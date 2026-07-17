import DieraHeader from "@/components/header/DieraHeader";
import Footer from "@/components/footer/Footer";
import PageHeader from "@/components/about/PageHeader";
import ContentSection from "@/components/about/ContentSection";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import AboutSidebar from "@/components/about/AboutSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Edit2, Plus, Trash2 } from "lucide-react";

interface FAQ {
  _id: string;
  question: string;
  answer: string;
  order: number;
  active: boolean;
}

const CustomerCare = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === "admin";
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ question: "", answer: "", order: 0 });

  useEffect(() => {
    fetchFaqs();
  }, [isAdmin]);

  const fetchFaqs = async () => {
    try {
      const endpoint = isAdmin ? "/faqs/all" : "/faqs";
      const data = await api.get<FAQ[]>(endpoint);
      setFaqs(data);
    } catch (error) {
      console.error("Failed to fetch FAQs:", error);
    }
  };

  const handleStartChat = () => {
    if (!user) {
      toast.error("Please sign in to start a chat");
      navigate("/auth/login");
      return;
    }
    navigate("/account/chat");
  };

  const openDialog = (faq?: FAQ) => {
    if (faq) {
      setEditingFaq(faq);
      setFormData({ question: faq.question, answer: faq.answer, order: faq.order });
    } else {
      setEditingFaq(null);
      setFormData({ question: "", answer: "", order: faqs.length });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingFaq) {
        const updated = await api.patch<FAQ>(`/faqs/${editingFaq._id}`, formData);
        setFaqs(faqs.map(f => f._id === updated._id ? updated : f));
        toast.success("FAQ updated successfully");
      } else {
        const created = await api.post<FAQ>("/faqs", formData);
        setFaqs([...faqs, created]);
        toast.success("FAQ created successfully");
      }
      setDialogOpen(false);
      setFormData({ question: "", answer: "", order: 0 });
    } catch (error) {
      toast.error("Failed to save FAQ");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      await api.delete(`/faqs/${id}`);
      setFaqs(faqs.filter(f => f._id !== id));
      toast.success("FAQ deleted successfully");
    } catch (error) {
      toast.error("Failed to delete FAQ");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DieraHeader />
      
      <div className="flex max-w-7xl mx-auto">
        <AboutSidebar />
        
        <main className="flex-1 px-6 lg:px-12 py-6">
        <PageHeader 
          title="Customer Care" 
          subtitle="We're here to help you with all your fashion needs"
        />
        
        <ContentSection title="Contact Information">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-light text-foreground">Phone</h3>
              <p className="text-muted-foreground"><a href="tel:+9779818276861" className="hover:text-primary transition-colors">+977 9818276861</a></p>
              <p className="text-sm text-muted-foreground">Sunday-Friday: 10AM-7:30PM</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-light text-foreground">Location</h3>
              <p className="text-muted-foreground">Diera Shop</p>
              <p className="text-sm text-muted-foreground">Visit us during business hours</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-light text-foreground">Live Chat</h3>
              <Button variant="outline" className="rounded-none" onClick={handleStartChat}>
                Start Chat
              </Button>
              <p className="text-sm text-muted-foreground">Available during business hours</p>
            </div>
          </div>
        </ContentSection>

        <ContentSection title="Frequently Asked Questions">
          {isAdmin && (
            <div className="mb-4">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => openDialog()} className="rounded-none">
                    <Plus className="w-4 h-4 mr-2" />
                    Add FAQ
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingFaq ? "Edit FAQ" : "Add New FAQ"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Question</label>
                      <Input
                        value={formData.question}
                        onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                        placeholder="Enter question"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Answer</label>
                      <Textarea
                        value={formData.answer}
                        onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                        placeholder="Enter answer"
                        rows={4}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Order</label>
                      <Input
                        type="number"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSave}>Save</Button>
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.length === 0 && (
              <p className="text-muted-foreground">No FAQs available yet.</p>
            )}
            {faqs.map((faq) => (
              <AccordionItem key={faq._id} value={faq._id} className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <span>{faq.question}</span>
                    {isAdmin && (
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openDialog(faq)}
                          className="h-8 w-8"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(faq._id)}
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ContentSection>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default CustomerCare;