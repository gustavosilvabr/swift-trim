/**
 * Browser Push Notification helper for PWA.
 * Requests permission and shows native notifications for new appointments.
 */

const PERMISSION_KEY = "goldblad_push_granted";

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;

  if (Notification.permission === "granted") {
    localStorage.setItem(PERMISSION_KEY, "true");
    return true;
  }

  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  const granted = result === "granted";
  if (granted) localStorage.setItem(PERMISSION_KEY, "true");
  return granted;
}

export function showAppointmentNotification(clientName: string, service: string, time: string) {
  if (Notification.permission !== "granted") return;

  const notification = new Notification("📅 Novo Agendamento!", {
    body: `Cliente: ${clientName}\nServiço: ${service}\nHorário: ${time}`,
    icon: "/pwa-icon-192.png",
    badge: "/pwa-icon-192.png",
    tag: "new-appointment",
    renotify: true,
    vibrate: [200, 100, 200],
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}

export function isNotificationSupported(): boolean {
  return "Notification" in window;
}
