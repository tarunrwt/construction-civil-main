import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImageIcon, Download, Eye, Calendar, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Photo {
  id: string;
  daily_report_id: string;
  file_name: string;
  public_url: string;
  description: string;
  created_at: string;
  report_date: string;
  project_name: string;
}

interface PhotoGalleryProps {
  reportId?: string;
  showAll?: boolean;
}

const PhotoGallery = ({ reportId, showAll = false }: PhotoGalleryProps) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, [reportId, showAll]);

  const fetchPhotos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try to fetch photos, but handle case where table doesn't exist yet
      try {
        if (showAll) {
          // Get all photos for the user
          const { data, error } = await supabase.rpc('get_user_photos' as any);
          if (error) throw error;
          setPhotos((data || []) as Photo[]);
        } else if (reportId) {
          // Get photos for specific report
          const { data, error } = await supabase.rpc('get_report_photos' as any, { report_id: reportId });
          if (error) throw error;
          setPhotos((data || []) as Photo[]);
        } else {
          setPhotos([]);
        }
      } catch (rpcError) {
        // If RPC functions don't exist, try direct table query
        console.warn("RPC functions not available, trying direct query:", rpcError);
        const { data, error } = await supabase
          .from("dpr_photos" as any)
          .select("*")
          .order("created_at", { ascending: false });
        
        if (error) {
          console.warn("dpr_photos table may not exist yet:", error);
          setPhotos([]);
        } else {
          setPhotos((data || []) as unknown as Photo[]);
        }
      }
    } catch (error) {
      console.error("Error fetching photos:", error);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadPhoto = async (photo: Photo) => {
    try {
      const response = await fetch(photo.public_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = photo.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading photo:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Loading photos...</p>
        </div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No photos found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Progress Photos</h3>
        <Badge variant="secondary">{photos.length} photos</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {photos.map((photo) => (
          <Card key={photo.id} className="overflow-hidden">
            <CardHeader className="p-0">
              <div className="relative aspect-video bg-muted">
                <img
                  src={photo.public_url}
                  alt={photo.description || photo.file_name}
                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedPhoto(photo)}
                />
                <div className="absolute top-2 right-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0"
                    onClick={() => downloadPhoto(photo)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(photo.report_date).toLocaleDateString()}</span>
                </div>
                {photo.project_name && (
                  <div className="text-sm font-medium">{photo.project_name}</div>
                )}
                {photo.description && (
                  <div className="flex items-start gap-2 text-sm">
                    <FileText className="h-3 w-3 mt-0.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{photo.description}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Photo Modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              {selectedPhoto?.file_name}
            </DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={selectedPhoto.public_url}
                  alt={selectedPhoto.description || selectedPhoto.file_name}
                  className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(selectedPhoto.report_date).toLocaleDateString()}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadPhoto(selectedPhoto)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                {selectedPhoto.project_name && (
                  <div className="text-sm font-medium">{selectedPhoto.project_name}</div>
                )}
                {selectedPhoto.description && (
                  <div className="text-sm text-muted-foreground">{selectedPhoto.description}</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PhotoGallery;
