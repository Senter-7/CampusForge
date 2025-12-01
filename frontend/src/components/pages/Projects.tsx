import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axiosClient from '../../api/axiosClient';
import { getCurrentUserId } from '../../utils/auth';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Input } from '../ui/input';
import { 
  Search, Filter, Users, Clock, 
  ArrowRight, Code, Palette, Database, Rocket, Loader2
} from 'lucide-react';

interface ProjectsProps {
  onNavigate?: (page: string, id?: string) => void;
}

interface ProjectDto {
  projectId?: number;
  title?: string;
  description?: string;
  creatorId?: number;
  status?: string; // 'OPEN', 'ONGOING', 'COMPLETED'
  createdAt?: string;
  membersRequired?: number;
  deadline?: string;
  skills?: Array<{ skillId: number; name: string }> | Set<{ skillId: number; name: string }>;
  memberIds?: number[] | Set<number>;
}

interface Skill {
  skillId: number;
  name: string;
}

interface ProjectDisplay {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: any;
  team: string;
  members: number;
  openSpots: number;
  skills: string[];
  status: string;
  timeCommitment: string;
}

// Fallback data
const fallbackProjects: ProjectDisplay[] = [
  {
    id: '1',
    title: 'AI Study Buddy Platform',
    description: 'An intelligent tutoring system that helps students learn more effectively using machine learning algorithms.',
    category: 'ml',
    icon: Code,
    team: 'Machine Learning Club',
    members: 4,
    openSpots: 2,
    skills: ['Python', 'TensorFlow', 'React'],
    status: 'recruiting',
    timeCommitment: '10-15 hrs/week',
  },
  {
    id: '2',
    title: 'Campus Event Manager',
    description: 'A comprehensive platform for organizing and managing campus events, RSVPs, and announcements.',
    category: 'web',
    icon: Rocket,
    team: 'Student Council',
    members: 6,
    openSpots: 1,
    skills: ['Node.js', 'MongoDB', 'Vue.js'],
    status: 'active',
    timeCommitment: '8-10 hrs/week',
  },
];

const categories = [
  { id: 'all', label: 'All Projects' },
  { id: 'web', label: 'Web Dev' },
  { id: 'mobile', label: 'Mobile' },
  { id: 'ml', label: 'Machine Learning' },
  { id: 'design', label: 'Design' },
  { id: 'research', label: 'Research' },
];

// Map status from backend to display status
const mapStatus = (status: string | undefined): string => {
  if (!status) return 'recruiting';
  switch (status.toUpperCase()) {
    case 'OPEN':
      return 'recruiting';
    case 'ONGOING':
      return 'active';
    case 'COMPLETED':
      return 'completed';
    default:
      return 'recruiting';
  }
};

// Determine category from skills
const getCategoryFromSkills = (skills: string[]): string => {
  const skillStr = skills.join(' ').toLowerCase();
  if (skillStr.includes('react native') || skillStr.includes('mobile') || skillStr.includes('ios') || skillStr.includes('android')) {
    return 'mobile';
  }
  if (skillStr.includes('machine learning') || skillStr.includes('ml') || skillStr.includes('tensorflow') || skillStr.includes('pytorch')) {
    return 'ml';
  }
  if (skillStr.includes('design') || skillStr.includes('figma') || skillStr.includes('ui') || skillStr.includes('ux')) {
    return 'design';
  }
  if (skillStr.includes('research') || skillStr.includes('data') || skillStr.includes('visualization')) {
    return 'research';
  }
  return 'web';
};

// Get icon based on category
const getIconForCategory = (category: string) => {
  switch (category) {
    case 'mobile':
      return Rocket;
    case 'ml':
      return Code;
    case 'design':
      return Palette;
    case 'research':
      return Database;
    default:
      return Code;
  }
};

