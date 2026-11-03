import { Download, PlaySquare, Sliders } from "lucide-react";

const STEPS = [
  {
    step: "01",
    title: "Pega el enlace de YouTube",
    description:
      "Copia la URL del video de YouTube (youtube.com/watch?v=... o youtu.be/...) sobre el que tengas autorización y pégala en el cuadro central.",
    icon: PlaySquare,
  },
  {
    step: "02",
    title: "Verifica el video y elige la calidad",
    description:
      "El sistema identifica el video mediante YouTube oEmbed / Data API, muestra su miniatura, título y duración, y te permite elegir entre 128 kbps, 192 kbps o 320 kbps.",
    icon: Sliders,
  },
  {
    step: "03",
    title: "Presiona DESCARGAR MP3",
    description:
      "El procesador obtiene el flujo de audio MP3 desde la fuente autorizada y transfiere el archivo directamente a tu dispositivo mostrando el progreso real.",
    icon: Download,
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="como-funciona"
      className="border-t border-white/10 bg-[#0B0B0F] py-16"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-[#A78BFA]">
            Proceso en 3 pasos
          </span>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            ¿Cómo convertir un enlace de YouTube a MP3?
          </h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="group relative rounded-3xl border border-white/10 bg-[#13131C] p-6 transition-all duration-300 hover:border-[#7C3AED]/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7C3AED]/20 text-[#A78BFA] transition-colors group-hover:bg-[#7C3AED] group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-2xl font-black text-white/10">
                    {item.step}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[#A1A1AA] sm:text-sm">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
