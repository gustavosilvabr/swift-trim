import { MapPin } from "lucide-react";
import StoreFacade from "./StoreFacade";

const ReviewsAndMap = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Google Maps */}
      <div className="glass-card rounded-xl overflow-hidden shadow-lg animate-slide-up">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3838.8!2d-48.2661512!3d-15.7414728!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x935bcd6068f63f43%3A0x2c8e7e3b8e3b8e3b!2sGoldblad!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr"
          width="100%"
          height="250"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Localização da Barbearia Goldblad"
        />
        <div className="p-4 space-y-3">
          <p className="text-center text-sm font-medium text-muted-foreground">
            📍 Estamos localizados na rua descendo do Goiás Forte
          </p>
          <a
            href="https://maps.app.goo.gl/HJiVUbwhWKYphoc88"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold transition-all duration-300 hover:scale-[1.02] hover:opacity-90"
          >
            <MapPin className="w-5 h-5" />
            Ver no Google Maps
          </a>
        </div>
      </div>

      {/* Store facade photo */}
      <StoreFacade />
    </div>
  );
};

export default ReviewsAndMap;
