
'use client';

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

import { auth, db, storage } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus, User, Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarItemProps {
  name: string;
  src?: string;
  isNewGroup?: boolean;
  aiHint?: string;
  isSelected: boolean;
  onSelect: () => void;
}

const AvatarItem: React.FC<AvatarItemProps> = ({ name, src, isNewGroup = false, aiHint, isSelected, onSelect }) => (
  <div
    className={cn(
      "flex flex-col items-center space-y-1 w-20 cursor-pointer group transform transition-all duration-200 ease-in-out",
      isSelected ? "scale-105" : "hover:scale-105"
    )}
    onClick={onSelect}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
    aria-pressed={isSelected}
    aria-label={`Seleccionar ${name}`}
  >
    <Avatar
      className={cn(
        "h-16 w-16 border-2 transition-all duration-200 ease-in-out",
        isSelected ? "border-primary shadow-lg border-4" : "border-muted group-hover:border-primary/70"
      )}
    >
      {src && !isNewGroup ? (
        <AvatarImage src={src} alt={name} data-ai-hint={aiHint} />
      ) : isNewGroup ? (
        <AvatarFallback className={cn("bg-primary/10 text-primary", isSelected && "bg-primary text-primary-foreground")}>
          <Plus size={28} />
        </AvatarFallback>
      ) : (
        <AvatarFallback className={cn("bg-muted", isSelected && "bg-primary/20")}>
          <User size={28} />
        </AvatarFallback>
      )}
    </Avatar>
    <span className={cn("text-xs text-muted-foreground truncate w-full text-center", isSelected && "text-primary font-bold")}>{name}</span>
  </div>
);

interface Kid {
  id: string;
  name: string;
  email: string;
  nickname?: string;
  avatar_url?: string;
  creadoPor: string;
}

interface KidItemProps {
  kid: Kid;
  isSelected: boolean;
  onSelect: (kidId: string) => void;
}

interface Participant {
  name: string;
  src?: string;
  aiHint?: string;
}

interface ParticipantSelectorProps {
  participants: Participant[];
}

const ParticipantSelector: React.FC<ParticipantSelectorProps> = ({ participants }) => {
  const { toast } = useToast();

  const [selectedParticipantName, setSelectedParticipantName] = useState<string | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const currentUserId = user?.uid;

  const [showNewGroupSection, setShowNewGroupSection] = useState(false);
  const [kids, setKids] = useState<Kid[]>([]);
  const [loadingKids, setLoadingKids] = useState(false);
  const [selectedKids, setSelectedKids] = useState<string[]>([]);
  const [showAddKidForm, setShowAddKidForm] = useState(false);
  const [newKidFormData, setNewKidFormData] = useState({ name: '', email: '', nickname: '', avatar_url: '' });
  const [addingKid, setAddingKid] = useState(false);
  const [showCreateGroupForm, setShowCreateGroupForm] = useState(false);
  const [groupFormData, setGroupFormData] = useState({ groupName: '', groupImage: null as File | null });
  const [creatingGroup, setCreatingGroup] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (showNewGroupSection && currentUserId) {
      const fetchUserDataAndKids = async () => {
        setLoadingKids(true);
        try {
          const userDocRef = doc(db, 'users', currentUserId);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const familyMemberIds = userData.familyMembers || [];

            if (familyMemberIds.length > 0) {
              const kidsQuery = query(
                collection(db, 'users'),
                where('__name__', 'in', familyMemberIds)
              );
              const kidsQuerySnapshot = await getDocs(kidsQuery);
              const fetchedKids: Kid[] = [];
              kidsQuerySnapshot.forEach((doc) => {
                fetchedKids.push({ id: doc.id, ...doc.data() } as Kid);
              });
              setKids(fetchedKids);
            } else {
              setKids([]);
            }
          } else {
            setKids([]);
          }
        } catch (error) {
          console.error('Error fetching kids:', error);
          setKids([]);
          setSelectedKids([]);
        } finally {
          setLoadingKids(false);
        }
      };

      fetchUserDataAndKids();
    }
  }, [showNewGroupSection, currentUserId]);

  const handleAddKidFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewKidFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSelectParticipant = (name: string) => {
    setShowAddKidForm(false);
    if (name === "Nuevo Grupo") {
      setShowNewGroupSection(prev => !prev);
      setSelectedParticipantName(null);
    } else {
      setSelectedParticipantName(prev => (prev === name ? null : name));
      setShowNewGroupSection(false);
    }
  };

  const handleSelectKid = (kidId: string) => {
    setSelectedKids(prevSelectedKids =>
      prevSelectedKids.includes(kidId)
        ? prevSelectedKids.filter(id => id !== kidId)
        : [...prevSelectedKids, kidId]
    );
  };

  return (
    <section>
    </section>
  );
};

export default ParticipantSelector;
