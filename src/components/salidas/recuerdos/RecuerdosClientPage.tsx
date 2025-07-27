
'use client';

import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, Timestamp, collection, addDoc, serverTimestamp, query, orderBy, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useDropzone } from 'react-dropzone';

import { Loader2, Calendar, UploadCloud, Film, Trash2, Maximize } from 'lucide-react';
import SalidaPageHeader from '../SalidaPageHeader'; // Import the new header
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';


interface SalidaData {
  id: string;
  dateRange: {
    from: Date;
    to: Date | null;
  };
}

interface Recuerdo {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  createdAt: Date;
}

const FilePreview = ({ file, onRemove }: { file: File, onRemove: (file: File) => void }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const isImage = file.type.startsWith('image/');
  const fileSize = (file.size / 1024 / 1024).toFixed(2); // in MB

  return (
    <div className="flex items-center gap-4 p-3 border rounded-lg bg-muted/50 w-full">
      <div className="w-20 h-20 rounded-md overflow-hidden bg-slate-800 flex-shrink-0">
        {isImage && previewUrl ? (
          <img src={previewUrl} alt={file.name} className="object-cover w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="w-10 h-10 text-white" />
          </div>
        )}
      </div>
      <div className="flex-grow overflow-hidden">
        <p className="font-semibold text-sm truncate text-foreground">{file.name}</p>
        <p className="text-xs text-muted-foreground">{file.type}</p>
        <p className="text-xs text-muted-foreground">{fileSize} MB</p>
      </div>
      <Button variant="ghost" size="icon" onClick={() => onRemove(file)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0">
        <Trash2 className="w-4 w-4" />
        <span className="sr-only">Quitar archivo</span>
      </Button>
    </div>
  );
};

export default function RecuerdosClientPage({ salidaId }: { salidaId: string }) {
  const { toast } = useToast();
  const [salidaData, setSalidaData] = useState<SalidaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recuerdos, setRecuerdos] = useState<Recuerdo[]>([]);
  const [selectedRecuerdo, setSelectedRecuerdo] = useState<Recuerdo | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);
  
  const fetchRecuerdos = useCallback(async () => {
    if (!user || !salidaId) return;
    try {
      const recuerdosRef = collection(db, 'users', user.uid, 'salidas', salidaId, 'recuerdos');
      const recuerdosQuery = query(recuerdosRef, orderBy('createdAt', 'desc'));
      const recuerdosSnap = await getDocs(recuerdosQuery);
      const fetchedRecuerdos: Recuerdo[] = recuerdosSnap.docs.map(d => ({
        id: d.id,
        name: d.data().name,
        type: d.data().type,
        size: d.data().size,
        url: d.data().url,
        createdAt: (d.data().createdAt as Timestamp).toDate(),
      }));
      setRecuerdos(fetchedRecuerdos);
    } catch (error) {
      console.error("Error fetching memories:", error);
      toast({ title: "Error", description: "No se pudieron cargar los recuerdos.", variant: "destructive" });
    }
  }, [user, salidaId, toast]);

  useEffect(() => {
    const fetchPageData = async () => {
      if (!user || !salidaId) return;
      setLoading(true);
      try {
        const salidaDocRef = doc(db, 'users', user.uid, 'salidas', salidaId);
        const salidaSnap = await getDoc(salidaDocRef);
        if (salidaSnap.exists()) {
          const data = salidaSnap.data();
          setSalidaData({
            id: salidaSnap.id,
            dateRange: {
              from: (data.dateRange.from as Timestamp).toDate(),
              to: data.dateRange.to ? (data.dateRange.to as Timestamp).toDate() : null,
            },
          });
          await fetchRecuerdos();
        } else {
          setSalidaData(null);
        }
      } catch (error) {
        console.error("Error fetching page data:", error);
        toast({ title: "Error", description: "No se pudo cargar la información de la salida.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchPageData();
  }, [user, salidaId, toast, fetchRecuerdos]);
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
  }, []);
  
  const removeFile = (fileToRemove: File) => {
    setFiles(prevFiles => prevFiles.filter(file => file !== fileToRemove));
  };
  
  const handleUpload = async () => {
    if (!user || files.length === 0) {
      toast({ title: 'No hay archivos o no estás autenticado', description: 'Por favor, selecciona archivos para subir y asegúrate de haber iniciado sesión.', variant: 'destructive'});
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);

    const uploadPromises = files.map(file => {
        const storageRef = ref(storage, `recuerdos/${salidaId}/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done for ' + file.name);
                },
                (error) => {
                    console.error("Upload failed for " + file.name, error);
                    reject(error);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    const recuerdosRef = collection(db, 'users', user.uid, 'salidas', salidaId, 'recuerdos');
                    await addDoc(recuerdosRef, {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        url: downloadURL,
                        createdAt: serverTimestamp()
                    });
                    resolve(downloadURL);
                }
            );
        });
    });

    try {
        const totalFiles = files.length;
        let completedFiles = 0;
        
        const wrappedPromises = uploadPromises.map(p => 
            p.then(res => {
                completedFiles++;
                setUploadProgress((completedFiles / totalFiles) * 100);
                return res;
            })
        );
        
        await Promise.all(wrappedPromises);
        toast({ title: '¡Éxito!', description: `Se han subido ${files.length} recuerdos.`});
        setFiles([]);
        await fetchRecuerdos();
    } catch (error) {
        toast({ title: 'Error de subida', description: 'Algunos archivos no se pudieron subir. Por favor, inténtalo de nuevo.', variant: 'destructive'});
    } finally {
        setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi']
    }
  });

  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  if (!salidaData) {
    return <div className="container mx-auto py-8 text-center"><h1 className="text-2xl font-bold">Salida no encontrada</h1></div>;
  }
  
  const formattedDate = format(salidaData.dateRange.from, 'd MMMM yyyy', { locale: es });

  return (
    <>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <SalidaPageHeader
          title="Mis Recuerdos"
          subtitle={formattedDate}
          salidaId={salidaId}
          userId={user?.uid || null}
          currentStep={5}
        />

        <Card className="w-full">
          <CardContent className="p-6">
            <div
              {...getRootProps()}
              className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold text-foreground">Arrastra tus fotos y videos aquí</p>
              <p className="text-muted-foreground">o haz clic para seleccionar archivos</p>
              <p className="text-xs text-muted-foreground mt-2">(Imágenes: JPG, PNG, GIF, WebP. Videos: MP4, MOV, AVI)</p>
            </div>

            {files.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">Archivos para subir ({files.length})</h3>
                <div className="space-y-4">
                  {files.map((file, index) => (
                    <FilePreview key={`${file.name}-${index}`} file={file} onRemove={removeFile} />
                  ))}
                </div>
              </div>
            )}
            
            {isUploading && (
               <div className="mt-6 space-y-2">
                  <p className="text-sm font-medium">Subiendo...</p>
                  <Progress value={uploadProgress} className="w-full" />
               </div>
            )}

            <div className="mt-8 flex justify-end">
              <Button size="lg" onClick={handleUpload} disabled={files.length === 0 || isUploading}>
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>}
                Subir {files.length > 0 ? `${files.length} archivo(s)` : 'archivos'}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-12">
            <h2 className="text-2xl font-headline text-primary mb-4">Galería de la Salida</h2>
            {recuerdos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {recuerdos.map(recuerdo => (
                  <button key={recuerdo.id} onClick={() => setSelectedRecuerdo(recuerdo)} className="relative aspect-square group block rounded-lg overflow-hidden shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                    {recuerdo.type.startsWith('image/') ? (
                      <Image src={recuerdo.url} alt={recuerdo.name} fill className="object-cover transition-transform duration-300 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center p-2 text-center transition-colors duration-300 group-hover:bg-slate-700">
                         <Film className="w-10 h-10 text-white" />
                         <span className="text-xs text-white/70 mt-2 break-all">{recuerdo.name}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Maximize className="w-8 h-8 text-white" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground bg-muted p-8 rounded-lg">
                Aún no has subido ningún recuerdo para esta salida.
              </p>
            )}
        </div>
      </div>

      <Dialog open={!!selectedRecuerdo} onOpenChange={(isOpen) => !isOpen && setSelectedRecuerdo(null)}>
        <DialogContent className="max-w-4xl w-full h-auto max-h-[90vh] p-2 bg-transparent border-none shadow-none focus:outline-none">
          {selectedRecuerdo && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white sr-only">{selectedRecuerdo.name}</DialogTitle>
              </DialogHeader>
              {selectedRecuerdo.type.startsWith('image/') ? (
                <div className="relative w-full h-[85vh]">
                   <Image
                      src={selectedRecuerdo.url}
                      alt={selectedRecuerdo.name}
                      fill
                      className="rounded-lg object-contain w-full h-full"
                    />
                </div>
              ) : (
                 <video src={selectedRecuerdo.url} controls autoPlay className="w-full h-full rounded-lg outline-none">
                    Tu navegador no soporta el tag de video.
                 </video>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
