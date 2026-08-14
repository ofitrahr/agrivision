import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Phone, MapPin } from 'lucide-react';

const PublicFooter = () => (
  <footer className="footer">
    <div className="footer-container">
      {/* 1. Integrated Pre-Footer CTA Banner */}
      <div className="footer-cta-banner">
        <div className="footer-cta-content">
          <h3 className="footer-cta-title">Siap Memantau Kesehatan Lahan &amp; Karbon Berbasis Satelit?</h3>
          <p className="footer-cta-subtitle">
            Jadwalkan konsultasi teknis atau demonstrasi langsung bersama tim spesialis agronomi Agrivision.
          </p>
        </div>
        <div className="footer-cta-actions">
          <Link to="/contact" className="btn-footer-cta-primary">
            Jadwalkan Konsultasi <ArrowRight size={16} />
          </Link>
          <a 
            href="https://wa.me/6285117142929?text=Halo%20Agrivision,%20saya%20tertarik%20dengan%20solusi%20satelit%20lahan%20dan%20MRV" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn-footer-cta-secondary"
          >
            <Phone size={15} /> WhatsApp Kami
          </a>
        </div>
      </div>

      {/* 2. Main Footer Grid */}
      <div className="footer-main-grid">
        {/* Brand Column */}
        <div className="footer-brand-col">
          <Link to="/" className="footer-brand-link">
            <img src="/assets/images/logo_icon.png" alt="Agrivision Logo" className="footer-brand-icon" />
            <div className="footer-brand-text">
              <span className="footer-brand-name">
                <span className="brand-agri-white">Agri</span><span className="brand-vision">vision</span>
              </span>
              <span className="footer-brand-tagline">See &bull; Regenerate &bull; Prosper</span>
            </div>
          </Link>
          
          <p className="footer-entity-desc">
            PT. Visi Agrikultur Indonesia — Climate-Smart Agriculture powered by AI &amp; Remote Sensing.
          </p>

          <div className="footer-contact-items">
            <div className="footer-contact-item">
              <MapPin size={15} className="contact-icon" />
              <span>Jl. Cisitu Indah 4 No.12, Dago, Coblong, Kota Bandung, Jawa Barat 40165</span>
            </div>
            <a href="mailto:agrivisionconnect@gmail.com" className="footer-contact-item">
              <Mail size={15} className="contact-icon" />
              <span>agrivisionconnect@gmail.com</span>
            </a>
            <a href="https://wa.me/6285117142929" target="_blank" rel="noopener noreferrer" className="footer-contact-item">
              <Phone size={15} className="contact-icon" />
              <span>(+62) 851-1714-2929</span>
            </a>
          </div>

          <div className="footer-socials">
            <a href="https://www.linkedin.com/company/agrivisiontechnology/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="footer-social-btn">
              <img src="/assets/icons/linkedin3.png" alt="LinkedIn" />
            </a>
            <a href="https://wa.me/6285117142929" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="footer-social-btn">
              <img src="/assets/icons/whatsapp.png" alt="WhatsApp" />
            </a>
            <a href="mailto:agrivisionconnect@gmail.com" aria-label="Email" className="footer-social-btn">
              <img src="/assets/icons/email3.png" alt="Email" />
            </a>
          </div>
        </div>

        {/* Column 1: Solutions */}
        <div className="footer-col">
          <h4 className="footer-col-title">Solutions</h4>
          <ul className="footer-col-list">
            <li><Link to="/signals">Five Signals</Link></li>
            <li><Link to="/mrv">End-to-End MRV</Link></li>
            <li><Link to="/login">Intelligence Dashboard</Link></li>
          </ul>
        </div>

        {/* Column 2: Company */}
        <div className="footer-col">
          <h4 className="footer-col-title">Company</h4>
          <ul className="footer-col-list">
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/about#team">Our Team</Link></li>
            <li><Link to="/about#activities">Activities</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>

        {/* Column 3: Access */}
        <div className="footer-col">
          <h4 className="footer-col-title">Access</h4>
          <ul className="footer-col-list">
            <li><Link to="/login">Client Portal</Link></li>
            <li><Link to="/contact">Request Demo</Link></li>
          </ul>
        </div>
      </div>

      {/* 3. Bottom Bar */}
      <div className="footer-bottom-bar">
        <p>&copy; 2025 PT. Visi Agrikultur Indonesia. All rights reserved.</p>
        <p>agrivisiontech.com</p>
      </div>
    </div>
  </footer>
);

export default PublicFooter;
