import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Building2, 
  ArrowLeft, 
  Users, 
  UserPlus, 
  Shield, 
  Settings,
  CheckCircle,
  XCircle
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserRole {
  id: string;
  name: string;
  description: string | null;
  permissions: string[] | string; // JSONB from Supabase
}

interface Project {
  id: string;
  name: string;
}

interface UserAssignment {
  id: string;
  user_id: string;
  project_id: string;
  role_id: string;
  assigned_at: string | null;
  user_roles: UserRole;
  projects: Project;
}

const UserManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignments, setAssignments] = useState<UserAssignment[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");

  const [newAssignment, setNewAssignment] = useState({
    project_id: "",
    role_id: "",
  });

  useEffect(() => {
    const initialize = async () => {
      await checkAuth();
      await fetchData();
      setLoading(false);
    };
    initialize();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }

    // For now, allow access to all authenticated users
    // In production, you would check for admin permissions
    setCurrentUserRole("Admin");
  };

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("id, name, description, permissions")
        .order("name");

      if (rolesError) throw rolesError;

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name");

      if (projectsError) throw projectsError;

      // Fetch user assignments - ONLY for current user
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("user_project_assignments")
        .select(`
          id,
          user_id,
          project_id,
          role_id,
          assigned_at,
          user_roles(id, name, description, permissions),
          projects(id, name)
        `)
        .eq("user_id", user.id)  // CRITICAL: Only show current user's assignments
        .order("assigned_at", { ascending: false });

      if (assignmentsError) {
        console.warn("Error fetching assignments:", assignmentsError);
        // Don't throw error, just set empty array
        setAssignments([]);
      } else {
        setAssignments((assignmentsData || []) as unknown as UserAssignment[]);
      }

      setUserRoles((rolesData || []) as unknown as UserRole[]);
      setProjects(projectsData || []);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch user management data");
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      // For now, just assign the role to the current user for testing
      const payload = {
        user_id: currentUser.id,
        project_id: newAssignment.project_id,
        role_id: newAssignment.role_id,
        assigned_by: currentUser.id,
      };

      const { error } = await supabase
        .from("user_project_assignments")
        .insert([payload]);

      if (error) throw error;

      toast.success("User role assigned successfully!");
      setNewAssignment({
        project_id: "",
        role_id: "",
      });
      await fetchData();
    } catch (error) {
      console.error("Error assigning role:", error);
      toast.error("Failed to assign user role");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from("user_project_assignments")
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;

      toast.success("User assignment removed successfully!");
      await fetchData();
    } catch (error) {
      console.error("Error removing assignment:", error);
      toast.error("Failed to remove user assignment");
    } finally {
      setLoading(false);
    }
  };

  const getPermissionBadges = (permissions: string[] | string) => {
    const perms = Array.isArray(permissions) ? permissions : [];
    if (perms.includes("*")) {
      return <Badge variant="default">Full Access</Badge>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {perms.map((permission: string) => (
          <Badge key={permission} variant="secondary" className="text-xs">
            {permission.replace(/_/g, " ")}
          </Badge>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              User Management
            </h1>
            <Badge variant="outline">{currentUserRole}</Badge>
          </div>
          <Button variant="ghost" onClick={() => navigate("/admin")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Roles Overview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Available Roles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userRoles.map((role) => (
                  <div key={role.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{role.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{role.description}</p>
                    {getPermissionBadges(role.permissions)}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Assign User Role */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Assign User Role
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAssignRole} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="project_id">Project *</Label>
                      <Select
                        value={newAssignment.project_id}
                        onValueChange={(value) => setNewAssignment({ ...newAssignment, project_id: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role_id">Role *</Label>
                      <Select
                        value={newAssignment.role_id}
                        onValueChange={(value) => setNewAssignment({ ...newAssignment, role_id: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {userRoles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    Assign Role
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Current Assignments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Current User Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-card rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Assigned</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell>{assignment.user_id}</TableCell>
                          <TableCell>{assignment.projects.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{assignment.user_roles.name}</Badge>
                          </TableCell>
                          <TableCell>
                            {assignment.assigned_at ? new Date(assignment.assigned_at).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveAssignment(assignment.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserManagement;
