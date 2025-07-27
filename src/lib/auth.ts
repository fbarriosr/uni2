
'use server';

import type { User } from './types';
import { getUserById } from './data'; // Se mantiene para buscar por ID si tuviéramos uno.

// La autenticación de Firebase del lado del cliente (firebase/auth) es para el navegador.
// Para las verificaciones de autenticación del lado del servidor (en Server Components, Route Handlers, Server Actions),
// normalmente se utiliza Firebase Admin SDK para verificar los tokens de ID enviados desde el cliente,
// o se gestionan sesiones (por ejemplo, con cookies).

// La simulación anterior permitía que los Server Components se renderizaran como si un usuario específico
// estuviera conectado. Eliminar la simulación significa que estas funciones, cuando se llaman desde
// un contexto de servidor sin una sesión/token establecido, no conocerán el estado de autenticación del cliente.

/**
 * Obtiene el usuario actual.
 * IMPORTANTE: En un contexto de servidor (Server Component, Server Action), esta función
 * no puede acceder directamente al estado de autenticación de Firebase del lado del cliente sin
 * un sistema de gestión de sesiones adecuado (por ejemplo, cookies, verificación de tokens).
 * Esta implementación actual probablemente devolverá null cuando se llame desde el servidor
 * a menos que se extienda con dicho sistema.
 *
 * Para componentes del lado del cliente, deberías usar el listener `onAuthStateChanged` de Firebase.
 */
export async function getCurrentUser(): Promise<User | null> {
  // Placeholder: En una configuración real del lado del servidor, verificarías una cookie de sesión o un token.
  // Por ahora, esto devolverá null ya que no hay una sesión del lado del servidor.
  // console.warn(
  //   "getCurrentUser (lado del servidor) llamada. Sin gestión de sesión, esto probablemente devolverá null."
  // );
  
  // Ejemplo de cómo podría funcionar si tuvieras un userId de una sesión:
  // const userId = getUserIdFromSession(); // Esta función aún no existe
  // if (userId) {
  //   const user = await getUserById(userId);
  //   return user || null;
  // }
  return null;
}

/**
 * Verifica si el usuario actual es un administrador.
 * Depende de `getCurrentUser`. Consulta su documentación para conocer las limitaciones en contextos de servidor.
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === 'admin';
}

// La función simulateLoginAs se elimina ya que estaba ligada a la simulación anterior.
// Si necesitas simular usuarios para pruebas del lado del servidor en el futuro,
// se podría reintroducir una forma de hacerlo, pero idealmente con un enfoque
// que no interfiera con el flujo de autenticación real.
