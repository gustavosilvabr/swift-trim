import { CreditCard, Smartphone, Banknote, Clock, MapPin, Download, Lock } from "lucide-react";

const paymentMethods = [
  { icon: Smartphone, label: "Pix" },
  { icon: CreditCard, label: "Crédito" },
  { icon: Banknote, label: "Débito" },
];

const Footer = () => {
  return (
    <footer className="w-full border-t border-border/50 bg-card/80 backdrop-blur-xl">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Payment Methods */}
        <div className="text-center space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Formas de Pagamento
          </p>
          <div className="flex items-center justify-center gap-4">
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

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border/50" />
          <span className="text-primary text-[10px] font-semibold tracking-wider">✦</span>
          <div className="h-px flex-1 bg-border/50" />
        </div>

        {/* Info */}
        <div className="flex items-center justify-center gap-6 text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary/70" />
            <span className="text-[10px]">Seg - Sáb</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary/70" />
            <span className="text-[10px]">Águas Lindas - GO</span>
          </div>
        </div>

        {/* Discrete Links - App & Admin */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <a
            href="https://expo.dev/artifacts/eas/svcVU6ipB6LuBjq5jLEQny.apk"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50 hover:text-primary/70 transition-colors"
          >
            <Download className="w-3 h-3" />
            <span>App Android</span>
          </a>
          <span className="text-muted-foreground/30">|</span>
          <a
            href="/admin"
            className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50 hover:text-primary/70 transition-colors"
          >
            <Lock className="w-3 h-3" />
            <span>Admin</span>
          </a>
        </div>

        <p className="text-center text-[10px] text-muted-foreground/60">
          © {new Date().getFullYear()} Goldblad Barbearia — Todos os direitos reservados
        </p>
      </div>
    </footer>
  );
};

export default Footer;
