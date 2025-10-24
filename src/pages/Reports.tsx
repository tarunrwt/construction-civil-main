import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Building2, ArrowLeft, Home, DollarSign, Users, FileText, TrendingUp, Clock, Calendar, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

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
  work_completed: string | null;
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      let reportsQuery = supabase.from('daily_reports').select('*, projects(name)') as any;
      reportsQuery = reportsQuery.eq('user_id', user.id).order('report_date', { ascending: false });

      let projectsQuery = supabase.from('projects').select('*') as any;
      projectsQuery = projectsQuery.eq('user_id', user.id);

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

  const handleDownloadPdf = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const today = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      // Header with blue background
      doc.setFillColor(41, 128, 185);
      doc.rect(0, 0, pageWidth, 40, 'F');

      // White header text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text('Construction Project Report', pageWidth / 2, 25, { align: 'center' });

      // Reset to black text
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text(`Report Generated: ${today}`, 15, 50);

      let yPosition = 70;

      // Financial Overview
      doc.setFontSize(16);
      doc.text('Financial Overview', 15, yPosition);

      autoTable(doc, {
        startY: yPosition + 5,
        head: [['Description', 'Amount (₹)']],
        body: [
          ['Total Budget', stats.totalBudget.toLocaleString('en-IN')],
          ['Total Spent', stats.totalSpent.toLocaleString('en-IN')],
          ['Balance', (stats.totalBudget - stats.totalSpent).toLocaleString('en-IN')]
        ],
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 12 }
      });

      // Construction Progress
      yPosition = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(16);
      doc.text('Construction Progress', 15, yPosition);

      autoTable(doc, {
        startY: yPosition + 5,
        head: [['Stage', 'Status', 'Progress']],
        body: stages.map(stage => [
          stage.name,
          stage.status,
          `${stage.progress}%`
        ]),
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 12 }
      });

      // Project Statistics
      yPosition = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(16);
      doc.text('Project Statistics', 15, yPosition);

      autoTable(doc, {
        startY: yPosition + 5,
        head: [['Metric', 'Value']],
        body: [
          ['Total Manpower', stats.totalManpower.toString()],
          ['Delayed Projects', stats.delayedProjects.toString()],
          ['Total Reports', reports.length.toString()]
        ],
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 12 }
      });

      // Recent Activities on New Page
      doc.addPage();
      doc.setFillColor(41, 128, 185);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text('Recent Activities', pageWidth / 2, 25, { align: 'center' });

      doc.setTextColor(0, 0, 0);
      autoTable(doc, {
        startY: 50,
        head: [['Date', 'Project', 'Work Done', 'Stage', 'Cost (₹)']],
        body: reports.slice(0, 10).map(report => [
          new Date(report.report_date).toLocaleDateString('en-IN'),
          report.projects?.name || 'N/A',
          report.work_completed || 'N/A',
          report.stage || 'N/A',
          (report.cost || 0).toLocaleString('en-IN')
        ]),
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 11 },
        columnStyles: {
          2: { cellWidth: 80 }
        }
      });

      // Page Numbers
      const pageCount = (doc as any).internal.pages.length;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      doc.save(`Construction_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Report downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate report. Please try again.');
    }
  };

  const handleDownloadExcel = () => {
    try {
      const worksheets = {
        Summary: [
          ['Construction Project Status Report'],
          ['Generated on:', new Date().toLocaleDateString()],
          [],
          ['Metric', 'Value'],
          ['Total Spent (₹)', stats.totalSpent],
          ['Total Budget (₹)', stats.totalBudget],
          ['Total Manpower Days', stats.totalManpower],
          ['Delayed Projects', stats.delayedProjects],
          ['Total Reports', reports.length],
        ],
        
        'Project Stages': [
          ['Stage Name', 'Status', 'Progress (%)'],
          ...stages.map(s => [s.name, s.status, s.progress]),
        ],
        
        'Recent Reports': [
          ['Date', 'Project', 'Stage', 'Work Done', 'Manpower', 'Cost (₹)', 'Weather'],
          ...reports.slice(0, 10).map(r => [
            new Date(r.report_date).toLocaleDateString(),
            r.projects?.name || 'N/A',
            r.stage || 'N/A',
            r.work_completed || 'N/A',
            r.manpower || '0',
            r.cost || '0',
            r.weather || 'N/A',
          ]),
        ],
      };

      const wb = XLSX.utils.book_new();
      Object.entries(worksheets).forEach(([name, data]) => {
        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, name);
      });

      XLSX.writeFile(wb, `Construction_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel report downloaded successfully!');
    } catch (error) {
      console.error('Error generating Excel:', error);
      toast.error('Failed to generate Excel report. Please try again.');
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

            {/* This button takes you from a specific project back to the main reports list */}
            {projectId && (
              <Button variant="ghost" onClick={() => navigate("/reports")}>
                <Building2 className="mr-2 h-4 w-4" /> All Reports
              </Button>
            )}

            {/* This is the restored Homepage button */}
            <Button variant="ghost" onClick={() => navigate("/")}>
                <Home className="mr-2 h-4 w-4" />
                Homepage
            </Button>

            {/* This button appears if you are logged in */}
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