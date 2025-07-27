

import { seedInitialActivities } from '@/lib/data'; // Adjust path for root level

async function main() {
  console.log('Iniciando el proceso de siembra de datos...');
  try {
    // Seed Activities
    console.log('--- Sembrando Actividades ---');
    const activitiesResult = await seedInitialActivities();
    console.log(`Resultado de Actividades: [Éxito: ${activitiesResult.success}, Mensaje: ${activitiesResult.message}, Añadidas: ${activitiesResult.count}]`);
    
    // NOTE: Seeding agents is now handled via the UI CRUD.

    console.log('--------------------------------------------------');
    console.log('Proceso de siembra finalizado.');
    console.log('--------------------------------------------------');

  } catch (error) {
    console.error('--------------------------------------------------');
    console.error('Error durante la siembra de datos:', error);
    console.error('--------------------------------------------------');
    console.error('Asegúrate de que tus credenciales de Firebase en .env estén configuradas correctamente y que las reglas de seguridad de Firestore permitan escrituras.');
  } finally {
    // Firestore SDK maneja sus propias conexiones, usualmente no necesitas cerrar explícitamente
    // para un script simple. Si fuera un servidor de larga duración, sería diferente.
    // process.exit(0); // Descomenta si quieres que el script termine explícitamente.
  }
}

main();
