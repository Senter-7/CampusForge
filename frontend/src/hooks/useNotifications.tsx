// src/hooks/useNotifications.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "../api/axiosClient";

export interface Notification {
  notificationId: number;
  userId: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const useNotifications = () => {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await axiosClient.get("/notifications/me");
      return res.data || [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await axiosClient.put(`/notifications/${notificationId}/read`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const deleteNotification = useMutation({
    mutationFn: async (notificationId: number) => {
      await axiosClient.delete(`/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsRead.mutate,
    deleteNotification: deleteNotification.mutate,
  };
};

