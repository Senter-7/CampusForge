import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import axiosClient from '../../../api/axiosClient';
import { getCurrentUserId } from '../../../utils/auth';
import { toast } from 'sonner';
import { Loader2, Plus, ArrowRight } from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Progress } from '../../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog';
import { 
  Users, Clock, MoreVertical, 
  Calendar, CheckCircle2, AlertCircle, FolderKanban
} from 'lucide-react';

interface MyProjectsProps {
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
  memberIds?: number[];
}

interface ProjectFormValues {
  title: string;
  description: string;
  skills: string;
  membersRequired: number;
  deadline: string;
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
  projectTitle?: string;
}

interface CollaborationRequestDto {
  requestId?: number;
  projectId?: number;
  projectTitle?: string;
  studentId?: number;
  studentName?: string;
  status?: string;
  createdAt?: string;
}

interface ProjectDisplay {
  id: string;
  title: string;
  role: string;
  progress: number;
  tasks: { total: number; completed: number };
  members: number;
  deadline: string;
  status: 'on-track' | 'at-risk';
  lastUpdate: string;
  completedDate?: string;
  rating?: number;
}

export function MyProjects({ onNavigate }: MyProjectsProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeProjects, setActiveProjects] = useState<ProjectDisplay[]>([]);
  const [completedProjects, setCompletedProjects] = useState<ProjectDisplay[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<CollaborationRequestDto[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<TaskDto[]>([]);
  const [tasksDue, setTasksDue] = useState<TaskDto[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const userId = getCurrentUserId();

  const handleProjectClick = (projectId: string) => {
    if (onNavigate) {
      onNavigate('project-detail', projectId);
    } else {
      // Pass state to indicate we're coming from MyProjects page
      navigate(`/projects/${projectId}`, { state: { from: 'myprojects' } });
    }
  };

  const { control, handleSubmit, reset } = useForm<ProjectFormValues>({
    defaultValues: {
      title: '',
      description: '',
      skills: '',
      membersRequired: 5,
      deadline: '',
    },
  });

  useEffect(() => {
    fetchMyProjects();
    fetchPendingInvites();
    fetchUpcomingTasks();
    fetchTasksDue();
  }, [userId]);

  // Fetch collaboration requests where user is project owner
  const fetchPendingInvites = async () => {
    if (!userId) {
      console.log('[Pending Invites] No userId, skipping fetch');
      return;
    }
    setLoadingInvites(true);
    try {
      // Convert userId to number for proper comparison (userId from localStorage is string)
      const userIdNum = Number(userId);
      console.log(`[Pending Invites] Fetching pending invites for owner ${userIdNum} (userId: ${userId})`);
      
      // Use the new efficient endpoint to get all pending requests for this owner
      const res = await axiosClient.get<CollaborationRequestDto[]>(
        `/collaboration/owner/${userIdNum}/pending`
      );
      
      const requests = res.data || [];
      console.log(`[Pending Invites] API returned ${requests.length} pending invites:`, requests);
      
      // Filter to ensure we only show PENDING status (backend should already do this, but double-check)
      const pendingRequests = requests.filter(req => req.status === 'PENDING');
      console.log(`[Pending Invites] Filtered to ${pendingRequests.length} PENDING requests`);
      
      setPendingInvites(pendingRequests);
    } catch (error: any) {
      console.error('[Pending Invites] Failed to fetch pending invites:', error);
      console.error('[Pending Invites] Error details:', {
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
        data: error?.response?.data
      });
      // Don't show error toast if it's just 404 (no requests found) or 400 (bad request)
      if (error?.response?.status !== 404 && error?.response?.status !== 400) {
        toast.error(error?.response?.data?.message || 'Failed to load pending invites');
      }
      setPendingInvites([]);
    } finally {
      setLoadingInvites(false);
    }
  };

  // Fetch upcoming tasks (assigned to user, not completed, due in next 7 days)
  const fetchUpcomingTasks = async () => {
    if (!userId) {
      setUpcomingTasks([]);
      return;
    }
    try {
      // Get all projects user is a member of (not just creator)
      const projectsRes = await axiosClient.get<ProjectDto[]>('/projects/student/me');
      const projects = projectsRes.data || [];
      
      // Fetch tasks from all projects
      const allTasks: TaskDto[] = [];
      for (const project of projects) {
        if (!project.projectId) continue;
        try {
          const tasksRes = await axiosClient.get<TaskDto[]>(`/tasks/project/${project.projectId}`);
          const projectTasks = tasksRes.data || [];
          // Filter tasks assigned to current user and add project title
          projectTasks.forEach((task) => {
            if (task.assignedToId?.toString() === userId) {
              allTasks.push({ ...task, projectTitle: project.title || 'Untitled Project' });
            }
          });
        } catch (error) {
          console.warn(`Failed to fetch tasks for project ${project.projectId}:`, error);
        }
      }
      
      const tasks = allTasks;
      
      console.log(`[Upcoming Tasks] Fetched ${tasks.length} tasks for user ${userId}`);
      
      // Set time to start of day for accurate date comparison
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const sevenDaysFromNow = new Date(now);
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      
      console.log(`[Upcoming Tasks] Filtering tasks with due dates between ${now.toISOString()} and ${sevenDaysFromNow.toISOString()}`);
      
      const upcoming = tasks
        .filter(task => {
          // Check if task is not done
          if (task.status === 'DONE') {
            console.log(`[Upcoming Tasks] Task ${task.taskId} filtered out: status is DONE`);
            return false;
          }
          
          // Check if task has a due date
          if (!task.dueDate) {
            console.log(`[Upcoming Tasks] Task ${task.taskId} filtered out: no due date`);
            return false;
          }
          
          try {
            // Parse the date (could be ISO string or date string)
            const taskDueDate = new Date(task.dueDate);
            taskDueDate.setHours(0, 0, 0, 0);
            
            // Check if due date is between now and 7 days from now
            const isInRange = taskDueDate >= now && taskDueDate <= sevenDaysFromNow;
            console.log(`[Upcoming Tasks] Task ${task.taskId} (${task.title}): dueDate=${task.dueDate}, parsed=${taskDueDate.toISOString()}, inRange=${isInRange}`);
            return isInRange;
          } catch (e) {
            console.warn(`[Upcoming Tasks] Invalid date format for task ${task.taskId}:`, task.dueDate, e);
            return false;
          }
        })
        .sort((a, b) => {
          if (!a.dueDate || !b.dueDate) return 0;
          try {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          } catch {
            return 0;
          }
        })
        .slice(0, 5); // Limit to 5 most upcoming

      console.log(`[Upcoming Tasks] Final result: ${upcoming.length} upcoming tasks`);
      setUpcomingTasks(upcoming);
    } catch (error: any) {
      console.error('Failed to fetch upcoming tasks:', error);
      // Show error to user only if it's not a 404 (no tasks is fine)
      if (error?.response?.status !== 404) {
        console.error('Error details:', error?.response?.data || error.message);
      }
      setUpcomingTasks([]);
    }
  };

  // Fetch tasks that are due soon (overdue or due within 3 days)
  const fetchTasksDue = async () => {
    if (!userId) {
      setTasksDue([]);
      return;
    }
    try {
      // Get all projects user is a member of (not just creator)
      const projectsRes = await axiosClient.get<ProjectDto[]>('/projects/student/me');
      const projects = projectsRes.data || [];
      
      // Fetch tasks from all projects
      const allTasks: TaskDto[] = [];
      for (const project of projects) {
        if (!project.projectId) continue;
        try {
          const tasksRes = await axiosClient.get<TaskDto[]>(`/tasks/project/${project.projectId}`);
          const projectTasks = tasksRes.data || [];
          // Filter tasks assigned to current user and add project title
          projectTasks.forEach((task) => {
            if (task.assignedToId?.toString() === userId) {
              allTasks.push({ ...task, projectTitle: project.title || 'Untitled Project' });
            }
          });
        } catch (error) {
          console.warn(`Failed to fetch tasks for project ${project.projectId}:`, error);
        }
      }
      
      const tasks = allTasks;
      
      console.log(`[Tasks Due] Fetched ${tasks.length} tasks for user ${userId}`);
      
      // Set time to start of day for accurate date comparison
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const threeDaysFromNow = new Date(now);
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      
      console.log(`[Tasks Due] Filtering tasks with due dates <= ${threeDaysFromNow.toISOString()}`);
      
      const due = tasks
        .filter(task => {
          // Check if task is not done
          if (task.status === 'DONE') {
            console.log(`[Tasks Due] Task ${task.taskId} filtered out: status is DONE`);
            return false;
          }
          
          // Check if task has a due date
          if (!task.dueDate) {
            console.log(`[Tasks Due] Task ${task.taskId} filtered out: no due date`);
            return false;
          }
          
          try {
            // Parse the date (could be ISO string or date string)
            const taskDueDate = new Date(task.dueDate);
            taskDueDate.setHours(0, 0, 0, 0);
            
            // Check if due date is within 3 days (including overdue)
            const isDue = taskDueDate <= threeDaysFromNow;
            console.log(`[Tasks Due] Task ${task.taskId} (${task.title}): dueDate=${task.dueDate}, parsed=${taskDueDate.toISOString()}, isDue=${isDue}`);
            return isDue;
          } catch (e) {
            console.warn(`[Tasks Due] Invalid date format for task ${task.taskId}:`, task.dueDate, e);
            return false;
          }
        })
        .sort((a, b) => {
          if (!a.dueDate || !b.dueDate) return 0;
          try {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          } catch {
            return 0;
          }
        });

      console.log(`[Tasks Due] Final result: ${due.length} tasks due`);
      setTasksDue(due);
    } catch (error: any) {
      console.error('Failed to fetch tasks due:', error);
      // Show error to user only if it's not a 404 (no tasks is fine)
      if (error?.response?.status !== 404) {
        console.error('Error details:', error?.response?.data || error.message);
      }
      setTasksDue([]);
    }
  };

  // Fetch tasks for a project and calculate progress
  const fetchTasksForProject = async (projectId: number): Promise<{ total: number; completed: number; progress: number }> => {
    try {
      const tasksRes = await axiosClient.get<TaskDto[]>(`/tasks/project/${projectId}`);
      const tasks = tasksRes.data || [];
      const total = tasks.length;
      const completed = tasks.filter(task => task.status === 'DONE').length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { total, completed, progress };
    } catch (error: any) {
      // If user is not a member or tasks can't be fetched, return 0 progress
      console.warn(`Failed to fetch tasks for project ${projectId}:`, error);
      return { total: 0, completed: 0, progress: 0 };
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string | undefined): string => {
    if (!dateString) return 'Recently';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  const fetchMyProjects = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch all projects and filter by creatorId
      const res = await axiosClient.get('/projects');
      const allProjects: ProjectDto[] = res.data || [];
      
      // Filter projects created by the current user
      const myProjects = allProjects.filter(
        project => project.creatorId?.toString() === userId
      );

      // Transform and categorize projects with actual task data
      const active: ProjectDisplay[] = [];
      const completed: ProjectDisplay[] = [];

      // Fetch tasks for all projects in parallel
      const projectsWithTasks = await Promise.all(
        myProjects.map(async (project) => {
          const taskData = await fetchTasksForProject(project.projectId!);
          return { project, taskData };
        })
      );

      projectsWithTasks.forEach(({ project, taskData }, index) => {
        // Format deadline if it exists
        let deadlineStr = 'No deadline set';
        if (project.deadline) {
          try {
            deadlineStr = new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          } catch (e) {
            deadlineStr = project.deadline;
          }
        }

        // Determine if project should be in completed tab
        // Completed if: backend status is COMPLETED OR (all tasks are completed and has at least one task)
        const isCompleted = project.status === 'COMPLETED' || 
          (taskData.total > 0 && taskData.completed === taskData.total);
        
        // Determine status (at-risk if deadline is past and not completed)
        let status: 'on-track' | 'at-risk' = 'on-track';
        if (!isCompleted && project.deadline) {
          try {
            const deadline = new Date(project.deadline);
            const now = new Date();
            if (deadline < now && taskData.progress < 100) {
              status = 'at-risk';
            }
          } catch (e) {
            // Invalid date, keep default
          }
        }

        // Get last update time from project's createdAt or most recent task
        const lastUpdate = project.createdAt ? formatRelativeTime(project.createdAt) : 'Recently';
        
        const transformed: ProjectDisplay = {
          id: String(project.projectId || index),
          title: project.title || 'Untitled Project',
          role: 'Project Lead', // User is the creator
          progress: taskData.progress,
          tasks: {
            total: taskData.total,
            completed: taskData.completed
          },
          members: project.memberIds?.length || 1,
          deadline: deadlineStr,
          status,
          lastUpdate,
        };

        if (isCompleted) {
          // Use the most recent task completion date if available, otherwise use current date
          const completedDate = taskData.completed > 0 && project.createdAt
            ? new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          
          completed.push({
            ...transformed,
            progress: 100, // Ensure progress shows 100% for completed projects
            completedDate,
            rating: 5, // Fallback - could be fetched from ratings later
          });
        } else {
          active.push(transformed);
        }
      });

      setActiveProjects(active);
      setCompletedProjects(completed);
    } catch (error) {
      console.error('Failed to fetch my projects:', error);
      toast.error('Failed to load your projects');
      // Keep empty arrays on error
      setActiveProjects([]);
      setCompletedProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitProject = async (data: ProjectFormValues) => {
    if (!userId) {
      toast.error('Please log in to create a project');
      return;
    }

    setCreating(true);
    try {
      // Parse skills from comma-separated string
      const skillNames = data.skills
        ? data.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
        : [];

      // Create skills array for backend
      const skills = skillNames.map((name: string) => ({
        skillId: 0, // Will be created/found on backend
        name,
      }));

      const projectData: Partial<ProjectDto> = {
        title: data.title,
        description: data.description,
        status: 'OPEN',
        membersRequired: data.membersRequired || 5,
        deadline: data.deadline || undefined,
        skills: skills as any,
      };

      const response = await axiosClient.post('/projects', projectData);
      const createdProject: ProjectDto = response.data;
      
      if (createdProject && createdProject.projectId) {
        toast.success('Project created successfully!');
        setCreateDialogOpen(false);
        reset();
        // Refresh projects list and invites
        await fetchMyProjects();
        await fetchPendingInvites();
      } else {
        toast.error('Project created but response was invalid.');
      }
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast.error(error?.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  // Handle accepting or declining collaboration requests
  const handleRespondToInvite = async (requestId: number, action: 'approve' | 'reject') => {
    if (!userId) return;
    try {
      await axiosClient.put(`/collaboration/${requestId}/respond`, null, {
        params: { ownerId: userId, action }
      });
      
      toast.success(action === 'approve' ? 'Invite accepted!' : 'Invite declined');
      await fetchPendingInvites();
      await fetchMyProjects(); // Refresh projects to update member count
    } catch (error: any) {
      console.error(`Failed to ${action} invite:`, error);
      toast.error(error?.response?.data?.message || `Failed to ${action} invite`);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'No date';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = date.getTime() - now.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
      if (diffDays === 0) return 'Due today';
      if (diffDays === 1) return 'Due tomorrow';
      if (diffDays < 7) return `Due in ${diffDays} days`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateString;
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="mb-2">My Projects</h1>
          <p className="text-muted-foreground">
            Manage and track all your active and completed projects
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Start a new project and invite teammates to collaborate
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmitProject)}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name *</Label>
                  <Controller
                    name="title"
                    control={control}
                    rules={{ required: 'Project name is required' }}
                    render={({ field }) => (
                      <Input 
                        id="project-name" 
                        placeholder="Enter project name" 
                        {...field}
                      />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Controller
                    name="description"
                    control={control}
                    rules={{ required: 'Description is required' }}
                    render={({ field }) => (
                      <Textarea 
                        id="description" 
                        placeholder="Describe your project" 
                        rows={4} 
                        {...field}
                      />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skills">Required Skills (comma separated)</Label>
                  <Controller
                    name="skills"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="skills" 
                        placeholder="React, Node.js, MongoDB" 
                        {...field}
                      />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="members-required">Members Required *</Label>
                  <Controller
                    name="membersRequired"
                    control={control}
                    rules={{ 
                      required: 'Members required is required',
                      min: { value: 1, message: 'At least 1 member is required' },
                      max: { value: 20, message: 'Maximum 20 members allowed' }
                    }}
                    render={({ field }) => (
                      <Input 
                        id="members-required" 
                        type="number"
                        min="1"
                        max="20"
                        placeholder="5"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Controller
                    name="deadline"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="deadline" 
                        type="date"
                        {...field}
                      />
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
                    setCreateDialogOpen(false);
                    reset();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="flex-1 rounded-lg"
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 rounded-xl shadow-sm border-border">
          <p className="text-muted-foreground text-sm mb-1">Active</p>
          <p className="text-2xl text-primary">{activeProjects.length}</p>
        </Card>
        <Card className="p-4 rounded-xl shadow-sm border-border">
          <p className="text-muted-foreground text-sm mb-1">Completed</p>
          <p className="text-2xl text-chart-4">{completedProjects.length}</p>
        </Card>
        <Card className="p-4 rounded-xl shadow-sm border-border">
          <p className="text-muted-foreground text-sm mb-1">Pending</p>
          <p className="text-2xl text-chart-5">{pendingInvites.length}</p>
        </Card>
        <Card className="p-4 rounded-xl shadow-sm border-border">
          <p className="text-muted-foreground text-sm mb-1">Tasks Due</p>
          <p className="text-2xl text-destructive">{tasksDue.length}</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="active">
            <TabsList className="rounded-xl">
              <TabsTrigger value="active" className="rounded-lg">Active Projects</TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4 mt-6">
              {activeProjects.length === 0 ? (
                <Card className="p-12 rounded-xl shadow-sm border-border text-center">
                  <div className="max-w-md mx-auto">
                    <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                      <FolderKanban className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="mb-2">No active projects</h3>
                    <p className="text-muted-foreground mb-4">
                      You haven't created any projects yet. Start by creating your first project!
                    </p>
                   
                  </div>
                </Card>
              ) : (
                activeProjects.map((project) => (
                <Card 
                  key={project.id} 
                  className="p-6 rounded-xl shadow-sm border-border hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => handleProjectClick(project.id)}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="group-hover:text-primary transition-colors">{project.title}</h3>
                          {project.status === 'at-risk' && (
                            <AlertCircle className="h-5 w-5 text-destructive" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{project.role}</span>
                          <span>•</span>
                          <span>Updated {project.lastUpdate}</span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                        }}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Tasks</p>
                          <p className="text-sm">{project.tasks.completed}/{project.tasks.total}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Team</p>
                          <p className="text-sm">{project.members} members</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Deadline</p>
                          <p className="text-sm">{project.deadline.split(',')[0]}</p>
                        </div>
                      </div>
                    </div>

                    {/* Footer with View Button */}
                    <div className="pt-4 border-t border-border flex justify-end">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          handleProjectClick(project.id);
                        }}
                      >
                        View
                        <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </div>

                    {/* Status Badge */}
                    {project.status === 'at-risk' && (
                      <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <p className="text-sm text-destructive">This project is behind schedule</p>
                      </div>
                    )}
                  </div>
                </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4 mt-6">
              {completedProjects.length === 0 ? (
                <Card className="p-12 rounded-xl shadow-sm border-border text-center">
                  <div className="max-w-md mx-auto">
                    <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                      <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="mb-2">No completed projects</h3>
                    <p className="text-muted-foreground">
                      Projects you complete will appear here.
                    </p>
                  </div>
                </Card>
              ) : (
                completedProjects.map((project) => (
                <Card 
                  key={project.id} 
                  className="p-6 rounded-xl shadow-sm border-border hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => handleProjectClick(project.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle2 className="h-5 w-5 text-chart-4" />
                        <h3 className="group-hover:text-primary transition-colors">{project.title}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span>{project.role}</span>
                        <span>•</span>
                        <span>{project.members} members</span>
                        <span>•</span>
                        <span>Completed {project.completedDate}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(project.rating)].map((_, i) => (
                          <span key={i} className="text-chart-5">★</span>
                        ))}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        handleProjectClick(project.id);
                      }}
                    >
                      View
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </div>
                </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pending Invites */}
          <Card className="p-6 rounded-xl shadow-sm border-border">
            <h3 className="mb-4">Pending Invites ({pendingInvites.length})</h3>
            {loadingInvites ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : pendingInvites.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No pending invites
              </p>
            ) : (
            <div className="space-y-4">
              {pendingInvites.map((invite, index) => (
                  <div key={invite.requestId || index} className="space-y-3">
                  <div>
                      <p className="text-sm font-medium mb-1">{invite.projectTitle || 'Untitled Project'}</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Request from <span className="font-medium">{invite.studentName || 'Unknown'}</span>
                      </p>
                    <p className="text-xs text-muted-foreground">
                        Received {formatRelativeTime(invite.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1 rounded-lg"
                        onClick={() => handleRespondToInvite(invite.requestId!, 'approve')}
                      >
                        Accept
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 rounded-lg"
                        onClick={() => handleRespondToInvite(invite.requestId!, 'reject')}
                      >
                      Decline
                    </Button>
                  </div>
                  {index < pendingInvites.length - 1 && (
                    <div className="border-t border-border pt-4" />
                  )}
                </div>
              ))}
            </div>
            )}
          </Card>

          {/* Upcoming Tasks */}
          <Card className="p-6 rounded-xl shadow-sm border-border">
            <h3 className="mb-4">Upcoming Tasks</h3>
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No upcoming tasks
              </p>
            ) : (
            <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div 
                    key={task.taskId} 
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      if (task.projectId) {
                        if (onNavigate) {
                          onNavigate('project-detail', String(task.projectId));
                        } else {
                          navigate(`/projects/${task.projectId}`);
                        }
                      }
                    }}
                  >
                    <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${
                      task.priority === 'HIGH' ? 'bg-destructive' :
                      task.priority === 'MEDIUM' ? 'bg-chart-5' : 'bg-chart-4'
                  }`} />
                  <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title || 'Untitled Task'}</p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {task.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {task.projectTitle || 'Untitled Project'}
                      </p>
                  </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                      {formatDate(task.dueDate)}
                  </span>
                </div>
              ))}
            </div>
            )}
          </Card>

          {/* Tasks Due */}
          <Card className="p-6 rounded-xl shadow-sm border-border">
            <h3 className="mb-4">Tasks Due ({tasksDue.length})</h3>
            {tasksDue.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tasks due soon
              </p>
            ) : (
              <div className="space-y-3">
                {tasksDue.map((task) => {
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
                  return (
                    <div 
                      key={task.taskId} 
                      className={`flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${
                        isOverdue ? 'bg-destructive/5 border border-destructive/20' : ''
                      }`}
                      onClick={() => {
                        if (task.projectId) {
                          if (onNavigate) {
                            onNavigate('project-detail', String(task.projectId));
                          } else {
                            navigate(`/projects/${task.projectId}`);
                          }
                        }
                      }}
                    >
                      <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${
                        isOverdue ? 'bg-destructive' :
                        task.priority === 'HIGH' ? 'bg-destructive' :
                        task.priority === 'MEDIUM' ? 'bg-chart-5' : 'bg-chart-4'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title || 'Untitled Task'}</p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {task.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {task.projectTitle || 'Untitled Project'}
                        </p>
        </div>
                      <span className={`text-xs whitespace-nowrap flex-shrink-0 ${
                        isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'
                      }`}>
                        {formatDate(task.dueDate)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
