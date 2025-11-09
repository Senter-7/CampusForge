import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import axiosClient from '../../api/axiosClient';
import { getCurrentUserId } from '../../utils/auth';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  User, Bell, Shield, Palette, 
  Globe, Save, Loader2, AlertTriangle, Sun, Moon
} from 'lucide-react';

interface SettingsProps {
  onNavigate: (page: string) => void;
}

interface UserDto {
  userId?: number;
  name?: string;
  email?: string;
  bio?: string;
  profileImage?: any;
  role?: string;
  createdAt?: string;
  skills?: Array<{ skillId: number; name: string }>;
  interests?: Array<{ interestId: number; name: string }>;
  universityId?: number;
  universityName?: string;
  major?: string;
  year?: string;
  availability?: string;
  hoursPerWeek?: string;
  lastSeen?: string;
}

interface University {
  universityId: number;
  name: string;
}

interface Interest {
  interestId: number;
  name: string;
}

interface SettingsFormData {
  name: string;
  email: string;
  bio: string;
  universityId: string;
  skills: string;
  interests: string;
  // Fields not in backend (use fallbacks)
  firstName: string;
  lastName: string;
  major: string;
  year: string;
  location: string;
  website: string;
  github: string;
  linkedin: string;
  availableForProjects: boolean;
  timeCommitment: string;
  // Notifications
  emailProjectInvitations: boolean;
  emailProjectUpdates: boolean;
  emailMessages: boolean;
  emailWeeklyDigest: boolean;
  pushNewMessages: boolean;
  pushTaskAssignments: boolean;
  pushDeadlineReminders: boolean;
  pushComments: boolean;
  // Privacy
  publicProfile: boolean;
  showEmail: boolean;
  showProjectHistory: boolean;
  showRatings: boolean;
  whoCanMessage: string;
  whoCanInvite: string;
  // Appearance
  theme: string;
  compactMode: boolean;
  language: string;
  timezone: string;
}

