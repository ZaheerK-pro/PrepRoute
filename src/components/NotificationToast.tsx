import { useEffect } from 'react';
import { useNotificationStore } from '../store/notificationStore';

function NotificationIcon({ type }: { type: 'error' | 'success' | 'info' }) {
  if (type === 'success') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="10" fill="#dcfce7" />
        <path
          d="M6 10.25 8.5 12.75 14 7.25"
          stroke="#16a34a"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === 'info') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="10" fill="#eef1ff" />
        <path d="M10 9v5M10 6.5v.5" stroke="#6b84ff" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="#fee2e2" />
      <path d="M10 6.5v4M10 12.75v.5" stroke="#dc2626" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

const AUTO_DISMISS_MS = 4500;

export function NotificationToast() {
  const notification = useNotificationStore((s) => s.notification);
  const hide = useNotificationStore((s) => s.hide);

  useEffect(() => {
    if (!notification) return undefined;

    const timer = window.setTimeout(() => hide(), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [notification, hide]);

  if (!notification) return null;

  return (
    <div className="notification-toast-container" aria-live="polite">
      <div
        className={`notification-toast notification-toast--${notification.type}`}
        role="status"
      >
        <div className="notification-toast-icon">
          <NotificationIcon type={notification.type} />
        </div>
        <div className="notification-toast-content">
          <p className="notification-toast-title">{notification.title}</p>
          <p className="notification-toast-message">{notification.message}</p>
        </div>
        <button
          type="button"
          className="notification-toast-close"
          aria-label="Dismiss notification"
          onClick={hide}
        >
          ×
        </button>
      </div>
    </div>
  );
}
