'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { 
  Bell, 
  Mail, 
  Shield, 
  CreditCard, 
  User, 
  Users, 
  Settings as SettingsIcon,
  UserPlus,
  Trash2,
  X,
  Check,
  Loader2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import CompanySettings from '@/components/settings/CompanySettings';
import ApiTokenSettings from '@/components/settings/ApiTokenSettings';

// Form validation schema for inviting users
const inviteFormSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['admin', 'accountant', 'staff'], {
    required_error: 'Please select a role',
  }),
  name: z.string().optional(),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

type User = {
  id: number;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
};

type Invitation = {
  id: number;
  email: string;
  name: string | null;
  role: string;
  status: string;
  createdAt: string;
  expires: string;
};

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  staff: 'Staff',
  accountant: 'Accountant',
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [cancelInvitationId, setCancelInvitationId] = useState<number | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  
  // These would normally be fetched from your API
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [invoiceReminders, setInvoiceReminders] = useState(true);
  const [paymentReminders, setPaymentReminders] = useState(true);
  const [theme, setTheme] = useState('system');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  
  const inviteForm = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: '',
      role: 'staff',
      name: '',
    },
  });
  
  // Fetch users and invitations when the component mounts
  useEffect(() => {
    const fetchTeamData = async () => {
      if (session?.user?.permissions?.['users.view']) {
        await fetchUsers();
        await fetchInvitations();
      } else {
        setLoadingUsers(false);
        setLoadingInvitations(false);
      }
    };
    
    fetchTeamData();
  }, [session]);
  
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch('/api/users');
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoadingUsers(false);
    }
  };
  
  const fetchInvitations = async () => {
    setLoadingInvitations(true);
    try {
      const response = await fetch('/api/invitations');
      
      if (!response.ok) {
        throw new Error('Failed to fetch invitations');
      }
      
      const data = await response.json();
      setInvitations(data);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast.error('Failed to load pending invitations');
    } finally {
      setLoadingInvitations(false);
    }
  };
  
  const handleDeleteUser = async (userId: number) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete user');
      }
      
      // Update the users list
      setUsers(users.filter(user => user.id !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to delete user');
      }
    } finally {
      setDeleteUserId(null);
    }
  };
  
  const handleCancelInvitation = async (invitationId: number) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to cancel invitation');
      }
      
      // Update the invitations list
      setInvitations(invitations.filter(invitation => invitation.id !== invitationId));
      toast.success('Invitation cancelled successfully');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to cancel invitation');
      }
    } finally {
      setCancelInvitationId(null);
    }
  };
  
  const onInviteSubmit = async (data: InviteFormValues) => {
    setIsLoading(true);
    setInviteUrl(null);
    
    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send invitation');
      }
      
      const responseData = await response.json();
      
      // Set the invitation URL (normally this would be sent via email)
      setInviteUrl(responseData.acceptUrl);
      
      // Refresh the invitations list
      fetchInvitations();
      
      toast.success('Invitation sent successfully');
      
      // Reset the form but keep the dialog open to show the URL
      inviteForm.reset({
        email: '',
        role: 'staff',
        name: '',
      });
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
      
      // Close the dialog on error
      setInviteDialogOpen(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyInviteUrl = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      toast.success('Invitation link copied to clipboard');
    }
  };

  return (
    <div className="container py-10">
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Account</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Team</span>
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            <span>Company</span>
          </TabsTrigger>
          <TabsTrigger value="api-tokens" className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            <span>API Tokens</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account details and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The account settings section will allow users to update their profile, change password, and manage their account preferences.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                This section is currently being developed and will be available soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-muted-foreground text-sm">
                      Receive email notifications for important updates.
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="invoice-reminders">Invoice Reminders</Label>
                    <p className="text-muted-foreground text-sm">
                      Get notified about upcoming and overdue invoices.
                    </p>
                  </div>
                  <Switch
                    id="invoice-reminders"
                    checked={invoiceReminders}
                    onCheckedChange={setInvoiceReminders}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="payment-reminders">Payment Reminders</Label>
                    <p className="text-muted-foreground text-sm">
                      Receive notifications about upcoming payments.
                    </p>
                  </div>
                  <Switch
                    id="payment-reminders"
                    checked={paymentReminders}
                    onCheckedChange={setPaymentReminders}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleSaveNotifications} 
                disabled={isLoading}
                className="mt-4"
              >
                {isLoading ? 'Saving...' : 'Save Notification Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent> */}
        
        <TabsContent value="team">
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    Manage your team members and their access levels.
                  </CardDescription>
                </div>
                {session?.user?.permissions?.['users.invite'] && (
                  <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        <span>Invite Team Member</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite Team Member</DialogTitle>
                        <DialogDescription>
                          Send an invitation to a new team member. They will receive an email with instructions to create an account.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Form {...inviteForm}>
                        <form onSubmit={inviteForm.handleSubmit(onInviteSubmit)} className="space-y-4">
                          <FormField
                            control={inviteForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                  <Input placeholder="email@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={inviteForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormDescription>
                                  If provided, the name will be pre-filled in the registration form.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={inviteForm.control}
                            name="role"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Role</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="admin">Administrator</SelectItem>
                                    <SelectItem value="accountant">Accountant</SelectItem>
                                    <SelectItem value="staff">Staff</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  The role determines what permissions the user will have.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {inviteUrl && (
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Invitation Created</AlertTitle>
                              <AlertDescription className="flex flex-col gap-2">
                                <p className="text-sm">Share this link with the invitee:</p>
                                <div className="flex items-center gap-2">
                                  <Input 
                                    value={inviteUrl} 
                                    readOnly 
                                    className="text-xs"
                                  />
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    onClick={copyInviteUrl}
                                  >
                                    Copy
                                  </Button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  In a production environment, an email would be sent automatically.
                                </p>
                              </AlertDescription>
                            </Alert>
                          )}
                          
                          <DialogFooter className="mt-4">
                            <Button
                              type="submit"
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Sending Invitation...
                                </>
                              ) : (
                                'Send Invitation'
                              )}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : users.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Joined</TableHead>
                          {session?.user?.permissions?.['users.delete'] && (
                            <TableHead className="text-right">Actions</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map(user => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground">
                                {roleLabels[user.role] || user.role}
                              </span>
                            </TableCell>
                            <TableCell>
                              {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                            {session?.user?.permissions?.['users.delete'] && (
                              <TableCell className="text-right">
                                {user.id.toString() === session.user.id ? (
                                  <span className="text-xs text-muted-foreground">Current user</span>
                                ) : (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setDeleteUserId(user.id)}
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Confirm Deletion</DialogTitle>
                                        <DialogDescription>
                                          Are you sure you want to remove {user.name || user.email} from your team?
                                          This action cannot be undone.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <DialogFooter className="gap-2 sm:justify-end">
                                        <DialogClose asChild>
                                          <Button type="button" variant="outline">
                                            Cancel
                                          </Button>
                                        </DialogClose>
                                        <Button
                                          type="button"
                                          variant="destructive"
                                          onClick={() => handleDeleteUser(user.id)}
                                        >
                                          Delete User
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No team members found</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {session?.user?.permissions?.['users.invite'] && (
              <Card>
                <CardHeader>
                  <CardTitle>Pending Invitations</CardTitle>
                  <CardDescription>
                    Manage and track pending team member invitations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingInvitations ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : invitations.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Sent</TableHead>
                            <TableHead>Expires</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invitations.map(invitation => (
                            <TableRow key={invitation.id}>
                              <TableCell className="font-medium">{invitation.email}</TableCell>
                              <TableCell>
                                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground">
                                  {roleLabels[invitation.role] || invitation.role}
                                </span>
                              </TableCell>
                              <TableCell>
                                {new Date(invitation.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {new Date(invitation.expires).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setCancelInvitationId(invitation.id)}
                                    >
                                      <X className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Confirm Cancellation</DialogTitle>
                                      <DialogDescription>
                                        Are you sure you want to cancel the invitation to {invitation.email}?
                                        They will no longer be able to use this invitation.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter className="gap-2 sm:justify-end">
                                      <DialogClose asChild>
                                        <Button type="button" variant="outline">
                                          No, Keep It
                                        </Button>
                                      </DialogClose>
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={() => handleCancelInvitation(invitation.id)}
                                      >
                                        Yes, Cancel Invitation
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No pending invitations</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="company">
          <CompanySettings />
        </TabsContent>
        
        <TabsContent value="api-tokens">
          <ApiTokenSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
} 