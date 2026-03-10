import { Smartphone, Download, Bell, Share2, PlusSquare, MoreVertical, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { isNotificationSupported, requestNotificationPermission } from "@/hooks/usePushNotifications";

const Install = () => {
  const navigate = useNavigate();
  const [isIOS, setIsIOS] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));
    if ("Notification" in window) {
      setNotifGranted(Notification.permission === "granted");
    }
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotifGranted(granted);
  };

  const steps = isIOS
    ? [
        {
          icon: <Share2 className="w-6 h-6" />,
          title: "Abra no Safari",
          desc: "Acesse o site pelo Safari e toque no botão de compartilhar (ícone de quadrado com seta para cima).",
        },
        {
          icon: <PlusSquare className="w-6 h-6" />,
          title: "Adicionar à Tela de Início",
          desc: 'Role para baixo e toque em "Adicionar à Tela de Início".',
        },
        {
          icon: <Smartphone className="w-6 h-6" />,
          title: "Confirme e pronto!",
          desc: 'Toque em "Adicionar". O app aparecerá na sua tela inicial como um app normal.',
        },
      ]
    : [
        {
          icon: <MoreVertical className="w-6 h-6" />,
          title: "Abra no Chrome",
          desc: "Acesse o site pelo Google Chrome. Toque no menu (3 pontinhos) no canto superior.",
        },
        {
          icon: <Download className="w-6 h-6" />,
          title: "Instalar aplicativo",
          desc: 'Toque em "Instalar aplicativo" ou "Adicionar à tela inicial".',
        },
        {
          icon: <Smartphone className="w-6 h-6" />,
          title: "Confirme e pronto!",
          desc: "O app será instalado e aparecerá na sua tela inicial igual a qualquer outro app.",
        },
      ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">Instalar App</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto w-full px-4 py-8 space-y-8 flex-1">
        {/* Hero */}
        <section className="text-center space-y-3">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Smartphone className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-black gold-text">
            Instale o App Goldblad
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Tenha acesso rápido ao painel e receba notificações de novos agendamentos direto no celular.
          </p>
        </section>

        {/* Platform toggle */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setIsIOS(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              !isIOS ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            Android
          </button>
          <button
            onClick={() => setIsIOS(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isIOS ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            iPhone
          </button>
        </div>

        {/* Steps */}
        <section className="space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-4 items-start p-4 rounded-xl bg-card border border-border/50">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                {step.icon}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary">PASSO {i + 1}</span>
                </div>
                <h3 className="font-semibold text-foreground text-sm">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Notifications */}
        {isNotificationSupported() && (
          <section className="p-4 rounded-xl bg-card border border-border/50 space-y-3">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground text-sm">Ativar Notificações</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Após instalar, ative as notificações para receber alertas de novos agendamentos em tempo real.
            </p>
            {notifGranted ? (
              <div className="flex items-center gap-2 text-xs text-green-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                Notificações ativadas!
              </div>
            ) : (
              <button
                onClick={handleEnableNotifications}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Ativar Notificações
              </button>
            )}
          </section>
        )}

        {/* iOS warning */}
        {isIOS && (
          <p className="text-[11px] text-muted-foreground/70 text-center leading-relaxed">
            ⚠️ No iPhone, notificações push em PWA funcionam a partir do iOS 16.4+. Certifique-se de usar a versão mais recente do iOS.
          </p>
        )}
      </main>
    </div>
  );
};

export default Install;
