import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Building2, 
  FileText, 
  Package, 
  DollarSign,
  Calendar,
  X
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface SearchResult {
  id: string;
  type: 'project' | 'report' | 'material';
  title: string;
  description: string;
  date?: string;
  cost?: number;
  url: string;
}

const GlobalSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchData = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const searchResults: SearchResult[] = [];

      // Search projects
      const { data: projectsData } = await supabase
        .from("projects")
        .select("id, name, description, created_at")
        .eq("user_id", user.id)
        .ilike("name", `%${searchQuery}%`);

      if (projectsData) {
        projectsData.forEach(project => {
          searchResults.push({
            id: project.id,
            type: 'project',
            title: project.name,
            description: project.description || 'No description',
            date: project.created_at,
            url: `/reports/${project.id}`
          });
        });
      }

      // Search daily reports
      const { data: reportsData } = await supabase
        .from("daily_reports")
        .select(`
          id, 
          report_date, 
          work_completed, 
          cost,
          projects(name)
        `)
        .eq("user_id", user.id)
        .or(`work_completed.ilike.%${searchQuery}%,projects.name.ilike.%${searchQuery}%`);

      if (reportsData) {
        reportsData.forEach(report => {
          searchResults.push({
            id: report.id,
            type: 'report',
            title: `${report.projects?.name || 'Unknown Project'} - ${new Date(report.report_date).toLocaleDateString()}`,
            description: report.work_completed || 'No description',
            date: report.report_date,
            cost: report.cost,
            url: '/reports'
          });
        });
      }

      // Search materials
      const { data: materialsData } = await supabase
        .from("materials")
        .select("id, name, description, category, created_at")
        .eq("user_id", user.id)
        .ilike("name", `%${searchQuery}%`);

      if (materialsData) {
        materialsData.forEach(material => {
          searchResults.push({
            id: material.id,
            type: 'material',
            title: material.name,
            description: `${material.category} - ${material.description || 'No description'}`,
            date: material.created_at,
            url: '/materials'
          });
        });
      }

      setResults(searchResults.slice(0, 10)); // Limit to 10 results
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    searchData(value);
    setIsOpen(value.length > 0);
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'project':
        return <Building2 className="h-4 w-4" />;
      case 'report':
        return <FileText className="h-4 w-4" />;
      case 'material':
        return <Package className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getResultBadge = (type: string) => {
    switch (type) {
      case 'project':
        return <Badge variant="default">Project</Badge>;
      case 'report':
        return <Badge variant="secondary">Report</Badge>;
      case 'material':
        return <Badge variant="outline">Material</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Search projects, reports, materials..."
          value={query}
          onChange={handleSearch}
          onFocus={() => setIsOpen(query.length > 0)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={clearSearch}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                <Search className="h-6 w-6 mx-auto mb-2 animate-pulse" />
                Searching...
              </div>
            ) : results.length > 0 ? (
              <div className="divide-y divide-border">
                {results.map((result) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    className="p-3 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 text-muted-foreground">
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">{result.title}</h4>
                          {getResultBadge(result.type)}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                          {result.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {result.date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(result.date).toLocaleDateString()}
                            </div>
                          )}
                          {result.cost && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ₹{result.cost.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : query.length > 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Search className="h-6 w-6 mx-auto mb-2" />
                No results found for "{query}"
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GlobalSearch;
