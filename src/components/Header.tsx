import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Building2, LogOut, Home, Bell } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import GlobalSearch from "./GlobalSearch";
import Notifications from "./Notifications";

interface HeaderProps {
  title: string;
  showSearch?: boolean;
  showNotifications?: boolean;
  children?: React.ReactNode;
}

const Header = ({ title, showSearch = true, showNotifications = true, children }: HeaderProps) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotificationCount();
  }, []);

  const fetchNotificationCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) {
        console.warn("Error fetching notification count:", error);
        setNotifications(0);
      } else {
        setNotifications(data?.length || 0);
      }
    } catch (error) {
      console.warn("Error fetching notification count:", error);
      setNotifications(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/");
    }
  };

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        </div>

        <div className="flex items-center gap-4 flex-1 max-w-md mx-8">
          {showSearch && <GlobalSearch />}
        </div>

        <div className="flex items-center gap-2">
          {showNotifications && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {notifications}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <Notifications />
              </PopoverContent>
            </Popover>
          )}
          
          {children}
          
          <Button variant="ghost" onClick={() => navigate("/")}>
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
