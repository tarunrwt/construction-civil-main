import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Building2, ArrowLeft, Plus, Calendar, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

interface Project {
  id: string;
  name: string;
  start_date: string;
  total_cost: number;
}

const Projects = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const initializePage = async () => {
      await checkAuth();
      await fetchProjects();
      setLoading(false);
    };
    initializePage();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }
  };

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      setProjects(data || []);
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
            <h1 className="text-2xl font-bold text-foreground">Manage Projects</h1>
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
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
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
                <Button className="w-full">Create Project</Button>
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
                    Total Cost: ${project.total_cost.toLocaleString()}
                  </div>
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Projects;
