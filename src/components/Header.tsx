import { Settings } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="sticky top-0 z-40 w-full py-4 px-4 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-center relative max-w-lg mx-auto">
        <h1 className="font-display text-2xl font-bold gold-text tracking-wider animate-scale-in">
          GOLDBLAD
        </h1>
        <Link
          to="/admin"
          className="absolute right-0 p-2 rounded-lg hover:bg-secondary transition-colors"
          aria-label="Admin"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </Link>
      </div>
    </header>
  );
};

export default Header;
