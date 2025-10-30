import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Building2, Package, DollarSign, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Header from "@/components/Header";

const Admin = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [lastSignIn, setLastSignIn] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUserEmail(session.user.email || "");
    setUserId(session.user.id);
    setLastSignIn(new Date(session.user.last_sign_in_at || "").toLocaleString());
    setLoading(false);
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
      <Header title="Admin Dashboard" />

      <main className="container mx-auto px-4 py-8">
        <div className="bg-card rounded-lg p-8 border border-border mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Welcome, {userEmail}</h2>
          <p className="text-muted-foreground">Manage your construction projects</p>

          <div className="mt-6 space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">User ID: </span>
              <span className="text-sm font-mono text-foreground">{userId}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Last Sign In: </span>
              <span className="text-sm text-foreground">{lastSignIn}</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          <div className="bg-card rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Create Project</h3>
            <p className="text-muted-foreground mb-4">
              Create and manage your construction projects
            </p>
            <Button onClick={() => navigate("/projects")}>Create Project</Button>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Submit Daily Report</h3>
            <p className="text-muted-foreground mb-4">
              Submit your Daily Progress Report (DPR) for the construction project
            </p>
            <Button onClick={() => navigate("/submit-dpr")}>Submit DPR</Button>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">View Reports</h3>
            <p className="text-muted-foreground mb-4">
              View all submitted DPRs and project analytics
            </p>
            <Button onClick={() => navigate("/reports")}>View Reports</Button>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Materials & Inventory</h3>
            <p className="text-muted-foreground mb-4">
              Track materials, inventory levels, and usage
            </p>
            <Button onClick={() => navigate("/materials")}>
              <Package className="mr-2 h-4 w-4" />
              Manage Materials
            </Button>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Financial Dashboard</h3>
            <p className="text-muted-foreground mb-4">
              Advanced financial analysis and budgeting
            </p>
            <Button onClick={() => navigate("/financials")}>
              <DollarSign className="mr-2 h-4 w-4" />
              View Financials
            </Button>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">User Management</h3>
            <p className="text-muted-foreground mb-4">
              Manage user roles and project assignments
            </p>
            <Button onClick={() => navigate("/users")}>
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;