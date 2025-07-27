
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import {
    addUser, deleteUser, updateUser as dbUpdateUser, getUserById, getUserByEmail
} from '@/lib/data';
import type { User, UserRole, Address } from '@/lib/types';
import { USER_ROLES } from '@/lib/types';
import { isAdmin } from '@/lib/auth';
import {
    db, storage
} from '@/lib/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    arrayUnion,
    serverTimestamp,
    arrayRemove,
    writeBatch
} from 'firebase/firestore';
import {
    ref, uploadBytes, getDownloadURL
} from 'firebase/storage';

export type UserFormState = {
  message: string;
  errors?: {
    name?: string[];
    email?: string[];
    role?: string[];
    password?: string[];
    confirmPassword?: string[];
    general?: string[];
  };
  success: boolean;
};

// Renamed for clarity: this is for form validation, not the DB model
const UserFormSchema = z.object({
  name: z.string().optional(),
  email: z.string().email({ message: "Correo electrónico inválido." }),
  role: z.enum(USER_ROLES, { errorMap: () => ({ message: "Rol inválido." }) }),
  password: z.string().optional(), // Optional here, will be checked in actions
  confirmPassword: z.string().optional(),
}).refine(data => {
  // If password is provided (and not empty), confirmPassword must also be provided and match
  if (data.password && data.password.length > 0) {
    if (!data.confirmPassword) {
      return false; 
    }
    return data.password === data.confirmPassword;
  }
  return true; // No new password provided or password is empty string, so pass this specific check
}, {
  message: "Las contraseñas no coinciden o la confirmación es requerida si se establece una nueva contraseña.",
  path: ["confirmPassword"],
}).refine(data => {
    // If password is provided (and not empty), it must meet min length
    if (data.password && data.password.length > 0 && data.password.length < 6) {
        return false;
    }
    return true;
}, {
    message: "La contraseña debe tener al menos 6 caracteres.",
    path: ["password"],
});

export async function createChildInvitationAction(formData: FormData): Promise<{ success: boolean; message: string; }> {
    const parentUid = formData.get('parentUid') as string;
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const nickname = formData.get('nickname') as string;
    const gender = formData.get('gender') as 'male' | 'female' | 'other';
    const avatarFile = formData.get('avatar') as File | null;
    
    if (!parentUid || !name || !email) {
        return { success: false, message: "Faltan datos obligatorios (padre, nombre, email)." };
    }
    
    try {
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return { success: false, message: "Este correo electrónico ya está en uso." };
        }

        const childId = uuidv4();
        let avatarUrl = `https://placehold.co/256x256.png?text=${name.charAt(0).toUpperCase()}`;

        if (avatarFile) {
            const storageRef = ref(storage, `users/${childId}/avatar/${avatarFile.name}`);
            await uploadBytes(storageRef, avatarFile);
            avatarUrl = await getDownloadURL(storageRef);
        }

        const childData: Partial<User> = {
            name: name,
            email: email,
            nickname: nickname,
            gender: gender,
            avatarUrl: avatarUrl,
            role: 'hijo',
            parentUid: parentUid,
            status: 'invited',
            createdAt: new Date(),
        };
        
        // Use setDoc with the generated UUID
        await setDoc(doc(db, 'users', childId), childData);
        
        // Add the child's temporary UUID to the parent's familyMembers array
        await updateDoc(doc(db, 'users', parentUid), {
            familyMembers: arrayUnion(childId),
        });

        // Here you would typically trigger an email to the child.
        // For now, we just return a success message.
        revalidatePath('/familia');
        return { success: true, message: `Se ha invitado a ${name}. Debe registrarse con el correo ${email} para activar su cuenta.` };
    } catch (error) {
        console.error("Error creating child invitation:", error);
        return { success: false, message: "Error del servidor al crear la invitación." };
    }
}

