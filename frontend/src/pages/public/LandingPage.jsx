import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../shared/api/axios';
import { 
  Sprout, 
  Activity, 
  Leaf, 
  BarChart3, 
  TreePine, 
  Gauge, 
  FileSpreadsheet, 
  CheckCheck, 
  ArrowRight,
  TrendingDown,
  ShieldAlert,
  Coins,
  Check
} from 'lucide-react';
import PublicNavbar from './components/PublicNavbar';
import PublicFooter from './components/PublicFooter';
import useScrollReveal from '../../shared/utils/useScrollReveal';
import '../../assets/css/landing.css';

const LandingPage = () => {
  const statsRef = useScrollReveal();
  const challengeRef = useScrollReveal();
  const signalsOverviewRef = useScrollReveal();
  const mrvOverviewRef = useScrollReveal();
  const productRef = useScrollReveal();
  const pricingRef = useScrollReveal();
  const [activities, setActivities] = useState([]);
  const activitiesRef = useScrollReveal({}, [activities]);
  const partnersRef = useScrollReveal();
  const sliderRef = useRef(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await api.get('/public/recent-activities');
        if (res.data?.data) {
          setActivities(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch activities', err);
      }
    };
    fetchActivities();
  }, []);

  const slideActivities = (direction) => {
    if (sliderRef.current) {
      const card = sliderRef.current.querySelector('.activity-card');
      const cardWidth = card ? card.offsetWidth + 28 : 340;
      sliderRef.current.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
    }
  };

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

  const signalPreviews = [
    {
      step: '01',
      title: 'Soil Nutrient Intelligence',
      icon: <Sprout size={24} strokeWidth={1.75} />,
      desc: 'Precision mapping of soil nutrient availability (N, P, K) to eliminate wasteful over-fertilization and lift land productivity.',
      output: 'N, P, K Spatial Distribution & Balance'
    },
    {
      step: '02',
      title: 'Crop Health Index',
      icon: <Activity size={24} strokeWidth={1.75} />,
      desc: 'Quarterly satellite vegetation monitoring to detect biological stress, water deficits, and canopy health before yield loss.',
      output: 'NDVI & NDRE Spectral Indices'
    },
    {
      step: '03',
      title: 'Soil Organic Carbon',
      icon: <Leaf size={24} strokeWidth={1.75} />,
      desc: 'Quantified topsoil carbon accumulation supporting regenerative farming verification and high-integrity carbon credit claims.',
      output: 'SOC Stock & Sequestration Rate'
    },
    {
      step: '04',
      title: 'Productivity Analytics',
      icon: <BarChart3 size={24} strokeWidth={1.75} />,
      desc: 'Spatial analytics showing how different farm blocks perform over time to benchmark yield and forecast harvest volume.',
      output: 'Projected vs Actual Yield per Ha'
    },
    {
      step: '05',
      title: 'Biomass Carbon Estimation',
      icon: <TreePine size={24} strokeWidth={1.75} />,
      desc: 'Vegetative biomass growth calculations over time for verified audit documentation and ESG corporate disclosures.',
      output: 'Above-Ground Biomass Density'
    }
  ];

  return (
    <div className="page-wrapper">
      <PublicNavbar />

      {/* 1. HERO - SPLIT LAYOUT */}
      <header className="hero-split" id="home">
        <div className="hero-split-left">
          <div className="hero-split-content">
            <h1>We Turn Landscape Intelligence into Measurable Climate Impact</h1>
            <p>
              Sustainable Farm, Sustainable Business — helping large farms regenerate soil, lift yields, and become carbon and ESG ready.
            </p>
            <div className="hero-actions">
              <Link to="/login" className="btn-demo">See Product Demo</Link>
              <Link to="/contact" className="btn-demo-outline">Request a Consultation</Link>
            </div>
          </div>
          {/* Organic Vertical Seam Curve */}
          <div className="hero-vertical-seam" aria-hidden="true">
            <svg viewBox="0 0 60 800" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,0 C60,240 60,560 0,800 L0,800 L0,0 Z" fill="var(--color-primary)"></path>
            </svg>
          </div>
        </div>
        <div className="hero-split-right">
          <img src="/assets/images/hero_landing.png" alt="Aerial view of terraced farmland" />
        </div>
        <div className="hero-wave">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,32 C280,96 520,12 800,64 C1080,116 1280,24 1440,48 L1440,120 L0,120 Z" fill="var(--color-surface)"></path>
          </svg>
        </div>
      </header>

      {/* 2. STATS COUNTER */}
      <section className="stats-section scroll-reveal" ref={statsRef}>
        <div className="stats-container-card">
          <div className="landing-stats-grid">
            <div className="stat-item">
              <div className="stat-number-wrap">
                <span className="stat-number" data-target="2500">0</span>
                <span className="stat-suffix">Ha+</span>
              </div>
              <div className="stat-label">Land Monitored</div>
            </div>
            <div className="stat-item">
              <div className="stat-number-wrap">
                <span className="stat-number" data-target="12">0</span>
                <span className="stat-suffix">Ton C/Ha</span>
              </div>
              <div className="stat-label">Avg Carbon Sequestered</div>
            </div>
            <div className="stat-item">
              <div className="stat-number-wrap">
                <span className="stat-number" data-target="90">0</span>
                <span className="stat-suffix">%+</span>
              </div>
              <div className="stat-label">Model Accuracy</div>
            </div>
            <div className="stat-item">
              <div className="stat-number-wrap">
                <span className="stat-number" data-target="5">0</span>
                <span className="stat-suffix">Signals</span>
              </div>
              <div className="stat-label">Monitored per Farm</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2.5 THE CHALLENGE (WHY NOW) */}
      <section className="landing-section challenge-section scroll-reveal" ref={challengeRef}>
        <div className="section-header-centered">
          <span className="section-label">THE CHALLENGE</span>
          <h2 className="section-title text-center">Overcoming the Climate &amp; Productivity Barrier</h2>
          <p className="section-intro">
            Indonesian agriculture stands at a critical juncture where land degradation, missing carbon baselines, and emerging ESG mandates require verifiable digital infrastructure.
          </p>
        </div>

        <div className="challenge-grid">
          <div className="challenge-card">
            <div className="challenge-icon-box">
              <TrendingDown size={28} />
            </div>
            <div className="challenge-badge">Economic &amp; Soil Risk</div>
            <h3>Degraded Land &amp; Climate Risk</h3>
            <p>
              Indonesian farmers lose over <strong>$3 billion annually</strong> in agricultural productivity from degraded farmland and inefficient input management.
            </p>
            <div className="challenge-stat-highlight">
              <span className="highlight-number">&gt;$3 Billion / Year</span>
              <span className="highlight-desc">National productivity loss</span>
            </div>
          </div>

          <div className="challenge-card">
            <div className="challenge-icon-box">
              <ShieldAlert size={28} />
            </div>
            <div className="challenge-badge">Compliance Barrier</div>
            <h3>No Verifiable ESG Infrastructure</h3>
            <p>
              Agribusiness enterprises struggle to meet stringent ESG disclosure and export compliance standards (such as EUDR) due to a lack of verifiable data tools.
            </p>
            <div className="challenge-stat-highlight">
              <span className="highlight-number">EUDR &amp; Scope 3</span>
              <span className="highlight-desc">Export compliance gap</span>
            </div>
          </div>

          <div className="challenge-card">
            <div className="challenge-icon-box">
              <Coins size={28} />
            </div>
            <div className="challenge-badge">Finance Bottleneck</div>
            <h3>Missing Soil Carbon Baseline</h3>
            <p>
              A lack of scalable soil carbon measurement infrastructure prevents regenerative agriculture projects from unlocking international climate finance.
            </p>
            <div className="challenge-stat-highlight">
              <span className="highlight-number">Carbon MRV</span>
              <span className="highlight-desc">Monetizing soil regeneration</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FIVE SIGNALS OVERVIEW */}
      <section className="landing-section scroll-reveal" ref={signalsOverviewRef}>
        <div className="section-header-centered">
          <span className="section-label">AGRONOMY INTELLIGENCE</span>
          <h2 className="section-title text-center">Five Signals That Run The Farm</h2>
          <p className="section-intro">
            We turn satellite remote sensing and calibrated ground data into five critical metrics that drive agronomic precision and carbon verification.
          </p>
        </div>

        <div className="mrv-lifecycle-grid">
          {signalPreviews.map((sig) => (
            <div key={sig.step} className="lifecycle-card">
              <div className="lifecycle-card-top">
                <span className="lifecycle-step-num">{sig.step}</span>
                <div className="lifecycle-icon-wrap">{sig.icon}</div>
              </div>
              <h3>{sig.title}</h3>
              <p>{sig.desc}</p>
              <div className="lifecycle-output">
                <span className="output-label">Key Metric:</span>
                <span className="output-text">{sig.output}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="section-center-action">
          <Link to="/signals" className="btn-inline-link">
            Explore All 5 Signals in Detail <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* 4. END-TO-END MRV OVERVIEW */}
      <section className="landing-section mrv-overview-section scroll-reveal" ref={mrvOverviewRef}>
        <div className="section-header-centered">
          <span className="section-label">PLATFORM INFRASTRUCTURE</span>
          <h2 className="section-title text-center">End-to-End MRV Operations</h2>
          <p className="section-intro">
            A unified digital framework covering measurement in the field, standard-aligned reporting, and independent verification.
          </p>
        </div>

        <div className="mrv-pillars-grid">
          <div className="mrv-pillar-card">
            <div className="mrv-pillar-badge pillar-measure">01</div>
            <div className="mrv-pillar-icon"><Gauge size={28} strokeWidth={1.75} /></div>
            <h3>Measurement</h3>
            <p>Quantifying soil carbon, biomass, and crop condition via Sentinel-2 satellite and ground sampling.</p>
          </div>

          <div className="mrv-pillar-card">
            <div className="mrv-pillar-badge pillar-report">02</div>
            <div className="mrv-pillar-icon"><FileSpreadsheet size={28} strokeWidth={1.75} /></div>
            <h3>Reporting</h3>
            <p>Standard-aligned disclosures and carbon calculations ready for compliance and ESG audit.</p>
          </div>

          <div className="mrv-pillar-card">
            <div className="mrv-pillar-badge pillar-verify">03</div>
            <div className="mrv-pillar-icon"><CheckCheck size={28} strokeWidth={1.75} /></div>
            <h3>Verification</h3>
            <p>Verifiable digital audit trail connecting farm plots to certification bodies and commodity buyers.</p>
          </div>
        </div>

        <div className="section-center-action">
          <Link to="/mrv" className="btn-inline-link">
            See the 6-Stage Operational Workflow <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* 5. PRODUCT PREVIEW */}
      <section className="landing-section product-preview scroll-reveal" id="solutions" ref={productRef}>
        <div className="preview-grid">
          <div className="preview-text">
            <span className="section-label">OUR PLATFORM</span>
            <h2 className="section-title">Intelligence Dashboard</h2>
            <p className="preview-desc">
              Monitor your farmland in real-time. Track NDVI, SOC, Yield, Biomass, and NPK across all your plots, all in one centralized SaaS interface.
            </p>
            <ul className="preview-features">
              <li>Interactive map with pixel-level detail</li>
              <li>Anomaly detection &amp; alert system</li>
              <li>Period-over-period comparison</li>
              <li>Automated carbon credit reports</li>
              <li>Per land-owner breakdown</li>
            </ul>
            <Link to="/login" className="btn-preview-demo">Try the Demo →</Link>
          </div>
          <div className="preview-image">
            <div className="dashboard-mockup">
              <div className="mockup-sidebar">
                <div className="mockup-sidebar-logo"></div>
                <div className="mockup-sidebar-item active"></div>
                <div className="mockup-sidebar-item"></div>
                <div className="mockup-sidebar-item"></div>
                <div className="mockup-sidebar-item"></div>
              </div>
              <div className="mockup-main">
                <div className="mockup-topbar">
                  <div className="mockup-search"></div>
                  <div className="mockup-avatar"></div>
                </div>
                <div className="mockup-stats-row">
                  <div className="mockup-stat">
                    <div className="mockup-stat-label">NDVI</div>
                    <div className="mockup-stat-value" style={{ color: 'var(--color-main-green)' }}>0.82</div>
                  </div>
                  <div className="mockup-stat">
                    <div className="mockup-stat-label">SOC</div>
                    <div className="mockup-stat-value" style={{ color: 'var(--color-dark-gold)' }}>3.4%</div>
                  </div>
                  <div className="mockup-stat">
                    <div className="mockup-stat-label">Yield</div>
                    <div className="mockup-stat-value" style={{ color: 'var(--color-medium-emerald)' }}>4.2 t/ha</div>
                  </div>
                </div>
                <div className="mockup-content-row">
                  <div className="mockup-map">
                    <span className="mockup-map-badge">Plot 04 - West Java</span>
                  </div>
                  <div className="mockup-chart">
                    <div className="mockup-bar" style={{ height: '60%' }}></div>
                    <div className="mockup-bar" style={{ height: '85%' }}></div>
                    <div className="mockup-bar" style={{ height: '45%' }}></div>
                    <div className="mockup-bar" style={{ height: '95%' }}></div>
                    <div className="mockup-bar" style={{ height: '70%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5.5 PLANS & PRICING */}
      <section className="landing-section pricing-section scroll-reveal" id="pricing" ref={pricingRef}>
        <div className="section-header-centered">
          <span className="section-label">PLANS &amp; PACKAGES</span>
          <h2 className="section-title text-center">Scalable Solutions for Every Agricultural Scale</h2>
          <p className="section-intro">
            Transparent pricing models engineered for pilot trials, commercial plantations, and enterprise agribusiness.
          </p>
        </div>

        <div className="pricing-grid">
          {/* Package 1: Basic Pilot */}
          <div className="pricing-card">
            <div className="pricing-header">
              <div className="pricing-tier-tag">Pilot Testing</div>
              <h3 className="pricing-title">Basic (Pilot)</h3>
              <p className="pricing-target">Ideal for research trials and pilot project validation.</p>
              <div className="pricing-price-box">
                <span className="price-currency">Rp</span>
                <span className="price-amount">2.000.000</span>
                <span className="price-period">/ Ha / Bulan</span>
              </div>
              <div className="pricing-meta">Min. 5 Hectares &bull; 3–6 Months</div>
            </div>
            <div className="pricing-body">
              <div className="pricing-features-title">Included Capabilities:</div>
              <ul className="pricing-features-list">
                <li><Check size={16} className="text-main-green" /> <span>Productivity Analytics (Yield Forecast)</span></li>
                <li><Check size={16} className="text-main-green" /> <span>Crop Health Index (NDVI / NDRE)</span></li>
                <li><Check size={16} className="text-main-green" /> <span>Soil Nutrient Intelligence (NPK)</span></li>
                <li><Check size={16} className="text-main-green" /> <span>1x Monthly Agronomist Consultation</span></li>
                <li><Check size={16} className="text-main-green" /> <span>Standard PDF Performance Report</span></li>
              </ul>
            </div>
            <div className="pricing-footer">
              <Link to="/contact" className="btn-pricing-outline">
                Start Pilot Trial
              </Link>
            </div>
          </div>

          {/* Package 2: Pro Subscription */}
          <div className="pricing-card pricing-card-featured">
            <div className="pricing-header">
              <div className="pricing-tier-tag tier-pro">Commercial Scale</div>
              <h3 className="pricing-title">Pro (Subscription)</h3>
              <p className="pricing-target">For plantation companies scaling regenerative practices.</p>
              <div className="pricing-price-box">
                <span className="price-currency">Rp</span>
                <span className="price-amount">4.000.000</span>
                <span className="price-period">/ Ha / Tahun</span>
              </div>
              <div className="pricing-meta">Min. 20 Hectares &bull; 12 Months Annual</div>
            </div>
            <div className="pricing-body">
              <div className="pricing-features-title">All Basic Features, plus:</div>
              <ul className="pricing-features-list">
                <li><Check size={16} className="text-main-green" /> <span><strong>Soil Organic Carbon (SOC)</strong> Tracking</span></li>
                <li><Check size={16} className="text-main-green" /> <span>Economic Outcome &amp; Yield Report</span></li>
                <li><Check size={16} className="text-main-green" /> <span>Quarterly ESG Disclosure Summary</span></li>
                <li><Check size={16} className="text-main-green" /> <span>Farm Identification Code (FID) Traceability</span></li>
                <li><Check size={16} className="text-main-green" /> <span>2x Monthly Agronomist Consultation</span></li>
              </ul>
            </div>
            <div className="pricing-footer">
              <Link to="/contact" className="btn-pricing-primary">
                Get Started Pro <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Package 3: Enterprise Custom */}
          <div className="pricing-card">
            <div className="pricing-header">
              <div className="pricing-tier-tag">Large Enterprise</div>
              <h3 className="pricing-title">Enterprise</h3>
              <p className="pricing-target">For large-scale plantations and carbon project developers.</p>
              <div className="pricing-price-box">
                <span className="price-amount-custom">Custom</span>
                <span className="price-period">Tailored Contract</span>
              </div>
              <div className="pricing-meta">Min. 100 Hectares &bull; Multi-Year</div>
            </div>
            <div className="pricing-body">
              <div className="pricing-features-title">All Pro Features, plus:</div>
              <ul className="pricing-features-list">
                <li><Check size={16} className="text-main-green" /> <span>Above-Ground Biomass (AGB) Estimation</span></li>
                <li><Check size={16} className="text-main-green" /> <span>Custom White-Label Dashboard</span></li>
                <li><Check size={16} className="text-main-green" /> <span>Full REST API &amp; Webhook Integration</span></li>
                <li><Check size={16} className="text-main-green" /> <span>Audit-Ready Carbon Registry Dossier</span></li>
                <li><Check size={16} className="text-main-green" /> <span>Dedicated Lead Agronomist &amp; SLA Support</span></li>
              </ul>
            </div>
            <div className="pricing-footer">
              <Link to="/contact" className="btn-pricing-outline">
                Contact Enterprise
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5.8 RECENT ACTIVITIES */}
      {activities.length > 0 && (
        <section className="landing-section activities-section scroll-reveal" id="activities" ref={activitiesRef}>
          <div className="activities-header">
            <div>
              <span className="section-label">FIELD UPDATES</span>
              <h2 className="section-title">Recent Activities</h2>
            </div>
            {activities.length > 1 && (
              <div className="activities-nav-btns">
                <button className="slider-btn slider-prev" onClick={() => slideActivities(-1)} aria-label="Previous slide">&#10094;</button>
                <button className="slider-btn slider-next" onClick={() => slideActivities(1)} aria-label="Next slide">&#10095;</button>
              </div>
            )}
          </div>
          <div className="slider-wrapper">
            <div className="slider-track" id="activitySlider" ref={sliderRef}>
              {activities.map((activity) => (
                <div className="activity-card" key={activity.id}>
                  {activity.image_path && (
                    <img src={activity.image_path} alt={activity.title} />
                  )}
                  <div className="activity-content">
                    <h3>{activity.title}</h3>
                    <p>{activity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. PARTNERS */}
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
        <div className="section-center-action mt-4">
          <Link to="/about" className="btn-inline-link">
            Learn More About Our Team &amp; Mission <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default LandingPage;
