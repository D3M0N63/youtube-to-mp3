"use client";

import { ChevronDown, HelpCircle } from "lucide-react";
import { useState } from "react";

const FAQS = [
  {
    question: "¿Qué formatos de enlaces de YouTube son compatibles?",
    answer:
      "El sistema identifica enlaces estándar de YouTube (https://www.youtube.com/watch?v=...), enlaces cortos (https://youtu.be/...), enlaces móviles (m.youtube.com) y enlaces de YouTube Shorts mediante la API oficial YouTube oEmbed.",
  },
  {
    question: "¿Cómo se separa la descarga autorizada de la conversión a MP3?",
    answer:
      "El servicio AuthorizedDownloaderService verifica exclusivamente si existe una fuente de descarga autorizada para el video (en el almacén local authorized-media/<videoId>.* o mediante URL directa autorizada), sin buscar mirrors en Internet Archive ni en servidores de terceros. Una vez adquirido el archivo autorizado, el servicio independiente FfmpegConverterService ejecuta FFmpeg localmente para codificar el audio a MP3 en 128, 192 o 320 kbps.",
  },
  {
    question: "¿Por qué algunos enlaces de YouTube muestran que no tienen fuente de descarga autorizada?",
    answer:
      "YouTube no ofrece un endpoint público para descargar flujos de audio/video de terceros sin autorización, y esta aplicación no implementa mecanismos para eludir las restricciones técnicas de YouTube.",
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
