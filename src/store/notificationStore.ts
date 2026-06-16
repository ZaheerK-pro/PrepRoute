import { create } from 'zustand';

export type NotificationType = 'error' | 'success' | 'info';

export interface Notification {
  type: NotificationType;
  title: string;
  message: string;
}

interface NotificationState {
  notification: Notification | null;
  show: (notification: Notification) => void;
  hide: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notification: null,
  show: (notification) => set({ notification }),
  hide: () => set({ notification: null }),
}));

export function notifyError(message: string, title = 'Error') {
  useNotificationStore.getState().show({ type: 'error', title, message });
}

export function notifySuccess(message: string, title = 'Success') {
  useNotificationStore.getState().show({ type: 'success', title, message });
}

export function notifyInfo(message: string, title = 'Notice') {
  useNotificationStore.getState().show({ type: 'info', title, message });
}
