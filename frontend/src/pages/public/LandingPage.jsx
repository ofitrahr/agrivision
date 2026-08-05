import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../../assets/css/main.css';
import '../../assets/css/landing.css';

const LandingPage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const sliderRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // For stats counter
  useEffect(() => {
    const counters = document.querySelectorAll('.stat-number');
    const animateCounters = () => {
      counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const updateCount = () => {
          const current = +counter.innerText;
          const increment = target / 200;
          if (current < target) {
            counter.innerText = Math.ceil(current + increment);
            setTimeout(updateCount, 10);
          } else {
            counter.innerText = target;
          }
        };
        updateCount();
      });
    };

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        animateCounters();
      }
    });

    const statsSection = document.querySelector('.stats-section');
    if (statsSection) observer.observe(statsSection);

    return () => {
      if (statsSection) observer.unobserve(statsSection);
    };
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const slideActivities = (direction) => {
    if (sliderRef.current) {
      const card = sliderRef.current.querySelector('.activity-card');
      const cardWidth = card ? card.offsetWidth + 20 : 320; 
      sliderRef.current.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
    }
  };

  return (
    <div>
      {/* NAVBAR */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`} id="navbar">
        <div className="nav-logo">
          <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/assets/images/agrivision.png" alt="Agrivision Logo" />
          </Link>
        </div>
        <div className={`nav-menu ${isMobileMenuOpen ? 'active' : ''}`} id="navMenu">
          <Link to="/" className="nav-link active">Home</Link>
          <a href="#about" className="nav-link">About Us</a>
          <a href="#solutions" className="nav-link">Solutions</a>
          <a href="#activities" className="nav-link">Activities</a>
          <a href="#connect" className="nav-link">Contact</a>
        </div>
        <div className="nav-right">
          <Link to="/login" className="btn-login">Log In</Link>
          <a href="#connect" className="btn-request-demo">Request Demo</a>
          <button className={`nav-hamburger ${isMobileMenuOpen ? 'active' : ''}`} id="navHamburger" onClick={toggleMobileMenu}>
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>

      {/* 1. HERO */}
      <header className="hero" id="home">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">Climate-Smart and Regenerative Agriculture Solution</h1>
          <p className="hero-subtitle">Transforming Agriculture for Food Security and Carbon Neutrality</p>
          <div className="hero-actions">
            <Link to="/login" className="btn-demo">See Product Demo</Link>
            <a href="#connect" className="btn-demo-outline">Request a Consultation</a>
          </div>
        </div>
      </header>

      {/* STATS COUNTER */}
      <section className="stats-section">
        <div className="landing-stats-grid">
          <div className="stat-item">
            <div className="stat-number" data-target="2500">0</div>
            <div className="stat-suffix">Ha+</div>
            <div className="stat-label">Land Monitored</div>
          </div>
          <div className="stat-item">
            <div className="stat-number" data-target="12">0</div>
            <div className="stat-suffix">Ton C/Ha</div>
            <div className="stat-label">Avg Carbon Sequestered</div>
          </div>
          <div className="stat-item">
            <div className="stat-number" data-target="90">0</div>
            <div className="stat-suffix">%+</div>
            <div className="stat-label">Model Accuracy</div>
          </div>
          <div className="stat-item">
            <div className="stat-number" data-target="5">0</div>
            <div className="stat-suffix">Parameters</div>
            <div className="stat-label">Monitored per Farm</div>
          </div>
        </div>
      </section>

      {/* 2. WHO WE ARE */}
      <section className="section who-we-are" id="about">
        <div className="section-header-centered">
          <span className="section-label">WHO WE ARE</span>
          <h2 className="section-title text-center">Bridging Technology &amp;<br/>Regenerative Farming</h2>
          <p className="section-intro">By harnessing satellite data and AI power, we help businesses invest confidently in regenerative agriculture — improving crop productivity, farmer livelihoods, carbon sequestration capacity, and full supply-chain traceability.</p>
        </div>
        <div className="solutions-grid">
          <div className="solution-card">
            <img src="/assets/icons/leaf.png" alt="Regenerative Farming" />
            <h3>Regenerative Farming</h3>
            <p>Restoring soil health and biodiversity through sustainable farming ethics</p>
          </div>
          <div className="solution-card">
            <img src="/assets/icons/carbon-footprint.png" alt="Carbon Sequestration" />
            <h3>Carbon Sequestration Efforts</h3>
            <p>Designing the farming system so that it can capture atmospheric carbon emission</p>
          </div>
          <div className="solution-card">
            <img src="/assets/icons/wheat.png" alt="Crop Yield" />
            <h3>Crop Yield Enhancement</h3>
            <p>Enhancing crop output through efficient and resilient methods</p>
          </div>
          <div className="solution-card">
            <img src="/assets/icons/farmer.png" alt="Farmer Livelihoods" />
            <h3>Improvement of Farmer Livelihoods</h3>
            <p>Empowering farmers with income stability and better opportunities</p>
          </div>
          <div className="solution-card">
            <img src="/assets/icons/orbit.png" alt="Precision Agriculture" />
            <h3>Precision Agriculture using AI &amp; Remote Sensing</h3>
            <p>Leveraging data and technology for smarter, targeted farming</p>
          </div>
          <div className="solution-card">
            <img src="/assets/icons/survey.png" alt="Multi-Stakeholder" />
            <h3>Multi-Stakeholder Collaboration</h3>
            <p>Building strong partnerships across the agricultural value chain</p>
          </div>
        </div>
      </section>

      {/* 3. INTELLIGENCE DASHBOARD / SOLUTIONS */}
      <section className="section product-preview" id="solutions">
        <div className="preview-grid">
          <div className="preview-text">
            <span className="section-label">OUR PRODUCT</span>
            <h2 className="section-title">Intelligence Dashboard</h2>
            <p className="preview-desc">
              Monitor your farmland in real-time. Track 5 key parameters — NDVI, SOC, Yield, Biomass, and NPK — across all your plots, all in one place.
            </p>
            <ul className="preview-features">
              <li>✅ Interactive map with pixel-level detail</li>
              <li>✅ Anomaly detection &amp; alert system</li>
              <li>✅ Period-over-period comparison</li>
              <li>✅ Automated carbon credit reports</li>
              <li>✅ Per land-owner breakdown</li>
            </ul>
            <Link to="/login" className="btn-preview-demo">Try the Demo →</Link>
          </div>
          <div className="preview-image">
            <div className="preview-mockup">
              <div className="mockup-bar">
                <span></span><span></span><span></span>
              </div>
              <div className="mockup-content">
                <div className="mockup-map"></div>
                <div className="mockup-stats">
                  <div className="mockup-stat-bar" style={{width: '85%'}}></div>
                  <div className="mockup-stat-bar" style={{width: '65%'}}></div>
                  <div className="mockup-stat-bar" style={{width: '90%'}}></div>
                  <div className="mockup-stat-bar" style={{width: '70%'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="section how-it-works" id="how-it-works">
        <span className="section-label text-center" style={{display: 'block'}}>THE PROCESS</span>
        <h2 className="section-title text-center">How It Works</h2>
        <p className="section-subtitle text-center">From satellite to insight in 4 simple steps</p>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">01</div>
            <div className="step-icon">🛰️</div>
            <h3>Satellite Data Collection</h3>
            <p>We continuously collect Sentinel-2 satellite imagery over your farmland every quarter.</p>
          </div>
          <div className="step-card">
            <div className="step-number">02</div>
            <div className="step-icon">🤖</div>
            <h3>AI Analysis</h3>
            <p>Our machine learning models process the imagery to measure 5 key agricultural parameters.</p>
          </div>
          <div className="step-card">
            <div className="step-number">03</div>
            <div className="step-icon">📊</div>
            <h3>Intelligence Dashboard</h3>
            <p>Results are visualized in an interactive dashboard — maps, charts, trends, and anomaly alerts.</p>
          </div>
          <div className="step-card">
            <div className="step-number">04</div>
            <div className="step-icon">📄</div>
            <h3>Carbon Credit Report</h3>
            <p>Generate verified carbon reports ready for submission to Verra, Gold Standard, and other registries.</p>
          </div>
        </div>
      </section>

      {/* 5. OUR TEAM */}
      <section className="section our-team" id="team">
        <span className="section-label text-center" style={{display: 'block'}}>THE PEOPLE</span>
        <h2 className="section-title text-center">Our Team</h2>
        <div className="team-grid">
          <div className="team-card">
            <img src="/assets/images/Sofya Restu2.jpg" alt="Sofya Restu Seftyani" className="team-photo" />
            <h3>Sofya Restu Seftyani, M.Sc.</h3>
            <p className="team-role">Founder &amp; CEO</p>
            <p className="team-desc">7 years experience in agribusiness and integrated farming system</p>
          </div>
          <div className="team-card">
            <img src="/assets/images/Fitrah Ramadhan3.jpg" alt="Fitrah Ramadhan" className="team-photo" />
            <h3>Fitrah Ramadhan, M.Sc.</h3>
            <p className="team-role">Co-Founder &amp; CTO</p>
            <p className="team-desc">Expert in AI, remote sensing, and agricultural decision-support systems</p>
          </div>
          <div className="team-card">
            <img src="/assets/images/Nur Amalia3.jpg" alt="Nur Amelia" className="team-photo" />
            <h3>Nur Amelia, S.Ds.</h3>
            <p className="team-role">Co-Founder &amp; CBDO</p>
            <p className="team-desc">Specialist in sustainability and circular economy project for corporate</p>
          </div>
        </div>
      </section>

      {/* 6. CURRENT ACTIVITIES */}
      <section className="section activities-section" id="activities">
        <span className="section-label text-center" style={{display: 'block'}}>LATEST UPDATES</span>
        <h2 className="section-title text-center">Current Activities</h2>
        <div className="slider-wrapper">
          <div className="slider-track" id="activitySlider" ref={sliderRef}>
            <a href="#" className="activity-card">
              <img src="/assets/activities/251124_profile.png" alt="Field Visit" />
              <div className="activity-content">
                <h3>Field Visit with Local Farmers</h3>
                <p>Agrivision conducted a field visit in West Java to support capacity building and sustainable farming adoption.</p>
              </div>
            </a>
            <a href="#" className="activity-card">
              <img src="/assets/activities/251130_profile.png" alt="Satellite Monitoring" />
              <div className="activity-content">
                <h3>Satellite Monitoring Demo</h3>
                <p>Demonstration of using remote sensing to monitor vegetation growth and soil carbon regeneration.</p>
              </div>
            </a>
            <a href="#" className="activity-card">
              <img src="/assets/activities/251205_profile.png" alt="Corporate Training" />
              <div className="activity-content">
                <h3>Corporate Training on RegenAgri</h3>
                <p>Training session for private companies on regenerative agriculture and carbon-positive farming.</p>
              </div>
            </a>
          </div>
          <button className="slider-btn slider-prev" onClick={() => slideActivities(-1)}>&#10094;</button>
          <button className="slider-btn slider-next" onClick={() => slideActivities(1)}>&#10095;</button>
        </div>
      </section>

      {/* 7. OUR PARTNERS */}
      <section className="section partners-section">
        <h2 className="section-title text-center">Our Partners</h2>
        <div className="partners-wrapper">
          <div className="partners-track">
            <img src="/assets/partner/pt lapi.jpg" alt="PT Lapi" />
            <img src="/assets/partner/itb.jpg" alt="ITB" />
            <img src="/assets/partner/labtech.jpg" alt="Labtech" />
            <img src="/assets/partner/kadatuan.jpg" alt="Kadatuan" />
            <img src="/assets/partner/biosphereplus.jpg" alt="Biosphere Plus" />
            <img src="/assets/partner/btp.jpg" alt="BTP" />
            {/* Duplicate for infinite scroll */}
            <img src="/assets/partner/pt lapi.jpg" alt="PT Lapi" />
            <img src="/assets/partner/itb.jpg" alt="ITB" />
            <img src="/assets/partner/labtech.jpg" alt="Labtech" />
            <img src="/assets/partner/kadatuan.jpg" alt="Kadatuan" />
            <img src="/assets/partner/biosphereplus.jpg" alt="Biosphere Plus" />
            <img src="/assets/partner/btp.jpg" alt="BTP" />
          </div>
        </div>
      </section>

      {/* 8. LET'S CONNECT */}
      <section className="section connect-section" id="connect">
        <div className="connect-grid">
          <div className="connect-left">
            <h2 className="connect-title">Let's Connect!</h2>
            <a href="mailto:connect@agrivisiontech.com" className="contact-item">
              <img src="/assets/icons/email3.png" alt="Email" />
              <div>
                <h3>Email</h3>
                <p>connect@agrivisiontech.com</p>
              </div>
            </a>
            <div className="contact-item">
              <img src="/assets/icons/location3.png" alt="Location" />
              <div>
                <h3>Office Address</h3>
                <p>Jl. Haji Gari No.43B RT002/RW003 Pesanggrahan,<br/>Pesanggrahan, Jakarta Selatan 12320</p>
              </div>
            </div>
            <a href="https://www.linkedin.com/company/agrivisiontechnology/" target="_blank" rel="noopener noreferrer" className="contact-item">
              <img src="/assets/icons/linkedin3.png" alt="LinkedIn" />
              <div>
                <h3>LinkedIn</h3>
                <p>linkedin.com/company/agrivisiontechnology</p>
              </div>
            </a>
            <a href="https://wa.me/6290546670" target="_blank" rel="noopener noreferrer" className="contact-item">
              <img src="/assets/icons/whatsapp.png" alt="WhatsApp" />
              <div>
                <h3>Contact Number</h3>
                <p>+62 9054 6670 (Available on WhatsApp)</p>
              </div>
            </a>
          </div>
          <div className="connect-right">
            <h2 className="enquiry-title">Have Any Enquiries?</h2>
            <form action="https://formsubmit.co/ofitrahramadhan@gmail.com" method="POST" className="contact-form">
              <input type="hidden" name="_captcha" value="false" />
              <label>Name</label>
              <input type="text" name="name" required placeholder="Your full name" />
              <label>Email</label>
              <input type="email" name="email" required placeholder="your@email.com" />
              <label>Message</label>
              <textarea name="message" required placeholder="How can we help you?"></textarea>
              <button type="submit" className="btn-submit">Send Message</button>
            </form>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <img src="/assets/images/agrivision.png" alt="Agrivision" className="footer-logo" />
            <p className="footer-tagline">Climate-Smart Agriculture<br/>powered by AI &amp; Remote Sensing</p>
            <div className="footer-socials">
              <a href="https://www.linkedin.com/company/agrivisiontechnology/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              <a href="https://wa.me/6290546670" target="_blank" rel="noopener noreferrer">WhatsApp</a>
              <a href="mailto:connect@agrivisiontech.com">Email</a>
            </div>
          </div>
          <div className="footer-links">
            <h4>Platform</h4>
            <Link to="/login">Product Demo</Link>
            <a href="#about">About Us</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#connect">Contact</a>
          </div>
          <div className="footer-links">
            <h4>Resources</h4>
            <a href="#">Help Center</a>
            <a href="#">Methodology</a>
            <a href="#">Parameters Guide</a>
            <a href="#">FAQ</a>
          </div>
          <div className="footer-links">
            <h4>Company</h4>
            <a href="#about">About</a>
            <a href="#connect">Get in Touch</a>
            <Link to="/login">Client Login</Link>
            <a href="#">Privacy Policy</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 PT. Visi Agrikultur Indonesia. All rights reserved.</p>
          <p>agrivisiontech.com</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