export async function finalizeRegistration(formData: FormData): Promise<{ success: boolean; message: string; }> {
    const uid = formData.get('uid') as string;
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const nickname = formData.get('nickname') as string | null;
    const avatarFile = formData.get('avatar') as File | null;

    if (!uid || !email || !name) {
        return { success: false, message: "Faltan datos para finalizar el registro." };
    }
    
    try {
        let avatarUrl = `https://placehold.co/256x256.png?text=${name.charAt(0).toUpperCase()}`;
        if (avatarFile) {
            const storageRef = ref(storage, `users/${uid}/avatar/${avatarFile.name}`);
            await uploadBytes(storageRef, avatarFile);
            avatarUrl = await getDownloadURL(storageRef);
        }

        const q = query(collection(db, 'users'), where("email", "==", email), where("status", "==", "invited"));
        const invitationSnapshot = await getDocs(q);

        if (!invitationSnapshot.empty) {
            // This is an invited child completing registration
            const invitationDoc = invitationSnapshot.docs[0];
            const invitationData = invitationDoc.data();
            const parentId = invitationData.parentUid;

            // Delete the temporary invitation document
            await deleteDoc(invitationDoc.ref);
            
            // Update the parent's familyMembers: remove temporary ID, add final UID
            const parentRef = doc(db, 'users', parentId);
            await updateDoc(parentRef, {
                familyMembers: arrayRemove(invitationDoc.id)
            });
            await updateDoc(parentRef, {
                familyMembers: arrayUnion(uid)
            });
            
            // Create the final user document with the Auth UID and parent link
            await setDoc(doc(db, 'users', uid), {
                name,
                email,
                nickname: nickname || '',
                avatarUrl: invitationData.avatarUrl || avatarUrl, // Prefer avatar set by parent
                role: 'hijo',
                status: 'active',
                parentUid: parentId,
                createdAt: serverTimestamp(),
            });

            return { success: true, message: "¡Bienvenido! Tu cuenta ha sido vinculada a tu familia." };
            
        } else {
            // This is a standard (parent) registration
            await setDoc(doc(db, 'users', uid), {
                name,
                email,
                nickname: nickname || '',

                avatarUrl,
                role: 'user', // Default role for standard registration
                status: 'active',
                createdAt: serverTimestamp(),
            });
            return { success: true, message: "¡Bienvenido! Tu cuenta ha sido creada." };
        }
    } catch (error) {
        console.error("Error finalizing registration:", error);
        return { success: false, message: "Error del servidor al guardar los datos del usuario." };
    }
}


