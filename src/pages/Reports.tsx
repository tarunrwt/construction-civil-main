import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Building2, ArrowLeft, Home, DollarSign, Users, Package, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";

const Reports = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  };

  const stages = [
    { name: "Site Preparation", status: "Not Started", progress: 0 },
    { name: "Excavation", status: "Not Started", progress: 0 },
    { name: "Foundation Work", status: "Not Started", progress: 0 },
    { name: "Plinth Work", status: "Not Started", progress: 0 },
    { name: "Superstructure Work", status: "Not Started", progress: 0 },
    { name: "Roof Work", status: "Not Started", progress: 0 },
    { name: "Flooring Work", status: "Not Started", progress: 0 },
    { name: "Plastering", status: "Not Started", progress: 0 },
    { name: "Door & Window Work", status: "Not Started", progress: 0 },
    { name: "Electrical & Plumbing Work", status: "Not Started", progress: 0 },
    { name: "Painting & Finishing Work", status: "Not Started", progress: 0 },
    { name: "Completed", status: "Not Started", progress: 0 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">View Reports</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate("/")}>
              <Home className="mr-2 h-4 w-4" />
              Back to Homepage
            </Button>
            {isAuthenticated && (
              <Button variant="ghost" onClick={() => navigate("/admin")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manpower</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Materials Used</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Days Elapsed</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-card rounded-lg p-6 border border-border">
          <h2 className="text-xl font-bold text-foreground mb-6">Project Stages</h2>
          <div className="space-y-6">
            {stages.map((stage, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{stage.name}</span>
                  <span className="text-sm text-muted-foreground">{stage.status}</span>
                </div>
                <Progress value={stage.progress} className="h-2" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;
