import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import EditableImage from "@/components/admin/EditableImage";

const SiteImages = () => {
  const [slots, setSlots] = useState<any[]>([]);
  useEffect(() => {
    api.get<any[]>("/admin/site-images").then(setSlots).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl mb-2">Site images</h1>
      <p className="text-sm text-muted-foreground mb-6">Click the pencil on any image to update it. Changes are live for all visitors.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {slots.map((s) => (
          <div key={s.id || s.slot_key} className="border border-border rounded-lg overflow-hidden bg-card">
            <EditableImage slotKey={s.slot_key || s.slotKey} defaultSrc={s.image_data || s.image_url || ""} alt={s.alt || ""} className="block" imgClassName="w-full h-48 object-cover" />
            <div className="p-3">
              <p className="text-xs uppercase text-muted-foreground">{s.slot_key || s.slotKey}</p>
              <p className="text-sm">{s.title || s.alt || "—"}</p>
            </div>
          </div>
        ))}
        {slots.length === 0 && <p className="text-muted-foreground">No site image slots configured. Run npm run seed in backend.</p>}
      </div>
    </div>
  );
};

export default SiteImages;
