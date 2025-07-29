import Link from 'next/link';
import { AppRoutes } from '@/lib/urls';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-700 mt-16">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Columna de la Marca */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-headline text-white mb-2">UNI2</h3>
            <p className="max-w-sm">
              Fortaleciendo vínculos, un fin de semana a la vez.
            </p>
          </div>

          {/* Columna de Navegación */}
          <div>
            <h4 className="font-semibold text-white mb-3">Herramientas</h4>
            <ul className="space-y-2">
              <li>
                <Link href={AppRoutes.inicio} className="hover:text-primary transition-colors">
                  ¡Uni2 tu próxima gran aventura!
                </Link>
              </li>
              <li>
                <Link href={AppRoutes.vinculo} className="hover:text-primary transition-colors">
                  Academia del Vínculo
                </Link>
              </li>
              <li>
                <Link href={AppRoutes.asesoriaLegal} className="hover:text-primary transition-colors">
                  Orientación Legal
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna de Soporte */}
          <div>
            <h4 className="font-semibold text-white mb-3">Soporte</h4>
            <ul className="space-y-2">
              <li>
                <Link href={AppRoutes.reclamos} className="hover:text-primary transition-colors">
                  Soporte y Reclamos
                </Link>
              </li>
              {/* Aquí se podrían añadir enlaces a "Términos de Servicio" o "Política de Privacidad" en el futuro */}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-700 text-center text-sm">
           <p className="mb-1">
             &copy; {new Date().getFullYear()} UNI2. Todos los derechos reservados.
           </p>
           <p>
            Hecho con ❤️ para todas las familias.
           </p>
        </div>
      </div>
    </footer>
  );
}
