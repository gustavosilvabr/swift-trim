import { Star, MapPin } from "lucide-react";

const ReviewsAndMap = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Avaliação */}
      <div className="glass-card rounded-xl p-6 text-center">
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
      <div className="glass-card rounded-xl overflow-hidden">
        <iframe
          src="https://www.google.com/maps/place/Goldblad/@-15.7414728,-48.2681897,17z/data=!3m1!4b1!4m6!3m5!1s0x935bb900538931ff:0x90bf1902faa7c545!8m2!3d-15.741478!4d-48.2635763!16s%2Fg%2F11yxbzj5bn?entry=ttu&g_ep=EgoyMDI2MDIwNC4wIKXMDSoASAFQAw%3D%3D"
          width="100%"
          height="250"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Localização Goldblad"
        />
        <div className="p-4">
          <a
            href="https://www.google.com/maps/place/Goldblad/@-15.7414728,-48.2661512,17z/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold transition-all hover:opacity-90"
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
