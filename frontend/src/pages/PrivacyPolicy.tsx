import { useEffect } from "react";
import DieraHeader from "@/components/header/DieraHeader";
import Footer from "@/components/footer/Footer";

const PrivacyPolicy = () => {
  useEffect(() => {
    document.title = "Privacy Policy - Diera Shop";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <DieraHeader />
      
      <main className="pt-6">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <header className="mb-12 text-center">
            <h1 className="text-4xl font-light italic text-foreground mb-4" style={{ fontFamily: 'Playball, cursive' }}>Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: January 15, 2025</p>
          </header>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                At Diera Shop ("we," "our," or "us"), we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, make a purchase, or interact with our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-light text-foreground mb-2">Personal Information</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We may collect personal information that you provide directly to us, including:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                    <li>Name, email address, and contact information</li>
                    <li>Billing and shipping addresses within Nepal</li>
                    <li>Payment information (processed securely through PhonePay, eSewa, Khalti, or Cash on Delivery)</li>
                    <li>Account preferences and communication settings</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-light text-foreground mb-2">Usage Information</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We automatically collect certain information about your device and usage patterns, including IP address, browser type, pages visited, and interaction data to improve our services and user experience.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use the information we collect for various purposes, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Processing and fulfilling your clothing orders</li>
                <li>Arranging delivery to your location in Nepal</li>
                <li>Providing customer support and responding to inquiries</li>
                <li>Sending promotional communications about new collections (with your consent)</li>
                <li>Improving our website functionality and user experience</li>
                <li>Preventing fraud and ensuring security</li>
                <li>Complying with legal obligations under Nepali law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Information Sharing and Disclosure</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>With delivery service providers for order fulfillment</li>
                <li>With payment processors (PhonePay, eSewa, Khalti)</li>
                <li>When required by law or to protect our rights</li>
                <li>With your explicit consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Your Rights and Choices</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You have certain rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Access to your personal information</li>
                <li>Correction of inaccurate or incomplete information</li>
                <li>Deletion of your personal information</li>
                <li>Objection to or restriction of processing</li>
                <li>Data portability</li>
                <li>Withdrawal of consent (where applicable)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Cookies and Tracking</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar tracking technologies to enhance your browsing experience, analyze website traffic, and personalize content. You can control cookie settings through your browser preferences, though this may affect website functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on our website and updating the "Last updated" date above.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
              </p>
              <div className="mt-4 text-muted-foreground">
                <p>Email: privacy@dierashop.com</p>
                <p>Phone: +977 (01) 555-0123</p>
                <p>Address: Kathmandu, Nepal</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;