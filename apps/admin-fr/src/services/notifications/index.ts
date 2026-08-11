import { ADMIN } from "@/services/apis/config";

export const fetchNotifications = async () => {
  // Expecting backend endpoint: /notifications
  return ADMIN.get("/notifications");
};

export const markAsRead = async (id: string) => {
  return ADMIN.post(`/notifications/${id}/mark-read`);
};

export const deleteNotification = async (id: string) => {
  return ADMIN.delete(`/notifications/${id}`);
};

export const undoNotification = async (id: string) => {
  return ADMIN.post(`/notifications/${id}/undo`);
};

export default {
  fetchNotifications,
  markAsRead,
  deleteNotification,
  undoNotification,
};
