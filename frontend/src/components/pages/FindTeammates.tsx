import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Input } from '../ui/input';
import { 
  Search, Filter, MapPin, Briefcase, 
  MessageSquare, UserPlus, Code, Palette, Database 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { getCurrentUserId } from '../../utils/auth';

interface FindTeammatesProps {
  onNavigate: (page: string) => void;
}

interface Teammate {
  userId: number;
  name: string;
  major?: string;
  year?: string;
  location?: string;
  bio?: string;
  skills?: Array<{ skillId: number; name: string }>;
  interests?: Array<{ interestId: number; name: string }>;
  projectCount: number;
  rating: number;
  availability?: string;
  hoursPerWeek?: string;
  lastSeen?: string;
  status: 'online' | 'offline';
}

interface ProjectDto {
  projectId?: number;
  title?: string;
  description?: string;
  creatorId?: number;
  status?: string;
}

export function FindTeammates({ onNavigate }: FindTeammatesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMajor, setSelectedMajor] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [teammates, setTeammates] = useState<Teammate[]>([]);
  const [majors, setMajors] = useState<string[]>([]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedTeammate, setSelectedTeammate] = useState<Teammate | null>(null);
  const [myProjects, setMyProjects] = useState<ProjectDto[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const userId = getCurrentUserId();

  // Fetch teammates from backend
  useEffect(() => {
    fetchTeammates();
  }, [searchQuery, selectedMajor, selectedYear, selectedAvailability]);

  // Fetch user's projects when dialog opens
  useEffect(() => {
    if (inviteDialogOpen && userId) {
      fetchMyProjects();
    }
  }, [inviteDialogOpen, userId]);

  const fetchTeammates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedMajor !== 'all') params.append('major', selectedMajor);
      if (selectedYear !== 'all') params.append('year', selectedYear);
      if (selectedAvailability !== 'all') params.append('availability', selectedAvailability);

      const res = await axiosClient.get(`/users/teammates?${params.toString()}`);
      const data = res.data || [];

      // Transform to display format
      const transformed: Teammate[] = data.map((user: any) => {
        // Determine online status (if lastSeen is within last 5 minutes, consider online)
        let status: 'online' | 'offline' = 'offline';
        if (user.lastSeen) {
          const lastSeenTime = new Date(user.lastSeen).getTime();
          const now = Date.now();
          const minutesSinceLastSeen = (now - lastSeenTime) / (1000 * 60);
          status = minutesSinceLastSeen <= 5 ? 'online' : 'offline';
        }

        return {
          userId: user.userId,
          name: user.name || 'Unknown',
          major: user.major,
          year: user.year,
          location: user.location,
          bio: user.bio,
          skills: user.skills ? Array.from(user.skills) : [],
          interests: user.interests ? Array.from(user.interests) : [],
          projectCount: user.projectCount || 0,
          rating: user.rating || 0,
          availability: user.availability || 'Available',
          hoursPerWeek: user.hoursPerWeek,
          lastSeen: user.lastSeen,
          status,
        };
      });

      setTeammates(transformed);

      // Extract unique majors for filter
      const uniqueMajors = Array.from(new Set(
        transformed
          .map(t => t.major)
          .filter((m): m is string => m !== undefined && m !== null)
      )).sort();
      setMajors(uniqueMajors);
    } catch (error) {
      console.error('Failed to fetch teammates:', error);
      toast.error('Failed to load teammates');
      setTeammates([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyProjects = async () => {
    if (!userId) return;
    
    try {
      const res = await axiosClient.get('/projects');
      const allProjects: ProjectDto[] = res.data || [];
      
      // Filter projects created by the current user
      const myProjects = allProjects.filter(
        project => project.creatorId?.toString() === userId && 
        project.status !== 'COMPLETED'
      );
      
      setMyProjects(myProjects);
    } catch (error) {
      console.error('Failed to fetch my projects:', error);
      toast.error('Failed to load your projects');
      setMyProjects([]);
    }
  };

  const handleInviteClick = (teammate: Teammate) => {
    setSelectedTeammate(teammate);
    setSelectedProjectId('');
    setInviteDialogOpen(true);
  };

  const handleSendInvite = async () => {
    if (!selectedTeammate || !selectedProjectId) {
      toast.error('Please select a project');
      return;
    }

    setSendingInvite(true);
    try {
      await axiosClient.post('/collaboration/send', null, {
        params: {
          projectId: selectedProjectId,
          studentId: selectedTeammate.userId,
        },
      });
      
      toast.success(`Invitation sent to ${selectedTeammate.name}!`);
      setInviteDialogOpen(false);
      setSelectedTeammate(null);
      setSelectedProjectId('');
    } catch (error: any) {
      console.error('Failed to send invitation:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data || 
                          'Failed to send invitation';
      toast.error(errorMessage);
    } finally {
      setSendingInvite(false);
    }
  };

  // Get avatar initials from name
  const getAvatarInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getIconForSkill = (skillName: string) => {
    const skill = skillName.toLowerCase();
    if (skill.includes('figma') || skill.includes('xd') || skill.includes('design')) return Palette;
    if (skill.includes('sql') || skill.includes('mongo') || skill.includes('database') || skill.includes('db')) return Database;
    return Code;
  };

  // Filter teammates (additional client-side filtering if needed)
  const filteredTeammates = teammates;

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
        <h1 className="mb-2">Find Teammates</h1>
        <p className="text-muted-foreground">
          Connect with talented students and build amazing projects together
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 rounded-xl shadow-sm border-border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, skills, or major..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="rounded-lg">
            <Filter className="mr-2 h-4 w-4" />
            Advanced Filters
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Button 
            variant={selectedAvailability === 'all' ? 'default' : 'outline'} 
            size="sm" 
            className="rounded-lg whitespace-nowrap"
            onClick={() => setSelectedAvailability('all')}
          >
            All
          </Button>
          <Button 
            variant={selectedAvailability === 'Available' ? 'default' : 'outline'} 
            size="sm" 
            className="rounded-lg whitespace-nowrap"
            onClick={() => setSelectedAvailability('Available')}
          >
            Available Now
          </Button>
          {majors.slice(0, 5).map((major) => (
            <Button
              key={major}
              variant={selectedMajor === major.toLowerCase() ? 'default' : 'outline'}
              size="sm"
              className="rounded-lg whitespace-nowrap"
              onClick={() => setSelectedMajor(selectedMajor === major.toLowerCase() ? 'all' : major.toLowerCase())}
            >
              {major}
            </Button>
          ))}
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 rounded-xl shadow-sm border-border">
          <p className="text-muted-foreground text-sm mb-1">Total Students</p>
          <p className="text-2xl">{filteredTeammates.length}</p>
        </Card>
        <Card className="p-4 rounded-xl shadow-sm border-border">
          <p className="text-muted-foreground text-sm mb-1">Available</p>
          <p className="text-2xl text-chart-4">
            {filteredTeammates.filter(t => t.availability === 'Available').length}
          </p>
        </Card>
        <Card className="p-4 rounded-xl shadow-sm border-border">
          <p className="text-muted-foreground text-sm mb-1">Online Now</p>
          <p className="text-2xl text-primary">
            {filteredTeammates.filter(t => t.status === 'online').length}
          </p>
        </Card>
        <Card className="p-4 rounded-xl shadow-sm border-border">
          <p className="text-muted-foreground text-sm mb-1">Active Projects</p>
          <p className="text-2xl">
            {filteredTeammates.reduce((sum, t) => sum + (t.projectCount || 0), 0)}
          </p>
        </Card>
      </div>

      {/* Teammates Grid */}
      {filteredTeammates.length === 0 ? (
        <Card className="p-12 rounded-xl shadow-sm border-border text-center">
          <div className="max-w-md mx-auto">
            <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <UserPlus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2">No teammates found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedMajor !== 'all' || selectedYear !== 'all' || selectedAvailability !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No teammates available yet'}
            </p>
          </div>
        </Card>
      ) : (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeammates.map((teammate) => (
          <Card 
            key={teammate.userId} 
            className="p-6 rounded-xl shadow-sm border-border hover:shadow-lg transition-all"
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getAvatarInitials(teammate.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card ${
                      teammate.status === 'online' ? 'bg-chart-4' : 'bg-muted-foreground'
                    }`} />
                  </div>
                  <div>
                    <p>{teammate.name}</p>
                    <p className="text-xs text-muted-foreground">{teammate.major || 'No major specified'}</p>
                  </div>
                </div>
                <Badge 
                  variant={teammate.availability === 'Available' ? 'default' : 'secondary'}
                  className="rounded-lg"
                >
                  {teammate.availability}
                </Badge>
              </div>

              {/* Bio */}
              {teammate.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {teammate.bio}
                </p>
              )}

              {/* Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  <span>
                    {teammate.year || 'N/A'} • {teammate.projectCount} {teammate.projectCount === 1 ? 'project' : 'projects'}
                    {teammate.rating > 0 && ` • ⭐ ${teammate.rating.toFixed(1)}`}
                  </span>
                </div>
                {teammate.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{teammate.location}</span>
                  </div>
                )}
                {teammate.hoursPerWeek && (
                  <div className="text-xs text-muted-foreground">
                    {teammate.hoursPerWeek} available
                  </div>
                )}
              </div>

              {/* Skills */}
              {teammate.skills && teammate.skills.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Top Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {teammate.skills.slice(0, 4).map((skill) => {
                      const Icon = getIconForSkill(skill.name);
                      return (
                        <Badge key={skill.skillId} variant="outline" className="rounded-lg text-xs">
                          <Icon className="h-3 w-3 mr-1" />
                          {skill.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Interests */}
              {teammate.interests && teammate.interests.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Interests</p>
                  <div className="flex flex-wrap gap-1">
                    {teammate.interests.map((interest) => (
                      <Badge key={interest.interestId} variant="secondary" className="rounded-lg text-xs">
                        {interest.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-border flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1 rounded-lg"
                  onClick={() => handleInviteClick(teammate)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-lg"
                  onClick={() => onNavigate('messages')}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Invite {selectedTeammate?.name} to Your Project</DialogTitle>
            <DialogDescription>
              Select a project to send a collaboration request. Once they accept, they'll be added as a collaborator.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {myProjects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  You don't have any active projects yet.
                </p>
                <Button onClick={() => {
                  setInviteDialogOpen(false);
                  onNavigate('projects');
                }}>
                  Create a Project
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Project</label>
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a project..." />
                    </SelectTrigger>
                    <SelectContent>
                      {myProjects.map((project) => (
                        <SelectItem 
                          key={project.projectId} 
                          value={String(project.projectId)}
                        >
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-lg"
                    onClick={() => {
                      setInviteDialogOpen(false);
                      setSelectedTeammate(null);
                      setSelectedProjectId('');
                    }}
                    disabled={sendingInvite}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 rounded-lg"
                    onClick={handleSendInvite}
                    disabled={!selectedProjectId || sendingInvite}
                  >
                    {sendingInvite ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Send Invite
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
