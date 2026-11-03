"use client";

import { Menu, PlaySquare, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Convertidor", href: "#inicio" },
    { label: "Cómo funciona", href: "#como-funciona" },
    { label: "Preguntas frecuentes", href: "#faq" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#7C3AED]/20 bg-[#0B0B0F]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        {/* Logotipo YOUTUBE TO MP3 */}
        <a
          href="#inicio"
          className="group flex items-center gap-3 focus:outline-none"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C3AED] shadow-lg shadow-[#7C3AED]/40 transition-transform duration-200 group-hover:scale-105">
            <PlaySquare className="h-5 w-5 text-white" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-extrabold tracking-tight text-white">
              YT<span className="text-[#A78BFA]">MP3</span>
            </span>
            <span className="rounded-md border border-[#7C3AED]/40 bg-[#7C3AED]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#A78BFA]">
              Studio
            </span>
          </div>
        </a>

        {/* Navegación Desktop */}
        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-8 md:flex"
        >
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-[#A1A1AA] transition-colors duration-200 hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Botón menú móvil */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-[#17171F] p-2.5 text-[#A1A1AA] transition-colors hover:text-white md:hidden"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-[#17171F] px-4 py-4 md:hidden">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#A1A1AA] transition-colors hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
