// src/routes/AppRoutes.tsx
import { Routes, Route } from "react-router-dom";

import { Landing } from "../components/Landing";
import { Dashboard } from "../components/pages/Dashboard";
import { Projects } from "../components/pages/Projects";
import { ProjectDetail } from "../components/pages/ProjectDetail";
import { Messages } from "../components/pages/Messages";
import { Profile } from "../components/pages/Profile";
import { Layout } from "../components/Layout";
import { MyProjects } from "../components/pages/user/MyProjects";

// Public pages
import { PublicProjects } from "../components/public/PublicProjects";
import { PublicCourses } from "../components/public/PublicCourses";
import { PublicProfessors } from "../components/public/PublicProfessors";
import { CourseDetail } from "../components/public/CourseDetail";
import { ProfessorDetail } from "../components/public/ProfessorDetail";

import { PrivateRoute } from "./PrivateRoute";

import { Login } from "../components/auth/Login";
import { Register } from "../components/auth/Register";
import { Settings } from "@/components/pages/Settings";
import {Courses} from "@/components/pages/Courses";
import { FindTeammates } from "@/components/pages/FindTeammates";
import { Professors } from "@/components/pages/Professors";
import { AdminRoute } from "./AdminRoute";
import { AdminDashboard } from "../components/pages/admin/AdminDashboard";
import { AdminUsers } from "../components/pages/admin/AdminUsers";
import { AdminProjects } from "../components/pages/admin/AdminProjects";

export function AppRoutes() {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <Routes>
      {/* Public Routes for non authenticated users*/}
      <Route path="/" element={<Landing onLogin={() => {}} />} />
      <Route path="/explore/projects" element={<PublicProjects />} />
      <Route path="/explore/courses" element={<PublicCourses />} />
      <Route path="/explore/professors" element={<PublicProfessors />} />
      <Route path="/explore/courses/:id" element={<CourseDetail />} />
      <Route path="/explore/professors/:id" element={<ProfessorDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes for students*/}
      <Route
        element={
          <PrivateRoute>
            <Layout onLogout={handleLogout} />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/myprojects" element={<MyProjects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/professors" element={<Professors />} />
        <Route path="/teammates" element={<FindTeammates />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Admin Routes */}
      <Route
        element={
          <AdminRoute>
            <Layout onLogout={handleLogout} />
          </AdminRoute>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/projects" element={<AdminProjects />} />
      </Route>
    </Routes>
  );
}
