import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Props {
  slotKey: string;
  defaultSrc: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
}

const EditableImage = ({ slotKey, defaultSrc, alt = "", className = "", imgClassName = "" }: Props) => {
  const { role } = useAuth();
  const [src, setSrc] = useState(defaultSrc);
  const [altText, setAltText] = useState(alt);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [draftUrl, setDraftUrl] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get<{ imageData?: string; image_data?: string; alt?: string; title?: string; subtitle?: string }>(`/site-images/${slotKey}`)
      .then((data) => {
        const img = data.imageData || data.image_data;
        // Only update src if there's actual image data
        if (img && img.trim() !== '') {
          setSrc(img);
        } else {
          // If no image data, use defaultSrc
          setSrc(defaultSrc);
        }
        if (data.alt) setAltText(data.alt);
        if (data.title) setTitle(data.title);
        if (data.subtitle) setSubtitle(data.subtitle);
      })
      .catch((err) => {
        // If slot doesn't exist (404), that's okay - it will be created on first save
        if (err?.response?.status !== 404) {
          console.error('Error fetching site image:', err);
        }
        // Use defaultSrc on error
        setSrc(defaultSrc);
      });
  }, [slotKey, defaultSrc]);

  const handleExternalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const url = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
    if (url?.match(/^https?:\/\/.+/i)) {
      setDraftUrl(url);
      setFile(null);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      let updatedImageData = src;
      
      if (file) {
        if (file.size > 5 * 1024 * 1024) throw new Error("Max 5 MB");
        console.log('[EditableImage] Uploading file for slot:', slotKey);
        const fd = new FormData();
        fd.append("image", file);
        const res = await api.post<{ imageData?: string }>(`/admin/site-images/${slotKey}/image`, fd);
        console.log('[EditableImage] Upload response:', res);
        if (res.imageData) {
          updatedImageData = res.imageData;
          setSrc(res.imageData);
        }
      } else if (draftUrl) {
        console.log('[EditableImage] Uploading URL for slot:', slotKey, draftUrl);
        const res = await api.post<{ imageData?: string }>(`/admin/site-images/${slotKey}/image`, { url: draftUrl });
        console.log('[EditableImage] Upload response:', res);
        if (res.imageData) {
          updatedImageData = res.imageData;
          setSrc(res.imageData);
        }
      }
      
      console.log('[EditableImage] Updating metadata for slot:', slotKey);
      await api.patch(`/admin/site-images/${slotKey}`, { title, subtitle, alt: altText });
      console.log('[EditableImage] Save complete');
      
      setOpen(false);
      setFile(null);
      setDraftUrl("");
      toast.success("Image updated - refreshing page...");
      
      // Wait a bit for the toast to show, then reload
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (e: unknown) {
      console.error('[EditableImage] Save error:', e);
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const preview = file ? URL.createObjectURL(file) : draftUrl || src || defaultSrc || "/placeholder.svg";

  // Use the image source, falling back to defaultSrc and then placeholder
  const displaySrc = src || defaultSrc || "/placeholder.svg";

  return (
    <div className={`relative group ${className}`}>
      <img src={displaySrc} alt={altText} className={imgClassName} onError={(e) => {
        // If image fails to load, try placeholder
        const target = e.target as HTMLImageElement;
        if (target.src !== "/placeholder.svg") {
          target.src = "/placeholder.svg";
        }
      }} />
      {role === "admin" && (
        <>
          <button
            onClick={() => setOpen(true)}
            className="absolute top-2 right-2 bg-primary text-primary-foreground p-2 rounded-full shadow-lg opacity-90 hover:opacity-100 z-10"
            aria-label="Edit image"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="text-base">Edit · {slotKey}</DialogTitle></DialogHeader>
              <div className="space-y-2.5">
                <img src={preview} alt="" className="w-full max-h-32 object-contain rounded bg-muted" />
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); setFile(e.dataTransfer.files?.[0] || null); setDraftUrl(""); }}
                  className="border-2 border-dashed border-border rounded-lg p-3 text-center"
                >
                  <Label htmlFor="file" className="text-xs text-muted-foreground">Upload from device (max 5 MB)</Label>
                  <Input id="file" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1.5 text-sm h-9" onChange={(e) => { setFile(e.target.files?.[0] || null); setDraftUrl(""); }} />
                </div>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleExternalDrop}
                  className="border-2 border-dashed border-border rounded-lg p-3 text-center"
                >
                  <p className="text-xs text-muted-foreground">Or drag an image from a website here</p>
                  {draftUrl && <p className="text-xs mt-1.5 truncate text-primary">{draftUrl}</p>}
                </div>
                <div><Label htmlFor="title" className="text-sm">Title</Label><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 h-9 text-sm" /></div>
                <div><Label htmlFor="subtitle" className="text-sm">Subtitle</Label><Input id="subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="mt-1 h-9 text-sm" /></div>
                <div><Label htmlFor="alt" className="text-sm">Alt text</Label><Input id="alt" value={altText} onChange={(e) => setAltText(e.target.value)} className="mt-1 h-9 text-sm" /></div>
                <Button onClick={save} disabled={busy} className="w-full h-9 text-sm">{busy ? "Saving…" : "Save"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default EditableImage;
