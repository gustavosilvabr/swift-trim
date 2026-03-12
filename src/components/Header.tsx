import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo-goldblad.png";
import { Scissors, Menu, X, Calendar, Download } from "lucide-react";

const navItems = [
  { label: "Início", href: "#hero" },
  { label: "Agendar", href: "#booking" },
  { label: "Plano VIP", href: "#vip" },
  { label: "Galeria", href: "#gallery" },
  { label: "Avaliações", href: "#reviews" },
  { label: "Localização", href: "#location" },
];

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (href: string) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 lg:px-8 py-3">
        {/* Left - branding */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Scissors className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] hidden sm:inline">Barbearia</span>
        </div>

        {/* Center - logo */}
        <div className="animate-scale-in">
          <img
            src={logo}
            alt="Goldblad Barbearia"
            className="h-12 lg:h-14 w-auto drop-shadow-[0_4px_24px_hsl(43_74%_49%/0.25)] transition-transform duration-500 hover:scale-105"
          />
        </div>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-6">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => scrollTo(item.href)}
              className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Desktop CTA */}
        <button
          onClick={() => scrollTo("#booking")}
          className="hidden lg:flex items-center gap-2 px-5 py-2.5 rounded-xl gold-gradient text-primary-foreground font-semibold text-sm hover:scale-105 transition-transform"
        >
          <Calendar className="w-4 h-4" />
          Agendar
        </button>

        {/* Mobile right */}
        <div className="flex items-center gap-3 lg:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-muted-foreground hover:text-primary transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-card/95 backdrop-blur-xl border-t border-border/50 animate-fade-in">
          <div className="max-w-lg mx-auto px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => scrollTo(item.href)}
                className="block w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => scrollTo("#booking")}
              className="w-full mt-2 flex items-center justify-center gap-2 px-5 py-3 rounded-xl gold-gradient text-primary-foreground font-bold text-sm"
            >
              <Calendar className="w-4 h-4" />
              Agendar Agora
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
