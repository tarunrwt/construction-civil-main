import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import heroImage from "@/assets/construction-hero.jpg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div
        className="relative min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-primary p-4 rounded-xl mr-4">
              <Building2 className="h-12 w-12 text-primary-foreground" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">DPR Automation</h1>
          </div>

          <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">
           Daily Progress Report Automation of Construction work
          </h2>

          <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto">
            Real-time construction project tracking with intelligence delay analysis
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 py-6"
              onClick={() => navigate("/reports")}
            >
              View Full Report
            </Button>
            <Button
              size="lg"
              className="text-lg px-8 py-6"
              onClick={() => navigate("/auth")}
            >
              Admin Login
            </Button>
          </div>

          <div className="mt-12">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-card/90 backdrop-blur-sm rounded-full border border-border">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="text-sm text-foreground font-medium">
                Professional Construction Management
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
