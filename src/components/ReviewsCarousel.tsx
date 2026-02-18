import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";

const reviews = [
  { name: "Lucas Oliveira", text: "Melhor barbearia da região! Atendimento top demais." },
  { name: "Rafael Santos", text: "Corte perfeito, sempre saio satisfeito. Recomendo!" },
  { name: "Matheus Silva", text: "Ambiente muito bom e barbeiros profissionais." },
  { name: "Pedro Henrique", text: "Fui pela primeira vez e já virei cliente fiel." },
  { name: "João Victor", text: "Sobrancelha ficou impecável, parabéns pelo trabalho!" },
  { name: "Gabriel Souza", text: "Atendimento rápido e corte na régua. Nota 10!" },
  { name: "Felipe Costa", text: "Preço justo e qualidade premium. Só aqui mesmo!" },
  { name: "Thiago Almeida", text: "Barbeiros muito habilidosos, sempre capricham." },
  { name: "Bruno Ferreira", text: "Ambiente agradável e corte de primeira qualidade." },
  { name: "André Lima", text: "Melhor degradê que já fiz na vida. Voltarei sempre!" },
];

const ReviewsCarousel = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const interval = setInterval(() => {
      if (paused) return;
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: 260, behavior: "smooth" });
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [paused]);

  return (
    <section className="space-y-4 animate-fade-in">
      <h2 className="font-display text-2xl font-bold text-center gold-text">Avaliações</h2>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {reviews.map((r, i) => (
          <div
            key={i}
            className="min-w-[240px] max-w-[240px] glass-card rounded-xl p-4 snap-start flex-shrink-0 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {r.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{r.name}</p>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3 h-3 fill-primary text-primary" />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{r.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ReviewsCarousel;
