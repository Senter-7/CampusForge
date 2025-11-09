import { useState, useEffect } from 'react';
import axiosClient from '../../../api/axiosClient';
import { Card } from '../../ui/card';
import { Loader2 } from 'lucide-react';
import { 
  Users, FolderKanban, GraduationCap, TrendingUp,
  UserCheck, UserX, AlertCircle
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  students: number;
  admins: number;
  projects: number;
  professors?: number;
}

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axiosClient.get('/admin/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of the platform statistics and management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 rounded-xl shadow-sm border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Users</p>
              <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-xl shadow-sm border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Students</p>
              <p className="text-3xl font-bold">{stats?.students || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-accent" />
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-xl shadow-sm border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Projects</p>
              <p className="text-3xl font-bold">{stats?.projects || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-chart-4/10 flex items-center justify-center">
              <FolderKanban className="h-6 w-6 text-chart-4" />
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-xl shadow-sm border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Admins</p>
              <p className="text-3xl font-bold">{stats?.admins || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-chart-5/10 flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-chart-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 rounded-xl shadow-sm border-border">
        <h3 className="mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
            <Users className="h-5 w-5 text-primary mb-2" />
            <p className="font-medium">Manage Users</p>
            <p className="text-sm text-muted-foreground">View and manage all users</p>
          </div>
          <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
            <FolderKanban className="h-5 w-5 text-primary mb-2" />
            <p className="font-medium">Manage Projects</p>
            <p className="text-sm text-muted-foreground">View and manage all projects</p>
          </div>
          <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
            <TrendingUp className="h-5 w-5 text-primary mb-2" />
            <p className="font-medium">View Analytics</p>
            <p className="text-sm text-muted-foreground">Platform statistics and reports</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
