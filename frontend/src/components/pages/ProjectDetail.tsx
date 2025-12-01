import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import axiosClient from '../../api/axiosClient';
import { getCurrentUserId } from '../../utils/auth';
import { toast } from 'sonner';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { 
  ArrowLeft, Users, Calendar, Clock, Github, 
  ExternalLink, MessageSquare, Star, CheckCircle2, 
  Loader2, Plus, Trash2
} from 'lucide-react';

interface ProjectDetailProps {
  projectId?: string;
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

interface TaskFormValues {
  title: string;
  description: string;
  priority: string;
  dueDate: string;
  assignedToId: string;
}

export function ProjectDetail({ projectId: propProjectId, onNavigate }: ProjectDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const projectId = propProjectId || id;
  
  // Determine source page from location state or default to 'projects'
  const sourcePage = (location.state as any)?.from || 'projects';
  
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectDto | null>(null);
  const [members, setMembers] = useState<ProjectMemberDto[]>([]);
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [updatingTask, setUpdatingTask] = useState<number | null>(null);
  const userId = getCurrentUserId();

  const handleNavigate = (page: string, navId?: string) => {
    if (onNavigate) {
      onNavigate(page, navId);
    } else {
      if (page === 'projects') {
        // Navigate back to the source page (Projects or MyProjects)
        navigate(sourcePage === 'myprojects' ? '/myprojects' : '/projects');
      } else if (page === 'messages') {
        navigate(`/messages?projectId=${navId || projectId}`);
      } else {
        navigate(`/${page}${navId ? `/${navId}` : ''}`);
      }
    }
  };

  const { control: taskControl, handleSubmit: handleTaskSubmit, reset: resetTaskForm } = useForm<TaskFormValues>({
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      dueDate: '',
      assignedToId: 'unassigned',
    },
  });

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  const fetchProjectData = async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      // Fetch project data
      const projectRes = await axiosClient.get<ProjectDto>(`/projects/${projectId}`);
      setProject(projectRes.data);

      // Fetch members
      try {
        const membersRes = await axiosClient.get<ProjectMemberDto[]>(`/projects/${projectId}/members`);
        setMembers(membersRes.data || []);
      } catch (error) {
        console.error('Failed to fetch members:', error);
        setMembers([]);
      }

