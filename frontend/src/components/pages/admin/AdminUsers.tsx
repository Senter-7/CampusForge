import { useState, useEffect } from 'react';
import axiosClient from '../../../api/axiosClient';
import { toast } from 'sonner';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { Loader2, Search, Trash2, Edit, User } from 'lucide-react';

interface UserDto {
  userId?: number;
  name?: string;
  email?: string;
  role?: string;
  createdAt?: string;
  universityName?: string;
  major?: string;
}

export function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [newRole, setNewRole] = useState<string>('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/admin/users');
      setUsers(res.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await axiosClient.delete(`/admin/users/${userId}`);
      toast.success('User deleted successfully');
      await fetchUsers();
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser?.userId || !newRole) return;

    setUpdating(true);
    try {
      await axiosClient.put(`/admin/users/${selectedUser.userId}/role?role=${newRole}`);
      toast.success('User role updated successfully');
      setUpdateDialogOpen(false);
      setSelectedUser(null);
      setNewRole('');
      await fetchUsers();
    } catch (error: any) {
      console.error('Failed to update user role:', error);
      toast.error(error?.response?.data?.message || 'Failed to update user role');
    } finally {
      setUpdating(false);
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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

  const getRoleBadgeVariant = (role: string | undefined) => {
    switch (role) {
      case 'ADMIN':
        return 'default';
      case 'PROFESSOR':
        return 'secondary';
      case 'STUDENT':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
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
        <h1 className="mb-2">User Management</h1>
        <p className="text-muted-foreground">
          Manage users, roles, and permissions
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4 rounded-xl shadow-sm border-border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="STUDENT">Students</SelectItem>
              <SelectItem value="PROFESSOR">Professors</SelectItem>
              <SelectItem value="ADMIN">Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="p-6 rounded-xl shadow-sm border-border">
        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">User</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Email</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Role</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">University</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Joined</th>
                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.userId} className="border-b border-border hover:bg-muted/50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {getInitials(user.name || 'User')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{user.email || 'N/A'}</td>
                      <td className="p-3">
                        <Badge variant={getRoleBadgeVariant(user.role)} className="rounded-lg">
                          {user.role || 'STUDENT'}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{user.universityName || 'N/A'}</td>
                      <td className="p-3 text-sm text-muted-foreground">{formatDate(user.createdAt)}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-2">
                          <Dialog open={updateDialogOpen && selectedUser?.userId === user.userId} onOpenChange={(open) => {
                            setUpdateDialogOpen(open);
                            if (open) {
                              setSelectedUser(user);
                              setNewRole(user.role || 'STUDENT');
                            } else {
                              setSelectedUser(null);
                              setNewRole('');
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Update User Role</DialogTitle>
                                <DialogDescription>
                                  Change the role for {user.name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Role</label>
                                  <Select value={newRole} onValueChange={setNewRole}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="STUDENT">Student</SelectItem>
                                      <SelectItem value="PROFESSOR">Professor</SelectItem>
                                      <SelectItem value="ADMIN">Admin</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="flex gap-3">
                                <Button
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => {
                                    setUpdateDialogOpen(false);
                                    setSelectedUser(null);
                                    setNewRole('');
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  className="flex-1"
                                  onClick={handleUpdateRole}
                                  disabled={updating || newRole === user.role}
                                >
                                  {updating ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Updating...
                                    </>
                                  ) : (
                                    'Update Role'
                                  )}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.userId!)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
