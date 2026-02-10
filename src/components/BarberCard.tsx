import { Barber } from "@/hooks/useSupabase";
import { User } from "lucide-react";

interface BarberCardProps {
  barber: Barber;
  selected: boolean;
  onSelect: () => void;
}

const BarberCard = ({ barber, selected, onSelect }: BarberCardProps) => {
  return (
    <button
      onClick={onSelect}
      className={`relative flex flex-col items-center gap-3 p-6 rounded-xl transition-all duration-300 w-full ${
        selected
          ? "glass-card glow-gold ring-2 ring-primary scale-[1.02]"
          : "glass-card hover:ring-1 hover:ring-primary/50"
      }`}
    >
      <div className={`w-24 h-24 rounded-full overflow-hidden border-2 transition-colors ${
        selected ? "border-primary" : "border-border"
      }`}>
        {barber.photo_url ? (
          <img
            src={barber.photo_url}
            alt={barber.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <User className="w-10 h-10 text-muted-foreground" />
          </div>
        )}
      </div>
      <span className={`font-display text-lg font-semibold transition-colors ${
        selected ? "text-primary" : "text-foreground"
      }`}>
        {barber.name}
      </span>
      {selected && (
        <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-primary animate-scale-in" />
      )}
    </button>
  );
};

export default BarberCard;
