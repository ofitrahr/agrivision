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

  const handleFormSubmit = () => {
    setIsSubmitted(true);
  };

  return (
    <div className="page-wrapper">
      <PublicNavbar />

      {/* PAGE HEADER */}
      <header className="page-header-banner" ref={heroRef}>
        <div className="page-header-container">
          <span className="section-label">GET IN TOUCH</span>
          <h1 className="page-header-title">Connect with Agrivision</h1>
          <p className="page-header-desc">
            Whether you want to screen farmland, implement carbon MRV, or explore our agronomy dashboard, our team is ready to assist you.
          </p>
        </div>
      </header>

      {/* CONTACT MAIN SECTION */}
      <section className="landing-section connect-section scroll-reveal" ref={formRef}>
        <div className="connect-grid">
          {/* CONTACT INFO */}
          <div className="connect-left">
            <h2 className="connect-title">Reach Out Directly</h2>
            
            <a href="mailto:agrivisionconnect@gmail.com" className="contact-item">
              <div className="contact-icon-box"><Mail size={22} className="text-main-green" /></div>
              <div>
                <h3>Email</h3>
                <p>agrivisionconnect@gmail.com</p>
              </div>
            </a>

            <div className="contact-item">
              <div className="contact-icon-box"><MapPin size={22} className="text-main-green" /></div>
              <div>
                <h3>Office Address</h3>
                <p>Jl. Cisitu Indah 4 No.12, Dago,<br />Kecamatan Coblong, Kota Bandung, Jawa Barat 40165</p>
              </div>
            </div>

            <a href="https://www.linkedin.com/company/agrivisiontechnology/" target="_blank" rel="noopener noreferrer" className="contact-item">
              <div className="contact-icon-box"><Globe size={22} className="text-main-green" /></div>
              <div>
                <h3>LinkedIn</h3>
                <p>linkedin.com/company/agrivisiontechnology</p>
              </div>
            </a>

            <a href="https://wa.me/6285117142929" target="_blank" rel="noopener noreferrer" className="contact-item">
              <div className="contact-icon-box"><PhoneCall size={22} className="text-main-green" /></div>
              <div>
                <h3>Contact Number / WhatsApp</h3>
                <p>(+62) 851-1714-2929</p>
              </div>
            </a>
          </div>

          {/* CONTACT FORM */}
          <div className="connect-right">
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
                  Send Inquiry
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default ContactPage;