export function Settings({ onNavigate }: SettingsProps) {
  const userId = getCurrentUserId();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { setTheme, theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [userData, setUserData] = useState<UserDto | null>(null);

  const { control, handleSubmit, reset, watch } = useForm<SettingsFormData>({
    defaultValues: {
      name: '',
      email: '',
      bio: '',
      universityId: '',
      skills: '',
      interests: '',
      firstName: '',
      lastName: '',
      major: '',
      year: '',
      location: '',
      website: '',
      github: '',
      linkedin: '',
      availableForProjects: true,
      timeCommitment: '10-15',
      emailProjectInvitations: true,
      emailProjectUpdates: true,
      emailMessages: true,
      emailWeeklyDigest: false,
      pushNewMessages: true,
      pushTaskAssignments: true,
      pushDeadlineReminders: true,
      pushComments: true,
      publicProfile: true,
      showEmail: false,
      showProjectHistory: true,
      showRatings: true,
      whoCanMessage: 'all',
      whoCanInvite: 'all',
      theme: 'light',
      compactMode: false,
      language: 'en',
      timezone: 'pst',
    },
  });

  // Fetch user data and options
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        toast.error('User not authenticated');
        setLoading(false);
        return;
      }

      try {
        // Fetch all data in parallel
        const [userRes, universitiesRes, interestsRes] = await Promise.allSettled([
          axiosClient.get(`/users/${userId}`),
          axiosClient.get('/universities'),
          axiosClient.get('/interests'),
        ]);

        // Handle user data
        if (userRes.status === 'fulfilled') {
          const user: UserDto = userRes.value.data;
          setUserData(user);
          
          // Split name into first/last if possible
          const nameParts = user.name?.split(' ') || [];
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          // Convert skills and interests to comma-separated strings
          const skillsStr = user.skills?.map(s => s.name).join(', ') || '';
          const interestsStr = user.interests?.map(i => i.name).join(', ') || '';

          // Map year from backend enum to form value
          const yearReverseMap: Record<string, string> = {
            'Freshman': 'freshman',
            'Sophomore': 'sophomore',
            'Junior': 'junior',
            'Senior': 'senior',
            'Graduate': 'graduate'
          };

          // Determine availability settings from backend
          const availability = user.availability || 'Available';
          const availableForProjects = availability !== 'Busy';
          const timeCommitment = user.hoursPerWeek || '10-15';

          // Load frontend settings from localStorage
          const savedSettings = localStorage.getItem(`userSettings_${userId}`);
          const frontendSettings = savedSettings ? JSON.parse(savedSettings) : {};
          
          // Get current theme or default
          const savedTheme = frontendSettings.appearance?.theme || theme || 'system';
          
          // Apply theme on load
          if (setTheme && savedTheme) {
            setTheme(savedTheme);
          }

          reset({
            name: user.name || '',
            email: user.email || '',
            bio: user.bio || '',
            universityId: user.universityId?.toString() || '',
            skills: skillsStr,
            interests: interestsStr,
            firstName: firstName,
            lastName: lastName,
            major: user.major || '',
            year: user.year ? yearReverseMap[user.year] || '' : '',
            location: frontendSettings.profile?.location || '',
            website: frontendSettings.social?.website || '',
            github: frontendSettings.social?.github || '',
            linkedin: frontendSettings.social?.linkedin || '',
            availableForProjects: availableForProjects,
            timeCommitment: timeCommitment,
            emailProjectInvitations: frontendSettings.notifications?.emailProjectInvitations ?? true,
            emailProjectUpdates: frontendSettings.notifications?.emailProjectUpdates ?? true,
            emailMessages: frontendSettings.notifications?.emailMessages ?? true,
            emailWeeklyDigest: frontendSettings.notifications?.emailWeeklyDigest ?? false,
            pushNewMessages: frontendSettings.notifications?.pushNewMessages ?? true,
            pushTaskAssignments: frontendSettings.notifications?.pushTaskAssignments ?? true,
            pushDeadlineReminders: frontendSettings.notifications?.pushDeadlineReminders ?? true,
            pushComments: frontendSettings.notifications?.pushComments ?? true,
            publicProfile: frontendSettings.privacy?.publicProfile ?? true,
            showEmail: frontendSettings.privacy?.showEmail ?? false,
            showProjectHistory: frontendSettings.privacy?.showProjectHistory ?? true,
            showRatings: frontendSettings.privacy?.showRatings ?? true,
            whoCanMessage: frontendSettings.privacy?.whoCanMessage || 'all',
            whoCanInvite: frontendSettings.privacy?.whoCanInvite || 'all',
            theme: savedTheme,
            compactMode: frontendSettings.appearance?.compactMode ?? false,
            language: frontendSettings.appearance?.language || 'en',
            timezone: frontendSettings.appearance?.timezone || 'pst',
          });
        } else {
          console.error('Failed to fetch user:', userRes.reason);
          toast.error('Failed to load user data');
        }

        // Handle universities
        if (universitiesRes.status === 'fulfilled') {
          setUniversities(universitiesRes.value.data || []);
        } else {
          console.error('Failed to fetch universities:', universitiesRes.reason);
        }

        // Handle interests
        if (interestsRes.status === 'fulfilled') {
          setInterests(interestsRes.value.data || []);
        } else {
          console.error('Failed to fetch interests:', interestsRes.reason);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load settings data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, reset]);

  const onSubmit = async (data: SettingsFormData) => {
    if (!userId) {
      toast.error('User not authenticated');
      return;
    }

    setSaving(true);
    try {
      // Map year from form value to backend enum
      const yearMap: Record<string, string> = {
        'freshman': 'Freshman',
        'sophomore': 'Sophomore',
        'junior': 'Junior',
        'senior': 'Senior',
        'graduate': 'Graduate'
      };

      // Map availability based on availableForProjects and timeCommitment
      let availability = 'Available';
      if (!data.availableForProjects) {
        availability = 'Busy';
      } else if (data.timeCommitment === '5-8' || data.timeCommitment === '8-10') {
        availability = 'Limited';
      }

      // Prepare user update data (only fields that exist in backend)
      const updateData: Partial<UserDto> = {
        name: data.firstName && data.lastName 
          ? `${data.firstName} ${data.lastName}`.trim() 
          : data.name || '',
        email: data.email || '',
        bio: data.bio || '',
        universityId: data.universityId ? Number(data.universityId) : undefined,
        major: data.major || undefined,
        year: data.year ? yearMap[data.year] || undefined : undefined,
        availability: availability,
        hoursPerWeek: data.timeCommitment || undefined,
        // Convert comma-separated strings back to arrays of skill/interest names
        skills: data.skills 
          ? data.skills.split(',').map(s => ({ skillId: 0, name: s.trim() })).filter(s => s.name)
          : [],
        interests: data.interests
          ? data.interests.split(',').map(i => ({ interestId: 0, name: i.trim() })).filter(i => i.name)
          : [],
      };

      // Save backend fields
      await axiosClient.put(`/users/${userId}`, updateData);
      
      // Save frontend-only settings to localStorage
      const frontendSettings = {
        notifications: {
          emailProjectInvitations: data.emailProjectInvitations,
          emailProjectUpdates: data.emailProjectUpdates,
          emailMessages: data.emailMessages,
          emailWeeklyDigest: data.emailWeeklyDigest,
          pushNewMessages: data.pushNewMessages,
          pushTaskAssignments: data.pushTaskAssignments,
          pushDeadlineReminders: data.pushDeadlineReminders,
          pushComments: data.pushComments,
        },
        privacy: {
          publicProfile: data.publicProfile,
          showEmail: data.showEmail,
          showProjectHistory: data.showProjectHistory,
          showRatings: data.showRatings,
          whoCanMessage: data.whoCanMessage,
          whoCanInvite: data.whoCanInvite,
        },
        appearance: {
          theme: data.theme,
          compactMode: data.compactMode,
          language: data.language,
          timezone: data.timezone,
        },
        social: {
          website: data.website,
          github: data.github,
          linkedin: data.linkedin,
        },
        profile: {
          location: data.location,
        }
      };
      
      localStorage.setItem(`userSettings_${userId}`, JSON.stringify(frontendSettings));
      
      // Apply theme change immediately
      if (data.theme && setTheme) {
        setTheme(data.theme);
      }
      
      toast.success('Settings saved successfully!');
      
      // Optionally refetch user data
      const userRes = await axiosClient.get(`/users/${userId}`);
      setUserData(userRes.data);
      
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error?.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!userId) {
      toast.error('User not authenticated');
      return;
    }

    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setDeleting(true);
    try {
      await axiosClient.delete(`/users/${userId}`);
      toast.success('Account deleted successfully');
      
      // Logout and clear local storage
      logout();
      
      // Navigate to login page
      setTimeout(() => {
        navigate('/login');
      }, 1000);
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete account');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
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
      <div>
        <h1 className="mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="rounded-xl">
          <TabsTrigger value="profile" className="rounded-lg">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="rounded-lg">
            <Shield className="mr-2 h-4 w-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="appearance" className="rounded-lg">
            <Palette className="mr-2 h-4 w-4" />
            Appearance
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="p-6 rounded-xl shadow-sm border-border">
            <h3 className="mb-6">Personal Information</h3>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Controller
                    name="firstName"
                    control={control}
                    render={({ field }) => (
                      <Input id="firstName" {...field} placeholder="John" />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Controller
                    name="lastName"
                    control={control}
                    render={({ field }) => (
                      <Input id="lastName" {...field} placeholder="Doe" />
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input id="email" type="email" {...field} placeholder="john.doe@university.edu" />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Controller
                  name="bio"
                  control={control}
                  render={({ field }) => (
                    <Textarea 
                      id="bio" 
                      rows={4}
                      {...field}
                      placeholder="Tell us about yourself..."
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="universityId">University</Label>
                <Controller
                  name="universityId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="universityId">
                        <SelectValue placeholder="Select university" />
                      </SelectTrigger>
                      <SelectContent>
                        {universities.map((university) => (
                          <SelectItem key={university.universityId} value={String(university.universityId)}>
                            {university.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">Skills (comma-separated)</Label>
                <Controller
                  name="skills"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      id="skills" 
                      {...field} 
                      placeholder="Java, React, Python, Machine Learning"
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interests">Interests (comma-separated)</Label>
                <Controller
                  name="interests"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      id="interests" 
                      {...field} 
                      placeholder="AI, Web Development, Data Science"
                    />
                  )}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="major">Major</Label>
                  <Controller
                    name="major"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="major">
                          <SelectValue placeholder="Select major" />
                        </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Computer Science">Computer Science</SelectItem>
                        <SelectItem value="Software Engineering">Software Engineering</SelectItem>
                        <SelectItem value="Data Science">Data Science</SelectItem>
                        <SelectItem value="Electrical Engineering">Electrical Engineering</SelectItem>
                        <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                        <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                        <SelectItem value="Business Administration">Business Administration</SelectItem>
                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                        <SelectItem value="Physics">Physics</SelectItem>
                        <SelectItem value="Chemistry">Chemistry</SelectItem>
                        <SelectItem value="Biology">Biology</SelectItem>
                      </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Controller
                    name="year"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="year">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="freshman">Freshman</SelectItem>
                          <SelectItem value="sophomore">Sophomore</SelectItem>
                          <SelectItem value="junior">Junior</SelectItem>
                          <SelectItem value="senior">Senior</SelectItem>
                          <SelectItem value="graduate">Graduate</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Controller
                  name="location"
                  control={control}
                  render={({ field }) => (
                    <Input id="location" {...field} placeholder="Berkeley, CA" />
                  )}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-xl shadow-sm border-border">
            <h3 className="mb-6">Social Links</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Controller
                  name="website"
                  control={control}
                  render={({ field }) => (
                    <Input id="website" placeholder="https://yourwebsite.com" {...field} />
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github">GitHub Username</Label>
                <Controller
                  name="github"
                  control={control}
                  render={({ field }) => (
                    <Input id="github" placeholder="username" {...field} />
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn Username</Label>
                <Controller
                  name="linkedin"
                  control={control}
                  render={({ field }) => (
                    <Input id="linkedin" placeholder="username" {...field} />
                  )}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-xl shadow-sm border-border">
            <h3 className="mb-6">Availability</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p>Available for new projects</p>
                  <p className="text-sm text-muted-foreground">Let teammates know you're open to collaborating</p>
                </div>
                <Controller
                  name="availableForProjects"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeCommitment">Time Commitment (hrs/week)</Label>
                <Controller
                  name="timeCommitment"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="timeCommitment">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5-8">5-8 hours</SelectItem>
                        <SelectItem value="8-10">8-10 hours</SelectItem>
                        <SelectItem value="10-15">10-15 hours</SelectItem>
                        <SelectItem value="15-20">15-20 hours</SelectItem>
                        <SelectItem value="20+">20+ hours</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" className="rounded-lg" onClick={() => reset()}>
              Cancel
            </Button>
            <Button 
              className="rounded-lg" 
              onClick={handleSubmit(onSubmit)}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="p-6 rounded-xl shadow-sm border-border">
            <h3 className="mb-6">Email Notifications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p>Project invitations</p>
                  <p className="text-sm text-muted-foreground">Receive emails when you're invited to projects</p>
                </div>
                <Controller
                  name="emailProjectInvitations"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p>Project updates</p>
                  <p className="text-sm text-muted-foreground">Get notified about project milestones and updates</p>
                </div>
                <Controller
                  name="emailProjectUpdates"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p>Messages</p>
                  <p className="text-sm text-muted-foreground">Receive email notifications for new messages</p>
                </div>
                <Controller
                  name="emailMessages"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p>Weekly digest</p>
                  <p className="text-sm text-muted-foreground">Get a weekly summary of your activity</p>
                </div>
                <Controller
                  name="emailWeeklyDigest"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-xl shadow-sm border-border">
            <h3 className="mb-6">Push Notifications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p>New messages</p>
                  <p className="text-sm text-muted-foreground">Get notified instantly when you receive messages</p>
                </div>
                <Controller
                  name="pushNewMessages"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p>Task assignments</p>
                  <p className="text-sm text-muted-foreground">Notifications when you're assigned to tasks</p>
                </div>
                <Controller
                  name="pushTaskAssignments"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p>Deadline reminders</p>
                  <p className="text-sm text-muted-foreground">Get reminded about upcoming deadlines</p>
                </div>
                <Controller
                  name="pushDeadlineReminders"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p>Comments and mentions</p>
                  <p className="text-sm text-muted-foreground">When someone mentions you or comments on your work</p>
                </div>
                <Controller
                  name="pushComments"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" className="rounded-lg" onClick={() => reset()}>
              Cancel
            </Button>
            <Button 
              className="rounded-lg" 
              onClick={handleSubmit(onSubmit)}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy" className="space-y-6">
          <Card className="p-6 rounded-xl shadow-sm border-border">
            <h3 className="mb-6">Profile Visibility</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p>Public profile</p>
                  <p className="text-sm text-muted-foreground">Allow others to view your profile</p>
                </div>
                <Controller
                  name="publicProfile"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p>Show email address</p>
                  <p className="text-sm text-muted-foreground">Display your email on your profile</p>
                </div>
                <Controller
                  name="showEmail"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p>Show project history</p>
                  <p className="text-sm text-muted-foreground">Let others see your completed projects</p>
                </div>
                <Controller
                  name="showProjectHistory"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p>Show ratings and reviews</p>
                  <p className="text-sm text-muted-foreground">Display teammate reviews on your profile</p>
                </div>
                <Controller
                  name="showRatings"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-xl shadow-sm border-border">
            <h3 className="mb-6">Communication Preferences</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whoCanMessage">Who can message you</Label>
                <Controller
                  name="whoCanMessage"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="whoCanMessage">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Everyone</SelectItem>
                        <SelectItem value="teammates">Teammates only</SelectItem>
                        <SelectItem value="none">No one</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whoCanInvite">Who can invite you to projects</Label>
                <Controller
                  name="whoCanInvite"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="whoCanInvite">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Everyone</SelectItem>
                        <SelectItem value="verified">Verified users only</SelectItem>
                        <SelectItem value="none">No one</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-xl shadow-sm border-border bg-destructive/5 border-destructive/20">
            <h3 className="mb-6 text-destructive">Danger Zone</h3>
            <div className="space-y-4">
              {!showDeleteConfirm ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p>Delete Account</p>
                    <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                  </div>
                  <Button 
                    variant="destructive" 
                    className="rounded-lg"
                    onClick={handleDeleteAccount}
                  >
                    Delete
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-destructive mb-2">Are you sure?</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                      </p>
                      <div className="flex gap-3">
                        <Button 
                          variant="destructive" 
                          className="rounded-lg"
                          onClick={handleDeleteAccount}
                          disabled={deleting}
                        >
                          {deleting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            'Yes, delete my account'
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="rounded-lg"
                          onClick={() => setShowDeleteConfirm(false)}
                          disabled={deleting}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" className="rounded-lg" onClick={() => reset()}>
              Cancel
            </Button>
            <Button 
              className="rounded-lg" 
              onClick={handleSubmit(onSubmit)}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="p-6 rounded-xl shadow-sm border-border">
            <h3 className="mb-6">Theme</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Color Theme</Label>
                <Controller
                  name="theme"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      value={field.value} 
                      onValueChange={(value: string) => {
                        field.onChange(value);
                        // Apply theme immediately when changed
                        if (setTheme) {
                          setTheme(value);
                        }
                      }}
                    >
                      <SelectTrigger id="theme">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p>Compact mode</p>
                  <p className="text-sm text-muted-foreground">Reduce spacing for a denser layout</p>
                </div>
                <Controller
                  name="compactMode"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-xl shadow-sm border-border">
            <h3 className="mb-6">Display</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Controller
                  name="language"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Controller
                  name="timezone"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                        <SelectItem value="mst">Mountain Time (MST)</SelectItem>
                        <SelectItem value="cst">Central Time (CST)</SelectItem>
                        <SelectItem value="est">Eastern Time (EST)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" className="rounded-lg" onClick={() => reset()}>
              Cancel
            </Button>
            <Button 
              className="rounded-lg" 
              onClick={handleSubmit(onSubmit)}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
