import { Barber } from "@/hooks/useSupabase";
import { User, CheckCircle } from "lucide-react";

interface BarberCardProps {
  barber: Barber;
  selected: boolean;
  onSelect: () => void;
}

const BarberCard = ({ barber, selected, onSelect }: BarberCardProps) => {
  return (
    <button
      onClick={onSelect}
      className={`relative flex flex-col items-center gap-3 p-5 rounded-xl transition-all duration-300 w-full ${
        selected
          ? "pro-card glow-gold ring-2 ring-primary"
          : "pro-card hover:ring-1 hover:ring-primary/40 hover:translate-y-[-2px]"
      }`}
    >
      <div className={`w-20 h-20 rounded-full overflow-hidden border-2 transition-all duration-300 ${
        selected ? "border-primary shadow-[0_0_16px_hsl(43_90%_50%/0.3)]" : "border-border"
      }`}>
        {barber.photo_url ? (
          <img src={barber.photo_url} alt={barber.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
      </div>
      <span className={`font-display text-sm font-semibold transition-colors ${
        selected ? "text-primary" : "text-foreground"
      }`}>
        {barber.name}
      </span>
      {selected && (
        <div className="absolute top-2 right-2 animate-scale-in">
          <CheckCircle className="w-5 h-5 text-primary" />
        </div>
      )}
    </button>
  );
};

export default BarberCard;
