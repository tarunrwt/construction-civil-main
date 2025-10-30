import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ---------------- TYPES ----------------
interface DailyReport {
  id: string;
  project_id: string | null;
  report_date: string;
  weather?: string | null;
  manpower?: number | null;
  machinery?: string | null;
  work_completed?: string | null;
  cost?: number | null;
  stage?: string | null;

  // DPR dynamic fields
  [key: string]: any;

  projects?: {
    name?: string | null;
  } | null;
}

// ---------------- COMPONENT ----------------
const Notifications: React.FC = () => {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestReports = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        // ✅ FIX: Don't pass generics directly — instead, use runtime type narrowing
        const { data, error } = await supabase
          .from("daily_reports")
          .select(
            `
            id,
            project_id,
            report_date,
            weather,
            manpower,
            work_completed,
            cost,
            stage,
            projects (name)
          `
          )
          .order("report_date", { ascending: false })
          .limit(5);

        if (error) {
          console.error("Supabase error fetching notifications:", error);
          setErrorMsg(error.message);
          return;
        }

        // ✅ FIX: Type-safe conversion
        if (Array.isArray(data)) {
          setReports(data as unknown as DailyReport[]);
        } else {
          setReports([]);
        }
      } catch (err) {
        console.error("Unexpected error fetching notifications:", err);
        setErrorMsg(String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchLatestReports();
  }, []);

  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (window.location.href = "/reports")}
          >
            View all
          </Button>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">
              Loading notifications…
            </div>
          ) : errorMsg ? (
            <div className="text-sm text-destructive">Error: {errorMsg}</div>
          ) : reports.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No recent reports.
            </div>
          ) : (
            <ul className="space-y-3">
              {reports.map((r) => (
                <li key={r.id} className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium">
                      {r.projects?.name || "Unnamed Project"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.work_completed || "Report submitted"}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(r.report_date).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
