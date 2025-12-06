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
    staleTime: 0, // Always consider data stale to allow immediate refetch after mutations
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await axiosClient.put(`/notifications/${notificationId}/read`);
      return res.data;
    },
    onMutate: async (notificationId: number) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      
      // Snapshot the previous value
      const previousNotifications = queryClient.getQueryData<Notification[]>(["notifications"]);
      
      // Optimistically update to mark as read
      if (previousNotifications) {
        queryClient.setQueryData<Notification[]>(["notifications"], (old) => {
          if (!old) return old;
          return old.map((n) =>
            n.notificationId === notificationId ? { ...n, isRead: true } : n
          );
        });
      }
      
      return { previousNotifications };
    },
    onError: (err, notificationId, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(["notifications"], context.previousNotifications);
      }
    },
    onSuccess: () => {
      // Refetch to ensure we have the latest data from server
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.refetchQueries({ queryKey: ["notifications"] });
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

