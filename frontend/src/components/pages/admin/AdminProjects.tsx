import { useState, useEffect } from 'react';
import axiosClient from '../../../api/axiosClient';
import { toast } from 'sonner';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Loader2, Search, Trash2, Eye, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProjectDto {
  projectId?: number;
  title?: string;
  description?: string;
  creatorId?: number;
  status?: string;
  createdAt?: string;
  membersRequired?: number;
  deadline?: string;
  memberIds?: number[] | Set<number>;
}

export function AdminProjects() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/projects');
      setProjects(res.data || []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      await axiosClient.delete(`/admin/projects/${projectId}`);
      toast.success('Project deleted successfully');
      await fetchProjects();
    } catch (error: any) {
      console.error('Failed to delete project:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete project');
    }
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const getStatusBadgeVariant = (status: string | undefined) => {
    switch (status?.toUpperCase()) {
      case 'OPEN':
        return 'default';
      case 'ONGOING':
        return 'secondary';
      case 'COMPLETED':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchQuery || 
      project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status?.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  const getMemberCount = (project: ProjectDto): number => {
    if (!project.memberIds) return 0;
    return Array.isArray(project.memberIds) ? project.memberIds.length : project.memberIds.size;
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
        <h1 className="mb-2">Project Management</h1>
        <p className="text-muted-foreground">
          View and manage all projects on the platform
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4 rounded-xl shadow-sm border-border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {/* Projects Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.length === 0 ? (
          <Card className="p-12 rounded-xl shadow-sm border-border text-center col-span-full">
            <div className="max-w-md mx-auto">
              <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2">No projects found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try adjusting your search query' : 'No projects available'}
              </p>
            </div>
          </Card>
        ) : (
          filteredProjects.map((project) => {
            const memberCount = getMemberCount(project);
            const openSpots = (project.membersRequired || 5) - memberCount;
            
            return (
              <Card 
                key={project.projectId} 
                className="p-6 rounded-xl shadow-sm border-border hover:shadow-lg transition-all"
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold line-clamp-2 flex-1">{project.title || 'Untitled Project'}</h3>
                    <Badge variant={getStatusBadgeVariant(project.status)} className="rounded-lg ml-2">
                      {project.status || 'OPEN'}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description || 'No description available'}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{memberCount} / {project.membersRequired || 5} members</span>
                    {project.deadline && (
                      <span>Due: {formatDate(project.deadline)}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/projects/${project.projectId}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteProject(project.projectId!)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
