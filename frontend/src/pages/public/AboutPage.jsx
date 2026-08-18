import { useRef } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from './components/PublicNavbar';
import PublicFooter from './components/PublicFooter';
import useScrollReveal from '../../shared/utils/useScrollReveal';
import '../../assets/css/landing.css';

const AboutPage = () => {
  const sliderRef = useRef(null);
  const heroRef = useScrollReveal();
  const missionRef = useScrollReveal();
  const valuesRef = useScrollReveal();
  const teamRef = useScrollReveal();
  const activitiesRef = useScrollReveal();
  const partnersRef = useScrollReveal();

  const slideActivities = (direction) => {
    if (sliderRef.current) {
      const card = sliderRef.current.querySelector('.activity-card');
      const cardWidth = card ? card.offsetWidth + 20 : 320;
      sliderRef.current.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
    }
  };

  return (
    <div className="page-wrapper">
      <PublicNavbar />

      {/* PAGE HEADER - SPLIT LAYOUT */}
      <header className="hero-split hero-split--subpage" ref={heroRef}>
        <div className="hero-split-left">
          <div className="hero-split-content">
            <span className="hero-tag-pill">About Us</span>
            <h1>Bridging Technology &amp; Regenerative Farming</h1>
            <p>
              We empower agribusinesses, project developers, and farming communities with satellite AI intelligence to accelerate food security and carbon neutrality.
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
          <img src="/assets/images/hero_about.png" alt="Agricultural mission landscape" />
        </div>
        <div className="hero-wave">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,32 C280,96 520,12 800,64 C1080,116 1280,24 1440,48 L1440,120 L0,120 Z" fill="var(--color-surface)"></path>
          </svg>
        </div>
      </header>

      {/* VISION & MISSION */}
      <section className="landing-section scroll-reveal" ref={missionRef}>
        <div className="about-mission-box">
          <div className="mission-item">
            <span className="section-label">OUR VISION</span>
            <h2>Catalyzing the Next Era of Resilient Agriculture</h2>
            <p>
              To become the leading climate-smart agriculture intelligence platform in Southeast Asia, turning degraded agricultural lands into highly productive, verified carbon sinks.
            </p>
          </div>
          <div className="mission-item">
            <span className="section-label">OUR MISSION</span>
            <h2>Accessible Remote Sensing for Every Hectare</h2>
            <p>
              By combining high-resolution satellite remote sensing with calibrated machine learning, we make farm monitoring, carbon MRV, and supply chain traceability seamless, transparent, and affordable.
            </p>
          </div>
        </div>
      </section>

      {/* SIX PILLARS OF IMPACT */}
      <section className="landing-section who-we-are scroll-reveal" ref={valuesRef}>
        <div className="section-header-centered">
          <span className="section-label">WHAT DRIVES US</span>
          <h2 className="section-title text-center">Our Core Impact Principles</h2>
          <p className="section-intro">
            Every feature on our platform is built to create tangible value for growers, landowners, and corporate buyers.
          </p>
        </div>
        <div className="solutions-grid">
          <div className="solution-card">
            <img src="/assets/icons/leaf.png" alt="Regenerative Farming" />
            <h3>Regenerative Farming</h3>
            <p>Restoring topsoil vitality, water retention, and microbial biodiversity through science-backed practices.</p>
          </div>
          <div className="solution-card">
            <img src="/assets/icons/carbon-footprint.png" alt="Carbon Sequestration" />
            <h3>Carbon Sequestration</h3>
            <p>Designing and monitoring agricultural systems to reliably capture and store atmospheric carbon.</p>
          </div>
          <div className="solution-card">
            <img src="/assets/icons/wheat.png" alt="Crop Yield" />
            <h3>Crop Yield Enhancement</h3>
            <p>Enhancing crop output through precision nutrient management and proactive stress mitigation.</p>
          </div>
          <div className="solution-card">
            <img src="/assets/icons/farmer.png" alt="Farmer Livelihoods" />
            <h3>Farmer Livelihoods</h3>
            <p>Empowering smallholder farmers with income stability, technical capacity, and premium market access.</p>
          </div>
          <div className="solution-card">
            <img src="/assets/icons/orbit.png" alt="Precision Agriculture" />
            <h3>AI &amp; Remote Sensing</h3>
            <p>Harnessing satellite data streams and computer vision for continuous, non-invasive farm intelligence.</p>
          </div>
          <div className="solution-card">
            <img src="/assets/icons/survey.png" alt="Multi-Stakeholder" />
            <h3>Multi-Stakeholder Collaboration</h3>
            <p>Uniting farmers, academic institutions, corporate buyers, and financial entities under one trusted ledger.</p>
          </div>
        </div>
      </section>

      {/* LEADERSHIP TEAM */}
      <section className="landing-section our-team scroll-reveal" id="team" ref={teamRef}>
        <span className="section-label text-center" style={{ display: 'block' }}>THE PEOPLE</span>
        <h2 className="section-title text-center">Leadership Team</h2>
        <div className="team-grid">
          <div className="team-card">
            <img src="/assets/images/Sofya Restu2.jpg" alt="Sofya Restu Seftyani" className="team-photo" />
            <div className="team-overlay">
              <p className="team-role">Founder &amp; CEO</p>
              <h3>Sofya Restu Seftyani, M.Sc.</h3>
              <p className="team-desc">7 years experience in agribusiness and integrated farming systems.</p>
            </div>
          </div>
          <div className="team-card">
            <img src="/assets/images/Fitrah Ramadhan3.jpg" alt="Fitrah Ramadhan" className="team-photo" />
            <div className="team-overlay">
              <p className="team-role">Co-Founder &amp; CTO</p>
              <h3>Fitrah Ramadhan, M.Sc.</h3>
              <p className="team-desc">Expert in AI, remote sensing, and agricultural decision-support systems.</p>
            </div>
          </div>
          <div className="team-card">
            <img src="/assets/images/Nur Amalia3.jpg" alt="Nur Amelia" className="team-photo" />
            <div className="team-overlay">
              <p className="team-role">Co-Founder &amp; CBDO</p>
              <h3>Nur Amelia, S.Ds.</h3>
              <p className="team-desc">Specialist in sustainability and circular economy projects for corporate clients.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CURRENT ACTIVITIES SLIDER */}
      <section className="landing-section activities-section scroll-reveal" id="activities" ref={activitiesRef}>
        <span className="section-label text-center" style={{ display: 'block' }}>FIELD UPDATES</span>
        <h2 className="section-title text-center">Recent Activities</h2>
        <div className="slider-wrapper">
          <div className="slider-track" id="activitySlider" ref={sliderRef}>
            <div className="activity-card">
              <img src="/assets/activities/251124_profile.png" alt="Field Visit" />
              <div className="activity-content">
                <h3>Field Visit with Local Farmers</h3>
                <p>Agrivision conducted a field visit in West Java to support capacity building and sustainable farming adoption.</p>
              </div>
            </div>
            <div className="activity-card">
              <img src="/assets/activities/251130_profile.png" alt="Satellite Monitoring" />
              <div className="activity-content">
                <h3>Satellite Monitoring Demo</h3>
                <p>Demonstration of using remote sensing to monitor vegetation growth and soil carbon regeneration.</p>
              </div>
            </div>
            <div className="activity-card">
              <img src="/assets/activities/251205_profile.png" alt="Corporate Training" />
              <div className="activity-content">
                <h3>Corporate Training on RegenAgri</h3>
                <p>Training session for private companies on regenerative agriculture and carbon-positive farming.</p>
              </div>
            </div>
          </div>
          <button className="slider-btn slider-prev" onClick={() => slideActivities(-1)} aria-label="Previous slide">&#10094;</button>
          <button className="slider-btn slider-next" onClick={() => slideActivities(1)} aria-label="Next slide">&#10095;</button>
        </div>
      </section>

      {/* PARTNERS */}
      <section className="landing-section partners-section scroll-reveal" ref={partnersRef}>
        <h2 className="section-title text-center">Our Strategic Partners</h2>
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

      <PublicFooter />
    </div>
  );
};

export default AboutPage;
