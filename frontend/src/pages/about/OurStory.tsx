import { useEffect } from "react";
import DieraHeader from "@/components/header/DieraHeader";
import Footer from "@/components/footer/Footer";
import PageHeader from "@/components/about/PageHeader";
import ContentSection from "@/components/about/ContentSection";
import ImageTextBlock from "@/components/about/ImageTextBlock";
import AboutSidebar from "@/components/about/AboutSidebar";

const OurStory = () => {
  useEffect(() => {
    document.title = "Our Story - Diera Shop | About Us";
  }, []);
  return (
    <div className="min-h-screen bg-background">
      <DieraHeader />

      <div className="flex max-w-7xl mx-auto">
        <AboutSidebar />

        <main className="flex-1 px-6 lg:px-12 py-6">
          <PageHeader
            title="Our Story"
            subtitle="Bringing authentic Nepali fashion to your wardrobe"
          />

          <ContentSection>
            <ImageTextBlock
              image="/founders.png"
              imageAlt="Diera Shop"
              title="Founded on Passion"
              content="Diera Shop was born from a deep love for Nepal's rich textile heritage and contemporary fashion. We started with a simple mission: to bring high-quality, handpicked clothing from Nepal to fashion enthusiasts who appreciate authenticity, quality, and cultural craftsmanship in every thread."
              imagePosition="left"
            />
          </ContentSection>

          <ContentSection title="Our Heritage">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h3 className="text-xl font-light text-foreground">Handpicked Quality</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Every garment in our collection is carefully selected for its exceptional quality and craftsmanship. We work directly with local artisans and manufacturers in Nepal, ensuring each piece meets our high standards for fabric quality, stitching, and design excellence.
                </p>
              </div>
              <div className="space-y-6">
                <h3 className="text-xl font-light text-foreground">Cultural Authenticity</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We celebrate Nepal's textile traditions while embracing contemporary fashion trends. From traditional patterns to modern silhouettes, our collection bridges cultural heritage with today's style preferences, offering clothing that's both meaningful and fashionable.
                </p>
              </div>
            </div>
          </ContentSection>

          <ContentSection title="Our Values">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-light text-foreground">Quality First</h3>
                <p className="text-muted-foreground">
                  We never compromise on quality. Each piece is inspected to ensure it meets our standards for durability and comfort.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-light text-foreground">Fair Practices</h3>
                <p className="text-muted-foreground">
                  We support fair trade and ethical sourcing, ensuring our partners receive fair compensation for their craftsmanship.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-light text-foreground">Customer Care</h3>
                <p className="text-muted-foreground">
                  Your satisfaction is our priority. We're dedicated to providing excellent service from browsing to delivery.
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

export default OurStory;