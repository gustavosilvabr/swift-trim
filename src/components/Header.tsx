import logo from "@/assets/logo-goldblad.png";
import { Scissors } from "lucide-react";

const Header = () => {
  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Scissors className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Barbearia</span>
        </div>
        <div className="animate-scale-in">
          <img
            src={logo}
            alt="Goldblad Barbearia"
            className="h-14 w-auto drop-shadow-[0_4px_24px_hsl(43_74%_49%/0.25)] transition-transform duration-500 hover:scale-105"
          />
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Premium</span>
          <Scissors className="w-4 h-4 text-primary rotate-180" />
        </div>
      </div>
    </header>
  );
};

export default Header;
