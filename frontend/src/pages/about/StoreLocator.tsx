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
      address: "Bricks Cafe Building",
      phone: "+977 9818276861",
      hours: "Sunday-Friday: 10AM-7:30PM",
      services: ["Personal Shopping", "Custom Design","Quality Products"],
      mapUrl: "https://www.google.com/maps/place/Bricks+Cafe/@27.6855494,85.3151237,17z/data=!4m14!1m7!3m6!1s0x39eb19b437538aad:0xce90329ca745c9f3!2sBricks+Cafe!8m2!3d27.6855447!4d85.3176986!16s%2Fg%2F1hc5m0c6x!3m5!1s0x39eb19b437538aad:0xce90329ca745c9f3!8m2!3d27.6855447!4d85.3176986!16s%2Fg%2F1hc5m0c6x?entry=ttu&g_ep=EgoyMDI2MDcxMy4wIKXMDSoASAFQAw%3D%3D",
      directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=27.6855447,85.3176986&destination_place_id=ChIJrdU1R7sZbTkR88dKn_4xv2Q"
    }];

  return (
    <div className="min-h-screen bg-background">
      <DieraHeader />
      
      <div className="flex max-w-7xl mx-auto">
        <AboutSidebar />
        
        <main className="flex-1 px-6 lg:px-12 py-6">
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