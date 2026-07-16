import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { formatNPR } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { X, Upload, ImagePlus } from "lucide-react";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const ProductEditor = () => {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const nav = useNavigate();
  const [cats, setCats] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    name: "", slug: "", description: "", price: 0, stock: 0,
    originalPriceNPR: null, discountPercent: 0,
    images: [] as string[], sizes: [] as string[], colors: [] as string[],
    colorImageMap: {} as Record<string, number>,
    variantStock: {} as Record<string, number>,
    category_id: null, featured: false, active: true,
  });
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [sizesInput, setSizesInput] = useState("");
  const [colorsInput, setColorsInput] = useState("");

  useEffect(() => {
    api.get<any[]>("/categories").then(setCats).catch(() => {});
    if (!isNew) {
      api.get<any>(`/products/${id}`).then((data) => {
        // Extract category ID - could be in categoryId, category_id, or as an object
        let categoryId = null;
        if (data.categoryId) {
          categoryId = typeof data.categoryId === 'object' ? data.categoryId._id : data.categoryId;
        } else if (data.category_id) {
          categoryId = typeof data.category_id === 'object' ? data.category_id._id : data.category_id;
        }
        
        const productData = {
          ...data,
          price: data.price_npr ?? data.price,
          category_id: categoryId,
          colorImageMap: data.colorImageMap || {},
          variantStock: data.variantStock || {},
        };
        setForm(productData);
        setSizesInput((data.sizes || []).join(", "));
        setColorsInput((data.colors || []).join(", "));
      }).catch(() => {});
    }
  }, [id, isNew]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max 5 MB per image");
      return;
    }

    setFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;
      if (isNew) {
        // For new products, add to preview array
        setPreviewImages([...previewImages, preview]);
        setForm({ ...form, images: [...form.images, preview] });
      }
    };
    reader.readAsDataURL(file);
  };

  const upload = async () => {
    if (!file || isNew) return toast.error("Save the product first, then upload images");
    if (file.size > 5 * 1024 * 1024) return toast.error("Max 5 MB");
    const fd = new FormData();
    fd.append("image", file);
    try {
      const res = await api.post<{ images: string[] }>(`/products/${id}/image`, fd);
      setForm({ ...form, images: res.images });
      setFile(null);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      description: form.description || "",
      price_npr: Number(form.price),
      originalPriceNPR: form.originalPriceNPR ? Number(form.originalPriceNPR) : null,
      discountPercent: form.discountPercent ? Number(form.discountPercent) : 0,
      stock: Number(form.stock),
      images: form.images || [],
      sizes: form.sizes || [],
      colors: form.colors || [],
      colorImageMap: form.colorImageMap || {},
      variantStock: form.variantStock || {},
      category_id: form.category_id || null,
      featured: form.featured,
      active: form.active,
    };
    try {
      if (isNew) {
        const newProduct = await api.post<any>("/products", payload);
        toast.success("Product created successfully!");
        nav(`/admin/products/${newProduct.id}`);
      } else {
        await api.put(`/products/${id}`, payload);
        toast.success("Product updated successfully!");
        nav("/admin/products");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = form.images.filter((_: any, i: number) => i !== index);
    const newPreviews = previewImages.filter((_, i) => i !== index);
    setForm({ ...form, images: newImages });
    setPreviewImages(newPreviews);
    toast.success("Image removed");
  };

  const handleSizesChange = (value: string) => {
    setSizesInput(value);
    const sizesArray = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setForm({ ...form, sizes: sizesArray });
  };

  const handleColorsChange = (value: string) => {
    setColorsInput(value);
    const colorsArray = value
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    setForm({ ...form, colors: colorsArray });
  };

  const updateColorImageMapping = (color: string, imageIndex: number) => {
    const newMap = { ...form.colorImageMap };
    newMap[color] = imageIndex;
    setForm({ ...form, colorImageMap: newMap });
    toast.success(`${color} linked to image ${imageIndex + 1}`);
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl mb-6">{isNew ? "New product" : "Edit product"}</h1>
      <form onSubmit={save} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto from name" /></div>
        </div>
        <div><Label>Description</Label><Textarea rows={4} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Price (NPR)</Label>
            <Input 
              type="number" 
              step="0.01" 
              value={form.price} 
              onFocus={(e) => {
                // Clear the 0 when user focuses to type
                if (e.target.value === '0' || e.target.value === '0.00') {
                  e.target.value = '';
                }
              }}
              onBlur={(e) => {
                // Set to 0 if left empty or only whitespace
                const val = e.target.value.trim();
                if (val === '') {
                  setForm({ ...form, price: 0 });
                }
              }}
              onChange={(e) => {
                const val = e.target.value.trim();
                setForm({ ...form, price: val === '' ? 0 : e.target.value });
              }} 
              required 
            />
          </div>
          <div>
            <Label>Original Price (NPR) - Optional</Label>
            <Input 
              type="number" 
              step="0.01" 
              value={form.originalPriceNPR || ''} 
              placeholder="Leave empty if no discount"
              onChange={(e) => {
                const val = e.target.value.trim();
                const originalPrice = val === '' ? null : parseFloat(val);
                
                // Auto-calculate discount percentage if both prices exist
                let discountPercent = 0;
                if (originalPrice && form.price && originalPrice > form.price) {
                  discountPercent = Math.round(((originalPrice - form.price) / originalPrice) * 100);
                }
                
                setForm({ 
                  ...form, 
                  originalPriceNPR: originalPrice,
                  discountPercent: discountPercent
                });
              }} 
            />
            {form.originalPriceNPR && form.price && form.originalPriceNPR > form.price && (
              <p className="text-xs text-green-600 mt-1">
                {form.discountPercent}% discount ({formatNPR(form.originalPriceNPR - form.price)} off)
              </p>
            )}
          </div>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Discount % - Optional</Label>
            <Input 
              type="number" 
              min="0"
              max="100"
              step="1"
              value={form.discountPercent || ''} 
              placeholder="0"
              onChange={(e) => {
                const val = e.target.value.trim();
                const discountPercent = val === '' ? 0 : parseInt(val);
                
                // Auto-calculate original price if discount is provided
                let originalPrice = form.originalPriceNPR;
                if (discountPercent > 0 && form.price) {
                  originalPrice = Math.round(form.price / (1 - discountPercent / 100));
                }
                
                setForm({ 
                  ...form, 
                  discountPercent: discountPercent,
                  originalPriceNPR: discountPercent > 0 ? originalPrice : null
                });
              }} 
            />
            {form.discountPercent > 0 && form.originalPriceNPR && (
              <p className="text-xs text-muted-foreground mt-1">
                Original price calculated: {formatNPR(form.originalPriceNPR)}
              </p>
            )}
          </div>
          <div>
            <Label>Category</Label>
            <select value={form.category_id || ""} onChange={(e) => setForm({ ...form, category_id: e.target.value || null })} className="w-full h-10 rounded border border-input bg-background px-3 text-sm">
              <option value="">— none —</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        
        <div>
          <Label>Sizes (comma-separated)</Label>
          <Input
            value={sizesInput}
            placeholder="S, M, L, XL"
            onChange={(e) => handleSizesChange(e.target.value)}
          />
          {form.sizes?.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {form.sizes.length} size{form.sizes.length !== 1 ? 's' : ''}: {form.sizes.join(", ")}
            </p>
          )}
        </div>

        <div>
          <Label>Colors (comma-separated)</Label>
          <Input
            value={colorsInput}
            placeholder="Pink, Cream, Black"
            onChange={(e) => handleColorsChange(e.target.value)}
          />
          {form.colors?.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {form.colors.length} color{form.colors.length !== 1 ? 's' : ''}: {form.colors.join(", ")}
            </p>
          )}
          
          {/* Color-Image Mapping UI */}
          {form.colors?.length > 0 && form.images?.length > 0 && (
            <div className="mt-3 p-3 border border-border rounded-lg bg-muted/20">
              <p className="text-xs font-semibold mb-2">Link colors to images (in order):</p>
              <div className="space-y-2">
                {form.colors.map((color: string, colorIdx: number) => {
                  const linkedImageIdx = form.colorImageMap?.[color] ?? colorIdx;
                  return (
                    <div key={color} className="flex items-center gap-2 text-sm">
                      <span className="font-medium min-w-[80px]">{color}:</span>
                      <select
                        value={linkedImageIdx}
                        onChange={(e) => updateColorImageMapping(color, Number(e.target.value))}
                        className="flex-1 h-8 rounded border border-input bg-background px-2 text-xs"
                      >
                        {form.images.map((_: string, imgIdx: number) => (
                          <option key={imgIdx} value={imgIdx}>
                            Image {imgIdx + 1}
                          </option>
                        ))}
                      </select>
                      {form.images[linkedImageIdx] && (
                        <img 
                          src={form.images[linkedImageIdx]} 
                          alt={color}
                          className="w-8 h-8 object-cover rounded border"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                💡 Tip: Upload images in the same order as colors for automatic mapping
              </p>
            </div>
          )}
        </div>

        {/* Variant Stock Management */}
        {form.sizes?.length > 0 && form.colors?.length > 0 && (
          <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/10">
            <Label className="text-base font-semibold">Variant Stock (Size × Color)</Label>
            <p className="text-xs text-muted-foreground">Set stock for each size-color combination</p>
            <div className="grid gap-2">
              {form.sizes.map((size: string) => (
                <div key={size} className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Size: {size}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {form.colors.map((color: string) => {
                      const variantKey = `${size}-${color}`;
                      const currentStock = form.variantStock?.[variantKey] ?? 0;
                      return (
                        <div key={variantKey} className="flex items-center gap-1">
                          <span className="text-xs min-w-[60px] truncate">{color}:</span>
                          <Input
                            type="number"
                            min="0"
                            value={currentStock}
                            onFocus={(e) => {
                              // Clear the 0 when user focuses to type
                              if (e.target.value === '0') {
                                e.target.value = '';
                              }
                            }}
                            onBlur={(e) => {
                              // Set to 0 if left empty or only whitespace
                              const val = e.target.value.trim();
                              if (val === '' || val === '0') {
                                const newVariantStock = { ...form.variantStock };
                                newVariantStock[variantKey] = 0;
                                setForm({ ...form, variantStock: newVariantStock });
                              }
                            }}
                            onChange={(e) => {
                              const val = e.target.value.trim();
                              const newVariantStock = { ...form.variantStock };
                              // If empty, set to 0, otherwise use the number
                              newVariantStock[variantKey] = val === '' ? 0 : Number(val);
                              setForm({ ...form, variantStock: newVariantStock });
                            }}
                            className="h-8 text-xs"
                            placeholder="0"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              💡 Leave blank or set to 0 for out of stock variants
            </p>
          </div>
        )}

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm"><Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} /> Featured</label>
          <label className="flex items-center gap-2 text-sm"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /> Active</label>
        </div>

        {/* Image Upload Section - Works for both new and existing products */}
        <div className="border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Product Images</Label>
            <span className="text-xs text-muted-foreground">{form.images?.length || 0} image{form.images?.length !== 1 ? 's' : ''}</span>
          </div>
          
          {/* Image Preview Grid */}
          {form.images?.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {form.images.map((url: string, i: number) => (
                <div key={i} className="relative aspect-square group">
                  <img 
                    src={url} 
                    className="w-full h-full object-cover rounded-lg border border-border" 
                    alt={`Product image ${i + 1}`}
                    onError={(e) => {
                      // Fallback for broken images
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={() => removeImage(i)} 
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110 transform duration-150"
                    title="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input 
                type="file" 
                accept="image/*" 
                onChange={handleImageSelect}
                id="image-upload"
                className="hidden"
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => document.getElementById('image-upload')?.click()}
                className="w-full"
              >
                <ImagePlus className="w-4 h-4 mr-2" />
                {isNew ? 'Add Image' : 'Add Another Image'}
              </Button>
              {!isNew && file && (
                <Button type="button" onClick={upload} disabled={!file}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isNew 
                ? "Add images now (they'll be saved with the product). Max 5 MB per image." 
                : "Select and upload images one at a time. Max 5 MB per image."}
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
          <Button type="button" variant="ghost" onClick={() => nav(-1)}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};

export default ProductEditor;
