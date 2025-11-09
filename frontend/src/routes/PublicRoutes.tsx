import { Routes, Route } from "react-router-dom";
import { Landing } from "../components/Landing";
import { Professors } from "../components/pages/Professors";
import { Courses } from "../components/pages/Courses";
import { Projects } from "../components/pages/Projects";
import { Navbar } from "../components/Navbar";

interface PublicRoutesProps {
  onLogin: () => void;
}

export function PublicRoutes({ onLogin }: PublicRoutesProps) {
  const handleNavigate = (page: string) => {
    console.log(`Navigating to ${page}`);
    // Optionally use navigate() from react-router here
  };

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing onLogin={onLogin} />} />
        <Route path="/professors" element={<Professors onNavigate={handleNavigate} />} />
        <Route path="/courses" element={<Courses onNavigate={handleNavigate} />} />
        <Route path="/projects" element={<Projects onNavigate={handleNavigate} />} />
      </Routes>
    </>
  );
}
