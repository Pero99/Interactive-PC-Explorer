import type {Metadata} from 'next';
import {Outfit, Plus_Jakarta_Sans, JetBrains_Mono} from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Interactive PC Explorer 3D',
  description:
    'Interaktive 3D-Lernanwendung zur Erkundung aller 19 Hardware-Komponenten, Datenflüsse, Explosionsansichten und Fehlerszenarien eines modernen Desktop-PCs.',
  openGraph: {
    title: 'Interactive PC Explorer 3D',
    description:
      'Interaktive 3D-Lernanwendung zur Erkundung aller 19 Hardware-Komponenten, Datenflüsse, Explosionsansichten und Fehlerszenarien eines modernen Desktop-PCs.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Interactive PC Explorer 3D',
    description:
      'Interaktive 3D-Lernanwendung zur Erkundung aller 19 Hardware-Komponenten, Datenflüsse, Explosionsansichten und Fehlerszenarien eines modernen Desktop-PCs.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html
      lang="de"
      className={`${outfit.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} dark`}
    >
      <body
        suppressHydrationWarning
        className="bg-[#060A12] text-slate-100 font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200 overflow-hidden"
      >
        {children}
      </body>
    </html>
  );
}
