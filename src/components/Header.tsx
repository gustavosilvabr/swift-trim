import { Settings } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo-goldblad.png";

const Header = () => {
  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between max-w-lg mx-auto px-4 py-3">
        <Link
          to="/admin"
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
          aria-label="Admin"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div className="animate-scale-in">
          <img
            src={logo}
            alt="Goldblad Barbearia"
            className="h-14 w-auto drop-shadow-[0_4px_20px_hsl(43_90%_50%/0.3)] transition-transform duration-300 hover:scale-105"
          />
        </div>
        <div className="w-9" /> {/* spacer */}
      </div>
    </header>
  );
};

export default Header;
