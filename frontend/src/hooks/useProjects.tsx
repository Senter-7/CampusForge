// src/hooks/useProjects.ts
import { useQuery } from "@tanstack/react-query";
import axiosClient from "../api/axiosClient";

export const useProjects = () => {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await axiosClient.get("/projects");
      return res.data;
    },
  });
};
