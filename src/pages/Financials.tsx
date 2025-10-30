import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  ArrowLeft, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  PieChart,
  BarChart3,
  Calendar,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

interface Project {
  id: string;
  name: string;
  start_date: string;
  target_end_date?: string;
  total_cost?: number;
  created_at: string;
}

interface DailyReport {
  id: string;
  project_id: string | null;
  report_date: string;
  cost: number | null;
  stage: string | null;
  projects: {
    name: string;
  } | null;
}

interface CostCategory {
  category: string;
  amount: number;
  color: string;
}

const costCategories: CostCategory[] = [
  { category: "Labor", amount: 0, color: "#8884d8" },
  { category: "Materials", amount: 0, color: "#82ca9d" },
  { category: "Equipment", amount: 0, color: "#ffc658" },
  { category: "Subcontractors", amount: 0, color: "#ff7300" },
  { category: "Permits & Fees", amount: 0, color: "#00ff00" },
  { category: "Other", amount: 0, color: "#ff00ff" }
];

const Financials = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("30");

  useEffect(() => {
    const initialize = async () => {
      await checkAuth();
      await fetchData();
      setLoading(false);
    };
    initialize();
  }, [selectedProject, timeRange]);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
    }
  };

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (projectsError) throw projectsError;

      // Fetch daily reports
      let reportsQuery = supabase
        .from("daily_reports")
        .select("*, projects(name)")
        .eq("user_id", user.id)
        .order("report_date", { ascending: false });

      if (selectedProject !== "all") {
        reportsQuery = reportsQuery.eq("project_id", selectedProject);
      }

      // Filter by time range
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));
      reportsQuery = reportsQuery.gte("report_date", daysAgo.toISOString().split('T')[0]);

      const { data: reportsData, error: reportsError } = await reportsQuery;

      if (reportsError) throw reportsError;

      setProjects(projectsData || []);
      setReports(reportsData || []);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch financial data");
    }
  };

  // Calculate financial metrics
  const totalBudget = projects.reduce((sum, project) => sum + (project.total_cost || 0), 0);
  const totalSpent = reports.reduce((sum, report) => sum + (report.cost || 0), 0);
  const remainingBudget = totalBudget - totalSpent;
  const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Calculate cost trends
  const costTrendData = reports
    .reduce((acc, report) => {
      const date = new Date(report.report_date).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { date, cost: 0, cumulativeCost: 0 };
      }
      acc[date].cost += report.cost || 0;
      return acc;
    }, {} as Record<string, { date: string; cost: number; cumulativeCost: number }>);

  const costTrendArray = Object.values(costTrendData)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((item, index, array) => ({
      ...item,
      cumulativeCost: array.slice(0, index + 1).reduce((sum, curr) => sum + curr.cost, 0)
    }));

  // Calculate project-wise spending
  const projectSpending = projects.map(project => {
    const projectReports = reports.filter(report => report.project_id === project.id);
    const spent = projectReports.reduce((sum, report) => sum + (report.cost || 0), 0);
    return {
      name: project.name,
      budget: project.total_cost || 0,
      spent: spent,
      remaining: (project.total_cost || 0) - spent,
      utilization: project.total_cost ? (spent / project.total_cost) * 100 : 0
    };
  });

  // Calculate cost categories (simplified - in real app, you'd have category data)
  const categoryData = costCategories.map(category => ({
    ...category,
    amount: Math.random() * totalSpent * 0.3 // Placeholder - replace with actual category data
  }));

  // Calculate monthly spending
  const monthlyData = reports.reduce((acc, report) => {
    const month = new Date(report.report_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (!acc[month]) {
      acc[month] = 0;
    }
    acc[month] += report.cost || 0;
    return acc;
  }, {} as Record<string, number>);

  const monthlyArray = Object.entries(monthlyData).map(([month, cost]) => ({
    month,
    cost
  }));

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
              <DollarSign className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Financial Dashboard
            </h1>
          </div>
          <Button variant="ghost" onClick={() => navigate("/admin")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalBudget.toLocaleString('en-IN')}</div>
              <p className="text-xs text-muted-foreground">
                Across {projects.length} projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalSpent.toLocaleString('en-IN')}</div>
              <p className="text-xs text-muted-foreground">
                {budgetUtilization.toFixed(1)}% of budget used
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${remainingBudget < 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₹{remainingBudget.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-muted-foreground">
                {remainingBudget < 0 ? 'Over budget' : 'Available'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{budgetUtilization.toFixed(1)}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${budgetUtilization > 90 ? 'bg-red-500' : budgetUtilization > 75 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex gap-4">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background"
            >
              <option value="all">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Budget vs Actual</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={projectSpending}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, '']} />
                      <Legend />
                      <Bar dataKey="budget" fill="#8884d8" name="Budget" />
                      <Bar dataKey="spent" fill="#82ca9d" name="Spent" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cost Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                        nameKey="category"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`₹${value.toLocaleString('en-IN')}`, name]} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Spending Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={costTrendArray}>
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
                  <CardTitle>Cumulative Spending</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={costTrendArray}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, '']} />
                      <Line type="monotone" dataKey="cumulativeCost" stroke="#82ca9d" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <div className="space-y-4">
              {projectSpending.map((project, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <Badge 
                        variant={project.utilization > 90 ? "destructive" : project.utilization > 75 ? "secondary" : "default"}
                      >
                        {project.utilization.toFixed(1)}% utilized
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Budget</p>
                        <p className="text-lg font-semibold">₹{project.budget.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Spent</p>
                        <p className="text-lg font-semibold">₹{project.spent.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Remaining</p>
                        <p className={`text-lg font-semibold ${project.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ₹{project.remaining.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${project.utilization > 90 ? 'bg-red-500' : project.utilization > 75 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(project.utilization, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryData.map((category, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      ></div>
                      {category.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{category.amount.toLocaleString('en-IN')}</div>
                    <p className="text-sm text-muted-foreground">
                      {((category.amount / totalSpent) * 100).toFixed(1)}% of total spending
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Financials;
