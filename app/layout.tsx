import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL || "https://ytmp3-studio.vercel.app";

export const viewport: Viewport = {
  themeColor: "#0B0B0F",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "YOUTUBE TO MP3 | Convierte contenido autorizado de YouTube a MP3",
    template: "%s | YOUTUBE TO MP3",
  },
  description:
    "Convierte contenido autorizado de YouTube a MP3 en calidades de 128 kbps, 192 kbps y 320 kbps de forma rápida y sencilla.",
  keywords: [
    "youtube to mp3",
    "convertir youtube a mp3",
    "youtube mp3 320 kbps",
    "audio autorizado youtube",
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: appUrl,
    siteName: "YOUTUBE TO MP3 Studio",
    title: "YOUTUBE TO MP3 — Convierte contenido autorizado de YouTube a MP3",
    description:
      "Herramienta especializada para convertir enlaces de videos autorizados de YouTube a formato MP3 (128, 192 y 320 kbps).",
  },
  twitter: {
    card: "summary_large_image",
    title: "YOUTUBE TO MP3",
    description: "Convierte contenido autorizado de YouTube a MP3.",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`dark ${inter.variable}`}>
      <body className="flex min-h-screen flex-col bg-[#0B0B0F] font-sans text-white selection:bg-[#7C3AED] selection:text-white">
        {children}
      </body>
    </html>
  );
}
