import { MapPin, Star } from "lucide-react";
import StoreFacade from "./StoreFacade";
import qrCodeReview from "@/assets/qr-code-review.png";

const ReviewsAndMap = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="font-display text-3xl lg:text-4xl font-bold gold-text">Localização</h2>
        <p className="text-sm text-muted-foreground">Venha nos visitar</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
        {/* Google Maps */}
        <div className="glass-card rounded-2xl overflow-hidden shadow-lg">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d960.0!2d-48.2636032!3d-15.7414151!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x935bb9c0f7549bd5%3A0x11422ff270965ff4!2sBarbearia%20GoldBlad!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr"
            width="100%"
            height="280"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Localização da Barbearia Goldblad"
          />
          <div className="p-5 space-y-3">
            <p className="text-center text-sm font-medium text-muted-foreground">
              📍 Estamos localizados na rua descendo do Goiás Forte
            </p>
            <a
              href="https://www.google.com/maps/place/Barbearia+GoldBlad/@-15.741453,-48.2633605,19z/data=!4m6!3m5!1s0x935bb9c0f7549bd5:0x11422ff270965ff4!8m2!3d-15.7414151!4d-48.2636032!16s%2Fg%2F11yzpfl1nk"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold transition-all duration-300 hover:scale-[1.02] hover:opacity-90"
            >
              <MapPin className="w-5 h-5" />
              Ver no Google Maps
            </a>
          </div>
        </div>

        {/* Avalie no Google */}
        <div className="glass-card rounded-2xl p-6 lg:p-8 text-center space-y-5 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold text-foreground font-display">Avalie a Goldblad no Google</h3>
          <div className="flex justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-primary text-primary" />
            ))}
          </div>
          <img
            src={qrCodeReview}
            alt="QR Code para avaliar no Google"
            className="w-40 h-40 mx-auto rounded-lg bg-white p-2"
          />
          <a
            href="https://g.page/r/CfRflnDyL0IREBM/review"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold transition-all duration-300 hover:scale-[1.02] hover:opacity-90"
          >
            <Star className="w-4 h-4" />
            Deixe sua avaliação
          </a>
        </div>
      </div>

      {/* Store facade */}
      <StoreFacade />
    </div>
  );
};

export default ReviewsAndMap;
