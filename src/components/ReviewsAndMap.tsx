import { Star, MapPin } from "lucide-react";

const ReviewsAndMap = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Avaliação */}
      <div className="glass-card rounded-xl p-6 text-center animate-fade-in">
        <div className="flex justify-center gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className="w-7 h-7 fill-primary text-primary" />
          ))}
        </div>
        <p className="font-display text-lg font-semibold text-foreground">
          A melhor de Águas Lindas de Goiás
        </p>
      </div>

      {/* Google Maps */}
      <div className="glass-card rounded-xl overflow-hidden animate-slide-up">
        <iframe
          src="https://www.google.com/maps?q=-15.741478,-48.2635763&z=17&output=embed"
          width="100%"
          height="250"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Localização da Barbearia"
        />

        <div className="p-4 space-y-3">
          {/* Texto localização */}
          <p className="text-center text-sm font-medium text-muted-foreground animate-fade-in">
            📍 Estamos localizados na rua descendo do Goiás Forte
          </p>

          {/* Botão */}
          <a
            href="https://www.google.com/maps?q=-15.741478,-48.2635763"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold transition-all duration-300 hover:scale-[1.02] hover:opacity-90"
          >
            <MapPin className="w-5 h-5" />
            Ver no Google Maps
          </a>
        </div>
      </div>
    </div>
  );
};

export default ReviewsAndMap;
