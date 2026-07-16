import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, ImagePlus } from "lucide-react";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const Categories = () => {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  
  const load = () => api.get<any[]>("/categories").then(setItems).catch(() => {});
  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await api.post("/categories", { name: name.trim(), slug: slugify(name) });
      setName("");
      load();
      toast.success("Category added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };
  
  const del = async (id: string) => {
    if (!confirm("Delete category?")) return;
    await api.delete(`/categories/${id}`);
    load();
    toast.success("Category deleted");
  };
  
  const openImageDialog = (category: any) => {
    setEditingCategory(category);
    setFile(null);
    setPreviewUrl(category.imageUrl || category.image_url || "");
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("Max 5 MB");
      return;
    }
    
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };
  
  const uploadImage = async () => {
    if (!file || !editingCategory) return;
    
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      await api.post(`/categories/${editingCategory.id}/image`, fd);
      toast.success("Image uploaded");
      setEditingCategory(null);
      setFile(null);
      setPreviewUrl("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const toggleHeader = async (category: any) => {
    try {
      // DB default is true; treat undefined/null as true
      const current = category.showInHeader ?? category.show_in_header ?? true;
      const newValue = !current;
      await api.put(`/categories/${category.id}`, {
        name: category.name,
        slug: category.slug,
        sortOrder: category.sortOrder,
        showInHeader: newValue,
        showInFooter: category.showInFooter ?? category.show_in_footer ?? true
      });
      load();
      toast.success(newValue ? "Added to header" : "Removed from header");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const toggleFooter = async (category: any) => {
    try {
      const current = category.showInFooter ?? category.show_in_footer ?? true;
      const newValue = !current;
      await api.put(`/categories/${category.id}`, {
        name: category.name,
        slug: category.slug,
        sortOrder: category.sortOrder,
        showInHeader: category.showInHeader ?? category.show_in_header ?? true,
        showInFooter: newValue
      });
      load();
      toast.success(newValue ? "Added to footer" : "Removed from footer");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl mb-6">Categories</h1>
      <form onSubmit={add} className="flex gap-2 mb-6">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kurtis" />
        <Button type="submit">Add</Button>
      </form>
      <div className="border border-border rounded-lg bg-card divide-y divide-border">
        {items.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              {(c.imageUrl || c.image_url) && (
                <img src={c.imageUrl || c.image_url} alt={c.name} className="w-12 h-12 object-cover rounded" />
              )}
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">/{c.slug}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs">
                <Switch 
                  checked={c.showInHeader !== false} 
                  onCheckedChange={() => toggleHeader(c)}
                />
                <span className="text-muted-foreground">Show in header</span>
              </label>
              <label className="flex items-center gap-2 text-xs">
                <Switch 
                  checked={c.showInFooter !== false} 
                  onCheckedChange={() => toggleFooter(c)}
                />
                <span className="text-muted-foreground">Show in footer</span>
              </label>
              <Button variant="outline" size="icon" onClick={() => openImageDialog(c)} title="Upload image">
                <ImagePlus className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => del(c.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="p-6 text-sm text-muted-foreground">No categories yet.</p>}
      </div>
      
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload image for {editingCategory?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {previewUrl && (
              <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover rounded" />
            )}
            <div>
              <Label htmlFor="category-image">Choose image (max 5 MB)</Label>
              <Input 
                id="category-image"
                type="file" 
                accept="image/*" 
                onChange={handleFileSelect}
                className="mt-2"
              />
            </div>
            <Button onClick={uploadImage} disabled={!file || uploading} className="w-full">
              {uploading ? "Uploading..." : "Upload Image"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categories;
