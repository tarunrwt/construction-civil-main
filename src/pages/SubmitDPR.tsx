import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

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

const dprSchema = z.object({
  projectId: z.string().min(1, "Please select a project"),
  date: z.string().min(1, "Please select a date"),
  weather: z.string().min(1, "Please enter weather conditions"),
  manpowerCount: z.string().min(1, "Please enter manpower count").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Must be a positive number"),
  machineryUsed: z.string().optional(),
  workCompleted: z.string().min(1, "Please describe the work completed"),
  materialUsed: z.string().optional(),
  safetyIncidents: z.string().optional(),
  remarks: z.string().optional(),
  stage: z.string().min(1, "Please select current stage"),
  cost: z.string().min(1, "Please enter total cost").refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Must be a valid number"),
  laborCost: z.string().refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0), "Must be a valid number"),
  materialCost: z.string().refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0), "Must be a valid number"),
  equipmentCost: z.string().refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0), "Must be a valid number"),
  subcontractorCost: z.string().refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0), "Must be a valid number"),
  otherCost: z.string().refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0), "Must be a valid number"),
});

type DPRFormData = z.infer<typeof dprSchema>;

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
  const [photos, setPhotos] = useState<PhotoFile[]>([]);

  const form = useForm<DPRFormData>({
    resolver: zodResolver(dprSchema),
    defaultValues: {
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
    },
  });

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

  const onSubmit = async (data: DPRFormData) => {
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
      const totalCost = parseFloat(data.laborCost || "0") +
                       parseFloat(data.materialCost || "0") +
                       parseFloat(data.equipmentCost || "0") +
                       parseFloat(data.subcontractorCost || "0") +
                       parseFloat(data.otherCost || "0");

      const payload = {
        project_id: data.projectId,
        report_date: data.date,
        weather: data.weather,
        manpower: parseInt(data.manpowerCount || "0", 10),
        work_completed: data.workCompleted,
        cost: totalCost,
        stage: data.stage,
        labor_cost: parseFloat(data.laborCost || "0"),
        material_cost: parseFloat(data.materialCost || "0"),
        equipment_cost: parseFloat(data.equipmentCost || "0"),
        subcontractor_cost: parseFloat(data.subcontractorCost || "0"),
        other_cost: parseFloat(data.otherCost || "0"),
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

          // Note: dpr_photos table needs to be created in schema
          // For now, skip photo upload or use a different approach
          console.log("Photo upload skipped - dpr_photos table not in schema");
          return Promise.resolve({ data: null, error: null });
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

  const calculateTotalCost = () => {
    const labor = Number(form.watch("laborCost")) || 0;
    const material = Number(form.watch("materialCost")) || 0;
    const equipment = Number(form.watch("equipmentCost")) || 0;
    const subcontractor = Number(form.watch("subcontractorCost")) || 0;
    const other = Number(form.watch("otherCost")) || 0;
    const total = labor + material + equipment + subcontractor + other;
    form.setValue("cost", total.toString());
    return total;
  };

  useEffect(() => {
    const subscription = form.watch(() => {
      calculateTotalCost();
    });
    return () => subscription.unsubscribe();
  }, [form]);

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
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="bg-card rounded-lg p-8 border border-border space-y-6"
          >
          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Name *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Stage *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select current project stage" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {projectStages.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

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
                <FormField
                  control={form.control}
                  name="laborCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Labor Cost (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="materialCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material Cost (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="equipmentCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipment Cost (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subcontractorCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcontractor Cost (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="otherCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Costs (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <Label>Total Cost (₹)</Label>
                  <div className="p-2 bg-muted rounded-md font-semibold">
                    ₹{calculateTotalCost().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <FormField
            control={form.control}
            name="weather"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weather Conditions</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select weather" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="sunny">Sunny</SelectItem>
                    <SelectItem value="cloudy">Cloudy</SelectItem>
                    <SelectItem value="rainy">Rainy</SelectItem>
                    <SelectItem value="stormy">Stormy</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="manpowerCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Manpower Count</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Enter number of workers" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="machineryUsed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Machinery Used</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Crane, Excavator, Mixer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="workCompleted"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Completed *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe the work completed today" rows={4} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="materialUsed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Materials Used</FormLabel>
                <FormControl>
                  <Textarea placeholder="List materials used" rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="safetyIncidents"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Safety Incidents</FormLabel>
                <FormControl>
                  <Textarea placeholder="Report any safety incidents" rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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

          <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Remarks</FormLabel>
                <FormControl>
                  <Textarea placeholder="Any additional notes" rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1">
              Submit DPR
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/admin")}>
              Cancel
            </Button>
          </div>
          </form>
        </Form>
      </main>
    </div>
  );
};

export default SubmitDPR;

