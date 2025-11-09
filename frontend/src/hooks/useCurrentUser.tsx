// src/hooks/useCurrentUser.ts
import { useQuery } from "@tanstack/react-query";
import axiosClient from "../api/axiosClient";
import { FolderKanban, Users, Star, Award } from "lucide-react";
import { getCurrentUserId } from "../utils/auth";

export interface Achievement {
  title: string;
  description: string;
  icon: any; // Lucide icon component
}

export interface Skill {
  name: string;
  level: number;
}

export interface Review {
  from: string;
  project: string;
  rating: number;
  comment: string;
  date: string;
}

export interface ProjectSummary {
  name: string;
  role: string;
  status: string;
}

export interface UserStats {
  projects: number;
  completed: number;
  teammates: number;
  rating: number;
}

export interface User {
  userId?: number;
  name: string;
  avatar?: string;
  profileImage?: number[] | string; // Can be byte array or base64 string
  email: string;
  role?: string; // 'STUDENT', 'PROFESSOR', 'ADMIN'
  major?: string;
  year?: string;
  location?: string;
  bio?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  joinedDate?: string;
  createdAt?: string;
  hoursPerWeek?: string;
  availability?: string;
  stats?: UserStats;
  skills: Skill[] | Array<{ skillId?: number; name?: string; level?: number }>;
  interests: string[] | Array<{ interestId?: number; name?: string }>;  // Can be strings or objects from backend
  achievements?: Achievement[];
  recentProjects?: ProjectSummary[];
  reviews?: Review[];
}

// Placeholder user if API fails or data is incomplete
const placeholderUser: User = {
  name: "John Doe",
  avatar: "JD",
  email: "john.doe@university.edu",
  major: "Computer Science",
  year: "Junior",
  location: "Berkeley, CA",
  bio: "Passionate computer science student interested in machine learning and web development. Always looking for new collaboration opportunities!",
  website: "johndoe.dev",
  github: "johndoe",
  linkedin: "johndoe",
  joinedDate: "January 2023",
  stats: {
    projects: 12,
    completed: 8,
    teammates: 28,
    rating: 4.8,
  },
  skills: [
    { name: "Python", level: 90 },
    { name: "React", level: 85 },
    { name: "Node.js", level: 80 },
    { name: "Machine Learning", level: 75 },
    { name: "UI/UX Design", level: 70 },
  ],
  interests: ["Machine Learning", "Web Development", "Data Science", "Mobile Dev"],
  achievements: [
    { title: "Project Pioneer", description: "Created 10 projects", icon: FolderKanban },
    { title: "Team Player", description: "Collaborated with 20+ students", icon: Users },
    { title: "Top Contributor", description: "Completed 5 major projects", icon: Award },
    { title: "Five Star", description: "Maintained 4.8+ rating", icon: Star },
  ],
  recentProjects: [
    { name: "AI Study Buddy", role: "Team Member", status: "Active" },
    { name: "Campus Events", role: "Lead", status: "Active" },
    { name: "Portfolio Builder", role: "Frontend Dev", status: "Completed" },
  ],
  reviews: [
    {
      from: "Sarah Chen",
      project: "AI Study Buddy",
      rating: 5,
      comment: "Excellent teammate! Very reliable and skilled.",
      date: "2 weeks ago",
    },
    {
      from: "Mike Johnson",
      project: "Campus Events",
      rating: 5,
      comment: "Great leadership and communication skills.",
      date: "1 month ago",
    },
  ],
};

export const useCurrentUser = () => {
    const userId = getCurrentUserId();
  return useQuery<User>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        const res = await axiosClient.get(`/users/${userId}`); // endpoint to fetch current user
        if (res.data) {
          // Transform interests from objects to strings if needed
          const userData = { ...res.data };
          if (userData.interests && Array.isArray(userData.interests)) {
            userData.interests = userData.interests.map((interest: any) => 
              typeof interest === 'string' ? interest : interest?.name || interest
            );
          }
          // Map createdAt to joinedDate if joinedDate doesn't exist
          if (!userData.joinedDate && userData.createdAt) {
            userData.joinedDate = userData.createdAt;
          }
          return { ...placeholderUser, ...userData };
        }
        return placeholderUser;
      } catch (error) {
        console.error("Error fetching current user:", error);
        return placeholderUser;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};
