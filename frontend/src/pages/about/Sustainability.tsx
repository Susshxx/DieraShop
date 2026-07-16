import DieraHeader from "@/components/header/DieraHeader";
import Footer from "@/components/footer/Footer";
import PageHeader from "@/components/about/PageHeader";
import ContentSection from "@/components/about/ContentSection";
import AboutSidebar from "@/components/about/AboutSidebar";

const Sustainability = () => {
  return (
    <div className="min-h-screen bg-background">
      <DieraHeader />
      
      <div className="flex max-w-7xl mx-auto">
        <AboutSidebar />
        
        <main className="flex-1 px-6 lg:px-12 py-6">
        <PageHeader 
          title="Sustainability" 
          subtitle="Creating beautiful fashion while celebrating Nepali craftsmanship and protecting our environment"
        />
        
        <ContentSection title="Our Commitment to Nepal">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
              <h3 className="text-xl font-light text-foreground">Local Craftsmanship</h3>
              <p className="text-muted-foreground leading-relaxed">
                We proudly work with skilled Nepali artisans and tailors who bring generations of expertise to every piece. By partnering with local craftspeople, we preserve traditional techniques while providing sustainable livelihoods to families across Nepal.
              </p>
            </div>
            <div className="space-y-6">
              <h3 className="text-xl font-light text-foreground">Eco-Friendly Materials</h3>
              <p className="text-muted-foreground leading-relaxed">
                We prioritize natural, breathable fabrics sourced responsibly. Our collection features cotton, silk, and traditional Nepali textiles that are gentle on both your skin and the environment, reducing our ecological footprint.
              </p>
            </div>
          </div>

          <div className="bg-muted/10 rounded-lg p-8">
            <h3 className="text-2xl font-light text-foreground mb-6">Our Impact Goals</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="text-3xl font-light text-primary mb-2">100%</div>
                <p className="text-sm text-muted-foreground">Made in Nepal by local artisans</p>
              </div>
              <div>
                <div className="text-3xl font-light text-primary mb-2">80%</div>
                <p className="text-sm text-muted-foreground">Natural and sustainable fabrics</p>
              </div>
              <div>
                <div className="text-3xl font-light text-primary mb-2">Zero</div>
                <p className="text-sm text-muted-foreground">Exploitation - fair wages for all</p>
              </div>
            </div>
          </div>
        </ContentSection>

        <ContentSection title="Supporting Local Communities">
          <div className="space-y-8">
            <p className="text-lg text-muted-foreground leading-relaxed">
              Every purchase supports Nepali families and helps preserve traditional crafts. We believe in creating value that goes beyond fashion - empowering communities and celebrating our rich cultural heritage.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-light text-foreground">Fair Employment</h3>
                <p className="text-muted-foreground">
                  We provide fair wages, safe working conditions, and opportunities for growth to all our team members and partner artisans throughout Nepal.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-light text-foreground">Quality Over Quantity</h3>
                <p className="text-muted-foreground">
                  We focus on creating timeless, durable pieces that last for years, reducing the need for fast fashion and minimizing waste in our beautiful country.
                </p>
              </div>
            </div>
          </div>
        </ContentSection>

        <ContentSection title="Environmental Responsibility">
          <div className="space-y-8">
            <p className="text-muted-foreground leading-relaxed">
              As a Nepali brand, we understand the importance of protecting our pristine Himalayan environment. We are committed to sustainable practices that honor our natural heritage.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-light text-foreground">Minimal Waste</h3>
                <p className="text-muted-foreground">
                  Our production process minimizes fabric waste, and leftover materials are repurposed or recycled, keeping our workshops and communities clean.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-light text-foreground">Eco-Friendly Packaging</h3>
                <p className="text-muted-foreground">
                  We use recyclable and biodegradable packaging materials, reducing plastic waste and protecting Nepal's natural beauty for future generations.
                </p>
              </div>
            </div>
          </div>
        </ContentSection>

        <ContentSection title="Our Promise">
          <div className="space-y-8">
            <p className="text-muted-foreground leading-relaxed">
              Diera Shop is more than a clothing brand - we are a celebration of Nepali culture, craftsmanship, and sustainable fashion. Every piece tells a story of skilled hands, traditional techniques, and our commitment to a better future for Nepal.
            </p>
            
            <div className="bg-muted/10 rounded-lg p-6">
              <p className="text-foreground font-light italic">
                "When you choose Diera, you're not just buying clothes - you're supporting Nepali families, preserving traditional crafts, and contributing to a more sustainable fashion industry in Nepal."
              </p>
            </div>
          </div>
        </ContentSection>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default Sustainability;