export async function registerUserAction(prevState: UserFormState, formData: FormData): Promise<UserFormState> {
  if (!await isAdmin()) {
    return { message: "Acceso denegado. Se requieren privilegios de administrador.", success: false };
  }

  const password = formData.get('password') as string | null;
  if (!password || password.length < 6) {
    return {
      message: "Error de validación.",
      errors: { password: ["La contraseña es requerida y debe tener al menos 6 caracteres."] },
      success: false,
    };
  }
  
  const validatedFields = UserFormSchema.safeParse({
    name: formData.get('name') || undefined,
    email: formData.get('email'),
    role: formData.get('role'),
    password: password,
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!validatedFields.success) {
    return {
      message: "Error de validación.",
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }
  
  if (!validatedFields.data.password) {
      return { message: "La contraseña es un campo requerido.", success: false, errors: { password: ["La contraseña es requerida."]}};
  }

  try {
    await addUser({
        name: validatedFields.data.name,
        email: validatedFields.data.email,
        role: validatedFields.data.role,
        passwordHash: validatedFields.data.password, 
    });
    revalidatePath('/admin/users');
    return { message: 'Usuario registrado exitosamente.', success: true };
  } catch (error) {
    console.error("Error registering user:", error);
    return { message: 'Error en el servidor al registrar el usuario.', success: false };
  }
}

export async function updateUserAction(userId: string, prevState: UserFormState, formData: FormData): Promise<UserFormState> {
  if (!await isAdmin()) {
    return { message: "Acceso denegado. Se requieren privilegios de administrador.", success: false };
  }
  
  const validatedFields = UserFormSchema.safeParse({
    name: formData.get('name') || undefined,
    email: formData.get('email'),
    role: formData.get('role'),
    password: formData.get('password') || undefined,
    confirmPassword: formData.get('confirmPassword') || undefined,
  });

  if (!validatedFields.success) {
    return {
      message: "Error de validación.",
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }
  
  const { name, role, password } = validatedFields.data;
  const updateData: Partial<Omit<User, 'id' | 'createdAt' | 'email'>> = { name, role };

  if (password && password.length > 0) {
    updateData.passwordHash = password;
  }

  try {
    const updatedUser = await dbUpdateUser(userId, updateData);
    if (!updatedUser) {
      return { message: "No se encontró el usuario para actualizar.", success: false };
    }
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/edit/${userId}`);
    return { message: 'Usuario actualizado exitosamente.', success: true };
  } catch (error) {
    console.error("Error updating user:", error);
    return { message: 'Error en el servidor al actualizar el usuario.', success: false };
  }
}

export async function deleteUserAction(userId: string) {
  if (!await isAdmin()) {
    return { message: "Acceso denegado.", success: false };
  }
  try {
    await deleteUser(userId);
    revalidatePath('/admin/users');
    return { message: 'Usuario eliminado exitosamente.', success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { message: 'Error en el servidor al eliminar el usuario.', success: false };
  }
}

export async function sendPasswordResetLinkAction(userId: string): Promise<{success: boolean; message: string}> {
    if (!await isAdmin()) {
        return { success: false, message: "Acceso denegado." };
    }
    const user = await getUserById(userId);
    if (!user) {
        return { success: false, message: "Usuario no encontrado." };
    }
    console.log(`Simulating sending password reset link to ${user.email} for user ID ${userId}`);
    return { success: true, message: `Se ha enviado un enlace para restablecer la contraseña a ${user.email}. (Simulado)` };
}

export async function removeFamilyMemberAction(parentUid: string, childUid: string): Promise<{ success: boolean; message: string; }> {
    try {
        const parentRef = doc(db, 'users', parentUid);
        const childRef = doc(db, 'users', childUid);

        const batch = writeBatch(db);
        batch.update(parentRef, { familyMembers: arrayRemove(childUid) });
        batch.update(childRef, { parentUid: null });

        await batch.commit();

        revalidatePath('/familia');
        return { success: true, message: 'Miembro de la familia desvinculado correctamente.' };
    } catch (error) {
        console.error("Error removing family member:", error);
        return { success: false, message: 'Error del servidor al desvincular al miembro de la familia.' };
    }
}

export async function updateUser(userId: string, data: Partial<User>) {
    return dbUpdateUser(userId, data);
}

// --- Address Management Actions ---
export type AddressFormState = {
  message: string;
  success: boolean;
  errors?: {
    id?: string[];
    name?: string[];
    address?: string[];
    latitude?: string[];
    longitude?: string[];
    general?: string[];
  };
};

const AddressSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre es obligatorio."),
  address: z.string().min(5, "La dirección es obligatoria."),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
});

export async function addOrUpdateAddress(userId: string, prevState: AddressFormState, formData: FormData): Promise<AddressFormState> {
  if (!userId) return { success: false, message: "Usuario no autenticado." };

  const validatedFields = AddressSchema.safeParse({
    id: formData.get('id') as string || undefined,
    name: formData.get('name'),
    address: formData.get('address'),
    latitude: formData.get('latitude'),
    longitude: formData.get('longitude'),
  });

  if (!validatedFields.success) {
    return { success: false, message: "Error de validación.", errors: validatedFields.error.flatten().fieldErrors };
  }

  const { id, ...addressData } = validatedFields.data;
  const newAddress: Address = { ...addressData, id: id || uuidv4() };

  try {
    const userRef = doc(db, 'users', userId);
    const user = await getUserById(userId);
    if (!user) return { success: false, message: "Usuario no encontrado." };
    
    let addresses = user.addresses || [];
    const existingIndex = addresses.findIndex(a => a.id === newAddress.id);
    let isFirstAddress = false;

    if (existingIndex > -1) {
      addresses[existingIndex] = newAddress; // Update
    } else {
      addresses.push(newAddress); // Add
      if(addresses.length === 1) isFirstAddress = true;
    }
    
    const updateData: {addresses: Address[], activeAddressId?: string} = { addresses };

    // If it's the first address being added, set it as active
    if (isFirstAddress) {
      updateData.activeAddressId = newAddress.id;
    }

    await updateDoc(userRef, updateData);
    revalidatePath('/configuraciones');
    return { success: true, message: `Domicilio ${id ? 'actualizado' : 'agregado'} con éxito.` };

  } catch (error) {
    console.error("Error saving address:", error);
    return { success: false, message: "Error del servidor al guardar el domicilio." };
  }
}

export async function deleteAddress(userId: string, addressId: string): Promise<{success: boolean, message: string}> {
  if (!userId || !addressId) return { success: false, message: "Faltan datos." };
  
  try {
    const userRef = doc(db, 'users', userId);
    const user = await getUserById(userId);
    if (!user) return { success: false, message: "Usuario no encontrado." };

    const addresses = (user.addresses || []).filter(a => a.id !== addressId);
    let activeAddressId = user.activeAddressId;
    if (activeAddressId === addressId) {
      activeAddressId = addresses.length > 0 ? addresses[0].id : null;
    }

    await updateDoc(userRef, { addresses, activeAddressId });
    revalidatePath('/configuraciones');
    return { success: true, message: "Domicilio eliminado." };
  } catch (error) {
    console.error("Error deleting address:", error);
    return { success: false, message: "Error del servidor al eliminar el domicilio." };
  }
}

export async function setActiveAddress(userId: string, addressId: string): Promise<{success: boolean, message: string}> {
  if (!userId || !addressId) return { success: false, message: "Faltan datos." };

  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { activeAddressId: addressId });
    revalidatePath('/configuraciones');
    revalidatePath('/'); // Revalidate all pages that might show the address
    return { success: true, message: "Domicilio activo actualizado." };
  } catch (error) {
    console.error("Error setting active address:", error);
    return { success: false, message: "Error del servidor al actualizar el domicilio activo." };
  }
}