export function Projects({ onNavigate }: ProjectsProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectDisplay[]>([]);
  const userId = getCurrentUserId();

  const handleProjectClick = (projectId: string) => {
    if (onNavigate) {
      onNavigate('project-detail', projectId);
    } else {
      // Pass state to indicate we're coming from Projects page
      navigate(`/projects/${projectId}`, { state: { from: 'projects' } });
    }
  };

  // Transform backend project data to display format
  const transformProject = (project: ProjectDto): ProjectDisplay => {
    // Handle both Array and Set for skills
    const skillsArray = Array.isArray(project.skills) 
      ? project.skills 
      : project.skills ? Array.from(project.skills) : [];
    const skills = skillsArray.map(s => s.name) || [];
    
    const category = getCategoryFromSkills(skills);
    
    // Handle both Array and Set for memberIds
    const memberIdsArray = Array.isArray(project.memberIds) 
      ? project.memberIds 
      : project.memberIds ? Array.from(project.memberIds) : [];
    const members = memberIdsArray.length || 0;
    
    // Calculate open spots based on membersRequired
    const membersRequired = project.membersRequired || 5;
    const openSpots = Math.max(0, membersRequired - members);

    return {
      id: String(project.projectId || ''),
      title: project.title || 'Untitled Project',
      description: project.description || 'No description available',
      category,
      icon: getIconForCategory(category),
      team: 'Project Team', // Fallback - you might want to add team name to backend
      members,
      openSpots,
      skills: skills.slice(0, 5), // Limit to 5 skills for display
      status: mapStatus(project.status),
      timeCommitment: '8-12 hrs/week', // Fallback - you might want to add this to backend
    };
  };

  // Fetch projects from backend
  const fetchProjects = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const res = await axiosClient.get('/projects');
      const projectsData: ProjectDto[] = res.data || [];
      console.log('Fetched projects:', projectsData);

      // Transform backend data to display format
      const transformedProjects: ProjectDisplay[] = projectsData.map(transformProject);
      console.log('Transformed projects:', transformedProjects);

      setProjects(transformedProjects.length > 0 ? transformedProjects : fallbackProjects);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      toast.error('Failed to load projects. Using sample data.');
      setProjects(fallbackProjects);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchProjects(true);
  }, []);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
          <h1 className="mb-2">Discover Projects</h1>
          <p className="text-muted-foreground">
            Find exciting projects to collaborate on and build your portfolio
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 rounded-xl shadow-sm border-border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="rounded-lg">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>

        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              className="rounded-lg whitespace-nowrap"
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.label}
            </Button>
          ))}
        </div>
      </Card>

      {/* Projects Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const Icon = project.icon;
          return (
            <Card 
              key={project.id} 
              className="p-6 rounded-xl shadow-sm border-border hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => handleProjectClick(project.id)}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <Badge 
                    variant={project.status === 'recruiting' ? 'default' : project.status === 'completed' ? 'secondary' : 'default'}
                    className="rounded-lg"
                  >
                    {project.status === 'recruiting' ? 'Recruiting' : project.status === 'completed' ? 'Completed' : 'Active'}
                  </Badge>
                </div>

                {/* Content */}
                <div>
                  <h3 className="mb-2 group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {project.description}
                  </p>
                </div>

                {/* Skills */}
                {project.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {project.skills.slice(0, 3).map((skill, idx) => (
                      <Badge key={`${project.id}-${skill}-${idx}`} variant="outline" className="rounded-lg">
                        {skill}
                      </Badge>
                    ))}
                    {project.skills.length > 3 && (
                      <Badge variant="outline" className="rounded-lg">
                        +{project.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="pt-4 border-t border-border space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{project.members} {project.members === 1 ? 'member' : 'members'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{project.timeCommitment}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {[...Array(Math.min(project.members, 3))].map((_, i) => (
                        <Avatar key={i} className="h-7 w-7 border-2 border-card">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {String.fromCharCode(65 + i)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
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

                  {project.openSpots > 0 && project.status !== 'completed' && (
                    <div className="text-xs text-chart-4 text-center p-2 bg-chart-4/10 rounded-lg">
                      {project.openSpots} open spot{project.openSpots > 1 ? 's' : ''} available
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <Card className="p-12 rounded-xl shadow-sm border-border text-center">
          <div className="max-w-md mx-auto">
            <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2">No projects found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filters to find more projects
            </p>
            <Button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
              Clear Filters
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
