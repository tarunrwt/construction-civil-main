import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, ArrowLeft, Plus, Calendar, DollarSign, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { intervalToDuration } from "date-fns";

interface Project {
  id: string;
  name: string;
  start_date: string;
  target_end_date?: string | null;
  total_cost?: number | null;
  area_of_site?: number | null;
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    start_date: "",
    target_end_date: "",
    total_cost: "",
    area_of_site: "",
    latitude: "",
    longitude: "",
  });
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await checkAuth();
      await fetchProjects();
      setLoading(false);
    };
    initialize();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) navigate("/auth");
  };

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("start_date", { ascending: false });
    if (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to fetch projects. Ensure DB schema is up to date.");
      setProjects([]);
    } else {
      setProjects((data as Project[]) || []);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewProject((p) => ({ ...p, [id]: value }));
  };

  const handleCreateProject = async () => {
    if (!newProject.name || !newProject.start_date) {
      toast.error("Please fill all required fields.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to create a project.");
      return;
    }

    const payload: any = {
      name: newProject.name,
      start_date: newProject.start_date,
      user_id: user.id,
    };
    if (newProject.target_end_date) payload.target_end_date = newProject.target_end_date;
    if (newProject.total_cost) payload.total_cost = parseFloat(newProject.total_cost);
    if (newProject.area_of_site) payload.area_of_site = parseFloat(newProject.area_of_site);

    const { error } = await supabase.from("projects").insert([payload]);
    if (error) {
      toast.error("Error creating project: " + error.message);
    } else {
      toast.success("Project created successfully!");
      setIsDialogOpen(false);
      setNewProject({
        name: "",
        start_date: "",
        target_end_date: "",
        total_cost: "",
        area_of_site: "",
        latitude: "",
        longitude: "",
      });
      fetchProjects();
    }
  };

  const handleSeeLocation = () => {
    const lat = parseFloat((newProject as any).latitude);
    const lon = parseFloat((newProject as any).longitude);
    if (isNaN(lat) || isNaN(lon)) {
      toast.error("Please enter valid latitude and longitude values.");
      return;
    }
    const url = `https://www.google.com/maps?q=${lat},${lon}&z=17`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDeleteProject = async () => {
    if (!deleteProjectId) return;

    try {
      const { error: reportsError } = await supabase
        .from("daily_reports")
        .delete()
        .eq("project_id", deleteProjectId);

      if (reportsError) throw reportsError;

      const { error: projectError } = await supabase
        .from("projects")
        .delete()
        .eq("id", deleteProjectId);

      if (projectError) throw projectError;

      toast.success("Project and all associated reports have been deleted.");
      setProjects(projects.filter((p) => p.id !== deleteProjectId));
    } catch (error: any) {
      toast.error("Error deleting project: " + error.message);
    } finally {
      setDeleteDialogOpen(false);
      setDeleteProjectId(null);
    }
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
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Create Projects</h1>
          </div>
          <Button variant="ghost" onClick={() => navigate("/admin")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Your Projects</h2>
            <p className="text-muted-foreground">
              Manage and track all your construction projects
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Project</DialogTitle>
                <DialogDescription>
                  Enter the details for your new construction project.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input id="name" value={newProject.name} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={newProject.start_date}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_end_date">Target End Date</Label>
                  <Input
                    id="target_end_date"
                    type="date"
                    value={newProject.target_end_date}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_cost">Total Budget (₹)</Label>
                  <Input
                    id="total_cost"
                    type="number"
                    placeholder="e.g., 500000"
                    value={newProject.total_cost}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area_of_site">Area of site (sq.m)</Label>
                  <Input
                    id="area_of_site"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 250.5"
                    value={newProject.area_of_site}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="0.000001"
                        placeholder="e.g., 12.9716"
                        value={(newProject as any).latitude}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="0.000001"
                        placeholder="e.g., 77.5946"
                        value={(newProject as any).longitude}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button variant="outline" onClick={handleSeeLocation}>
                        See Location
                      </Button>
                    </div>
                  </div>
                </div>
                {newProject.start_date && newProject.target_end_date ? (
                  <div className="text-sm text-muted-foreground">
                    Duration:{" "}
                    {(() => {
                      try {
                        const start = new Date(newProject.start_date);
                        const end = new Date(newProject.target_end_date);
                        if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start)
                          return "Invalid date range";
                        const dur = intervalToDuration({ start, end });
                        const parts: string[] = [];
                        if (dur.years)
                          parts.push(
                            `${dur.years} year${dur.years > 1 ? "s" : ""}`
                          );
                        if (dur.months)
                          parts.push(
                            `${dur.months} month${dur.months > 1 ? "s" : ""}`
                          );
                        if (dur.days)
                          parts.push(
                            `${dur.days} day${dur.days > 1 ? "s" : ""}`
                          );
                        return parts.length ? parts.join(" ") : "0 days";
                      } catch {
                        return "-";
                      }
                    })()}
                  </div>
                ) : null}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleCreateProject}>Create Project</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create Your First Project
                </CardTitle>
                <CardDescription>
                  Get started by creating a new construction project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => setIsDialogOpen(true)}>
                  Create Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            projects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Started: {new Date(project.start_date).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <DollarSign className="h-4 w-4" />
                    Total Budget: ₹
                    {project.total_cost
                      ? project.total_cost.toLocaleString("en-IN")
                      : "0"}
                  </div>
                  {project.area_of_site ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <span className="text-sm font-medium">Area:</span>
                      <span>{project.area_of_site} sq.m</span>
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/reports/${project.id}`)}
                    >
                      View Details
                    </Button>
                    <AlertDialog
                      open={deleteDialogOpen && deleteProjectId === project.id}
                      onOpenChange={setDeleteDialogOpen}
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => {
                            setDeleteProjectId(project.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Are you sure you want to delete "{project.name}"?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the project and all its
                            reports. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel
                            onClick={() => setDeleteProjectId(null)}
                          >
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteProject}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
