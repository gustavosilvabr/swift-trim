import { Settings } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo-goldblad.png";

const Header = () => {
  return (
    <header className="sticky top-0 z-40 w-full py-3 px-4 bg-background/90 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-center relative max-w-lg mx-auto">
        <Link
          to="/admin"
          className="absolute left-0 p-2 rounded-lg hover:bg-secondary transition-colors"
          aria-label="Admin"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div className="animate-scale-in">
          <img
            src={logo}
            alt="Goldblad Barbearia"
            className="h-16 w-auto drop-shadow-[0_4px_24px_hsl(43_74%_49%/0.25)] transition-transform duration-500 hover:scale-105"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
