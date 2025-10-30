import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Building2, 
  ArrowLeft, 
  Plus, 
  Package, 
  TrendingDown, 
  AlertTriangle,
  ShoppingCart,
  BarChart3,
  Search,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Material {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  cost_per_unit: number;
  supplier_name: string;
  supplier_contact: string;
  min_stock_level: number;
  current_stock: number;
  created_at: string;
}

interface MaterialUsage {
  id: string;
  material_id: string;
  project_id: string;
  quantity_used: number;
  usage_date: string;
  notes: string;
  materials: Material;
  projects: { name: string };
}

interface MaterialPurchase {
  id: string;
  material_id: string;
  quantity_purchased: number;
  cost_per_unit: number;
  total_cost: number;
  purchase_date: string;
  supplier_name: string;
  invoice_number: string;
  notes: string;
  materials: Material;
}

const materialCategories = [
  "Cement & Concrete",
  "Steel & Reinforcement",
  "Bricks & Blocks",
  "Sand & Aggregates",
  "Wood & Timber",
  "Electrical",
  "Plumbing",
  "Paint & Finishes",
  "Tools & Equipment",
  "Safety Equipment",
  "Soil and Earthwork",
  "Doors & Windows (Joinery / Fixtures)",
  "Flooring & Tiles",
  "Other"
];

const units = [
  "kg", "tons", "pieces", "cubic meters", "square meters", 
  "liters", "bags", "rolls", "sheets", "meters"
];

