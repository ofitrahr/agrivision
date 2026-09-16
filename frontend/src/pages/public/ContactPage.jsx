import { useState } from 'react';
import { Mail, MapPin, Globe, PhoneCall, Send, CheckCircle2 } from 'lucide-react';
import PublicNavbar from './components/PublicNavbar';
import PublicFooter from './components/PublicFooter';
import useScrollReveal from '../../shared/utils/useScrollReveal';
import '../../assets/css/landing.css';

const ContactPage = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const heroRef = useScrollReveal();
  const formRef = useScrollReveal();
  const infoRef = useScrollReveal();

  const handleFormSubmit = () => {
    setIsSubmitted(true);
  };

  return (
    <div className="page-wrapper">
      <PublicNavbar />

      {/* PAGE HEADER - SPLIT LAYOUT */}
      <header className="hero-split hero-split--contact" ref={heroRef}>
        <div className="hero-split-left">
          <div className="hero-split-content">
            <h1>Connect with AgriVision</h1>
            <p>
              Whether you want to screen farmland, implement carbon MRV, or explore our agronomy dashboard, our team is ready to assist you.
            </p>
          </div>
          {/* Organic Vertical Seam Curve */}
          <div className="hero-vertical-seam" aria-hidden="true">
            <svg viewBox="0 0 60 800" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,0 C60,240 60,560 0,800 L0,800 L0,0 Z" fill="var(--color-primary)"></path>
            </svg>
          </div>
        </div>
        <div className="hero-split-right">
          <img src="/assets/images/hero_contact.png" alt="Agricultural rolling hills" />
        </div>
        <div className="hero-wave">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,32 C280,96 520,12 800,64 C1080,116 1280,24 1440,48 L1440,120 L0,120 Z" fill="var(--color-surface)"></path>
          </svg>
        </div>
      </header>

      {/* CONTACT LAYOUT WITH FLOATING FORM */}
      <div className="contact-layout-wrapper" ref={formRef}>
        <div className="contact-floating-container">
          <div className="contact-split-grid">
            
            {/* LEFT COLUMN: DIRECT CONTACT INFO */}
            <div className="contact-left-col scroll-reveal" ref={infoRef}>
              <h2 className="contact-section-title">Reach Out Directly</h2>
              <div className="contact-cards-grid">
                
                <a href="mailto:agrivisionconnect@gmail.com" className="contact-info-card">
                  <div className="contact-icon-box"><Mail size={22} className="text-main-green" /></div>
                  <h3>Email</h3>
                  <p>agrivisionconnect@gmail.com</p>
                </a>

                <div className="contact-info-card">
                  <div className="contact-icon-box"><MapPin size={22} className="text-main-green" /></div>
                  <h3>Office Address</h3>
                  <p>Jl. Cisitu Indah 4 No.12, Dago, Coblong, Kota Bandung, Jawa Barat 40165</p>
                </div>

                <a href="https://www.linkedin.com/company/agrivisiontechnology/" target="_blank" rel="noopener noreferrer" className="contact-info-card">
                  <div className="contact-icon-box"><Globe size={22} className="text-main-green" /></div>
                  <h3>LinkedIn</h3>
                  <p>linkedin.com/company/agrivisiontechnology</p>
                </a>

                <a href="https://wa.me/6285117142929" target="_blank" rel="noopener noreferrer" className="contact-info-card">
                  <div className="contact-icon-box"><PhoneCall size={22} className="text-main-green" /></div>
                  <h3>Contact / WhatsApp</h3>
                  <p>(+62) 851-1714-2929</p>
                </a>

              </div>
            </div>

            {/* RIGHT COLUMN: FLOATING CONSULTATION FORM */}
            <div className="contact-floating-form-col">
              <div className="contact-form-card">
                <h2 className="enquiry-title">Request a Consultation</h2>
                {isSubmitted ? (
                  <div className="form-success-message">
                    <CheckCircle2 size={48} className="text-main-green mb-3" />
                    <h3>Thank you for reaching out!</h3>
                    <p>Our team has received your message and will respond within 1 business day.</p>
                  </div>
                ) : (
                  <form action="https://formsubmit.co/agrivisionconnect@gmail.com" method="POST" onSubmit={handleFormSubmit} className="contact-form">
                    <input type="hidden" name="_captcha" value="false" />
                    
                    <label>Full Name</label>
                    <input type="text" name="name" required placeholder="e.g. Budi Santoso" />

                    <label>Work Email</label>
                    <input type="email" name="email" required placeholder="budi@company.com" />

                    <label>Organization / Company</label>
                    <input type="text" name="company" placeholder="e.g. PT Agribisnis Nusantara" />

                    <label>Area of Interest</label>
                    <select name="interest" defaultValue="mrv" className="contact-select">
                      <option value="mrv">End-to-End Carbon MRV</option>
                      <option value="signals">Five Signals &amp; Agronomy Intelligence</option>
                      <option value="traceability">Supply Chain Traceability</option>
                      <option value="demo">General Product Demo</option>
                      <option value="other">Partnership / Research</option>
                    </select>

                    <label>Message</label>
                    <textarea name="message" required placeholder="Tell us about your farmland size, crop types, or project goals..."></textarea>

                    <button type="submit" className="btn-submit">
                      <Send size={16} style={{ display: 'inline', marginRight: '8px' }} />
                      Submit Request
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
};

export default ContactPage;
