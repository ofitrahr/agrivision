import { Link } from 'react-router-dom';
import { Gauge, FileSpreadsheet, CheckCheck, MapPin, Layers, Cpu, FileText, QrCode, TrendingUp, ShieldAlert, ArrowRight } from 'lucide-react';
import PublicNavbar from './components/PublicNavbar';
import PublicFooter from './components/PublicFooter';
import useScrollReveal from '../../shared/utils/useScrollReveal';
import '../../assets/css/landing.css';

const MRVPage = () => {
  const heroRef = useScrollReveal();
  const pillarsRef = useScrollReveal();
  const lifecycleRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  const lifecycleStages = [
    {
      step: '01',
      title: 'Land Screening & Baseline',
      icon: <MapPin size={26} strokeWidth={1.75} />,
      desc: 'Quickly assess your farmland eligibility and historical baseline using Sentinel-2 imagery, GIS boundary mapping, and initial soil carbon estimates.',
      output: 'GIS Polygon & Baseline Carbon Stock'
    },
    {
      step: '02',
      title: 'Regenerative Farm Design',
      icon: <Layers size={26} strokeWidth={1.75} />,
      desc: 'Plan field-level regenerative practices such as cover cropping, bio-fertilization, and agroforestry to optimize yield and soil carbon potential.',
      output: 'Regenerative Farming Roadmap'
    },
    {
      step: '03',
      title: 'Continuous AI Monitoring',
      icon: <Cpu size={26} strokeWidth={1.75} />,
      desc: 'Execute ongoing quarterly remote sensing across 5 core signals (NDVI, SOC, Yield, Biomass, NPK) with automated anomaly alerts.',
      output: 'Quarterly Agronomy & Carbon Data'
    },
    {
      step: '04',
      title: 'Standardized MRV Reporting',
      icon: <FileText size={26} strokeWidth={1.75} />,
      desc: 'Automatically generate comprehensive carbon accounting and ESG disclosures aligned with international registry protocols.',
      output: 'Audit-Ready Carbon Reports'
    },
    {
      step: '05',
      title: 'Supply Chain Traceability',
      icon: <QrCode size={26} strokeWidth={1.75} />,
      desc: 'Connect every commodity harvest batch to its originating farm plot and farmer profile via verifiable QR-coded public dashboards.',
      output: 'Farm-to-Consumer Traceability'
    },
    {
      step: '06',
      title: 'Carbon & Market Access',
      icon: <TrendingUp size={26} strokeWidth={1.75} />,
      desc: 'Channel verified carbon credits to reputable buyers and position agricultural commodities for premium sustainable markets.',
      output: 'Verified Credits & Premium Revenue'
    }
  ];

  return (
    <div className="page-wrapper">
      <PublicNavbar />

      {/* PAGE HEADER - SPLIT LAYOUT */}
      <header className="hero-split hero-split--subpage" ref={heroRef}>
        <div className="hero-split-left">
          <div className="hero-split-content">
            <span className="hero-tag-pill">Climate Tech Infrastructure</span>
            <h1>End-to-End Measurement, Reporting &amp; Verification</h1>
            <p>
              A comprehensive MRV architecture engineered specifically for regenerative agriculture, topsoil carbon sequestration, and agricultural supply chain transparency.
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
          <img src="/assets/images/hero_mrv.png" alt="Aerial view of monitored farmland plots" />
        </div>
        <div className="hero-wave">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,32 C280,96 520,12 800,64 C1080,116 1280,24 1440,48 L1440,120 L0,120 Z" fill="var(--color-surface)"></path>
          </svg>
        </div>
      </header>

      {/* THREE CORE PILLARS */}
      <section className="landing-section scroll-reveal" ref={pillarsRef}>
        <div className="section-header-centered">
          <span className="section-label">CORE FRAMEWORK</span>
          <h2 className="section-title text-center">Built for Data Integrity &amp; Transparency</h2>
          <p className="section-intro">
            From initial satellite measurement to auditable verification, our framework ensures every carbon metric is grounded in robust science.
          </p>
        </div>

        <div className="mrv-pillars-grid">
          <div className="mrv-pillar-card">
            <div className="mrv-pillar-badge pillar-measure">01</div>
            <div className="mrv-pillar-icon"><Gauge size={32} strokeWidth={1.75} /></div>
            <h3>Measurement</h3>
            <p>
              We quantify what is in the field — soil organic carbon, biomass, and crop condition — from satellite, UAV, and ground sampling in near real-time.
            </p>
            <ul className="mrv-pillar-list">
              <li>Sentinel-2 multi-spectral remote sensing</li>
              <li>Calibrated ground-truth soil sampling</li>
              <li>Automated vegetation &amp; biomass algorithms</li>
            </ul>
          </div>

          <div className="mrv-pillar-card">
            <div className="mrv-pillar-badge pillar-report">02</div>
            <div className="mrv-pillar-icon"><FileSpreadsheet size={32} strokeWidth={1.75} /></div>
            <h3>Reporting</h3>
            <p>
              Data becomes standard-aligned dashboards and disclosures your ESG and compliance teams can file with confidence.
            </p>
            <ul className="mrv-pillar-list">
              <li>Standard-aligned ESG disclosure summaries</li>
              <li>Period-over-period carbon trend analysis</li>
              <li>Per-farmer group and per-plot breakdown</li>
            </ul>
          </div>

          <div className="mrv-pillar-card">
            <div className="mrv-pillar-badge pillar-verify">03</div>
            <div className="mrv-pillar-icon"><CheckCheck size={32} strokeWidth={1.75} /></div>
            <h3>Verification</h3>
            <p>
              Independent, auditable proof — a digital audit trail and third-party validation ready for carbon registry certification.
            </p>
            <ul className="mrv-pillar-list">
              <li>Verifiable farm-to-table QR traceability</li>
              <li>Full spatial and temporal audit logs</li>
              <li>Standardized report exports</li>
            </ul>
          </div>
        </div>

        {/* STEPPER BAR */}
        <div className="mrv-stepper-wrapper">
          <div className="mrv-stepper-line"></div>
          <div className="mrv-stepper-steps">
            <div className="stepper-node"><span className="node-dot"></span><span className="node-label">Baseline</span></div>
            <div className="stepper-node"><span className="node-dot"></span><span className="node-label">Monitor</span></div>
            <div className="stepper-node"><span className="node-dot"></span><span className="node-label">Quantify</span></div>
            <div className="stepper-node"><span className="node-dot"></span><span className="node-label">Report</span></div>
            <div className="stepper-node"><span className="node-dot"></span><span className="node-label">Verify</span></div>
          </div>
        </div>
      </section>

      {/* 6-STAGE OPERATIONAL LIFECYCLE */}
      <section className="landing-section mrv-lifecycle-section scroll-reveal" ref={lifecycleRef}>
        <div className="section-header-centered">
          <span className="section-label">OPERATIONAL JOURNEY</span>
          <h2 className="section-title text-center">Our 6-Stage End-to-End Workflow</h2>
          <p className="section-intro">
            How Agrivision supports project owners, corporate ESG teams, and farm managers through every phase of the project lifecycle.
          </p>
        </div>

        <div className="mrv-lifecycle-grid">
          {lifecycleStages.map((stage) => (
            <div key={stage.step} className="lifecycle-card">
              <div className="lifecycle-card-top">
                <span className="lifecycle-step-num">{stage.step}</span>
                <div className="lifecycle-icon-wrap">{stage.icon}</div>
              </div>
              <h3>{stage.title}</h3>
              <p>{stage.desc}</p>
              <div className="lifecycle-output">
                <span className="output-label">Key Deliverable:</span>
                <span className="output-text">{stage.output}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default MRVPage;
