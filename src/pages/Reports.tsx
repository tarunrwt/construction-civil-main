import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Building2, ArrowLeft, Home, DollarSign, Users, FileText, TrendingUp, Clock, Calendar, Download, ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { differenceInDays, parseISO } from "date-fns";
import PhotoGallery from "@/components/PhotoGallery";
import {
  LineChart,
  Line,
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
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter
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
  averageDailyCost: number;
  totalLaborCost: number;
  totalMaterialCost: number;
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
  const [projects, setProjects] = useState<Project[]>([]);
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
      let reportsQuery = supabase.from('daily_reports').select('*, projects(name)');
      reportsQuery = reportsQuery.eq('user_id', user.id).order('report_date', { ascending: false });

      let projectsQuery = supabase.from('projects').select('*');
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
      setProjects(projectsData);
      calculateStats(reportsData, projectsData);
      updateStageProgress(reportsData, projectsData, reportsData.slice().reverse());
    } catch (err: unknown) {
      console.error('Error fetching data:', err);
    }
  };

  const calculateStats = (reportsData: DailyReport[], projectsData: Project[]) => {
    const totalSpent = reportsData.reduce((sum, report) => sum + (report.cost || 0), 0);
    const totalBudget = projectsData.reduce((sum, project) => sum + (project.total_cost || 0), 0);
    const totalManpower = reportsData.reduce((sum, report) => sum + (report.manpower || 0), 0);
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

  const updateStageProgress = (reportsData: DailyReport[], projectsData: Project[], reportsAsc: DailyReport[]) => {
    const latestReport = reportsData.length > 0 ? reportsData[0] : null;
    const currentStage = latestReport?.stage;

    if (!currentStage) {
      setStages(STAGE_LIST.map(name => ({ name, status: "Not Started", progress: 0 })));
      return;
    }

    const currentStageIndex = STAGE_LIST.indexOf(currentStage);

    // Dynamic progress for single-project view
    if (projectId && projectsData.length > 0) {
        const project = projectsData[0];
        if (!project.start_date || !project.target_end_date) return;

        const totalDuration = differenceInDays(parseISO(project.target_end_date), parseISO(project.start_date));
        const durationPerStage = totalDuration / (STAGE_LIST.length - 1);

        const updatedStages = STAGE_LIST.map((name, index) => {
            if (index < currentStageIndex) return { name, status: "Completed", progress: 100 };
            if (index > currentStageIndex) return { name, status: "Not Started", progress: 0 };

            // Logic for the current stage
            const firstReportForCurrentStage = reportsAsc.find(r => r.stage === name);
            const stageStartDate = firstReportForCurrentStage ? parseISO(firstReportForCurrentStage.report_date) : parseISO(project.start_date);
            const daysElapsedInStage = differenceInDays(new Date(), stageStartDate);

            let progress = Math.min(99, Math.max(0, (daysElapsedInStage / durationPerStage) * 100));
            if (currentStage === "Completed") progress = 100;

            return { name, status: currentStage === "Completed" ? "Completed" : "In Progress", progress: Math.round(progress) };
        });
        setStages(updatedStages);
    } else { // Fallback for overall view
        const updatedStages = STAGE_LIST.map((name, index) => {
          if (index < currentStageIndex) return { name, status: "Completed", progress: 100 };
          if (index === currentStageIndex) return { name, status: "In Progress", progress: 50 };
          return { name, status: "Not Started", progress: 0 };
        });
        setStages(updatedStages);
    }
  };

  const handleDownloadPdf = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const today = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      // Professional Header with Company Logo Area
      doc.setFillColor(41, 128, 185);
      doc.rect(0, 0, pageWidth, 50, 'F');

      // White header text with better styling
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('CONSTRUCTION PROJECT REPORT', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Comprehensive Project Analysis & Progress Tracking', pageWidth / 2, 35, { align: 'center' });

      // Reset to black text
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report Generated: ${today}`, 15, 65);
      doc.text(`Generated by: Construction Management System`, pageWidth - 15, 65, { align: 'right' });

      let yPosition = 80;

      // Executive Summary Box
      doc.setFillColor(240, 248, 255);
      doc.rect(10, yPosition - 5, pageWidth - 20, 40, 'F');
      doc.setDrawColor(41, 128, 185);
      doc.rect(10, yPosition - 5, pageWidth - 20, 40, 'S');

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(41, 128, 185);
      doc.text('EXECUTIVE SUMMARY', 15, yPosition);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(`• Total Projects: ${projects.length}`, 15, yPosition + 8);
      doc.text(`• Total Progress Reports: ${reports.length}`, 15, yPosition + 16);
      doc.text(`• Total Photos Captured: ${reports.reduce((acc, r) => acc + (r.photos?.length || 0), 0)}`, 15, yPosition + 24);
      doc.text(`• Total Manpower Days: ${stats.totalManpower}`, 15, yPosition + 32);

      yPosition += 50;

      // Financial Overview with Enhanced Styling
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(41, 128, 185);
      doc.text('FINANCIAL OVERVIEW', 15, yPosition);

      autoTable(doc, {
        startY: yPosition + 8,
        head: [['Financial Metric', 'Amount (₹)', 'Percentage']],
        body: [
          ['Total Budget', (stats.totalBudget || 0).toLocaleString('en-IN'), '100%'],
          ['Total Spent', (stats.totalSpent || 0).toLocaleString('en-IN'), `${stats.totalBudget ? ((stats.totalSpent || 0) / stats.totalBudget * 100).toFixed(1) : '0'}%`],
          ['Remaining Budget', ((stats.totalBudget || 0) - (stats.totalSpent || 0)).toLocaleString('en-IN'), `${stats.totalBudget ? (((stats.totalBudget - (stats.totalSpent || 0)) / stats.totalBudget) * 100).toFixed(1) : '0'}%`],
          ['Average Daily Cost', (stats.averageDailyCost || 0).toLocaleString('en-IN'), '-'],
          ['Total Labor Cost', (stats.totalLaborCost || 0).toLocaleString('en-IN'), `${stats.totalSpent ? (((stats.totalLaborCost || 0) / stats.totalSpent) * 100).toFixed(1) : '0'}%`],
          ['Total Material Cost', (stats.totalMaterialCost || 0).toLocaleString('en-IN'), `${stats.totalSpent ? (((stats.totalMaterialCost || 0) / stats.totalSpent) * 100).toFixed(1) : '0'}%`]
        ],
        headStyles: { 
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 10,
          cellPadding: 4
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        }
      });

      // Construction Progress with Enhanced Details
      yPosition = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(41, 128, 185);
      doc.text('CONSTRUCTION PROGRESS', 15, yPosition);

      autoTable(doc, {
        startY: yPosition + 8,
        head: [['Stage', 'Status', 'Progress (%)', 'Description']],
        body: stages.map(stage => [
          stage.name,
          stage.status,
          `${stage.progress}%`,
          stage.description || 'No description available'
        ]),
        headStyles: { 
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 10,
          cellPadding: 4
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        }
      });

      // Recent Daily Reports
      yPosition = doc.lastAutoTable.finalY + 20;
      
      // Check if we need a new page
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(41, 128, 185);
      doc.text('RECENT DAILY REPORTS', 15, yPosition);

      autoTable(doc, {
        startY: yPosition + 8,
        head: [['Date', 'Project', 'Work Completed', 'Manpower', 'Cost (₹)', 'Weather']],
        body: reports.slice(0, 15).map(report => [
          new Date(report.report_date).toLocaleDateString('en-IN'),
          projects.find(p => p.id === report.project_id)?.name || 'Unknown',
          report.work_completed || 'N/A',
          report.manpower || '0',
          report.cost || '0',
          report.weather || 'N/A'
        ]),
        headStyles: { 
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 9,
          cellPadding: 3
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        }
      });

      // Project Details
      yPosition = doc.lastAutoTable.finalY + 20;
      
      // Check if we need a new page
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(41, 128, 185);
      doc.text('PROJECT DETAILS', 15, yPosition);

      autoTable(doc, {
        startY: yPosition + 8,
        head: [['Project Name', 'Description', 'Status', 'Created Date']],
        body: projects.map(project => [
          project.name,
          project.description || 'No description',
          'Active',
          new Date(project.created_at).toLocaleDateString('en-IN')
        ]),
        headStyles: { 
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 10,
          cellPadding: 4
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        }
      });

      // Footer
      const footerY = pageHeight - 20;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(128, 128, 128);
      doc.text('This report was generated by Construction Management System', pageWidth / 2, footerY, { align: 'center' });
      doc.text(`Page 1 of 1 • Generated on ${today}`, pageWidth / 2, footerY + 8, { align: 'center' });

      // Download the PDF
      const fileName = `Construction_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      toast.success('Professional PDF report downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF report. Please try again.');
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
          ['Delayed Projects', (stats.delayedProjects || 0)],
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
              <div className="text-2xl font-bold">₹{(stats.totalSpent || 0).toLocaleString('en-IN')}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(stats.totalBudget || 0).toLocaleString('en-IN')}</div>
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

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="charts">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="stages">Stages</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cost Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={reports.slice().reverse().map((report, index) => ({
                      date: new Date(report.report_date).toLocaleDateString(),
                      cost: report.cost || 0,
                      cumulative: reports.slice(0, index + 1).reduce((sum, r) => sum + (r.cost || 0), 0)
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, '']} />
                      <Area type="monotone" dataKey="cost" stroke="#8884d8" fill="#8884d8" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Manpower vs Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart data={reports.map(report => ({
                      manpower: report.manpower || 0,
                      cost: report.cost || 0,
                      date: new Date(report.report_date).toLocaleDateString()
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="manpower" name="Manpower" />
                      <YAxis dataKey="cost" name="Cost (₹)" />
                      <Tooltip formatter={(value, name) => [
                        name === 'cost' ? `₹${value.toLocaleString('en-IN')}` : value,
                        name === 'cost' ? 'Cost' : 'Manpower'
                      ]} />
                      <Scatter dataKey="cost" fill="#8884d8" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="charts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Spending</CardTitle>
                </CardHeader>
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
                      <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, '']} />
                      <Bar dataKey="cost" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weather Impact</CardTitle>
                </CardHeader>
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
                        ).map(([weather, count]) => ({ weather, count }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ weather, percent }) => `${weather} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {Object.entries(
                          reports.reduce((acc, report) => {
                            const weather = report.weather || 'Unknown';
                            acc[weather] = (acc[weather] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
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
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="space-y-6">
            <div className="bg-card rounded-lg p-6 border border-border">
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Progress Photos
              </h2>
              <PhotoGallery showAll={true} />
            </div>
          </TabsContent>

          {/* Stages Tab */}
          <TabsContent value="stages" className="space-y-6">
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