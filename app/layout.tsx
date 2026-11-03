import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YOUTUBE TO MP3",
  description: "Descarga audio en formato MP3 a partir de contenido autorizado.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-[#0B0B0F] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
