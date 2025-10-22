import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Building2, ArrowLeft, Home, DollarSign, Users, Package, TrendingUp, Clock, Calendar, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";

interface DailyReport {
  id: string;
  project_id: string;
  report_date: string;
  weather: string;
  manpower: number;
  machinery: string;
  work_completed: string;
  materials_used: string;
  safety_incidents: string | null;
  remarks: string;
  cost: number;
  stage: string;
  projects: {
    name: string;
  };
}

interface ProjectStats {
  totalCost: number;
  totalManpower: number;
  totalMaterials: number;
  progress: number;
  daysElapsed: number;
}

const Reports = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    totalCost: 0,
    totalManpower: 0,
    totalMaterials: 0,
    progress: 0,
    daysElapsed: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializePage = async () => {
      await checkAuth();
      await fetchReports();
      setLoading(false);
    };
    initializePage();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  };

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('daily_reports')
      .select(`
        *,
        projects (
          name
        )
      `)
      .order('report_date', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
    } else {
      setReports(data || []);
      calculateStats(data || []);
    }
  };

  const calculateStats = (reportsData: DailyReport[]) => {
    const totalCost = reportsData.reduce((sum, report) => sum + report.cost, 0);
    const totalManpower = reportsData.reduce((sum, report) => sum + report.manpower, 0);
    const uniqueProjects = new Set(reportsData.map(r => r.project_id)).size;
    const totalMaterials = reportsData.length; // Simplified count
    const progress = uniqueProjects > 0 ? (reportsData.length / (uniqueProjects * 10)) * 100 : 0; // Rough estimate
    const daysElapsed = reportsData.length > 0 ? Math.max(...reportsData.map(r => new Date(r.report_date).getTime())) - Math.min(...reportsData.map(r => new Date(r.report_date).getTime())) : 0;
    const daysElapsedCount = daysElapsed > 0 ? Math.ceil(daysElapsed / (1000 * 60 * 60 * 24)) : 0;

    setStats({
      totalCost,
      totalManpower,
      totalMaterials,
      progress: Math.min(progress, 100),
      daysElapsed: daysElapsedCount
    });
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
              <div className="text-2xl font-bold">${stats.totalCost.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manpower</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalManpower}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(stats.progress)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Days Elapsed</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.daysElapsed}</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-lg p-6 border border-border">
            <h2 className="text-xl font-bold text-foreground mb-6">Recent Reports</h2>
            {reports.length === 0 ? (
              <p className="text-muted-foreground">No reports submitted yet.</p>
            ) : (
              <div className="space-y-4">
                {reports.slice(0, 5).map((report) => (
                  <div key={report.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-foreground">{report.projects.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(report.report_date).toLocaleDateString()}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{report.work_completed}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span>Weather: {report.weather}</span>
                      <span>Manpower: {report.manpower}</span>
                      <span>Cost: ${report.cost.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
        </div>
      </main>
    </div>
  );
};

export default Reports;
