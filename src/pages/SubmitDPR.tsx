import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ArrowLeft, Upload, X, Camera, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

/**
 * All stages as in your app
 * Layout/Plan/Drawings stages intentionally include the "Layout/Plan/Drawings - ..." prefix
 */
const allProjectStages = [
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

const executionStagesForUpperFloors = [
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

/**
 * Validation schema. I made manpowerCount optional because for layout stages you don't need it.
 * cost is required-ish but can default to "0" in form defaultValues.
 */
const dprSchema = z.object({
  projectId: z.string().min(1, "Please select a project"),
  date: z.string().min(1, "Please select a date"),
  stage: z.string().min(1, "Please select the current stage"),
  workCompleted: z.string().min(1, "Please describe the work completed"),

  // The rest are now optional (will not block submission)
  weather: z.string().optional(),
  manpowerCount: z.string().optional(),
  machineryUsed: z.string().optional(),
  materialUsed: z.string().optional(),
  safetyIncidents: z.string().optional(),
  remarks: z.string().optional(),
  floor: z.string().optional(),    // no required_error here!
  cost: z.string().optional(),
  laborCost: z.string().optional(),
  materialCost: z.string().optional(),
  equipmentCost: z.string().optional(),
  subcontractorCost: z.string().optional(),
  otherCost: z.string().optional(),
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
  const [stageSelectionView, setStageSelectionView] = useState<"floor" | "stage">("floor");

  // PATCH: Simplify required fields, only main business fields are required
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
      floor: "",
      stage: "",
      cost: "0",
      laborCost: "",
      materialCost: "",
      equipmentCost: "",
      subcontractorCost: "",
      otherCost: "",
    },
  });

  // init
  useEffect(() => {
    const initialize = async () => {
      await checkAuth();
      await fetchProjects();
      setLoading(false);
    };
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) navigate("/auth");
  };

  const fetchProjects = async () => {
    const { data, error } = await supabase.from("projects").select("id, name");
    if (error) toast.error("Could not fetch projects.");
    else setProjects(data || []);
  };

  // photos handling
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setPhotos((prev) => [
            ...prev,
            { file, preview: event.target?.result as string, description: "" },
          ]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removePhoto = (index: number) => setPhotos((prev) => prev.filter((_, i) => i !== index));
  const updatePhotoDescription = (index: number, description: string) =>
    setPhotos((prev) => prev.map((p, i) => (i === index ? { ...p, description } : p)));

  const uploadPhotoToStorage = async (file: File, reportId: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${reportId}_${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("dpr-photos").upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = supabase.storage.from("dpr-photos").getPublicUrl(fileName);
    return { url: publicUrl, name: fileName };
  };

  // Type-safe total calculation
  const calculateTotalCost = useCallback(() => {
    const isLayoutStage = !!form.getValues("stage") && form.getValues("stage").startsWith("Layout/Plan/Drawings");
    const fields: (keyof DPRFormData)[] = isLayoutStage
      ? ["laborCost", "otherCost"]
      : ["laborCost", "materialCost", "equipmentCost", "subcontractorCost", "otherCost"];
    const total = fields.reduce((sum, key) => {
      const raw = form.getValues(key);
      const n = Number(raw || 0);
      return sum + (isNaN(n) ? 0 : n);
    }, 0);
    form.setValue("cost", total.toString(), { shouldValidate: true });
    return total;
  }, [form]);

  // watch cost fields and recalc
  useEffect(() => {
    const subscription = form.watch((_, { name }) => {
      if (
        name &&
        ["laborCost", "materialCost", "equipmentCost", "subcontractorCost", "otherCost"].includes(
          name as string
        )
      ) {
        calculateTotalCost();
      }
    });
    return () => subscription.unsubscribe();
  }, [form, calculateTotalCost]);

  const selectedFloor = form.watch("floor");
  const selectedStage = form.watch("stage");

  // helper: is a layout stage (we check full prefix to be safe)
  const isLayoutStage = !!selectedStage && selectedStage.startsWith("Layout/Plan/Drawings");

  /** SUBMIT HANDLER: called after validation **/
  const onSubmit = async (data: DPRFormData) => {
    console.log("onSubmit called, form data:", data);
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("You must be logged in to submit a report.");
      setLoading(false);
      return;
    }
    try {
      const isLayoutStage = data.stage?.startsWith("Layout/Plan/Drawings");
      // Calculate total per stage
      let total = 0;
      if (isLayoutStage) {
        total = parseFloat(data.laborCost || "0") + parseFloat(data.otherCost || "0");
      } else {
        total =
          parseFloat(data.laborCost || "0") +
          parseFloat(data.materialCost || "0") +
          parseFloat(data.equipmentCost || "0") +
          parseFloat(data.subcontractorCost || "0") +
          parseFloat(data.otherCost || "0");
      }
      // PATCH: Always submit the calculated total as 'cost' DB field
      const payload: any = {
        project_id: data.projectId,
        report_date: data.date,
        stage: data.stage,
        work_completed: data.workCompleted,
        user_id: session.user.id,
        cost: total,
      };
      if (isLayoutStage) {
        payload.labor_cost = parseFloat(data.laborCost || "0"); // Architect Cost
        payload.other_cost = parseFloat(data.otherCost || "0");
      } else {
        payload.labor_cost = parseFloat(data.laborCost || "0");
        payload.material_cost = parseFloat(data.materialCost || "0");
        payload.equipment_cost = parseFloat(data.equipmentCost || "0");
        payload.subcontractor_cost = parseFloat(data.subcontractorCost || "0");
        payload.other_cost = parseFloat(data.otherCost || "0");
      }
      const { data: reportData, error: insertErr } = await supabase
        .from("daily_reports")
        .insert([payload])
        .select()
        .single();
      if (insertErr) throw insertErr;
      // Photos logic unchanged
      if (photos.length > 0) {
        await Promise.all(
          photos.map(async (photo) => {
            const { url, name } = await uploadPhotoToStorage(photo.file, reportData.id);
            await supabase.from("dpr_photos").insert([
              {
                daily_report_id: reportData.id,
                user_id: session.user.id,
                file_name: name,
                file_path: `dpr-photos/${name}`,
                public_url: url,
                description: photo.description,
                file_size: photo.file.size,
                mime_type: photo.file.type,
              }
            ]);
          })
        );
      }
      toast.success("DPR submitted successfully!");
      navigate("/admin");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      toast.error("Error submitting report: " + errorMessage);
      console.error("DPR submit error:", err);
    } finally {
      setLoading(false);
      console.log("Submit loading=false");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );

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
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(
              onSubmit,
              (errors) => {
                window.scrollTo({ top: 0, behavior: 'smooth' }); // highlight errors
                toast.error('Please fill all required fields correctly.');
                console.error('Form validation errors:', errors);
              }
            )}
            className="bg-card rounded-lg p-8 border border-border space-y-6"
          >
            {/* Project */}
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

            {/* Date */}
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

            {/* Stage selection with floor-first view */}
            <FormField
              control={form.control}
              name="stage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Stage *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      if (stageSelectionView === "floor") {
                        form.setValue("floor", value as any);
                        form.setValue("stage", "");
                        setStageSelectionView("stage");
                      } else if (value === "back_to_floor") {
                        setStageSelectionView("floor");
                        form.setValue("stage", "");
                      } else {
                        field.onChange(value);
                      }
                    }}
                    value={stageSelectionView === "floor" ? selectedFloor : field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={stageSelectionView === "floor" ? "First, select a floor..." : "Then, select a stage..."} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stageSelectionView === "floor" ? (
                        <SelectGroup>
                          <SelectLabel>Floors</SelectLabel>
                          <SelectItem value="ground">Ground Floor</SelectItem>
                          <SelectItem value="first">First Floor</SelectItem>
                          <SelectItem value="other">Other Floors</SelectItem>
                        </SelectGroup>
                      ) : (
                        <>
                          <SelectItem value="back_to_floor">← Change Floor</SelectItem>
                          {selectedFloor === "ground" ? (
                            <>
                              <SelectGroup>
                                <SelectLabel>Layout/Plan/Drawings</SelectLabel>
                                {allProjectStages
                                  .filter((s) => s.startsWith("Layout/Plan/Drawings"))
                                  .map((s) => (
                                    <SelectItem key={s} value={s}>
                                      {s.replace("Layout/Plan/Drawings - ", "")}
                                    </SelectItem>
                                  ))}
                              </SelectGroup>
                              <SelectGroup>
                                <SelectLabel>Execution</SelectLabel>
                                {allProjectStages
                                  .filter((s) => !s.startsWith("Layout/Plan/Drawings"))
                                  .map((s) => (
                                    <SelectItem key={s} value={s}>
                                      {s}
                                    </SelectItem>
                                  ))}
                              </SelectGroup>
                            </>
                          ) : (
                            <SelectGroup>
                              <SelectLabel>Execution</SelectLabel>
                              {executionStagesForUpperFloors.map((stage) => (
                                <SelectItem key={stage} value={stage}>
                                  {stage}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cost Breakdown (conditional) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5" />
                  Cost Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {isLayoutStage ? (
                    <>
                      {/* Only Architect Cost and Other Cost for layout stages */}
                      <FormField control={form.control} name="laborCost" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Architect Cost (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="otherCost" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Other Costs (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </>
                  ) : (
                    <>
                      {/* Full breakdown for non-layout stages */}
                      <FormField control={form.control} name="laborCost" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Labor Cost (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="materialCost" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Material Cost (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="equipmentCost" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Equipment Cost (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="subcontractorCost" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subcontractor Cost (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="otherCost" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Other Costs (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </>
                  )}
                  {/* Total cost unchanged */}
                  <div className="space-y-2">
                    <Label>Total Cost (₹)</Label>
                    <div className="p-2 bg-muted rounded-md font-semibold">
                      ₹{Number(form.watch("cost")).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conditionally hide execution-specific fields for layout stages */}
            {!isLayoutStage && (
              <>
                {/* Removed manpowerCount, machineryUsed, materialUsed, safetyIncidents */}
              </>
            )}

            {/* Work Completed (always visible) */}
            <FormField control={form.control} name="workCompleted" render={({ field }) => (
              <FormItem>
                <FormLabel>Work Completed *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe the work completed today" rows={4} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Photos */}
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
                    <span className="text-sm font-medium text-primary hover:text-primary/80">Click to upload photos</span>
                    <span className="text-xs text-muted-foreground block mt-1">PNG, JPG, JPEG up to 10MB each</span>
                  </Label>
                  <Input id="photo-upload" type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </div>

                {photos.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Uploaded Photos ({photos.length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {photos.map((photo, index) => (
                        <div key={index} className="relative border border-border rounded-lg overflow-hidden">
                          <img src={photo.preview} alt={`Upload ${index + 1}`} className="w-full h-32 object-cover" />
                          <Button type="button" variant="destructive" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0" onClick={() => removePhoto(index)}>
                            <X className="h-3 w-3" />
                          </Button>
                          <div className="p-3">
                            <Textarea placeholder="Add description..." value={photo.description} onChange={(e) => updatePhotoDescription(index, e.target.value)} rows={2} className="text-xs" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Remarks */}
            <FormField control={form.control} name="remarks" render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Remarks</FormLabel>
                <FormControl>
                  <Textarea placeholder="Any additional notes" rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Submitting..." : "Submit DPR"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/admin")}>Cancel</Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
};

export default SubmitDPR;
