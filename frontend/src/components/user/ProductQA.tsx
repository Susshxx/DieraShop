import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { connectSocket } from "@/lib/socket";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface Q {
  id: string;
  question: string;
  user_id: string;
  created_at: string;
  answer?: string;
  answered_at?: string;
}

const ProductQA = ({ productId }: { productId: string }) => {
  const { user, role } = useAuth();
  const [items, setItems] = useState<Q[]>([]);
  const [q, setQ] = useState("");
  const [answerFor, setAnswerFor] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");

  const load = async () => {
    const data = await api.get<Q[]>(`/questions/product/${productId}`);
    setItems(data || []);
  };

  useEffect(() => { load(); }, [productId]);

  useEffect(() => {
    const socket = connectSocket();
    const onUpdate = () => load();
    socket.on("product_questions", onUpdate);
    socket.on("product_answers", onUpdate);
    return () => {
      socket.off("product_questions", onUpdate);
      socket.off("product_answers", onUpdate);
    };
  }, [productId]);

  const ask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to ask a question");
      return;
    }
    if (!q.trim()) {
      toast.error("Please enter a question");
      return;
    }
    try {
      await api.post("/questions", { productId, question: q.trim() });
      setQ("");
      toast.success("Question posted");
      load();
    } catch (err) {
      console.error("Error posting question:", err);
      toast.error(err instanceof Error ? err.message : "Failed to post question");
    }
  };

  const answer = async (qid: string) => {
    if (!user || !answerText.trim()) return;
    try {
      await api.patch(`/admin/questions/${qid}/answer`, { answer: answerText.trim() });
      setAnswerFor(null);
      setAnswerText("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-medium">Questions & Answers</h2>

      {user && role !== 'admin' ? (
        <form onSubmit={ask} className="space-y-2">
          <Textarea value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask a question about this product…" rows={2} className="text-xs" />
          <Button type="submit" size="sm" disabled={!q.trim()}>Post question</Button>
        </form>
      ) : user && role === 'admin' ? (
        <p className="text-xs text-muted-foreground italic">
          Admins can answer questions but cannot ask them.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          <Link to="/auth/login" className="text-primary underline">Sign in</Link> to ask a question.
        </p>
      )}

      <div className="space-y-3">
        {items.length === 0 && <p className="text-xs text-muted-foreground">No questions yet.</p>}
        {items.map((item) => (
          <div key={item.id} className="border border-border rounded p-3 bg-card">
            <p className="text-xs font-medium">Q: {item.question}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(item.created_at).toLocaleDateString()}</p>
            <div className="mt-2 space-y-1 pl-3 border-l-2 border-primary">
              {item.answer ? (
                <div>
                  <p className="text-xs">A: {item.answer}</p>
                  {item.answered_at && <p className="text-[10px] text-muted-foreground">{new Date(item.answered_at).toLocaleDateString()}</p>}
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground italic">Awaiting answer…</p>
              )}
            </div>
            {role === "admin" && !item.answer && (
              <div className="mt-2">
                {answerFor === item.id ? (
                  <div className="space-y-2">
                    <Textarea value={answerText} onChange={(e) => setAnswerText(e.target.value)} rows={2} placeholder="Write an answer…" className="text-xs" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => answer(item.id)}>Reply</Button>
                      <Button size="sm" variant="ghost" onClick={() => setAnswerFor(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setAnswerFor(item.id)}>Answer</Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProductQA;
