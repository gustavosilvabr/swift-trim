import { CreditCard, Smartphone, Banknote, Clock, MapPin, Download, Lock } from "lucide-react";

const paymentMethods = [
  { icon: Smartphone, label: "Pix" },
  { icon: CreditCard, label: "Crédito" },
  { icon: Banknote, label: "Débito" },
];

const Footer = () => {
  return (
    <footer className="w-full border-t border-border/50 bg-card/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Payment Methods */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Formas de Pagamento
            </p>
            <div className="flex items-center gap-4">
              {paymentMethods.map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5">
                  <div className="w-11 h-11 rounded-xl bg-secondary/80 border border-border/50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hours */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Horário
            </p>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-4 h-4 text-primary/70" />
              <span className="text-sm">Segunda a Sábado</span>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Localização
            </p>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary/70" />
              <span className="text-sm">Águas Lindas - GO</span>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Links
            </p>
            <div className="flex flex-col gap-2">
              <a
                href="https://expo.dev/artifacts/eas/svcVU6ipB6LuBjq5jLEQny.apk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                App Android
              </a>
              <a
                href="/install"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Instalar PWA
              </a>
              <a
                href="/admin"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                Admin
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/30">
          <p className="text-center text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} Goldblad Barbearia — Todos os direitos reservados
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
