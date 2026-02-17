import { useEffect, useRef, useState } from "react";
import { Star, Quote } from "lucide-react";

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
      <h2 className="font-display text-xl font-bold text-center text-foreground">
        O que dizem nossos <span className="gold-text">clientes</span>
      </h2>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {reviews.map((r, i) => (
          <div key={i} className="min-w-[220px] max-w-[220px] pro-card rounded-xl p-4 snap-start flex-shrink-0 space-y-3 relative">
            <Quote className="w-6 h-6 text-primary/20 absolute top-3 right-3" />
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full gold-gradient flex items-center justify-center text-primary-foreground font-bold text-xs">
                {r.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{r.name}</p>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-2.5 h-2.5 fill-primary text-primary" />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{r.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ReviewsCarousel;
