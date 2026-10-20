import { Bell, Circle, Clock3 } from "lucide-react";
import type { Notification } from "../types/Notification";

type NotificationsPageProps = {
  notifications: Notification[];
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date inconnue"
    : new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

export default function NotificationsPage({ notifications }: NotificationsPageProps) {
  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="eyebrow">ACTIVITÉ DU COMPTE</p>
        <h1 className="text-2xl font-semibold text-white">Notifications</h1>
        <p className="mt-2 text-sm text-slate-400">
          Les notifications sont conservées uniquement pendant cette session. L’historique
          n’est pas encore disponible sur le serveur.
        </p>
      </header>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 px-6 py-14 text-center">
          <Bell className="mx-auto mb-3 h-8 w-8 text-slate-500" aria-hidden="true" />
          <p className="font-medium text-slate-200">Aucune notification pour le moment</p>
          <p className="mt-1 text-sm text-slate-500">
            Les nouvelles notifications apparaîtront ici.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className="flex gap-4 rounded-xl border border-slate-700 bg-slate-900/70 p-4"
            >
              <span className="mt-0.5 rounded-lg bg-slate-800 p-2 text-amber-300">
                <Circle className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-medium text-white">{notification.title}</h2>
                {notification.message && (
                  <p className="mt-1 text-sm text-slate-300">{notification.message}</p>
                )}
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatDate(notification.created_at)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
