import { PlaySquare, Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#09090D] py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C3AED]">
              <PlaySquare className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-extrabold text-white">
              YT<span className="text-[#A78BFA]">MP3</span> Studio
            </span>
          </div>

          <p className="inline-flex items-center gap-1.5 text-xs text-[#A1A1AA]">
            <Shield className="h-3.5 w-3.5 text-[#7C3AED]" />
            <span>
              Herramienta diseñada únicamente para contenido propio, Creative
              Commons o autorizado de YouTube.
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
