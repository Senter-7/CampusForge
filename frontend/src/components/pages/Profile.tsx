// src/components/pages/Profile.tsx
import { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  MapPin, Mail, Globe, Github, Linkedin,
  Award, Star, FolderKanban, Users, Edit2, Upload
} from 'lucide-react';
import { useCurrentUser, User } from '../../hooks/useCurrentUser';
import { getCurrentUserId, getUserRole, isTokenValid } from "../../utils/auth";
import axiosClient from '../../api/axiosClient';
import { toast } from 'sonner';

interface ProfileProps {
  onNavigate: (page: string, id?: string) => void;
}

interface ProjectWithRole {
  projectId: number;
  name: string;
  role: string;
  status: string;
}

export function Profile({ onNavigate }: ProfileProps) {
  const { data: user, isLoading, refetch } = useCurrentUser();
  const [projects, setProjects] = useState<ProjectWithRole[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userId = getCurrentUserId();
  const role = getUserRole();
  const valid = isTokenValid();

  console.log("UserId:", userId, "Role:", role, "Token valid?", valid);

  // Fetch user projects with roles
  useEffect(() => {
    const fetchProjects = async () => {
      if (!userId) return;
      
      try {
        setProjectsLoading(true);
        // Fetch all projects for the user
        const projectsRes = await axiosClient.get('/projects/student/me');
        const userProjects: any[] = projectsRes.data || [];

        // For each project, determine the user's role
        const projectsWithRoles: ProjectWithRole[] = await Promise.all(
          userProjects.map(async (project: any) => {
            let userRole = 'MEMBER';
            
            // If user is the creator, role is LEADER
            if (project.creatorId === userId) {
              userRole = 'LEADER';
            } else {
              // Otherwise, fetch members to find the role
              try {
                const membersRes = await axiosClient.get(`/projects/${project.projectId}/members`);
                const members: any[] = membersRes.data || [];
                const userMember = members.find((m: any) => m.userId === userId);
                if (userMember) {
                  userRole = userMember.role || 'MEMBER';
                }
              } catch (error) {
                console.error(`Error fetching members for project ${project.projectId}:`, error);
              }
            }

            return {
              projectId: project.projectId,
              name: project.title,
              role: userRole,
              status: project.status || 'OPEN',
            };
          })
        );

        setProjects(projectsWithRoles);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setProjects([]);
      } finally {
        setProjectsLoading(false);
      }
    };

    fetchProjects();
  }, [userId]);

  // Handle profile picture upload
  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      
      // Read file and convert to byte array
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const byteArray = Array.from(new Uint8Array(arrayBuffer));

          // Update user profile with image
          await axiosClient.put(`/users/${userId}`, {
            profileImage: byteArray,
          });

          toast.success('Profile picture updated successfully!');
          refetch(); // Refresh user data
        } catch (error: any) {
          console.error('Error uploading profile picture:', error);
          toast.error(error?.response?.data?.message || 'Failed to upload profile picture');
        } finally {
          setUploading(false);
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      reader.onerror = () => {
        toast.error('Error reading file');
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      toast.error('Failed to upload profile picture');
      setUploading(false);
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

  // Format date for member since
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    } catch {
      return dateString;
    }
  };

  // Format link with fallback
  const formatLink = (link: string | undefined, name: string, domain: string): string => {
    if (link && link.trim()) {
      // If link doesn't start with http, add it
      if (!link.startsWith('http://') && !link.startsWith('https://')) {
        // If it's a username (no dots), prepend domain
        if (!link.includes('.')) {
          return `https://${domain}/${link}`;
        }
        return `https://${link}`;
      }
      return link;
    }
    // Return default format: name + domain
    const username = name.toLowerCase().replace(/\s+/g, '');
    return `https://${domain.includes('/') ? domain : username + '.' + domain}`;
  };

  // Show loading placeholder if user data isn't ready yet
  if (isLoading || !user) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading profile...
      </div>
    );
  }

  // Get skills from user data and add random levels if not present
  const skillsWithLevels = (user.skills || []).map((skill: any) => {
    if (typeof skill === 'string') {
      return {
        name: skill,
        level: Math.floor(Math.random() * 40) + 60, // Random between 60-100
      };
    }
    return {
      name: skill.name || skill,
      level: skill.level || Math.floor(Math.random() * 40) + 60,
    };
  });

  // Get location with default
  const location = user.location || 'India';

  // Get user's initials
  const userInitials = getInitials(user.name);

  // Get member since date from createdAt or joinedDate
  const memberSince = (user as User).createdAt ? formatDate((user as User).createdAt) : (user.joinedDate || 'N/A');

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="p-8 rounded-xl shadow-sm border-border">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar & Edit */}
          <div className="flex flex-col items-center md:items-start">
            <Avatar className="h-32 w-32 mb-4">
              {(() => {
                const profileImage = (user as User).profileImage;
                const avatar = user.avatar;
                
                // If profileImage exists (from backend), use it
                if (profileImage) {
                  if (typeof profileImage === 'string') {
                    // Already a string (URL or base64)
                    return <AvatarImage src={profileImage} />;
                  } else if (Array.isArray(profileImage) && profileImage.length > 0) {
                    // Byte array from backend - convert to base64
                    try {
                      const uint8Array = new Uint8Array(profileImage);
                      // Use chunking for large arrays to avoid stack overflow
                      const chunkSize = 0x8000; // 32KB chunks
                      let binaryString = '';
                      for (let i = 0; i < uint8Array.length; i += chunkSize) {
                        const chunk = uint8Array.subarray(i, i + chunkSize);
                        binaryString += String.fromCharCode.apply(null, Array.from(chunk));
                      }
                      const base64 = btoa(binaryString);
                      return <AvatarImage src={`data:image/jpeg;base64,${base64}`} />;
                    } catch (error) {
                      console.error('Error converting profile image:', error);
                      return (
                        <AvatarFallback className="bg-primary/10 text-primary text-4xl">
                          {userInitials}
                        </AvatarFallback>
                      );
                    }
                  }
                }
                
                // If avatar exists, use it
                if (avatar) {
                  return <AvatarImage src={avatar} />;
                }
                
                // Otherwise, show initials
                return (
                  <AvatarFallback className="bg-primary/10 text-primary text-4xl">
                    {userInitials}
                  </AvatarFallback>
                );
              })()}
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfilePictureUpload}
              className="hidden"
              id="profile-picture-upload"
            />
            <Button 
              variant="outline" 
              className="rounded-lg w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit Profile Picture
                </>
              )}
            </Button>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="mb-2">{user.name}</h1>
                <p className="text-muted-foreground mb-2">
                  {user.major || 'N/A'} • {user.year || 'N/A'}
                </p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{location}</span>
                </div>
              </div>
            </div>

            <p className="text-muted-foreground mb-4">{user.bio || 'No bio available'}</p>

            {/* Links */}
            <div className="flex flex-wrap gap-3 mb-6">
              <Button variant="outline" size="sm" className="rounded-lg" asChild>
                <a href={`mailto:${user.email}`} className="inline-flex items-center">
                <Mail className="mr-2 h-4 w-4" />
                {user.email}
                </a>
              </Button>
              <Button variant="outline" size="sm" className="rounded-lg" asChild>
                <a 
                  href={formatLink(user.website, user.name, 'com')} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                >
                <Globe className="mr-2 h-4 w-4" />
                  {user.website || `${user.name.toLowerCase().replace(/\s+/g, '')}.com`}
                </a>
              </Button>
              <Button variant="outline" size="sm" className="rounded-lg" asChild>
                <a 
                  href={formatLink(user.github, user.name, 'github.com')} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                >
                <Github className="mr-2 h-4 w-4" />
                  {user.github || `${user.name.toLowerCase().replace(/\s+/g, '')}.github.com`}
                </a>
              </Button>
              <Button variant="outline" size="sm" className="rounded-lg" asChild>
                <a 
                  href={formatLink(user.linkedin, user.name, 'linkedin.com/in')} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                >
                <Linkedin className="mr-2 h-4 w-4" />
                  {user.linkedin || `${user.name.toLowerCase().replace(/\s+/g, '')}.linkedin.com`}
                </a>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {user.stats && Object.entries(user.stats).map(([key, value]) => (
                <div key={key} className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl mb-1">{value}</p>
                  <p className="text-xs text-muted-foreground">{key.charAt(0).toUpperCase() + key.slice(1)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="skills" className="space-y-6">
        <TabsList className="rounded-xl">
          <TabsTrigger value="skills" className="rounded-lg">Skills & Interests</TabsTrigger>
          <TabsTrigger value="projects" className="rounded-lg">Projects</TabsTrigger>
          <TabsTrigger value="achievements" className="rounded-lg">Achievements</TabsTrigger>
          <TabsTrigger value="reviews" className="rounded-lg">Reviews</TabsTrigger>
        </TabsList>

        {/* Skills & Interests */}
        <TabsContent value="skills" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6 rounded-xl shadow-sm border-border">
              <h3 className="mb-4">Technical Skills</h3>
              <div className="space-y-4">
                {skillsWithLevels.length > 0 ? (
                  skillsWithLevels.map((skill, index) => (
                    <div key={index}>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{skill.name}</span>
                      <span className="text-muted-foreground">{skill.level}%</span>
                    </div>
                    <Progress value={skill.level} className="h-2" />
                  </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No skills listed</p>
                )}
              </div>
            </Card>

            <Card className="p-6 rounded-xl shadow-sm border-border">
              <h3 className="mb-4">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {user.interests && user.interests.length > 0 ? (
                  user.interests.map((interest: string | { interestId?: number; name?: string }, index: number) => {
                    const interestName = typeof interest === 'string' 
                      ? interest 
                      : (interest as any)?.name || String(interest);
                    const interestKey = typeof interest === 'string' 
                      ? interest 
                      : (interest as any)?.interestId || (interest as any)?.name || index;
                    return (
                      <Badge key={interestKey} variant="secondary" className="rounded-lg">
                        {interestName}
                      </Badge>
                    );
                  })
                ) : (
                  <p className="text-muted-foreground text-sm">No interests listed</p>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="mb-3">Availability</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time Commitment</span>
                    <span>{(user as User).hoursPerWeek || '10-15 hrs/week'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className="rounded-lg">{(user as User).availability || 'Available'}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Member Since</span>
                    <span>{memberSince}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Projects */}
        <TabsContent value="projects" className="space-y-6">
          <Card className="p-6 rounded-xl shadow-sm border-border">
            <h3 className="mb-4">Recent Projects</h3>
            {projectsLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading projects...
              </div>
            ) : projects.length > 0 ? (
              <>
            <div className="space-y-4">
                  {projects.map((project) => (
                <div
                      key={project.projectId}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
                      onClick={() => onNavigate('project-detail', project.projectId.toString())}
                >
                  <div>
                    <p className="mb-1">{project.name}</p>
                    <p className="text-sm text-muted-foreground">{project.role}</p>
                  </div>
                  <Badge
                        variant={project.status === 'ONGOING' ? 'default' : project.status === 'COMPLETED' ? 'secondary' : 'outline'}
                    className="rounded-lg"
                  >
                    {project.status}
                  </Badge>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full mt-4 rounded-lg"
              onClick={() => onNavigate('my-projects')}
            >
              View All Projects
            </Button>
              </>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p>No projects found</p>
                <Button
                  variant="outline"
                  className="mt-4 rounded-lg"
                  onClick={() => onNavigate('projects')}
                >
                  Browse Projects
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Achievements */}
        <TabsContent value="achievements" className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            {user.achievements && user.achievements.length > 0 ? (
              user.achievements.map((achievement, index) => {
              const Icon = achievement.icon;
              return (
                <Card key={index} className="p-6 rounded-xl shadow-sm border-border">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="mb-1">{achievement.title}</p>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    </div>
                  </div>
                </Card>
              );
              })
            ) : (
              <p className="text-muted-foreground">No achievements yet</p>
            )}
          </div>
        </TabsContent>

        {/* Reviews */}
        <TabsContent value="reviews" className="space-y-6">
          <Card className="p-6 rounded-xl shadow-sm border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="mb-2">Teammate Reviews</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 text-chart-5 fill-chart-5" />
                    <span className="text-xl">{user.stats?.rating || '0'}</span>
                  </div>
                  <span className="text-muted-foreground">({user.reviews?.length || 0} reviews)</span>
                </div>
              </div>
            </div>

            {user.reviews && user.reviews.length > 0 ? (
            <div className="space-y-6">
              {user.reviews.map((review, index) => (
                <div key={index} className="pb-6 border-b border-border last:border-0 last:pb-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {review.from.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p>{review.from}</p>
                        <p className="text-sm text-muted-foreground">{review.project}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-1">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-chart-5 fill-chart-5" />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{review.date}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">{review.comment}</p>
                </div>
              ))}
            </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p>No reviews yet</p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