const MaterialsInventory = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialUsage, setMaterialUsage] = useState<MaterialUsage[]>([]);
  const [materialPurchases, setMaterialPurchases] = useState<MaterialPurchase[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [lowStockMaterials, setLowStockMaterials] = useState<Material[]>([]);

  const [newMaterial, setNewMaterial] = useState({
    name: "",
    description: "",
    category: "",
    unit: "",
    cost_per_unit: "",
    supplier_name: "",
    supplier_contact: "",
    min_stock_level: "",
    current_stock: "",
  });

  const [newUsage, setNewUsage] = useState({
    material_id: "",
    project_id: "",
    quantity_used: "",
    usage_date: "",
    notes: "",
  });

  const [newPurchase, setNewPurchase] = useState({
    material_id: "",
    quantity_purchased: "",
    cost_per_unit: "",
    purchase_date: "",
    supplier_name: "",
    invoice_number: "",
    notes: "",
  });

  useEffect(() => {
    const initialize = async () => {
      await checkAuth();
      await fetchData();
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

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch materials
      const { data: materialsData, error: materialsError } = await supabase
        .from("materials")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (materialsError) throw materialsError;

      // Fetch material usage
      const { data: usageData, error: usageError } = await supabase
        .from("material_usage")
        .select(`
          *,
          materials(*),
          projects(name)
        `)
        .eq("user_id", user.id)
        .order("usage_date", { ascending: false });

      if (usageError) throw usageError;

      // Fetch material purchases
      const { data: purchasesData, error: purchasesError } = await supabase
        .from("material_purchases")
        .select(`
          *,
          materials(*)
        `)
        .eq("user_id", user.id)
        .order("purchase_date", { ascending: false });

      if (purchasesError) throw purchasesError;

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("id, name")
        .eq("user_id", user.id);

      if (projectsError) throw projectsError;

      setMaterials((materialsData || []) as unknown as Material[]);
      setMaterialUsage((usageData || []) as unknown as MaterialUsage[]);
      setMaterialPurchases((purchasesData || []) as unknown as MaterialPurchase[]);
      setProjects(projectsData || []);

      // Check for low stock materials
      const lowStock = ((materialsData || []) as unknown as Material[]).filter(
        (material) => (material.current_stock || 0) <= (material.min_stock_level || 0)
      );
      setLowStockMaterials(lowStock);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch materials data");
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const payload = {
        ...newMaterial,
        cost_per_unit: parseFloat(newMaterial.cost_per_unit),
        min_stock_level: parseInt(newMaterial.min_stock_level),
        current_stock: parseInt(newMaterial.current_stock),
        user_id: user.id,
      };

      const { error } = await supabase.from("materials").insert([payload]);

      if (error) throw error;

      toast.success("Material added successfully!");
      setNewMaterial({
        name: "",
        description: "",
        category: "",
        unit: "",
        cost_per_unit: "",
        supplier_name: "",
        supplier_contact: "",
        min_stock_level: "",
        current_stock: "",
      });
      await fetchData();
    } catch (error) {
      console.error("Error adding material:", error);
      toast.error("Failed to add material");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const payload = {
        ...newUsage,
        quantity_used: parseFloat(newUsage.quantity_used),
        user_id: user.id,
      };

      const { error } = await supabase.from("material_usage").insert([payload]);

      if (error) throw error;

      toast.success("Material usage recorded!");
      setNewUsage({
        material_id: "",
        project_id: "",
        quantity_used: "",
        usage_date: "",
        notes: "",
      });
      await fetchData();
    } catch (error) {
      console.error("Error recording usage:", error);
      toast.error("Failed to record material usage");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const quantity = parseFloat(newPurchase.quantity_purchased);
      const costPerUnit = parseFloat(newPurchase.cost_per_unit);
      const totalCost = quantity * costPerUnit;

      const payload = {
        ...newPurchase,
        quantity_purchased: quantity,
        cost_per_unit: costPerUnit,
        total_cost: totalCost,
        user_id: user.id,
      };

      const { error } = await supabase.from("material_purchases").insert([payload]);

      if (error) throw error;

      toast.success("Material purchase recorded!");
      setNewPurchase({
        material_id: "",
        quantity_purchased: "",
        cost_per_unit: "",
        purchase_date: "",
        supplier_name: "",
        invoice_number: "",
        notes: "",
      });
      await fetchData();
    } catch (error) {
      console.error("Error recording purchase:", error);
      toast.error("Failed to record material purchase");
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesCategory = false;
    if (selectedCategory === "all") {
      matchesCategory = true;
    } else if (selectedCategory === "low-stock") {
      matchesCategory = material.current_stock <= material.min_stock_level;
    } else {
      matchesCategory = material.category === selectedCategory;
    }
    
    return matchesSearch && matchesCategory;
  });

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
              <Package className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Materials & Inventory
            </h1>
          </div>
          <Button variant="ghost" onClick={() => navigate("/admin")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Low Stock Alert */}
        {lowStockMaterials.length > 0 && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="flex items-center justify-between">
                <div>
                  <strong>Low Stock Alert:</strong> {lowStockMaterials.length} material(s) are below minimum stock level.
                  <Button 
                    variant="link" 
                    className="text-orange-600 p-0 h-auto ml-2"
                    onClick={() => setSelectedCategory("low-stock")}
                  >
                    View Details
                  </Button>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-orange-600 hover:text-orange-700"
                  onClick={() => setLowStockMaterials([])}
                >
                  Dismiss
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="materials" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Materials Tab */}
          <TabsContent value="materials" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search materials..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="low-stock">Low Stock</SelectItem>
                    {materialCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Material
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Material</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddMaterial} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Material Name *</Label>
                        <Input
                          id="name"
                          value={newMaterial.name}
                          onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select
                          value={newMaterial.category}
                          onValueChange={(value) => setNewMaterial({ ...newMaterial, category: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {materialCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newMaterial.description}
                        onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="unit">Unit *</Label>
                        <Select
                          value={newMaterial.unit}
                          onValueChange={(value) => setNewMaterial({ ...newMaterial, unit: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cost_per_unit">Cost per Unit (₹) *</Label>
                        <Input
                          id="cost_per_unit"
                          type="number"
                          step="0.01"
                          value={newMaterial.cost_per_unit}
                          onChange={(e) => setNewMaterial({ ...newMaterial, cost_per_unit: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="current_stock">Current Stock *</Label>
                        <Input
                          id="current_stock"
                          type="number"
                          value={newMaterial.current_stock}
                          onChange={(e) => setNewMaterial({ ...newMaterial, current_stock: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="supplier_name">Supplier Name</Label>
                        <Input
                          id="supplier_name"
                          value={newMaterial.supplier_name}
                          onChange={(e) => setNewMaterial({ ...newMaterial, supplier_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supplier_contact">Supplier Contact</Label>
                        <Input
                          id="supplier_contact"
                          value={newMaterial.supplier_contact}
                          onChange={(e) => setNewMaterial({ ...newMaterial, supplier_contact: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="min_stock_level">Minimum Stock Level</Label>
                      <Input
                        id="min_stock_level"
                        type="number"
                        value={newMaterial.min_stock_level}
                        onChange={(e) => setNewMaterial({ ...newMaterial, min_stock_level: e.target.value })}
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      Add Material
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMaterials.map((material) => (
                <Card key={material.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{material.name}</CardTitle>
                      <Badge 
                        variant={material.current_stock <= material.min_stock_level ? "destructive" : "secondary"}
                      >
                        {material.current_stock} {material.unit}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{material.category}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Cost per Unit:</span>
                        <span className="font-medium">₹{material.cost_per_unit.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Value:</span>
                        <span className="font-medium">
                          ₹{(material.current_stock * material.cost_per_unit).toLocaleString()}
                        </span>
                      </div>
                      {material.supplier_name && (
                        <div className="flex justify-between text-sm">
                          <span>Supplier:</span>
                          <span className="font-medium">{material.supplier_name}</span>
                        </div>
                      )}
                    </div>
                    {material.description && (
                      <p className="text-sm text-muted-foreground">{material.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Material Usage</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Record Usage
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Material Usage</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddUsage} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="material_id">Material *</Label>
                      <Select
                        value={newUsage.material_id}
                        onValueChange={(value) => setNewUsage({ ...newUsage, material_id: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select material" />
                        </SelectTrigger>
                        <SelectContent>
                          {materials.map((material) => (
                            <SelectItem key={material.id} value={material.id}>
                              {material.name} ({material.current_stock} {material.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="project_id">Project *</Label>
                      <Select
                        value={newUsage.project_id}
                        onValueChange={(value) => setNewUsage({ ...newUsage, project_id: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity_used">Quantity Used *</Label>
                        <Input
                          id="quantity_used"
                          type="number"
                          step="0.01"
                          value={newUsage.quantity_used}
                          onChange={(e) => setNewUsage({ ...newUsage, quantity_used: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="usage_date">Usage Date *</Label>
                        <Input
                          id="usage_date"
                          type="date"
                          value={newUsage.usage_date}
                          onChange={(e) => setNewUsage({ ...newUsage, usage_date: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={newUsage.notes}
                        onChange={(e) => setNewUsage({ ...newUsage, notes: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      Record Usage
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-card rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materialUsage.map((usage) => (
                    <TableRow key={usage.id}>
                      <TableCell>{new Date(usage.usage_date).toLocaleDateString()}</TableCell>
                      <TableCell>{usage.materials.name}</TableCell>
                      <TableCell>{usage.projects.name}</TableCell>
                      <TableCell>{usage.quantity_used} {usage.materials.unit}</TableCell>
                      <TableCell>{usage.notes || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Purchases Tab */}
          <TabsContent value="purchases" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Material Purchases</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Record Purchase
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Material Purchase</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddPurchase} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="material_id">Material *</Label>
                      <Select
                        value={newPurchase.material_id}
                        onValueChange={(value) => setNewPurchase({ ...newPurchase, material_id: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select material" />
                        </SelectTrigger>
                        <SelectContent>
                          {materials.map((material) => (
                            <SelectItem key={material.id} value={material.id}>
                              {material.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity_purchased">Quantity Purchased *</Label>
                        <Input
                          id="quantity_purchased"
                          type="number"
                          step="0.01"
                          value={newPurchase.quantity_purchased}
                          onChange={(e) => setNewPurchase({ ...newPurchase, quantity_purchased: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cost_per_unit">Cost per Unit (₹) *</Label>
                        <Input
                          id="cost_per_unit"
                          type="number"
                          step="0.01"
                          value={newPurchase.cost_per_unit}
                          onChange={(e) => setNewPurchase({ ...newPurchase, cost_per_unit: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="purchase_date">Purchase Date *</Label>
                        <Input
                          id="purchase_date"
                          type="date"
                          value={newPurchase.purchase_date}
                          onChange={(e) => setNewPurchase({ ...newPurchase, purchase_date: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supplier_name">Supplier Name</Label>
                        <Input
                          id="supplier_name"
                          value={newPurchase.supplier_name}
                          onChange={(e) => setNewPurchase({ ...newPurchase, supplier_name: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="invoice_number">Invoice Number</Label>
                      <Input
                        id="invoice_number"
                        value={newPurchase.invoice_number}
                        onChange={(e) => setNewPurchase({ ...newPurchase, invoice_number: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={newPurchase.notes}
                        onChange={(e) => setNewPurchase({ ...newPurchase, notes: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      Record Purchase
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-card rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Cost per Unit</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Supplier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materialPurchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell>{new Date(purchase.purchase_date).toLocaleDateString()}</TableCell>
                      <TableCell>{purchase.materials.name}</TableCell>
                      <TableCell>{purchase.quantity_purchased} {purchase.materials.unit}</TableCell>
                      <TableCell>₹{purchase.cost_per_unit.toLocaleString()}</TableCell>
                      <TableCell>₹{purchase.total_cost.toLocaleString()}</TableCell>
                      <TableCell>{purchase.supplier_name || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-xl font-semibold">Inventory Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{materials.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{materials.reduce((sum, material) => {
                      const stock = Number(material.current_stock) || 0;
                      const cost = Number(material.cost_per_unit) || 0;
                      return sum + (stock * cost);
                    }, 0).toLocaleString('en-IN')}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{lowStockMaterials.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{materialPurchases.reduce((sum, purchase) => {
                      const cost = Number(purchase.total_cost) || 0;
                      return sum + cost;
                    }, 0).toLocaleString('en-IN')}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Materials by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {materialCategories.map((category) => {
                      const count = materials.filter(m => m.category === category).length;
                      if (count === 0) return null;
                      return (
                        <div key={category} className="flex justify-between">
                          <span>{category}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {materialUsage.length > 0 ? (
                      materialUsage.slice(0, 5).map((usage) => (
                        <div key={usage.id} className="flex justify-between text-sm">
                          <span>{usage.materials?.name || 'Unknown Material'}</span>
                          <span>{usage.quantity_used} {usage.materials?.unit || 'units'}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        No usage recorded yet
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default MaterialsInventory;
