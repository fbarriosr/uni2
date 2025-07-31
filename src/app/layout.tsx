
import AppLayoutClient from './AppLayoutClient';
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Fines de Semana en Familia Primero',
    default: 'Fines de Semana en Familia Primero',
  },
  description: 'Planifica actividades y fortalece vínculos familiares con UNI2.',
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
