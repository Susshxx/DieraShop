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
    address: "Diera Shop",
    phone: "+977 9818276861",
    hours: "Sunday-Friday: 10AM-8PM",
    lat: 27.6855447,
    lng: 85.3176986
  }
];

const StoreMap = () => {
  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-border bg-muted/10 relative">
      {/* Google Maps Embed with Bricks Cafe location */}
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3532.587394!2d85.3151237!3d27.6855494!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb19b437538aad%3A0xce90329ca745c9f3!2sBricks%20Cafe!5e0!3m2!1sen!2snp!4v1717500000000!5m2!1sen!2snp"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="w-full h-full"
      />
      
      {/* Overlay with store information */}
      <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg p-4 max-w-xs">
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