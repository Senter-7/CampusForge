import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  onNavigate?: (page: string, id?: string) => void;
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
  inviteStatus?: 'none' | 'pending' | 'approved' | 'rejected';
}

interface ProjectDto {
  projectId?: number;
  title?: string;
  description?: string;
  creatorId?: number;
  status?: string;
}

export function FindTeammates({ onNavigate }: FindTeammatesProps) {
  const navigate = useNavigate();
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
  const [collaborationRequests, setCollaborationRequests] = useState<Map<number, { status: string; projectId?: number }>>(new Map());
  const userId = getCurrentUserId();
  const isFetchingRequestsRef = useRef(false);
  const teammatesLengthRef = useRef(0);

  // Define fetchCollaborationRequests first (using useCallback)
  const fetchCollaborationRequests = useCallback(async () => {
    if (!userId || myProjects.length === 0 || isFetchingRequestsRef.current) return;

    isFetchingRequestsRef.current = true;
    try {
      // Fetch collaboration requests for all user's projects
      const requestsMap = new Map<number, { status: string; projectId?: number }>();
      
      for (const project of myProjects) {
        if (!project.projectId) continue;
        try {
          const res = await axiosClient.get(`/collaboration/project/${project.projectId}`, {
            params: { ownerId: userId }
          });
          const requests = res.data || [];
          
          requests.forEach((req: any) => {
            if (req.studentId) {
              // If teammate already has a request, keep the one with higher priority
              // Priority: pending > approved > rejected
              const existing = requestsMap.get(req.studentId);
              const newStatus = req.status?.toLowerCase() || 'pending';
              
              if (!existing) {
                requestsMap.set(req.studentId, {
                  status: newStatus,
                  projectId: project.projectId
                });
              } else {
                // Prioritize pending over others, then approved over rejected
                const priority: Record<string, number> = {
                  'pending': 3,
                  'approved': 2,
                  'rejected': 1
                };
                
                if (priority[newStatus] > (priority[existing.status] || 0)) {
                  requestsMap.set(req.studentId, {
                    status: newStatus,
                    projectId: project.projectId
                  });
                }
              }
            }
          });
        } catch (error) {
          // Continue if one project fails
          console.warn(`Failed to fetch requests for project ${project.projectId}:`, error);
        }
      }

      setCollaborationRequests(requestsMap);

      // Update teammates with invite status only if status changed
      setTeammates(prev => {
        let hasChanges = false;
        const updated = prev.map(teammate => {
          const request = requestsMap.get(teammate.userId);
          if (request) {
            const statusLower = request.status?.toLowerCase() || '';
            const newStatus: 'none' | 'pending' | 'approved' | 'rejected' = 
              statusLower === 'pending' ? 'pending' : 
              statusLower === 'approved' ? 'approved' : 
              statusLower === 'rejected' ? 'rejected' : 'none';
            
            // Only update if status actually changed
            if (teammate.inviteStatus !== newStatus) {
              hasChanges = true;
              return {
                ...teammate,
                inviteStatus: newStatus
              };
            }
          } else if (teammate.inviteStatus !== 'none') {
            // Clear status if no request exists
            hasChanges = true;
            return {
              ...teammate,
              inviteStatus: 'none' as const
            };
          }
          return teammate;
        });
        
        // Only update state if something actually changed
        return hasChanges ? updated : prev;
      });
    } catch (error) {
      console.error('Failed to fetch collaboration requests:', error);
    } finally {
      isFetchingRequestsRef.current = false;
    }
  }, [userId, myProjects]);

  // Fetch teammates from backend
  useEffect(() => {
    fetchTeammates();
  }, [selectedMajor, selectedYear, selectedAvailability]);

  // Fetch user's projects on initial load
  useEffect(() => {
    if (userId && myProjects.length === 0) {
      fetchMyProjects();
    }
  }, [userId]);

  // Also fetch projects when dialog opens (to ensure they're up to date)
  useEffect(() => {
    if (inviteDialogOpen && userId) {
      fetchMyProjects();
    }
  }, [inviteDialogOpen, userId]);

  // Fetch collaboration requests when projects and teammates are loaded
  // Use ref to track teammates length to avoid loop
  useEffect(() => {
    const currentLength = teammates.length;
    if (myProjects.length > 0 && currentLength > 0 && currentLength !== teammatesLengthRef.current && userId && !isFetchingRequestsRef.current) {
      teammatesLengthRef.current = currentLength;
      fetchCollaborationRequests();
    }
  }, [myProjects.length, teammates.length, userId, fetchCollaborationRequests]);

  const fetchTeammates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // Remove search from backend call - we'll do client-side filtering like Projects
      if (selectedMajor !== 'all') params.append('major', selectedMajor);
      if (selectedYear !== 'all') params.append('year', selectedYear);
      if (selectedAvailability !== 'all') params.append('availability', selectedAvailability);

      const res = await axiosClient.get(`/users/teammates?${params.toString()}`);
      const data = res.data || [];

      // Transform to display format and filter out current user
      const transformed: Teammate[] = data
        .filter((user: any) => user.userId?.toString() !== userId) // Filter out current user
        .map((user: any) => {
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
            inviteStatus: 'none' as const,
          };
        });

      setTeammates(transformed);
      teammatesLengthRef.current = transformed.length;

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
    // Check if teammate already has an invitation (pending, approved, or rejected)
    if (teammate.inviteStatus && teammate.inviteStatus !== 'none') {
      const statusMessages = {
        pending: 'already has a pending invitation',
        approved: 'has already accepted an invitation',
        rejected: 'has already been invited (rejected)'
      };
      toast.warning(`${teammate.name} ${statusMessages[teammate.inviteStatus] || 'already has an invitation'}`);
      return;
    }
    
    setSelectedTeammate(teammate);
    setSelectedProjectId('');
    setInviteDialogOpen(true);
  };

  const handleSendInvite = async () => {
    if (!selectedTeammate || !selectedProjectId) {
      toast.error('Please select a project');
      return;
    }

    // Double-check if this teammate already has an invitation for this project
    const existingRequest = collaborationRequests.get(selectedTeammate.userId);
    if (existingRequest && existingRequest.status === 'pending') {
      toast.warning(`${selectedTeammate.name} already has a pending invitation`);
      setInviteDialogOpen(false);
      setSelectedTeammate(null);
      setSelectedProjectId('');
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
      
      // Update the teammate's invite status to pending
      setTeammates(prev => prev.map(t => 
        t.userId === selectedTeammate.userId 
          ? { ...t, inviteStatus: 'pending' as const }
          : t
      ));

      // Update collaboration requests map
      setCollaborationRequests(prev => {
        const newMap = new Map(prev);
        newMap.set(selectedTeammate.userId, { 
          status: 'pending',
          projectId: parseInt(selectedProjectId)
        });
        return newMap;
      });
      
      toast.success(`Invitation sent to ${selectedTeammate.name}!`);
      setInviteDialogOpen(false);
      setSelectedTeammate(null);
      setSelectedProjectId('');
    } catch (error: any) {
      console.error('Failed to send invitation:', error);
      let errorMessage = 'Failed to send invitation';
      
      if (error?.response?.data) {
        // Handle different error message formats
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      }
      
      // Check for duplicate request error
      if (errorMessage.toLowerCase().includes('already exists') || 
          errorMessage.toLowerCase().includes('already a member')) {
        toast.error(`${selectedTeammate.name} ${errorMessage.toLowerCase()}. Please refresh the page.`);
        // Refresh collaboration requests to get latest status
        fetchCollaborationRequests();
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setSendingInvite(false);
    }
  };

  // Handle message button click - find or create conversation project
  const handleMessageClick = async (teammate: Teammate) => {
    if (!userId || !teammate.userId) {
      toast.error('Unable to start conversation');
      return;
    }

    try {
      // First, get all projects the current user is a member of
      const myProjectsRes = await axiosClient.get('/projects/student/me');
      const myProjects: ProjectDto[] = myProjectsRes.data || [];

      // Get all projects the teammate is a member of
      let teammateProjectIds: number[] = [];
      try {
        const teammateProjectsRes = await axiosClient.get(`/student/projects/${teammate.userId}`);
        const teammateProjectsData = teammateProjectsRes.data || [];
        // The endpoint returns an array of objects with id, title, status
        teammateProjectIds = teammateProjectsData.map((p: any) => p.id).filter(Boolean);
      } catch (error) {
        console.error('Failed to fetch teammate projects:', error);
        // Continue - we'll just check myProjects
      }

      // Find shared projects
      const sharedProjects = myProjects.filter(project => 
        project.projectId && teammateProjectIds.includes(project.projectId)
      );

      if (sharedProjects.length > 0) {
        // Navigate to the first shared project's messages
        const projectId = sharedProjects[0].projectId;
        if (onNavigate) {
          onNavigate('messages', projectId?.toString());
        } else {
          navigate(`/messages?projectId=${projectId}`);
        }
        toast.success(`Opened conversation with ${teammate.name}`);
      } else {
        // No shared project - create a conversation project
        try {
          const conversationProject = await axiosClient.post('/projects', {
            title: `Conversation with ${teammate.name}`,
            description: `Direct message conversation`,
            membersRequired: 2,
            status: 'OPEN',
            skills: []
          });

          const newProjectId = conversationProject.data.projectId;
          
          // Add the teammate to the project using addMember endpoint
          try {
            await axiosClient.post(`/projects/${newProjectId}/members`, null, {
              params: { 
                userId: teammate.userId,
                role: 'MEMBER'
              }
            });
          } catch (error: any) {
            console.error('Failed to add teammate to conversation project:', error);
            // Continue anyway - they can be added later or via collaboration request
            toast.warning(`Project created. You may need to invite ${teammate.name} to join.`);
          }

          // Navigate to the new conversation project's messages
          if (onNavigate) {
            onNavigate('messages', newProjectId?.toString());
          } else {
            navigate(`/messages?projectId=${newProjectId}`);
          }
          
          toast.success(`Started conversation with ${teammate.name}`);
        } catch (error: any) {
          console.error('Failed to create conversation project:', error);
          const errorMsg = error?.response?.data?.message || error?.message || 'Unable to start conversation';
          toast.error(errorMsg);
        }
      }
    } catch (error: any) {
      console.error('Failed to find shared projects:', error);
      toast.error('Unable to start conversation. Please try again.');
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

  // Filter teammates (client-side search filtering like Projects.tsx)
  const filteredTeammates = teammates.filter((teammate) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      teammate.name.toLowerCase().includes(searchLower) ||
      teammate.major?.toLowerCase().includes(searchLower) ||
      teammate.bio?.toLowerCase().includes(searchLower) ||
      teammate.skills?.some(skill => skill.name.toLowerCase().includes(searchLower)) ||
      teammate.interests?.some(interest => interest.name.toLowerCase().includes(searchLower));
    
    return matchesSearch;
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
                {teammate.inviteStatus === 'none' ? (
                  <Button 
                    size="sm" 
                    className="flex-1 rounded-lg"
                    onClick={() => handleInviteClick(teammate)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite
                  </Button>
                ) : teammate.inviteStatus === 'pending' ? (
                  <Button 
                    size="sm" 
                    variant="secondary"
                    className="flex-1 rounded-lg"
                    disabled
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invited
                  </Button>
                ) : teammate.inviteStatus === 'approved' ? (
                  <Button 
                    size="sm" 
                    variant="default"
                    className="flex-1 rounded-lg bg-green-600 hover:bg-green-700"
                    disabled
                  >
                    Accepted
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="destructive"
                    className="flex-1 rounded-lg"
                    disabled
                  >
                    Rejected
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-lg"
                  onClick={() => handleMessageClick(teammate)}
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
                  if (onNavigate) {
                    onNavigate('projects');
                  } else {
                    navigate('/projects');
                  }
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
                      {myProjects
                        .filter((project) => {
                          // Filter out projects that already have a pending/approved invitation for this teammate
                          if (!selectedTeammate || !project.projectId) return true;
                          const existingRequest = collaborationRequests.get(selectedTeammate.userId);
                          return !existingRequest || existingRequest.projectId !== project.projectId;
                        })
                        .map((project) => (
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
