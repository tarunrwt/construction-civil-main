import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Building2,
  ArrowLeft,
  Home,
  IndianRupee,
  Users,
  FileText,
  Clock,
  Calendar,
  Download,
  ImageIcon,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  TooltipProps
} from "recharts";

declare module "jspdf" {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface DailyReport {
  id: string;
  project_id: string | null;
  report_date: string;
  weather: string | null;
  manpower_count: number | null;
  machinery_used: string | null;
  work_completed: string | null;
  materials_used?: string | null;
  safety_incidents?: string | null;
  remarks?: string | null;
  cost: number | null;
  stage: string | null;
  labor_cost?: number;
  material_cost?: number;
  equipment_cost?: number;
  subcontractor_cost?: number;
  other_cost?: number;
  user_id: string;
  created_at: string;
  updated_at: string;
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
  averageDailyCost: number;
  totalLaborCost: number;
  totalMaterialCost: number;
  delayedProjects?: number;
  timeStatus?: string;
}

interface DprPhoto {
    id: string;
    public_url: string;
    description: string;
    created_at: string;
}

interface Stage {
    name: string;
    status: string;
    progress: number;
}

interface StageGroup {
    name: string;
    subStages: Stage[];
}

type StageItem = Stage | StageGroup;

const Reports = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [photos, setPhotos] = useState<DprPhoto[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    totalSpent: 0,
    totalBudget: 0,
    totalManpower: 0,
    averageDailyCost: 0,
    totalLaborCost: 0,
    totalMaterialCost: 0
  });
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("Overall");
  const [floorFilter, setFloorFilter] = useState("all");

  const layoutStages = useMemo(() => [
    "Layout/Plan/Drawings - Site Plan",
    "Layout/Plan/Drawings - Footing Layout",
    "Layout/Plan/Drawings - Column Layout",
    "Layout/Plan/Drawings - Floor Plan - Ground Floor",
    "Layout/Plan/Drawings - Floor Plan - First Floor",
    "Layout/Plan/Drawings - Floor Plan - Other Floors",
    "Layout/Plan/Drawings - Brick Work - Ground Floor",
    "Layout/Plan/Drawings - Brick Work - First Floor",
    "Layout/Plan/Drawings - Brick Work - Other Floors",
    "Layout/Plan/Drawings - Door/Window Schedule - Ground Floor",
    "Layout/Plan/Drawings - Door/Window Schedule - First Floor",
    "Layout/Plan/Drawings - Door/Window Schedule - Other Floors",
    "Layout/Plan/Drawings - Electrical Layout - Ground Floor",
    "Layout/Plan/Drawings - Electrical Layout - First Floor",
    "Layout/Plan/Drawings - Electrical Layout - Other Floors",
    "Layout/Plan/Drawings - Plumbing Layout of Building",
  ], []);

  const executionStages = useMemo(() => [
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
  ], []);

  const initialStages: StageItem[] = useMemo(() => [
    {
      name: "Layout/Plan/Drawings",
      subStages: layoutStages.map(s => ({ name: s.replace("Layout/Plan/Drawings - ", ""), status: "Not Started", progress: 0})),
    },
    ...executionStages.map(s => ({ name: s, status: "Not Started", progress: 0 })),
  ], [layoutStages, executionStages]);

  const [stagesToDisplay, setStagesToDisplay] = useState<StageItem[]>(initialStages);

  useEffect(() => {
    const initializePage = async () => {
      setLoading(true);
      await checkAuth();
      await fetchData();
      setLoading(false);
    };
    initializePage();
  }, [projectId]);

  useEffect(() => {
    if (reports.length > 0) {
      updateStageProgress(reports);
    } else {
      setStagesToDisplay(initialStages);
    }
  }, [reports, initialStages]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  };

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      let reportsQuery = supabase.from('daily_reports').select('*, projects(name)');
      let projectsQuery = supabase.from('projects').select('*');
      let photosQuery = (supabase as any)
      .from('dpr_photos')
      .select('*')
      .eq('user_id', user.id);
    
      if (projectId) {
        reportsQuery = reportsQuery.eq('project_id', projectId);
        projectsQuery = projectsQuery.eq('id', projectId);
        const { data: reportIds } = await supabase.from('daily_reports').select('id').eq('project_id', projectId);
        const ids = reportIds ? reportIds.map(r => r.id) : [];
        photosQuery = photosQuery.in('daily_report_id', ids);
      }

      const [reportsRes, projectsRes, photosRes] = await Promise.all([
        reportsQuery.order('report_date', { ascending: false }),
        projectsQuery,
        photosQuery.order('created_at', { ascending: false })
      ]);

      if (reportsRes.error) throw reportsRes.error;
      if (projectsRes.error) throw projectsRes.error;
      if (photosRes.error) throw photosRes.error;

      const reportsData = (reportsRes.data as unknown as DailyReport[]) || [];
      const projectsData = projectsRes.data as Project[] || [];
      const photosData = photosRes.data as DprPhoto[] || [];

      if (projectId && projectsData.length > 0) {
        setProjectName(projectsData[0].name);
      } else {
        setProjectName("Overall");
      }

      setReports(reportsData);
      setProjects(projectsData);
      setPhotos(photosData);
      calculateStats(reportsData, projectsData);
    } catch (err: unknown) {
      console.error('Error fetching data:', err);
      toast.error("Failed to fetch project data.");
    }
  };

  const calculateStats = (reportsData: DailyReport[], projectsData: Project[]) => {
    const totalSpent = reportsData.reduce((sum, report) => sum + (report.cost || 0), 0);
    const totalBudget = projectsData.reduce((sum, project) => sum + (project.total_cost || 0), 0) || 500000;
    const totalManpower = reportsData.reduce((sum, report) => {
      const manpower = report.manpower_count === null ? 0 : report.manpower_count;
      return sum + manpower;
    }, 0);
    const averageDailyCost = reportsData.length > 0 ? totalSpent / reportsData.length : 0;
    const totalLaborCost = reportsData.reduce((sum, report) => sum + (report.labor_cost || 0), 0);
    const totalMaterialCost = reportsData.reduce((sum, report) => sum + (report.material_cost || 0), 0);

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
      setStats({ totalSpent, totalBudget, totalManpower, averageDailyCost, totalLaborCost, totalMaterialCost, timeStatus });
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const delayedProjects = projectsData.filter(p => p.target_end_date && new Date(p.target_end_date) < today).length;
      setStats({ totalSpent, totalBudget, totalManpower, averageDailyCost, totalLaborCost, totalMaterialCost, delayedProjects });
    }
  };

  const updateStageProgress = (reportsData: DailyReport[]) => {
    const allStageNamesInOrder: string[] = [];
    initialStages.forEach(s => {
        if ("subStages" in s) {
            s.subStages.forEach(ss => allStageNamesInOrder.push(`Layout/Plan/Drawings - ${ss.name}`));
        } else {
            allStageNamesInOrder.push(s.name);
        }
    });

    let latestStageIndex = -1;
    reportsData.forEach(report => {
        if (report.stage) {
            const index = allStageNamesInOrder.indexOf(report.stage);
            if (index > latestStageIndex) {
                latestStageIndex = index;
            }
        }
    });

    if (reportsData.some(r => r.stage === 'Completed')) {
        latestStageIndex = allStageNamesInOrder.length - 1;
    }

    const updatedStages = initialStages.map(stageItem => {
        if ('subStages' in stageItem) {
            const newSubStages = stageItem.subStages.map(subStage => {
                const fullStageName = `Layout/Plan/Drawings - ${subStage.name}`;
                const currentIndex = allStageNamesInOrder.indexOf(fullStageName);
                if (currentIndex < latestStageIndex) {
                    return { ...subStage, status: "Completed", progress: 100 };
                }
                if (currentIndex === latestStageIndex) {
                    return { ...subStage, status: "In Progress", progress: 50 };
                }
                return { ...subStage };
            });
            return { ...stageItem, subStages: newSubStages };
        } else {
            const currentIndex = allStageNamesInOrder.indexOf(stageItem.name);
            if (currentIndex < latestStageIndex) {
                return { ...stageItem, status: "Completed", progress: 100 };
            }
            if (currentIndex === latestStageIndex) {
                return { ...stageItem, status: "In Progress", progress: 50 };
            }
            return { ...stageItem };
        }
    });
    setStagesToDisplay(updatedStages);
  };

  const handleDownloadPdf = () => { toast.info("PDF Download functionality coming soon!"); };
  const handleDownloadExcel = () => { toast.info("Excel Download functionality coming soon!"); };

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
              {projectId ? `Report for: ${projectName}` : "Project Reports"}
            </h1>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Button variant="outline" onClick={handleDownloadPdf}>
              <Download className="mr-2 h-4 w-4" /> PDF Report
            </Button>
            <Button variant="outline" onClick={handleDownloadExcel}>
              <Download className="mr-2 h-4 w-4" /> Excel Report
            </Button>
            {projectId && (
              <Button variant="ghost" onClick={() => navigate("/reports")}>
                <Building2 className="mr-2 h-4 w-4" /> All Reports
              </Button>
            )}
            <Button variant="ghost" onClick={() => navigate("/")}>
              <Home className="mr-2 h-4 w-4" /> Homepage
            </Button>
            {isAuthenticated && (
              <Button variant="ghost" onClick={() => navigate("/admin")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Dashboard
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
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{stats.totalSpent.toLocaleString('en-IN')}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{stats.totalBudget.toLocaleString('en-IN')}
              </div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manpower</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalManpower}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Avg. {reports.length > 0 ? Math.round(stats.totalManpower / reports.length) : 0} per day
              </p>
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

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="stages">Stages</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <Card>
                  <CardHeader><CardTitle>Cost Trend</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart 
                        data={reports.length > 0 ? reports.slice().reverse().map((report) => ({
                          date: new Date(report.report_date).toLocaleDateString(),
                          cost: report.cost || 0,
                        })) : [{ date: 'No Data', cost: 0 }]}
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date"
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          label={{ 
                            value: "Cost (₹)", 
                            angle: -90, 
                            position: "insideLeft" 
                          }}
                          tickFormatter={(value) => `₹${(value/1000).toFixed(1)}K`}
                        />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-background/95 border border-border p-2 rounded-lg shadow">
                                  <p className="text-sm font-medium">Date: {label}</p>
                                  <p className="text-sm">Cost: ₹{payload[0].value.toLocaleString('en-IN')}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="cost" 
                          stroke="#8884d8" 
                          fill="#8884d8"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Manpower and Daily Costs</CardTitle>
                    <p className="text-sm text-muted-foreground">Daily manpower vs expenses</p>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={reports.length > 0 ? reports.slice().reverse().map((report) => ({
                          date: new Date(report.report_date).toLocaleDateString(),
                          manpower: report.manpower_count || 0,
                          cost: report.cost || 0
                        })) : [{ date: 'No Data', manpower: 0, cost: 0 }]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          interval={0}
                        />
                        <YAxis
                          yAxisId="left"
                          orientation="left"
                          stroke="#8884d8"
                          label={{ value: 'Manpower Count', angle: -90, position: 'insideLeft', offset: 10 }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="#82ca9d"
                          label={{ value: 'Daily Cost (₹)', angle: 90, position: 'insideRight', offset: 10 }}
                          tickFormatter={(value) => `₹${(value/1000)}K`}
                        />
                        <Tooltip
                          content={(props: TooltipProps<number, string>) => {
                            const { active, payload, label } = props;
                            if (active && payload && payload.length) {
                              const workers = Number(payload[0].value) || 0;
                              const cost = Number(payload[1].value) || 0;
                              return (
                                <div className="bg-white p-3 border rounded-lg shadow">
                                  <p className="font-medium mb-1">Date: {label}</p>
                                  <p className="text-[#8884d8]">
                                    Manpower: {workers} people
                                  </p>
                                  <p className="text-[#82ca9d]">
                                    Cost: ₹{cost.toLocaleString('en-IN')}
                                  </p>
                                  {workers > 0 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Cost per person: ₹{Math.round(cost / workers).toLocaleString('en-IN')}
                                    </p>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend verticalAlign="top" height={36} />
                        <Bar
                          yAxisId="left"
                          dataKey="manpower"
                          name="Manpower"
                          fill="#8884d8"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          yAxisId="right"
                          dataKey="cost"
                          name="Daily Cost"
                          fill="#82ca9d"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <Card>
                <CardHeader><CardTitle>Monthly Spending</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.entries(
                      reports.reduce((acc, report) => {
                        const month = new Date(report.report_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                        acc[month] = (acc[month] || 0) + (report.cost || 0);
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([month, cost]) => ({ month, cost }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Spending']} />
                      <Bar dataKey="cost" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Weather Impact</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(
                          reports.reduce((acc, report) => {
                            const weather = report.weather || 'Unknown';
                            acc[weather] = (acc[weather] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([name, value]) => ({ name, value }))}
                        cx="50%" cy="50%" labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80} fill="#8884d8" dataKey="value"
                      >
                        {['#0088FE', '#00C49F', '#FFBB28', '#FF8042'].map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <Card className="mt-6">
              <CardHeader><CardTitle>All Reports</CardTitle></CardHeader>
              <CardContent className="space-y-4 pt-6">
                  {reports.length === 0 ? (
                  <p className="text-muted-foreground">No reports submitted yet.</p>
                  ) : (
                  reports.map((report) => (
                      <div key={report.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-foreground">
                          {report.projects?.name || "Unknown Project"}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(report.report_date).toLocaleDateString()}
                          </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{report.work_completed || 'No description'}</p>
                      <div className="flex items-center gap-4 text-sm">
                          <span>Weather: {report.weather || 'N/A'}</span>
                          <span>Manpower: {report.manpower_count || 0}</span>
                          <span>Cost: ₹{(report.cost || 0).toLocaleString('en-IN')}</span>
                      </div>
                      </div>
                  ))
                  )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="photos">
            <Card className="mt-6">
              <CardHeader><CardTitle>Project Photos</CardTitle></CardHeader>
              <CardContent className="pt-6">
                  {photos.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                      <ImageIcon className="mx-auto h-12 w-12" />
                      <p className="mt-2">No photos found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {photos.map(photo => (
                        <div key={photo.id} className="group relative">
                           <img src={photo.public_url} alt={photo.description || 'Project photo'} className="rounded-lg object-cover w-full h-48" />
                           <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-xs rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <p>{photo.description || "No description"}</p>
                            <p className="text-gray-300">{new Date(photo.created_at).toLocaleDateString()}</p>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="stages">
            <Card className="mt-6">
              <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Project Stages</CardTitle>
                  <Select value={floorFilter} onValueChange={setFloorFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by Floor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Floors</SelectItem>
                      <SelectItem value="ground">Ground Floor</SelectItem>
                      <SelectItem value="first">First Floor</SelectItem>
                      <SelectItem value="other">Other Floors</SelectItem>
                    </SelectContent>
                  </Select>
              </CardHeader>
              <CardContent className="space-y-2 pt-6">
                <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                  {stagesToDisplay.map((stage, index) => {
                    // Determine if the current stage should be visible based on the filter
                    const isLayoutStage = 'subStages' in stage;
                    const isFilteredOut = ['first', 'other'].includes(floorFilter) && isLayoutStage;

                    if (isFilteredOut) {
                      return null; // Skip rendering this stage entirely
                    }

                    // Render the visible stage (either as an Accordion or a simple div)
                    if (isLayoutStage) {
                      return (
                        <AccordionItem value={`item-${index}`} key={index}>
                          <AccordionTrigger>{stage.name}</AccordionTrigger>
                          <AccordionContent>
                            <div className="pl-4 space-y-4">
                              {stage.subStages.map((subStage, subIndex) => (
                                <div key={subIndex} className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-foreground">{subStage.name}</span>
                                    <span className="text-sm text-muted-foreground">{subStage.status}</span>
                                  </div>
                                  <Progress value={subStage.progress} className="h-2" />
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    } else {
                      return (
                        <div key={index} className="space-y-2 py-4 border-b">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">{stage.name}</span>
                            <span className="text-sm text-muted-foreground">{stage.status}</span>
                          </div>
                          <Progress value={stage.progress} className="h-2" />
                        </div>
                      );
                    }
                  })}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Reports;