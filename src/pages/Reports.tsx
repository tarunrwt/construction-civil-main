import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Building2, ArrowLeft, Home, DollarSign, Users, FileText, TrendingUp, Clock, Calendar, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';


declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface DailyReport {
  id: string;
  project_id: string | null;
  report_date: string;
  weather: string | null;
  manpower: number | null;
  machinery?: string | null;
  work_completed: string | null;
  materials_used?: string | null;
  safety_incidents?: string | null;
  remarks?: string | null;
  cost: number | null;
  stage: string | null;
  projects: {
    name: string;
  } | null;
}

interface Project {
  id: string;
  name: string;
  start_date: string;
  target_end_date?: string;
  total_cost?: number;
  created_at: string;
}

interface ProjectStats {
  totalSpent: number;
  totalBudget: number;
  totalManpower: number;
  delayedProjects?: number;
  timeStatus?: string;
}

const STAGE_LIST = [
  "Site Preparation",
  "Excavation",
  "Foundation Work",
  "Plinth Work",
  "Superstructure Work",
  "Roof Work",
  "Flooring Work",
  "Plastering",
  "Door & Window Work",
  "Electrical & Plumbing Work",
  "Painting & Finishing Work",
  "Completed",
];

interface StageData {
  name: string;
  status: string;
  progress: number;
}

const Reports = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    totalSpent: 0,
    totalBudget: 0,
    totalManpower: 0
  });
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("Overall");
  const [stages, setStages] = useState<StageData[]>(
    STAGE_LIST.map((name) => ({ name, status: "Not Started", progress: 0 }))
  );

  useEffect(() => {
    const initializePage = async () => {
      await checkAuth();
      await fetchData();
      setLoading(false);
    };
    initializePage();
  }, [projectId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  };

  const fetchData = async () => {
    try {
      let reportsQuery = supabase.from('daily_reports').select('*, projects(name)').order('report_date', { ascending: false });
      let projectsQuery = supabase.from('projects').select('*');
      
      if (projectId) {
        reportsQuery = reportsQuery.eq('project_id', projectId);
        projectsQuery = projectsQuery.eq('id', projectId);
      }

      const [reportsRes, projectsRes] = await Promise.all([reportsQuery, projectsQuery]);

      if (reportsRes.error) throw reportsRes.error;
      if (projectsRes.error) throw projectsRes.error;

      const reportsData = reportsRes.data as DailyReport[] || [];
      const projectsData = projectsRes.data as Project[] || [];

      if (projectId && projectsData.length > 0) {
        setProjectName(projectsData[0].name);
      }

      setReports(reportsData);
      calculateStats(reportsData, projectsData);
      updateStageProgress(reportsData);
    } catch (err: any) {
      console.error('Error fetching data:', err);
    }
  };

  const calculateStats = (reportsData: DailyReport[], projectsData: Project[]) => {
    const totalSpent = reportsData.reduce((sum, report) => sum + (report.cost || 0), 0);
    const totalBudget = projectsData.reduce((sum, project) => sum + (project.total_cost || 0), 0);
    const totalManpower = reportsData.reduce((sum, report) => sum + (report.manpower || 0), 0);

    if (projectId && projectsData.length > 0) {
      const project = projectsData[0];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let timeStatus = "N/A";
      if (project.target_end_date) {
        const targetDate = new Date(project.target_end_date);
        const daysDiff = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        timeStatus = daysDiff >= 0 ? `${daysDiff} Days Remaining` : `${Math.abs(daysDiff)} Days Overdue`;
      }
      setStats({ totalSpent, totalBudget, totalManpower, timeStatus });
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const delayedProjects = projectsData.filter(p => p.target_end_date && new Date(p.target_end_date) < today).length;
      setStats({ totalSpent, totalBudget, totalManpower, delayedProjects });
    }
  };

  const updateStageProgress = (reportsData: DailyReport[]) => {
    if (reportsData.length === 0) {
      setStages(STAGE_LIST.map(name => ({ name, status: "Not Started", progress: 0 })));
      return;
    }

    const latestReport = reportsData[0];
    const currentStage = latestReport.stage;
    if (!currentStage) return;

    const currentStageIndex = STAGE_LIST.indexOf(currentStage);
    if (currentStageIndex === -1) return;

    if (currentStage === "Completed") {
      setStages(STAGE_LIST.map(name => ({ name, status: "Completed", progress: 100 })));
      return;
    }

    const updatedStages = STAGE_LIST.map((name, index) => {
      if (index < currentStageIndex) return { name, status: "Completed", progress: 100 };
      if (index === currentStageIndex) return { name, status: "In Progress", progress: 50 };
      return { name, status: "Not Started", progress: 0 };
    });
    setStages(updatedStages);
  };
  
  const chartData = useMemo(() => {
    return reports
      .map(report => ({
        date: new Date(report.report_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        cost: report.cost || 0,
        manpower: report.manpower || 0,
      }))
      .reverse();
  }, [reports]);

  const analyticsData = useMemo(() => {
    const stageCosts = reports.reduce((acc, report) => {
      const stage = report.stage || "Uncategorized";
      acc[stage] = (acc[stage] || 0) + (report.cost || 0);
      return acc;
    }, {} as Record<string, number>);

    const stageManpower = reports.reduce((acc, report) => {
      const stage = report.stage || "Uncategorized";
      acc[stage] = (acc[stage] || 0) + (report.manpower || 0);
      return acc;
    }, {} as Record<string, number>);

    return {
      costDistribution: Object.entries(stageCosts).map(([name, value]) => ({ name, value })),
      manpowerByStage: Object.entries(stageManpower).map(([name, manpower]) => ({ name, manpower })),
    };
  }, [reports]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];


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
            <h1 className="text-2xl font-bold text-foreground">
              {projectId ? `Report for: ${projectName}` : "Overall Project Reports"}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              PDF Report
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Excel Report
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")}>
                <Home className="mr-2 h-4 w-4" />
                Homepage
            </Button>
            {isAuthenticated && (
              <Button variant="ghost" onClick={() => navigate("/admin")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalSpent.toLocaleString('en-IN')}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalBudget.toLocaleString('en-IN')}</div>
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
              <CardTitle className="text-sm font-medium">{projectId ? "Time Status" : "Delayed Projects"}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectId ? stats.timeStatus : stats.delayedProjects}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="stages">Stages</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
             <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Cost Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="cost" stroke="#8884d8" activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Manpower vs Cost</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="manpower" fill="#8884d8" />
                        <Bar yAxisId="right" dataKey="cost" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Stage Cost Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={analyticsData.costDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                          {analyticsData.costDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Manpower per Stage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData.manpowerByStage}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="manpower" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <div className="bg-card rounded-lg p-6 border border-border">
              <h2 className="text-xl font-bold text-foreground mb-6">Recent Reports</h2>
              {reports.length === 0 ? (
                <p className="text-muted-foreground">No reports submitted yet.</p>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-foreground">{report.projects?.name || 'Unknown Project'}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(report.report_date).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{report.work_completed || 'No description'}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span>Weather: {report.weather || 'N/A'}</span>
                        <span>Manpower: {report.manpower || 0}</span>
                        <span>Cost: ₹{(report.cost || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="stages" className="mt-6">
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Reports;