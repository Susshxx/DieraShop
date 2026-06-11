interface Store {
  name: string;
  address: string;
  phone: string;
  hours: string;
  lat: number;
  lng: number;
}

const stores: Store[] = [
  {
    name: "Diera Shop",
    address: "Opp to Bricks Cafe",
    phone: "+977 9981234567",
    hours: "Sunday-Friday: 10AM-8PM",
    lat: 27.6857695,
    lng: 85.3233144
  }
];

const StoreMap = () => {
  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-border bg-muted/10 relative">
      {/* Google Maps Embed with Diera Shop location */}
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3532.5668745234!2d85.32110737613179!3d27.685769524971665!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb19ff47b3cb17%3A0x64bf31fe9f44eaa3!2sDiera%20Shop!5e0!3m2!1sen!2snp!4v1717500000000!5m2!1sen!2snp"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="w-full h-full"
      />
      
      {/* Overlay with store information */}
      <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-4 max-w-xs">
        <h4 className="text-sm font-medium text-foreground mb-3">Our Location</h4>
        <div className="space-y-2">
          {stores.map((store, index) => (
            <div key={index} className="text-xs">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                <span className="font-medium text-foreground">{store.name}</span>
              </div>
              <p className="text-muted-foreground ml-4">{store.address}</p>
              <p className="text-muted-foreground ml-4">{store.phone}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoreMap;