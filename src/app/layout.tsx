
import AppLayoutClient from './AppLayoutClient';
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Fines de Semana en Familia Primero',
    default: 'Fines de Semana en Familia Primero',
  },
  description: 'Planifica actividades y fortalece vínculos familiares con UNI2.',
  icons: {
    icon: 'https://firebasestorage.googleapis.com/v0/b/lemon-admin.firebasestorage.app/o/home%2Fic_launcher.png?alt=media&token=4a958c34-b6af-4182-b273-69aee71f42f7',
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AppLayoutClient>{children}</AppLayoutClient>
      </body>
    </html>
  )
}
