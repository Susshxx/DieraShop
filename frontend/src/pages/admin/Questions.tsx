import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const Questions = () => {
  const [items, setItems] = useState<any[]>([]);
  const [reply, setReply] = useState<Record<string, string>>({});
  const load = () => api.get<any[]>("/admin/questions").then(setItems).catch(() => {});
  useEffect(() => { load(); }, []);

  const answer = async (qid: string) => {
    if (!reply[qid]?.trim()) return;
    try {
      await api.patch(`/admin/questions/${qid}/answer`, { answer: reply[qid].trim() });
      setReply({ ...reply, [qid]: "" });
      toast.success("Reply sent");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div>
      <h1 className="text-2xl mb-6">Product Q&A</h1>
      <div className="space-y-4">
        {items.map((q) => (
          <div key={q.id} className="border border-border rounded-lg bg-card p-4">
            <p className="text-xs text-muted-foreground">{q.products?.name} · {new Date(q.created_at).toLocaleString()}</p>
            <p className="font-medium mt-1">Q: {q.question}</p>
            {q.answer && (
              <div className="mt-2 pl-3 border-l-2 border-primary text-sm">
                <p>A: {q.answer}</p>
              </div>
            )}
            {!q.answer && (
              <div className="mt-3 space-y-2">
                <Textarea rows={2} value={reply[q.id] || ""} onChange={(e) => setReply({ ...reply, [q.id]: e.target.value })} placeholder="Reply…" />
                <Button size="sm" onClick={() => answer(q.id)}>Reply</Button>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="text-muted-foreground">No questions yet.</p>}
      </div>
    </div>
  );
};

export default Questions;
