"use client";

import { ChevronDown, HelpCircle } from "lucide-react";
import { useState } from "react";

const FAQS = [
  {
    question: "¿Qué formatos de enlaces de YouTube son compatibles?",
    answer:
      "El sistema acepta enlaces estándar de YouTube (https://www.youtube.com/watch?v=...), enlaces cortos (https://youtu.be/...), enlaces móviles (m.youtube.com) y enlaces de YouTube Shorts.",
  },
  {
    question: "¿Qué calidades de audio MP3 están disponibles?",
    answer:
      "Puedes seleccionar entre tres calidades antes de descargar: 128 kbps (tamaño compacto), 192 kbps (alta calidad recomendada) y 320 kbps (máxima fidelidad en formato MP3).",
  },
  {
    question: "¿Cómo obtiene el sistema la información y el audio sin evadir restricciones de YouTube?",
    answer:
      "La identificación del video (miniatura, título y canal) se realiza mediante la API pública oficial YouTube oEmbed y, opcionalmente, YouTube Data API v3 para obtener la duración exacta e información de licencia. La conversión y descarga del audio MP3 se ejecuta únicamente a través de espejos de preservación autorizados o mediante un proveedor externo autorizado configurado por variables de entorno (AUTHORIZED_YT_API_URL y AUTHORIZED_YT_API_KEY).",
  },
  {
    question: "¿Qué credenciales opcionales puedo configurar en Vercel o Netlify?",
    answer:
      "Para obtener duraciones exactas en cualquier video puedes definir YOUTUBE_DATA_API_KEY. Para procesar conversiones mediante un proveedor externo autorizado de YouTube a MP3 puedes definir AUTHORIZED_YT_API_URL y AUTHORIZED_YT_API_KEY, además de CLOUDCONVERT_API_KEY para recodificación de bitrate en la nube.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="border-t border-white/10 bg-[#0B0B0F] py-16"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#7C3AED]/30 bg-[#13131C] px-3.5 py-1 text-xs font-semibold text-[#A78BFA]">
            <HelpCircle className="h-3.5 w-3.5 text-[#7C3AED]" />
            <span>Preguntas Frecuentes</span>
          </div>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Dudas sobre YouTube to MP3
          </h2>
        </div>

        <div className="mt-8 space-y-3">
          {FAQS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={item.question}
                className="overflow-hidden rounded-2xl border border-white/10 bg-[#13131C] transition-colors hover:border-[#7C3AED]/40"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left focus:outline-none"
                >
                  <span className="text-sm font-bold text-white sm:text-base">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-[#A78BFA] transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-white/5 px-6 pb-5 pt-3 text-xs leading-relaxed text-[#A1A1AA] sm:text-sm">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
