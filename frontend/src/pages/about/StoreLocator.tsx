import DieraHeader from "@/components/header/DieraHeader";
import Footer from "@/components/footer/Footer";
import PageHeader from "@/components/about/PageHeader";
import ContentSection from "@/components/about/ContentSection";
import StoreMap from "@/components/about/StoreMap";
import { Button } from "@/components/ui/button";
import AboutSidebar from "@/components/about/AboutSidebar";

const StoreLocator = () => {
  const stores = [
    {
      name: "Diera Shop",
      address: "Opp to Bricks Cafe",
      phone: "+977 9981234567",
      hours: "Sunday-Friday: 10AM-8PM",
      services: ["Personal Shopping", "Custom Design", "Repairs", "Appraisals"],
      mapUrl: "https://www.google.com/maps/place/Diera+Shop/@27.685671,85.3179358,20z/data=!4m6!3m5!1s0x39eb19ff47b3cb17:0x64bf31fe9f44eaa3!8m2!3d27.6857695!4d85.3233144!16s%2Fg%2F11xz16s28n",
      directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=27.6857695,85.3233144&destination_place_id=ChIJF8uzR_8ZbTkRo-pE_v4xv2Q"
    }];

  return (
    <div className="min-h-screen bg-background">
      <DieraHeader />
      
      <div className="flex max-w-7xl mx-auto">
        <AboutSidebar />
        
        <main className="flex-1 px-6 lg:px-12 py-8">
        <PageHeader 
          title="Store Locator" 
          subtitle="Visit us in person for a clothes experience"
        />
        
        <ContentSection title="Interactive Store Map">
          <StoreMap />
        </ContentSection>

        <ContentSection title="Our Locations">
          <div className="grid gap-8">
            {stores.map((store, index) => (
              <div key={index} className="bg-background rounded-lg p-8 border border-border">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-xl font-light text-foreground">{store.name}</h3>
                    <div className="space-y-2 text-muted-foreground">
                      <p>{store.address}</p>
                      <p>{store.phone}</p>
                      <p>{store.hours}</p>
                    </div>
                    
                    <div className="pt-4">
                      <Button 
                        variant="outline" 
                        className="rounded-none"
                        asChild
                      >
                        <a 
                          href={store.directionsUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          Get Directions
                        </a>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-lg font-light text-foreground">Available Services</h4>
                    <ul className="grid grid-cols-2 gap-2">
                      {store.services.map((service, serviceIndex) => (
                        <li key={serviceIndex} className="text-sm text-muted-foreground flex items-center">
                          <span className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></span>
                          {service}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ContentSection>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default StoreLocator;