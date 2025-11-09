import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Progress } from '../ui/progress';
import { 
  TrendingUp, Users, FolderKanban, Clock, 
  ArrowRight, Star, MessageSquare 
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: string, id?: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const stats = [
    { label: 'Active Projects', value: '12', icon: FolderKanban, change: '+2 this week', color: 'text-primary' },
    { label: 'Team Members', value: '28', icon: Users, change: '+5 new', color: 'text-accent' },
    { label: 'Hours Logged', value: '156', icon: Clock, change: '+12 this week', color: 'text-chart-4' },
    { label: 'Course Rating', value: '4.8', icon: Star, change: '↑ 0.2 pts', color: 'text-chart-5' },
  ];

  const recentProjects = [
    {
      id: '1',
      title: 'AI Study Buddy Platform',
      team: 'Machine Learning Club',
      progress: 75,
      members: 4,
      status: 'In Progress',
      color: 'bg-primary',
    },
    {
      id: '2',
      title: 'Campus Event Manager',
      team: 'Student Council',
      progress: 45,
      members: 6,
      status: 'In Progress',
      color: 'bg-accent',
    },
    {
      id: '3',
      title: 'Research Paper Collaboration',
      team: 'Computer Science Dept',
      progress: 90,
      members: 3,
      status: 'Review',
      color: 'bg-chart-4',
    },
  ];

  const upcomingDeadlines = [
    { project: 'AI Study Buddy', task: 'Frontend Implementation', date: 'Nov 8', urgent: true },
    { project: 'Campus Events', task: 'Database Schema', date: 'Nov 10', urgent: false },
    { project: 'Research Paper', task: 'Final Review', date: 'Nov 12', urgent: false },
  ];

  const recentActivity = [
    { user: 'Sarah Chen', action: 'commented on', target: 'AI Study Buddy Platform', time: '2h ago', avatar: 'SC' },
    { user: 'Mike Johnson', action: 'joined', target: 'Campus Event Manager', time: '4h ago', avatar: 'MJ' },
    { user: 'Emily Davis', action: 'completed', target: 'Database Design', time: '6h ago', avatar: 'ED' },
    { user: 'Alex Kim', action: 'rated', target: 'CS 401 - Machine Learning', time: '8h ago', avatar: 'AK' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-2">Welcome back, John! 👋</h1>
        <p className="text-muted-foreground">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-6 rounded-xl shadow-sm border-border">
              <div className="flex items-start justify-between mb-4">
                <div className={`h-12 w-12 rounded-xl ${stat.color} bg-opacity-10 flex items-center justify-center`}>
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
            <Button variant="ghost" onClick={() => onNavigate('projects')}>
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {recentProjects.map((project) => (
              <Card 
                key={project.id} 
                className="p-6 rounded-xl shadow-sm border-border hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onNavigate('project-detail', project.id)}
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
                      {[...Array(project.members)].map((_, i) => (
                        <Avatar key={i} className="h-8 w-8 border-2 border-card">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {String.fromCharCode(65 + i)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <Button variant="ghost" size="sm">
                      View Details
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Button className="w-full rounded-xl" onClick={() => onNavigate('projects')}>
            Create New Project
          </Button>
        </div>

        {/* Sidebar Content */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <Card className="p-6 rounded-xl shadow-sm border-border">
            <h3 className="mb-4">Upcoming Deadlines</h3>
            <div className="space-y-4">
              {upcomingDeadlines.map((deadline, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`h-2 w-2 rounded-full mt-2 ${deadline.urgent ? 'bg-destructive' : 'bg-primary'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{deadline.task}</p>
                    <p className="text-xs text-muted-foreground">{deadline.project}</p>
                  </div>
                  <span className={`text-xs ${deadline.urgent ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {deadline.date}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6 rounded-xl shadow-sm border-border">
            <h3 className="mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
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
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4 rounded-lg" onClick={() => onNavigate('messages')}>
              <MessageSquare className="mr-2 h-4 w-4" />
              View All Activity
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
