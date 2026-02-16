import { CreditCard, Smartphone, Banknote } from "lucide-react";

const paymentMethods = [
  { icon: Smartphone, label: "Pix" },
  { icon: CreditCard, label: "Crédito" },
  { icon: Banknote, label: "Débito" },
];

const Footer = () => {
  return (
    <footer className="w-full py-6 px-4 border-t border-border bg-background/90 backdrop-blur-lg">
      <div className="max-w-lg mx-auto text-center space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Formas de Pagamento
        </p>
        <div className="flex items-center justify-center gap-6">
          {paymentMethods.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground pt-2">
          © {new Date().getFullYear()} Goldblad Barbearia
        </p>
      </div>
    </footer>
  );
};

export default Footer;
