import { MessageCircle } from "lucide-react";

const WhatsAppButton = () => {
  const phone = "5561992140623";
  const message = encodeURIComponent("Olá! Gostaria de falar com o barbeiro.");
  const url = `https://wa.me/${phone}?text=${message}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
      style={{ backgroundColor: "#25D366" }}
      aria-label="WhatsApp"
    >
      <MessageCircle className="w-7 h-7" style={{ color: "#fff" }} />
    </a>
  );
};

export default WhatsAppButton;
