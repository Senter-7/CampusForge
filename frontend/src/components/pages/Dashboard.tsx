import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Progress } from '../ui/progress';
import { Loader2 } from 'lucide-react';
import { 
  TrendingUp, Users, FolderKanban, Clock, 
  ArrowRight, Star, MessageSquare 
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { getCurrentUserId } from '../../utils/auth';
import { useCurrentUser } from '../../hooks/useCurrentUser';

interface DashboardProps {
  onNavigate?: (page: string, id?: string) => void;
}

interface ProjectDto {
  projectId?: number;
  title?: string;
  description?: string;
  creatorId?: number;
  status?: string;
  createdAt?: string;
  membersRequired?: number;
  deadline?: string;
  skills?: Array<{ skillId: number; name: string }>;
  memberIds?: number[] | Set<number>;
}

interface ProjectMemberDto {
  memberId?: number;
  projectId?: number;
  projectTitle?: string;
  userId?: number;
  userName?: string;
  role?: string;
  joinedAt?: string;
}

interface TaskDto {
  taskId?: number;
  projectId?: number;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  createdById?: number;
  assignedToId?: number;
  assignedToName?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface NotificationDto {
  notificationId?: number;
  userId?: number;
  message?: string;
  isRead?: boolean;
  createdAt?: string;
}

interface RatingDto {
  ratingId?: number;
  userId?: number;
  professorId?: number;
  courseId?: number;
  ratingValue?: number;
  comment?: string;
  createdAt?: string;
  userName?: string;
  professorName?: string;
  courseName?: string;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const navigate = useNavigate();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const userId = getCurrentUserId();
  
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    activeProjects: 0,
    teamMembers: 0,
    hoursLogged: 0,
    courseRating: 0,
    activeProjectsChange: '+0 this week',
    teamMembersChange: '+0 new',
    hoursLoggedChange: '+0 this week',
    courseRatingChange: '↑ 0.0 pts',
  });
  const [recentProjects, setRecentProjects] = useState<Array<{
    id: string;
    title: string;
    team: string;
    progress: number;
    members: number;
    status: string;
    color: string;
  }>>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<Array<{
    project: string;
    task: string;
    date: string;
    urgent: boolean;
  }>>([]);
  const [recentActivity, setRecentActivity] = useState<Array<{
    user: string;
    action: string;
    target: string;
    time: string;
    avatar: string;
  }>>([]);

  const handleNavigate = (page: string, id?: string) => {
    if (onNavigate) {
      onNavigate(page, id);
    } else {
      if (page === 'projects') {
        navigate('/projects');
      } else if (page === 'project-detail') {
        navigate(`/projects/${id}`, { state: { from: 'dashboard' } });
      } else if (page === 'messages') {
        navigate('/messages');
      } else {
        navigate(`/${page}${id ? `/${id}` : ''}`);
      }
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string | undefined): string => {
    if (!dateString) return 'Recently';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  // Format date for deadlines
  const formatDeadlineDate = (dateString: string | undefined): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Get user initials
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    if (userId && !userLoading) {
      fetchDashboardData();
    }
  }, [userId, userLoading]);

  const fetchDashboardData = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch all data in parallel
      const [projectsRes, tasksRes, notificationsRes, ratingsRes] = await Promise.all([
        axiosClient.get<ProjectDto[]>('/projects/student/me').catch(() => ({ data: [] })),
        axiosClient.get<TaskDto[]>(`/tasks/assigned/${userId}`).catch(() => ({ data: [] })),
        axiosClient.get<NotificationDto[]>('/notifications/me').catch(() => ({ data: [] })),
        axiosClient.get<RatingDto[]>(`/ratings/user/${userId}`).catch(() => ({ data: [] })),
      ]);

      const projects: ProjectDto[] = projectsRes.data || [];
      const tasks: TaskDto[] = tasksRes.data || [];
      const notifications: NotificationDto[] = notificationsRes.data || [];
      const ratings: RatingDto[] = ratingsRes.data || [];

      // Calculate stats
      const activeProjects = projects.filter(p => p.status !== 'COMPLETED').length;
      
      // Get unique team members across all projects
      const memberSet = new Set<number>();
      const projectMembersPromises = projects.map(async (project) => {
        try {
          const membersRes = await axiosClient.get<ProjectMemberDto[]>(`/projects/${project.projectId}/members`);
          membersRes.data?.forEach(m => {
            if (m.userId) memberSet.add(m.userId);
          });
        } catch (error) {
          // Ignore errors for member fetching
        }
      });
      await Promise.all(projectMembersPromises);
      const teamMembers = memberSet.size;

      // Calculate course rating average
      const courseRatings = ratings.filter(r => r.courseId && r.ratingValue);
      const avgRating = courseRatings.length > 0
        ? courseRatings.reduce((sum, r) => sum + (r.ratingValue || 0), 0) / courseRatings.length
        : 0;

      // Calculate hours logged (placeholder - doesn't exist in backend)
      const hoursLogged = 0; // This would need to be tracked separately

      setDashboardStats({
        activeProjects,
        teamMembers,
        hoursLogged,
        courseRating: Math.round(avgRating * 10) / 10,
        activeProjectsChange: '+0 this week', // Placeholder - would need time-based tracking
        teamMembersChange: '+0 new', // Placeholder
        hoursLoggedChange: '+0 this week', // Placeholder
        courseRatingChange: avgRating > 0 ? `↑ ${Math.round(avgRating * 10) / 10} pts` : 'No ratings yet',
      });

      // Fetch recent projects with progress
      const recentProjectsWithProgress = await Promise.all(
        projects
          .filter(p => p.status !== 'COMPLETED')
          .slice(0, 3)
          .map(async (project) => {
            // Fetch tasks to calculate progress
            let progress = 0;
            let memberCount = 0;
            try {
              const tasksRes = await axiosClient.get<TaskDto[]>(`/tasks/project/${project.projectId}`);
              const projectTasks = tasksRes.data || [];
              const total = projectTasks.length;
              const completed = projectTasks.filter(t => t.status === 'DONE').length;
              progress = total > 0 ? Math.round((completed / total) * 100) : 0;

              // Fetch members
              const membersRes = await axiosClient.get<ProjectMemberDto[]>(`/projects/${project.projectId}/members`);
              memberCount = membersRes.data?.length || 0;
            } catch (error) {
              // Use defaults if fetch fails
            }

            const colors = ['bg-primary', 'bg-accent', 'bg-chart-4'];
            return {
              id: String(project.projectId || ''),
              title: project.title || 'Untitled Project',
              team: `Project Team`, // Could be enhanced with actual team name
              progress,
              members: memberCount || 1,
              status: project.status === 'ONGOING' ? 'In Progress' : project.status === 'OPEN' ? 'Recruiting' : 'Review',
              color: colors[Math.floor(Math.random() * colors.length)],
            };
          })
      );
      setRecentProjects(recentProjectsWithProgress);

      // Get upcoming deadlines from tasks
      const upcomingTasks = tasks
        .filter(task => task.dueDate && task.status !== 'DONE')
        .sort((a, b) => {
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          return dateA - dateB;
        })
        .slice(0, 5)
        .map(async (task) => {
          // Fetch project name
          let projectName = 'Unknown Project';
          try {
            const projectRes = await axiosClient.get<ProjectDto>(`/projects/${task.projectId}`);
            projectName = projectRes.data?.title || 'Unknown Project';
          } catch (error) {
            // Use default
          }

          const dueDate = task.dueDate ? new Date(task.dueDate) : new Date();
          const now = new Date();
          const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const urgent = daysUntilDue <= 3 && daysUntilDue >= 0;

          return {
            project: projectName,
            task: task.title || 'Untitled Task',
            date: formatDeadlineDate(task.dueDate),
            urgent,
          };
        });

      const deadlines = await Promise.all(upcomingTasks);
      setUpcomingDeadlines(deadlines);

      // Convert notifications to recent activity
      const activities = notifications
        .slice(0, 4)
        .map((notification) => {
          // Parse notification message to extract user and action
          const message = notification.message || '';
          const parts = message.split(' ');
          const user = parts[0] || 'Someone';
          const action = parts.slice(1, -1).join(' ') || 'updated';
          const target = parts[parts.length - 1] || 'project';

          return {
            user,
            action,
            target,
            time: formatRelativeTime(notification.createdAt),
            avatar: getInitials(user),
          };
        });
      setRecentActivity(activities);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const userName = currentUser?.name || 'User';
  const displayStats = [
    { label: 'Active Projects', value: String(dashboardStats.activeProjects), icon: FolderKanban, change: dashboardStats.activeProjectsChange, color: 'text-primary' },
    { label: 'Team Members', value: String(dashboardStats.teamMembers), icon: Users, change: dashboardStats.teamMembersChange, color: 'text-accent' },
    { label: 'Hours Logged', value: String(dashboardStats.hoursLogged), icon: Clock, change: dashboardStats.hoursLoggedChange, color: 'text-chart-4' },
    { label: 'Course Rating', value: dashboardStats.courseRating > 0 ? String(dashboardStats.courseRating) : 'N/A', icon: Star, change: dashboardStats.courseRatingChange, color: 'text-chart-5' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-2">Welcome back, {userName.split(' ')[0]}! 👋</h1>
        <p className="text-muted-foreground">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-6 rounded-xl shadow-sm border-border">
              <div className="flex items-start justify-between mb-4">
                <div className={`h-12 w-12 rounded-xl ${stat.color.replace('text-', 'bg-')}/10 flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm">{stat.label}</p>
                <p className="text-3xl">{stat.value}</p>
                <div className="flex items-center gap-1 text-sm text-chart-4">
                  <TrendingUp className="h-3 w-3" />
                  <span>{stat.change}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2>Recent Projects</h2>
            <Button variant="ghost" onClick={() => handleNavigate('projects')}>
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {recentProjects.length === 0 ? (
              <Card className="p-12 rounded-xl shadow-sm border-border text-center">
                <p className="text-muted-foreground mb-4">No active projects yet.</p>
                <Button onClick={() => handleNavigate('myprojects')}>
                  Create New Project
                </Button>
              </Card>
            ) : (
              recentProjects.map((project) => (
                <Card 
                  key={project.id} 
                  className="p-6 rounded-xl shadow-sm border-border hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleNavigate('project-detail', project.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`h-3 w-3 rounded-full ${project.color}`} />
                        <h3>{project.title}</h3>
                      </div>
                      <p className="text-muted-foreground text-sm">{project.team}</p>
                    </div>
                    <Badge variant={project.status === 'Review' ? 'secondary' : 'default'}>
                      {project.status}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {[...Array(Math.min(project.members, 3))].map((_, i) => (
                          <Avatar key={i} className="h-8 w-8 border-2 border-card">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {String.fromCharCode(65 + i)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {project.members > 3 && (
                          <Avatar className="h-8 w-8 border-2 border-card">
                            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                              +{project.members - 3}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          handleNavigate('project-detail', project.id);
                        }}
                      >
                        View Details
                        <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          <Button className="w-full rounded-xl" onClick={() => handleNavigate('myprojects')}>
            Create New Project
          </Button>
        </div>

        {/* Sidebar Content */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <Card className="p-6 rounded-xl shadow-sm border-border">
            <h3 className="mb-4">Upcoming Deadlines</h3>
            <div className="space-y-4">
              {upcomingDeadlines.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming deadlines</p>
              ) : (
                upcomingDeadlines.map((deadline, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`h-2 w-2 rounded-full mt-2 ${deadline.urgent ? 'bg-destructive' : 'bg-primary'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{deadline.task}</p>
                      <p className="text-xs text-muted-foreground">{deadline.project}</p>
                    </div>
                    <span className={`text-xs whitespace-nowrap ${deadline.urgent ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {deadline.date}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6 rounded-xl shadow-sm border-border">
            <h3 className="mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
              ) : (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {activity.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span>{activity.user}</span>{' '}
                        <span className="text-muted-foreground">{activity.action}</span>{' '}
                        <span className="text-primary">{activity.target}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4 rounded-lg" onClick={() => handleNavigate('messages')}>
              <MessageSquare className="mr-2 h-4 w-4" />
              View All Activity
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
