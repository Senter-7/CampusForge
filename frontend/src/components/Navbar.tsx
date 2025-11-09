import { Button } from "./ui/button";
import { GraduationCap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface NavbarProps {
  onLogin?: () => void;
  onSignUp?: () => void;
}

export function Navbar({ onLogin, onSignUp }: NavbarProps) {
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container px-4">
        <div className="flex h-16 items-center justify-between">
          {/* 🔹 Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">
              CampusForge
            </span>
          </div>

          {/* 🔹 Navigation Links */}
          {/* <div className="hidden md:flex items-center gap-6">
            <Link
              to="/explore/projects"
              className="text-sm text-foreground hover:text-primary transition-colors"
            >
              Projects
            </Link>
            <Link
              to="/explore/professors"
              className="text-sm text-foreground hover:text-primary transition-colors"
            >
              Professors
            </Link>
            <Link
              to="/explore/courses"
              className="text-sm text-foreground hover:text-primary transition-colors"
            >
              Courses
            </Link>
            
          </div> */}

          {/* 🔹 Auth Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="rounded-lg"
              onClick={() => navigate("/login")}
            >
              Log In
            </Button>
            <Button
              className="rounded-lg"
              onClick={() => navigate("/register")}
            >
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
