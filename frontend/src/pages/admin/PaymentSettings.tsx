import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, X, Plus } from "lucide-react";

interface PaymentQR {
  id: string;
  imageData: string;
  title: string;
  category: string; // e.g., "PhonePay", "eSewa", "Khalti"
  sortOrder: number;
}

const PaymentSettings = () => {
  const [qrCodes, setQrCodes] = useState<PaymentQR[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newQRCategory, setNewQRCategory] = useState("");
  const [newQRTitle, setNewQRTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const loadQRCodes = async () => {
    try {
      setLoading(true);
      const images = await api.get<any[]>("/admin/site-images");
      // Filter for payment QR codes (slotKey starts with 'payment_qr_')
      const paymentQRs = images
        .filter(img => img.slotKey?.startsWith('payment_qr_'))
        .map(img => ({
          id: img.id,
          imageData: img.imageData,
          title: img.title || 'Payment QR Code',
          category: img.subtitle || 'Other', // Using subtitle field for category
          sortOrder: img.sortOrder || 0,
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder);
      
      setQrCodes(paymentQRs);
    } catch (error) {
      console.error("Failed to load QR codes:", error);
      toast.error("Failed to load QR codes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQRCodes();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadQRCode = async () => {
    if (!selectedFile || !previewImage) {
      toast.error("Please select an image");
      return;
    }

    if (!newQRCategory.trim()) {
      toast.error("Please enter a category (e.g., PhonePay, eSewa, Khalti)");
      return;
    }

    if (!newQRTitle.trim()) {
      toast.error("Please enter a title/description");
      return;
    }

    setUploading(true);

    try {
      const timestamp = Date.now();
      const slotKey = `payment_qr_${timestamp}`;
      
      await api.post("/admin/site-images", {
        slotKey,
        title: newQRTitle.trim(),
        subtitle: newQRCategory.trim(), // Store category in subtitle
        imageData: previewImage,
        sortOrder: qrCodes.length,
      });

      toast.success("Payment QR code uploaded successfully");
      setSelectedFile(null);
      setPreviewImage(null);
      setNewQRCategory("");
      setNewQRTitle("");
      loadQRCodes();
    } catch (error) {
      console.error("Failed to upload QR code:", error);
      toast.error("Failed to upload QR code");
    } finally {
      setUploading(false);
    }
  };

  const deleteQRCode = async (id: string) => {
    if (!confirm("Delete this QR code?")) return;

    try {
      await api.delete(`/admin/site-images/${id}`);
      toast.success("QR code deleted");
      loadQRCodes();
    } catch (error) {
      console.error("Failed to delete QR code:", error);
      toast.error("Failed to delete QR code");
    }
  };

  const updateQRCode = async (id: string, updates: { title?: string; category?: string }) => {
    try {
      const payload: any = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.category !== undefined) payload.subtitle = updates.category;
      
      await api.put(`/admin/site-images/${id}`, payload);
      toast.success("Updated successfully");
      loadQRCodes();
    } catch (error) {
      console.error("Failed to update:", error);
      toast.error("Failed to update");
    }
  };

  // Group QR codes by category
  const groupedQRs = qrCodes.reduce((acc, qr) => {
    const category = qr.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(qr);
    return acc;
  }, {} as Record<string, PaymentQR[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading payment settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Payment Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage payment QR codes displayed at checkout (PhonePay, eSewa, Khalti, etc.)
        </p>
      </div>

      {/* Upload New QR Code Form */}
      <div className="mb-6 border border-border rounded-lg p-4 bg-card">
        <h3 className="text-sm font-semibold mb-3">Add New Payment QR Code</h3>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Category *</Label>
                <Input
                  value={newQRCategory}
                  onChange={(e) => setNewQRCategory(e.target.value)}
                  placeholder="e.g., PhonePay, eSewa, Khalti"
                  className="text-sm"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Enter payment method name
                </p>
              </div>

              <div>
                <Label className="text-xs">Title/Description *</Label>
                <Input
                  value={newQRTitle}
                  onChange={(e) => setNewQRTitle(e.target.value)}
                  placeholder="e.g., Main PhonePay Account"
                  className="text-sm"
                />
              </div>

              <div>
                <Label className="text-xs">QR Code Image *</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="qr-file-upload"
                />
                <label
                  htmlFor="qr-file-upload"
                  className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors"
                >
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {selectedFile ? selectedFile.name : "Click to select image"}
                  </span>
                </label>
                <p className="text-[10px] text-muted-foreground mt-1">Max 5MB</p>
              </div>

              <Button
                onClick={uploadQRCode}
                disabled={uploading || !selectedFile || !newQRCategory || !newQRTitle}
                className="w-full"
                size="sm"
              >
                {uploading ? "Uploading..." : "Add QR Code"}
              </Button>
            </div>
          </div>

          <div>
            {previewImage ? (
              <div className="relative">
                <p className="text-xs font-medium mb-2">Preview:</p>
                <div className="aspect-square bg-white rounded border p-2">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewImage(null);
                  }}
                  className="absolute top-8 right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:scale-110 transition-transform"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="aspect-square bg-muted/20 rounded border-2 border-dashed border-border flex items-center justify-center">
                <p className="text-xs text-muted-foreground text-center p-4">
                  Image preview will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Existing QR Codes - Grouped by Category */}
      {Object.keys(groupedQRs).length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <p className="text-muted-foreground mb-2">No QR codes uploaded yet</p>
          <p className="text-xs text-muted-foreground">
            Upload at least one QR code to enable online payments
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedQRs).map(([category, qrs]) => (
            <div key={category} className="border border-border rounded-lg p-4 bg-card">
              <h3 className="text-sm font-semibold mb-3 text-primary">{category}</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {qrs.map((qr) => (
                  <div key={qr.id} className="border border-border rounded p-3 bg-background">
                    <div className="relative mb-2">
                      <div className="aspect-square bg-white rounded border p-2">
                        <img
                          src={qr.imageData}
                          alt={qr.title}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <button
                        onClick={() => deleteQRCode(qr.id)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:scale-110 transition-transform shadow-lg"
                        title="Delete QR code"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={qr.category}
                        onChange={(e) => {
                          const updated = qrCodes.map(q => 
                            q.id === qr.id ? { ...q, category: e.target.value } : q
                          );
                          setQrCodes(updated);
                        }}
                        onBlur={(e) => updateQRCode(qr.id, { category: e.target.value })}
                        className="w-full px-2 py-1 text-xs border border-input rounded bg-background font-medium"
                        placeholder="Category"
                      />
                      <input
                        type="text"
                        value={qr.title}
                        onChange={(e) => {
                          const updated = qrCodes.map(q => 
                            q.id === qr.id ? { ...q, title: e.target.value } : q
                          );
                          setQrCodes(updated);
                        }}
                        onBlur={(e) => updateQRCode(qr.id, { title: e.target.value })}
                        className="w-full px-2 py-1 text-xs border border-input rounded bg-background"
                        placeholder="Title"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border">
        <h3 className="text-sm font-semibold mb-2">Note:</h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• QR codes are grouped by category (PhonePay, eSewa, Khalti, etc.)</li>
          <li>• Users will see all QR codes during checkout</li>
          <li>• Users must upload payment screenshot after scanning</li>
          <li>• You can approve/reject orders from the Orders page</li>
          <li>• Edit category or title by clicking on the text fields</li>
        </ul>
      </div>
    </div>
  );
};

export default PaymentSettings;
