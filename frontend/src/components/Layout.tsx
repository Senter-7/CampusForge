
// src/components/Layout.tsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import {
  Home, FolderKanban, Users, BookOpen, User, MessageSquare,
  Settings, GraduationCap, Star, Menu, X, Bell, Search, LogOut, Trash2, Moon, Sun
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Popover, PopoverTrigger } from "./ui/popover";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "./ui/utils";
import { ScrollArea } from "./ui/scroll-area";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useNotifications } from "../hooks/useNotifications";

interface LayoutProps {
  onLogout: () => void;
}

export function Layout({ onLogout }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: currentUser } = useCurrentUser();
  const { notifications, unreadCount, isLoading: notificationsLoading, markAsRead, deleteNotification } = useNotifications();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('system');
    } else {
      setTheme('dark');
    }
  };

  // Generate initials from user name
  const getInitials = (name: string | undefined): string => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const userInitials = getInitials(currentUser?.name);

  const isAdmin = currentUser?.role === 'ADMIN';
  
  const studentNavigation = [
    { name: "Dashboard", icon: Home, path: "/dashboard" },
    { name: "Projects", icon: FolderKanban, path: "/projects" },
    { name: "My Projects", icon: BookOpen, path: "/myprojects" },
    { name: "Find Teammates", icon: Users, path: "/teammates" },
    { name: "Professors", icon: GraduationCap, path: "/professors" },
    { name: "Courses", icon: Star, path: "/courses" },
    { name: "Messages", icon: MessageSquare, path: "/messages"/*, badge: 5 */},
    { name: "Profile", icon: User, path: "/profile" },
    { name: "Settings", icon: Settings, path: "/settings" },
  ];

  const adminNavigation = [
    { name: "Admin Dashboard", icon: Home, path: "/admin/dashboard" },
    { name: "Users", icon: Users, path: "/admin/users" },
    { name: "Projects", icon: FolderKanban, path: "/admin/projects" },
    { name: "Settings", icon: Settings, path: "/settings" },
  ];

  const navigation = isAdmin ? adminNavigation : studentNavigation;

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50 shadow-sm">
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl text-foreground">CampusForge</span>
            </div>
          </div>

          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects, teammates, courses..."
                className="pl-10 bg-muted border-0"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="relative"
                title={`Current theme: ${theme || 'system'}`}
              >
                {theme === 'dark' ? (
                  <Moon className="h-5 w-5" />
                ) : theme === 'light' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </Button>
            )}

            {/* Notifications Popover */}
            <Popover open={notificationOpen} onOpenChange={(open: boolean) => {
              console.log("Popover onOpenChange called:", open, "Current state:", notificationOpen);
              setNotificationOpen(open);
            }}>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content
                  className={cn(
                    "w-80 p-0 bg-popover border shadow-lg",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                    "data-[side=bottom]:slide-in-from-top-2",
                    "rounded-md outline-hidden"
                  )}
                  align="end"
                  side="bottom"
                  sideOffset={8}
                  style={{ zIndex: 1000 }}
                  onOpenAutoFocus={(e: Event) => {
                    const element = e.target as HTMLElement;
                    // Force z-index via inline style
                    if (element) {
                      element.style.zIndex = '1000';
                    }
                  }}
                >
                  <div className="p-4 border-b">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                  {notificationsLoading ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      Loading notifications...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-sm text-muted-foreground">No notifications yet</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="divide-y">
                        {notifications.map((notification) => (
                          <div
                            key={notification.notificationId}
                            className={`p-4 hover:bg-muted/50 transition-colors ${
                              !notification.isRead ? "bg-primary/5" : ""
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm">{notification.message}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(notification.createdAt).toLocaleDateString()} at{" "}
                                  {new Date(notification.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                {!notification.isRead && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => markAsRead(notification.notificationId)}
                                    title="Mark as read"
                                  >
                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                  onClick={() => deleteNotification(notification.notificationId)}
                                  title="Delete"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </PopoverPrimitive.Content>
              </PopoverPrimitive.Portal>
            </Popover>

            {/* User Avatar */}
            <Avatar
              className="h-9 w-9 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
              onClick={() => navigate("/profile")}
            >
              <AvatarImage src={currentUser?.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className={`fixed top-16 left-0 bottom-0 w-64 bg-card border-r border-border z-40 transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="h-full overflow-y-auto p-4">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.path);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </div>
                   {/*{item.badge && (
                    <Badge variant={isActive ? 'secondary' : 'default'} className="h-5 min-w-5 px-1.5">
                      {item.badge}
                    </Badge>
                  )}*/}
                </button>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 rounded-lg border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`pt-16 transition-all duration-200 ${sidebarOpen ? 'lg:pl-64' : ''}`}>
        <div className="p-6 lg:p-8">
          <Outlet /> {/* 🔹 All routed pages render here */}
        </div>
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
