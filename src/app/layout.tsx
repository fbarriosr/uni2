
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
  openGraph: {
    images: [
      {
        url: 'https://firebasestorage.googleapis.com/v0/b/lemon-admin.firebasestorage.app/o/home%2Fimagen-thumbnail.jpg?alt=media&token=b11a3d10-ee60-4790-b8a2-aa6d0ab8c832',
      },
    ],
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
