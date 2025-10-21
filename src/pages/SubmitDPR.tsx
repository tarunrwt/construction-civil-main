import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SubmitDPR = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    projectName: "",
    date: "",
    weather: "",
    manpowerCount: "",
    machineryUsed: "",
    workCompleted: "",
    materialUsed: "",
    safetyIncidents: "",
    remarks: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate form
    if (!formData.projectName || !formData.date || !formData.workCompleted) {
      toast.error("Please fill in all required fields");
      return;
    }

    toast.success("DPR submitted successfully!");
    console.log("DPR Data:", formData);
    navigate("/admin");
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
            <h1 className="text-2xl font-bold text-foreground">Submit Daily Progress Report</h1>
          </div>
          <Button variant="ghost" onClick={() => navigate("/admin")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <form onSubmit={handleSubmit} className="bg-card rounded-lg p-8 border border-border space-y-6">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name *</Label>
            <Input
              id="projectName"
              value={formData.projectName}
              onChange={(e) => handleChange("projectName", e.target.value)}
              placeholder="Enter project name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleChange("date", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weather">Weather Conditions</Label>
            <Select
              value={formData.weather}
              onValueChange={(value) => handleChange("weather", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select weather" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sunny">Sunny</SelectItem>
                <SelectItem value="cloudy">Cloudy</SelectItem>
                <SelectItem value="rainy">Rainy</SelectItem>
                <SelectItem value="stormy">Stormy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manpowerCount">Manpower Count</Label>
            <Input
              id="manpowerCount"
              type="number"
              value={formData.manpowerCount}
              onChange={(e) => handleChange("manpowerCount", e.target.value)}
              placeholder="Enter number of workers"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="machineryUsed">Machinery Used</Label>
            <Input
              id="machineryUsed"
              value={formData.machineryUsed}
              onChange={(e) => handleChange("machineryUsed", e.target.value)}
              placeholder="e.g., Crane, Excavator, Mixer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workCompleted">Work Completed *</Label>
            <Textarea
              id="workCompleted"
              value={formData.workCompleted}
              onChange={(e) => handleChange("workCompleted", e.target.value)}
              placeholder="Describe the work completed today"
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="materialUsed">Materials Used</Label>
            <Textarea
              id="materialUsed"
              value={formData.materialUsed}
              onChange={(e) => handleChange("materialUsed", e.target.value)}
              placeholder="List materials used"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="safetyIncidents">Safety Incidents</Label>
            <Textarea
              id="safetyIncidents"
              value={formData.safetyIncidents}
              onChange={(e) => handleChange("safetyIncidents", e.target.value)}
              placeholder="Report any safety incidents"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Additional Remarks</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => handleChange("remarks", e.target.value)}
              placeholder="Any additional notes"
              rows={3}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1">
              Submit DPR
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/admin")}>
              Cancel
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default SubmitDPR;