      // Fetch tasks (may fail if user is not a member)
      await fetchTasks();
    } catch (error: any) {
      console.error('Failed to fetch project:', error);
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    if (!projectId) return;
    
    setLoadingTasks(true);
    setTasksError(null);
    try {
      const tasksRes = await axiosClient.get<TaskDto[]>(`/tasks/project/${projectId}`);
      setTasks(tasksRes.data || []);
    } catch (error: any) {
      // Tasks may not be accessible if user is not a project member
      if (error?.response?.status === 403 || error?.response?.status === 401) {
        setTasksError('Tasks are only visible to project members');
      } else {
        console.error('Failed to fetch tasks:', error);
        setTasksError('Failed to load tasks');
      }
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  // Calculate progress based on completed tasks
  const calculateProgress = (): number => {
    if (!tasks || tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.status === 'DONE').length;
    return Math.round((completedTasks / tasks.length) * 100);
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

  // Format date
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string | undefined): string => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return formatDate(dateString);
    } catch {
      return dateString;
    }
  };

  // Get category from skills
  const getCategory = (): string => {
    if (!project?.skills) return 'General';
    const skillsStr = Array.isArray(project.skills)
      ? project.skills.map(s => s.name).join(' ').toLowerCase()
      : '';
    if (skillsStr.includes('react native') || skillsStr.includes('mobile')) return 'Mobile';
    if (skillsStr.includes('machine learning') || skillsStr.includes('ml') || skillsStr.includes('tensorflow')) return 'Machine Learning';
    if (skillsStr.includes('design') || skillsStr.includes('figma')) return 'Design';
    return 'Web Development';
  };

  // Check if user is a project member
  const isProjectMember = (): boolean => {
    if (!userId) return false;
    return members.some(m => m.userId?.toString() === userId);
  };

  // Determine if task creation should be shown
  // Only show for project members when coming from MyProjects
  const shouldShowTaskCreation = sourcePage === 'myprojects' && isProjectMember();
  
  // Determine if task modification should be allowed
  // Only allow when coming from MyProjects
  const canModifyTasks = sourcePage === 'myprojects';

  // Check if user can modify task (creator, assignee, leader, or mentor)
  const canModifyTask = (task: TaskDto): boolean => {
    if (!userId) return false;
    if (task.createdById?.toString() === userId) return true;
    if (task.assignedToId?.toString() === userId) return true;
    const member = members.find(m => m.userId?.toString() === userId);
    return member?.role === 'LEADER' || member?.role === 'MENTOR';
  };

  // Create task
  const onSubmitTask = async (data: TaskFormValues) => {
    if (!projectId || !userId) {
      toast.error('Unable to create task');
      return;
    }

    setCreatingTask(true);
    try {
      const taskData = {
        projectId: Number(projectId),
        title: data.title,
        description: data.description || undefined,
        priority: data.priority || 'MEDIUM',
        dueDate: data.dueDate || undefined,
        assignedToId: data.assignedToId && data.assignedToId !== 'unassigned' ? Number(data.assignedToId) : undefined,
      };

      await axiosClient.post('/tasks/create', taskData);
      toast.success('Task created successfully!');
      setCreateTaskDialogOpen(false);
      resetTaskForm();
      await fetchTasks();
    } catch (error: any) {
      console.error('Failed to create task:', error);
      toast.error(error?.response?.data?.message || 'Failed to create task');
    } finally {
      setCreatingTask(false);
    }
  };

  // Update task status
  const handleUpdateTaskStatus = async (taskId: number, newStatus: string) => {
    if (updatingTask === taskId) return;
    
    setUpdatingTask(taskId);
    try {
      await axiosClient.patch(`/tasks/${taskId}/status?status=${newStatus}`);
      toast.success('Task status updated');
      await fetchTasks();
    } catch (error: any) {
      console.error('Failed to update task status:', error);
      toast.error(error?.response?.data?.message || 'Failed to update task status');
    } finally {
      setUpdatingTask(null);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await axiosClient.delete(`/tasks/${taskId}`);
      toast.success('Task deleted successfully');
      await fetchTasks();
    } catch (error: any) {
      console.error('Failed to delete task:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete task');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    const backButtonText = sourcePage === 'myprojects' ? 'Back to My Projects' : 'Back to Projects';
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => handleNavigate('projects')} className="rounded-lg">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {backButtonText}
        </Button>
        <Card className="p-12 rounded-xl shadow-sm border-border text-center">
          <h3 className="mb-2">Project not found</h3>
          <p className="text-muted-foreground mb-4">
            The project you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => handleNavigate('projects')}>{backButtonText}</Button>
        </Card>
      </div>
    );
  }

  const progress = calculateProgress();
  const skills = project.skills ? (Array.isArray(project.skills) ? project.skills : Array.from(project.skills as Array<{ skillId: number; name: string }>)) : [];
  const skillNames = skills.map((s: { skillId: number; name: string }) => s.name);
  const memberCount = project.memberIds ? (Array.isArray(project.memberIds) ? project.memberIds.length : (project.memberIds as Set<number>).size) : 0;
  const openSpots = (project.membersRequired || 5) - memberCount;
  
  // Group tasks by status
  const todoTasks = tasks.filter(t => t.status === 'TODO');
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
  const doneTasks = tasks.filter(t => t.status === 'DONE');
  
  // Determine back button text based on source page
  const backButtonText = sourcePage === 'myprojects' ? 'Back to My Projects' : 'Back to Projects';

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => handleNavigate('projects')} className="rounded-lg">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {backButtonText}
      </Button>

      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <h1>{project.title || 'Untitled Project'}</h1>
            <Badge>{project.status || 'OPEN'}</Badge>
            <Badge variant="outline">{getCategory()}</Badge>
          </div>
          <p className="text-muted-foreground mb-6">
            {project.description || 'No description available'}
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Team Size</p>
                <p>{members.length} / {project.membersRequired || 5} members</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deadline</p>
                <p className="text-sm">{project.deadline ? formatDate(project.deadline) : 'No deadline'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-chart-4/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-chart-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tasks</p>
                <p className="text-sm">{tasks.length} total</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-chart-5/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-chart-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-sm">{progress}%</p>
              </div>
            </div>
          </div>
        </div>

        <Card className="lg:w-80 p-6 rounded-xl shadow-sm border-border h-fit">
          <h3 className="mb-4">Project Actions</h3>
          <div className="space-y-3">
            {userId && members.some(m => m.userId?.toString() === userId) ? (
              <Button 
                variant="outline" 
                className="w-full rounded-xl"
                onClick={() => handleNavigate('messages', projectId)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Project Messages
              </Button>
            ) : openSpots > 0 ? (
            <Button className="w-full rounded-xl">
              <Users className="mr-2 h-4 w-4" />
              Join Project
            </Button>
            ) : (
              <Button variant="outline" className="w-full rounded-xl" disabled>
                <Users className="mr-2 h-4 w-4" />
                Project Full
            </Button>
            )}
            {openSpots > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                {openSpots} open spot{openSpots > 1 ? 's' : ''} available
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Progress Bar */}
      {tasks.length > 0 && (
      <Card className="p-6 rounded-xl shadow-sm border-border">
        <div className="flex justify-between mb-2">
          <span>Overall Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>{doneTasks.length} completed</span>
            <span>{tasks.length} total tasks</span>
        </div>
      </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
          <TabsTrigger value="team" className="rounded-lg">Team ({members.length})</TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-lg">Tasks ({tasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6 rounded-xl shadow-sm border-border">
              <h3 className="mb-4">Required Skills</h3>
              {skillNames.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                  {skillNames.map((skill, index) => (
                    <Badge key={`${skill}-${index}`} variant="secondary" className="rounded-lg">
                    {skill}
                  </Badge>
                ))}
              </div>
              ) : (
                <p className="text-muted-foreground text-sm">No skills specified</p>
              )}
            </Card>

            <Card className="p-6 rounded-xl shadow-sm border-border">
              <h3 className="mb-4">Project Info</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDate(project.createdAt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Deadline</span>
                  <span>{project.deadline ? formatDate(project.deadline) : 'No deadline'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline">{project.status || 'OPEN'}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Members</span>
                  <span>{members.length} / {project.membersRequired || 5}</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card className="p-6 rounded-xl shadow-sm border-border">
            <h3 className="mb-4">Team Members ({members.length})</h3>
            {members.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
                {members.map((member) => (
                  <div key={member.memberId} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(member.userName || 'User')}
                      </AvatarFallback>
                    </Avatar>
                  <div className="flex-1">
                      <p>{member.userName || 'Unknown User'}</p>
                      <p className="text-sm text-muted-foreground">{member.role || 'Member'}</p>
                      {member.joinedAt && (
                        <p className="text-xs text-muted-foreground">Joined {formatDate(member.joinedAt)}</p>
                      )}
                  </div>
                    {userId && member.userId?.toString() !== userId && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleNavigate('messages', projectId)}
                      >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                    )}
                </div>
              ))}
            </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No members found</p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          {/* Create Task Button - Only show for project members when coming from MyProjects */}
          {shouldShowTaskCreation && (
            <div className="flex justify-end">
              <Dialog open={createTaskDialogOpen} onOpenChange={setCreateTaskDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>
                      Add a new task to this project
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleTaskSubmit(onSubmitTask)}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="task-title">Task Title *</Label>
                        <Controller
                          name="title"
                          control={taskControl}
                          rules={{ required: 'Task title is required' }}
                          render={({ field }) => (
                            <Input 
                              id="task-title" 
                              placeholder="Enter task title" 
                              {...field}
                            />
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="task-description">Description</Label>
                        <Controller
                          name="description"
                          control={taskControl}
                          render={({ field }) => (
                            <Textarea 
                              id="task-description" 
                              placeholder="Describe the task" 
                              rows={3} 
                              {...field}
                            />
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="task-priority">Priority</Label>
                          <Controller
                            name="priority"
                            control={taskControl}
                            render={({ field }) => (
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger id="task-priority">
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="LOW">Low</SelectItem>
                                  <SelectItem value="MEDIUM">Medium</SelectItem>
                                  <SelectItem value="HIGH">High</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="task-due-date">Due Date</Label>
                          <Controller
                            name="dueDate"
                            control={taskControl}
                            render={({ field }) => (
                              <Input 
                                id="task-due-date" 
                                type="date"
                                {...field}
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="task-assignee">Assign To (Optional)</Label>
                        <Controller
                          name="assignedToId"
                          control={taskControl}
                          render={({ field }) => (
                            <Select 
                              value={field.value || "unassigned"} 
                              onValueChange={(value: string) => field.onChange(value === "unassigned" ? "" : value)}
                            >
                              <SelectTrigger id="task-assignee">
                                <SelectValue placeholder="Select team member" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {members.map((member) => (
                                  <SelectItem key={member.userId} value={String(member.userId)}>
                                    {member.userName} {member.role === 'LEADER' && '(Leader)'}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        type="button"
                        variant="outline" 
                        className="flex-1 rounded-lg"
                        onClick={() => {
                          setCreateTaskDialogOpen(false);
                          resetTaskForm({
                            title: '',
                            description: '',
                            priority: 'MEDIUM',
                            dueDate: '',
                            assignedToId: 'unassigned',
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        className="flex-1 rounded-lg"
                        disabled={creatingTask}
                      >
                        {creatingTask ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          'Create Task'
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {loadingTasks ? (
            <Card className="p-6 rounded-xl shadow-sm border-border">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            </Card>
          ) : tasksError ? (
            <Card className="p-6 rounded-xl shadow-sm border-border">
              <p className="text-muted-foreground text-center py-8">{tasksError}</p>
            </Card>
          ) : tasks.length === 0 ? (
            <Card className="p-6 rounded-xl shadow-sm border-border">
              <p className="text-muted-foreground text-center py-8">
                {isProjectMember() ? 'No tasks yet. Create your first task!' : 'No tasks found'}
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Todo Tasks */}
              {todoTasks.length > 0 && (
                <Card className="p-6 rounded-xl shadow-sm border-border">
                  <h3 className="mb-4">To Do ({todoTasks.length})</h3>
                  <div className="space-y-3">
                    {todoTasks.map((task) => (
                      <div key={task.taskId} className="p-4 bg-muted rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="mb-1">{task.title}</h4>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                              {task.priority && (
                                <Badge 
                                  variant="outline" 
                                  className={`rounded-lg text-xs ${
                                    task.priority === 'HIGH' ? 'border-destructive text-destructive' :
                                    task.priority === 'MEDIUM' ? 'border-chart-5 text-chart-5' :
                                    'border-chart-4 text-chart-4'
                                  }`}
                                >
                                  {task.priority}
                                </Badge>
                              )}
                              {task.dueDate && (
                                <span>Due: {formatDate(task.dueDate)}</span>
                              )}
                              {task.assignedToId && (
                                <span>Assigned to: {members.find(m => m.userId === task.assignedToId)?.userName || 'Unknown'}</span>
                              )}
                            </div>
                            {canModifyTasks && isProjectMember() && canModifyTask(task) && (
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateTaskStatus(task.taskId!, 'IN_PROGRESS')}
                                  disabled={updatingTask === task.taskId}
                                  className="text-xs"
                                >
                                  Start
                                </Button>
                                {canModifyTask(task) && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteTask(task.taskId!)}
                                    className="text-xs text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
              )}

              {/* In Progress Tasks */}
              {inProgressTasks.length > 0 && (
          <Card className="p-6 rounded-xl shadow-sm border-border">
                  <h3 className="mb-4">In Progress ({inProgressTasks.length})</h3>
                  <div className="space-y-3">
                    {inProgressTasks.map((task) => (
                      <div key={task.taskId} className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="flex items-start justify-between">
                  <div className="flex-1">
                            <h4 className="mb-1">{task.title}</h4>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                              {task.priority && (
                                <Badge 
                                  variant="outline" 
                                  className={`rounded-lg text-xs ${
                                    task.priority === 'HIGH' ? 'border-destructive text-destructive' :
                                    task.priority === 'MEDIUM' ? 'border-chart-5 text-chart-5' :
                                    'border-chart-4 text-chart-4'
                                  }`}
                                >
                                  {task.priority}
                                </Badge>
                              )}
                              {task.dueDate && (
                                <span>Due: {formatDate(task.dueDate)}</span>
                              )}
                              {task.assignedToId && (
                                <span>Assigned to: {members.find(m => m.userId === task.assignedToId)?.userName || 'Unknown'}</span>
                              )}
                            </div>
                            {canModifyTasks && isProjectMember() && canModifyTask(task) && (
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateTaskStatus(task.taskId!, 'DONE')}
                                  disabled={updatingTask === task.taskId}
                                  className="text-xs"
                                >
                                  Complete
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateTaskStatus(task.taskId!, 'TODO')}
                                  disabled={updatingTask === task.taskId}
                                  className="text-xs"
                                >
                                  Move to Todo
                                </Button>
                                {canModifyTask(task) && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteTask(task.taskId!)}
                                    className="text-xs text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
              )}

              {/* Completed Tasks */}
              {doneTasks.length > 0 && (
                <Card className="p-6 rounded-xl shadow-sm border-border">
                  <h3 className="mb-4">Completed ({doneTasks.length})</h3>
                  <div className="space-y-3">
                    {doneTasks.map((task) => (
                      <div key={task.taskId} className="p-4 bg-chart-4/5 rounded-lg border border-chart-4/20">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle2 className="h-4 w-4 text-chart-4" />
                              <h4 className="line-through text-muted-foreground">{task.title}</h4>
                            </div>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                              {task.assignedToId && (
                                <span>Assigned to: {members.find(m => m.userId === task.assignedToId)?.userName || 'Unknown'}</span>
                              )}
                            </div>
                            {task.updatedAt && (
                              <p className="text-xs text-muted-foreground">
                                Completed {formatRelativeTime(task.updatedAt)}
                              </p>
                            )}
                            {canModifyTasks && isProjectMember() && canModifyTask(task) && (
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateTaskStatus(task.taskId!, 'IN_PROGRESS')}
                                  disabled={updatingTask === task.taskId}
                                  className="text-xs"
                                >
                                  Reopen
                                </Button>
                                {canModifyTask(task) && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteTask(task.taskId!)}
                                    className="text-xs text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
