import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, ArrowLeft, Upload, X, Camera, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const projectStages = [
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

interface Project {
  id: string;
  name: string;
}

interface PhotoFile {
  file: File;
  preview: string;
  description: string;
}

const SubmitDPR = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState({
    projectId: "",
    date: "",
    weather: "",
    manpowerCount: "",
    machineryUsed: "",
    workCompleted: "",
    materialUsed: "",
    safetyIncidents: "",
    remarks: "",
    stage: "",
    cost: "",
    laborCost: "",
    materialCost: "",
    equipmentCost: "",
    subcontractorCost: "",
    otherCost: "",
  });
  const [photos, setPhotos] = useState<PhotoFile[]>([]);

  useEffect(() => {
    const initialize = async () => {
      await checkAuth();
      await fetchProjects();
      setLoading(false);
    };
    initialize();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
    }
  };

  const fetchProjects = async () => {
    const { data, error } = await supabase.from("projects").select("id, name");
    if (error) {
      toast.error("Could not fetch projects.");
    } else {
      setProjects(data || []);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newPhoto: PhotoFile = {
            file,
            preview: event.target?.result as string,
            description: '',
          };
          setPhotos(prev => [...prev, newPhoto]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const updatePhotoDescription = (index: number, description: string) => {
    setPhotos(prev => prev.map((photo, i) => 
      i === index ? { ...photo, description } : photo
    ));
  };

  const uploadPhotoToStorage = async (file: File, reportId: string, description: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${reportId}_${Date.now()}.${fileExt}`;
    const filePath = `dpr-photos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('dpr-photos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('dpr-photos')
      .getPublicUrl(filePath);

    return { url: publicUrl, name: fileName };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      toast.error("You must be logged in to submit a report.");
      setLoading(false);
      return;
    }

    try {
      // Calculate total cost from categories
      const totalCost = parseFloat(formData.laborCost || "0") +
                       parseFloat(formData.materialCost || "0") +
                       parseFloat(formData.equipmentCost || "0") +
                       parseFloat(formData.subcontractorCost || "0") +
                       parseFloat(formData.otherCost || "0");

      const payload = {
        project_id: formData.projectId,
        report_date: formData.date,
        weather: formData.weather,
        manpower: parseInt(formData.manpowerCount || "0", 10),
        work_completed: formData.workCompleted,
        cost: totalCost,
        stage: formData.stage,
        labor_cost: parseFloat(formData.laborCost || "0"),
        material_cost: parseFloat(formData.materialCost || "0"),
        equipment_cost: parseFloat(formData.equipmentCost || "0"),
        subcontractor_cost: parseFloat(formData.subcontractorCost || "0"),
        other_cost: parseFloat(formData.otherCost || "0"),
        user_id: session.user.id,
      };

      const { data: reportData, error: insertErr } = await supabase
        .from("daily_reports")
        .insert([payload])
        .select()
        .single();

      if (insertErr) throw insertErr;

      // Upload photos if any
      if (photos.length > 0) {
        const photoPromises = photos.map(async (photo) => {
          const { url, name } = await uploadPhotoToStorage(
            photo.file, 
            reportData.id, 
            photo.description
          );
          
          return supabase.from("dpr_photos").insert([{
            daily_report_id: reportData.id,
            photo_url: url,
            photo_name: name,
            photo_description: photo.description,
            user_id: session.user.id,
          }]);
        });

        await Promise.all(photoPromises);
      }

      toast.success("DPR submitted successfully!");
      navigate("/admin");
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      toast.error("Error submitting report: " + errorMessage);
    } finally {
      setLoading(false);
    }
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
            <h1 className="text-2xl font-bold text-foreground">
              Submit Daily Progress Report
            </h1>
          </div>
          <Button variant="ghost" onClick={() => navigate("/admin")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <form
          onSubmit={handleSubmit}
          className="bg-card rounded-lg p-8 border border-border space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor="projectId">Project Name *</Label>
            <Select
              value={formData.projectId}
              onValueChange={(value) => handleChange("projectId", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Label htmlFor="stage">Project Stage *</Label>
            <Select
              value={formData.stage}
              onValueChange={(value) => handleChange("stage", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select current project stage" />
              </SelectTrigger>
              <SelectContent>
                {projectStages.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cost Categories Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cost Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="laborCost">Labor Cost (₹)</Label>
                  <Input
                    id="laborCost"
                    type="number"
                    step="0.01"
                    value={formData.laborCost}
                    onChange={(e) => handleChange("laborCost", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="materialCost">Material Cost (₹)</Label>
                  <Input
                    id="materialCost"
                    type="number"
                    step="0.01"
                    value={formData.materialCost}
                    onChange={(e) => handleChange("materialCost", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipmentCost">Equipment Cost (₹)</Label>
                  <Input
                    id="equipmentCost"
                    type="number"
                    step="0.01"
                    value={formData.equipmentCost}
                    onChange={(e) => handleChange("equipmentCost", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subcontractorCost">Subcontractor Cost (₹)</Label>
                  <Input
                    id="subcontractorCost"
                    type="number"
                    step="0.01"
                    value={formData.subcontractorCost}
                    onChange={(e) => handleChange("subcontractorCost", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otherCost">Other Costs (₹)</Label>
                  <Input
                    id="otherCost"
                    type="number"
                    step="0.01"
                    value={formData.otherCost}
                    onChange={(e) => handleChange("otherCost", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Cost (₹)</Label>
                  <div className="p-2 bg-muted rounded-md font-semibold">
                    ₹{(
                      parseFloat(formData.laborCost || "0") +
                      parseFloat(formData.materialCost || "0") +
                      parseFloat(formData.equipmentCost || "0") +
                      parseFloat(formData.subcontractorCost || "0") +
                      parseFloat(formData.otherCost || "0")
                    ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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

          {/* Photo Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Progress Photos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <Label htmlFor="photo-upload" className="cursor-pointer">
                  <span className="text-sm font-medium text-primary hover:text-primary/80">
                    Click to upload photos
                  </span>
                  <span className="text-xs text-muted-foreground block mt-1">
                    PNG, JPG, JPEG up to 10MB each
                  </span>
                </Label>
                <Input
                  id="photo-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              {photos.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Uploaded Photos ({photos.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative border border-border rounded-lg overflow-hidden">
                        <img
                          src={photo.preview}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-32 object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 h-6 w-6 p-0"
                          onClick={() => removePhoto(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <div className="p-3">
                          <Textarea
                            placeholder="Add description for this photo..."
                            value={photo.description}
                            onChange={(e) => updatePhotoDescription(index, e.target.value)}
                            rows={2}
                            className="text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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

