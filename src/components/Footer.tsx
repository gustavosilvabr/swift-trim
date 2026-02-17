import { CreditCard, Smartphone, Banknote } from "lucide-react";

const paymentMethods = [
  { icon: Smartphone, label: "Pix" },
  { icon: CreditCard, label: "Crédito" },
  { icon: Banknote, label: "Débito" },
];

const Footer = () => {
  return (
    <footer className="w-full py-6 px-4 border-t border-border bg-card/80 backdrop-blur-lg">
      <div className="max-w-lg mx-auto text-center space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Formas de Pagamento
        </p>
        <div className="flex items-center justify-center gap-8">
          {paymentMethods.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div className="w-11 h-11 rounded-xl bg-secondary/80 border border-border flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
        <div className="pt-2">
          <p className="text-[10px] text-muted-foreground/60">
            © {new Date().getFullYear()} Goldblad Barbearia • Todos os direitos reservados
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
