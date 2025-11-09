import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { SearchBar } from './SearchBar';
import { ProjectCard } from './ProjectCard';
import { ProfessorCard } from './ProfessorCard';
import { CourseCard } from './CourseCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { Card } from './ui/card';
import axiosClient from '../api/axiosClient';

interface LandingProps {
  onLogin: () => void;
}

interface ProjectDto {
  projectId?: number;
  title?: string;
  description?: string;
  creatorId?: number;
  status?: string;
  skills?: Array<{ skillId: number; name: string }> | Set<{ skillId: number; name: string }>;
  memberIds?: number[] | Set<number>;
}

interface ProfessorDto {
  professorId?: number;
  name?: string;
  department?: string;
  email?: string;
  universityId?: number;
  universityName?: string;
}

interface CourseDto {
  courseId?: number;
  name?: string;
  professorId?: number;
  professorName?: string;
  description?: string;
  universityId?: number;
  universityName?: string;
}

export function Landing({ onLogin }: LandingProps) {
  const [activeTab, setActiveTab] = useState('projects');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [professors, setProfessors] = useState<ProfessorDto[]>([]);
  const [courses, setCourses] = useState<CourseDto[]>([]);

  // Fetch data based on active tab and search query
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'projects') {
        const params = searchQuery ? { search: searchQuery } : {};
        const res = await axiosClient.get('/projects', { params });
        setProjects(res.data || []);
      } else if (activeTab === 'professors') {
        if (searchQuery) {
          const res = await axiosClient.get('/public/professors/search', {
            params: { q: searchQuery }
          });
          setProfessors(res.data || []);
        } else {
          const res = await axiosClient.get('/public/professors');
          setProfessors(res.data || []);
        }
      } else if (activeTab === 'courses') {
        if (searchQuery) {
          const res = await axiosClient.get('/public/courses/search', {
            params: { q: searchQuery }
          });
          setCourses(res.data || []);
        } else {
          const res = await axiosClient.get('/public/courses');
          setCourses(res.data || []);
        }
      }
    } catch (error) {
      console.error(`Failed to fetch ${activeTab}:`, error);
      // Keep existing data on error
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  // Fetch data when tab or search query changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Transform project data for ProjectCard
  const transformProject = (project: ProjectDto) => {
    const skillsArray = Array.isArray(project.skills) 
      ? project.skills 
      : project.skills ? Array.from(project.skills) : [];
    const skills = skillsArray.map(s => s.name);
    
    const memberIdsArray = Array.isArray(project.memberIds) 
      ? project.memberIds 
      : project.memberIds ? Array.from(project.memberIds) : [];
    const memberCount = memberIdsArray.length || 0;

    return {
      id: String(project.projectId || ''),
      title: project.title || 'Untitled Project',
      description: project.description || 'No description available',
      skills: skills,
      creator: { name: 'Creator', avatar: '' }, // TODO: Fetch creator name
      rating: 4.5, // TODO: Calculate from ratings
      memberCount: memberCount,
    };
  };

  // Transform professor data for ProfessorCard
  const transformProfessor = (professor: ProfessorDto) => {
    return {
      id: String(professor.professorId || ''),
      name: professor.name || 'Unknown Professor',
      department: professor.department || 'Unknown Department',
      rating: 4.5, // TODO: Calculate from ratings
      courseCount: 0, // TODO: Fetch course count
    };
  };

  // Transform course data for CourseCard
  const transformCourse = (course: CourseDto) => {
    return {
      id: String(course.courseId || ''),
      name: course.name || 'Untitled Course',
      professor: course.professorName || 'Unknown Professor',
      description: course.description || 'No description available',
      rating: 4.5, // TODO: Calculate from ratings
      tags: [], // TODO: Add tags if available
    };
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onLogin={onLogin} onSignUp={onLogin} />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20">
        <div className="container px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-4xl sm:text-5xl md:text-6xl animate-fade-in">
              Find Projects, Professors, and Courses That Inspire You
            </h1>
            <p className="mb-10 text-lg text-muted-foreground sm:text-xl animate-fade-in [animation-delay:100ms]">
              Explore innovative student ideas, top-rated professors, and trending courses — all in one place.
            </p>
            
            <div className="animate-fade-in [animation-delay:200ms]">
              <SearchBar onSearch={handleSearch} initialQuery={searchQuery} />
            </div>
          </div>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
      </section>

      {/* Results Section */}
      <section className="container px-4 py-16">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8 grid w-full max-w-md mx-auto grid-cols-3 h-12 rounded-xl">
            <TabsTrigger value="projects" className="rounded-lg">Projects</TabsTrigger>
            <TabsTrigger value="professors" className="rounded-lg">Professors</TabsTrigger>
            <TabsTrigger value="courses" className="rounded-lg">Courses</TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <TabsContent value="projects" className="animate-fade-in">
                {projects.length === 0 ? (
                  <Card className="p-12 rounded-xl shadow-sm border-border text-center">
                    <p className="text-muted-foreground">
                      {searchQuery ? 'No projects found matching your search.' : 'No projects available yet.'}
                    </p>
                  </Card>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                      <ProjectCard key={project.projectId} {...transformProject(project)} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="professors" className="animate-fade-in">
                {professors.length === 0 ? (
                  <Card className="p-12 rounded-xl shadow-sm border-border text-center">
                    <p className="text-muted-foreground">
                      {searchQuery ? 'No professors found matching your search.' : 'No professors available yet.'}
                    </p>
                  </Card>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {professors.map((professor) => (
                      <ProfessorCard key={professor.professorId} {...transformProfessor(professor)} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="courses" className="animate-fade-in">
                {courses.length === 0 ? (
                  <Card className="p-12 rounded-xl shadow-sm border-border text-center">
                    <p className="text-muted-foreground">
                      {searchQuery ? 'No courses found matching your search.' : 'No courses available yet.'}
                    </p>
                  </Card>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {courses.map((course) => (
                      <CourseCard key={course.courseId} {...transformCourse(course)} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>

        {!loading && (
          <div className="mt-12 text-center">
            <Button size="lg" variant="outline" className="rounded-xl">
              Load More
            </Button>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
