import { Link } from 'react-router-dom';
import { Sprout, Activity, Leaf, BarChart3, TreePine, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import PublicNavbar from './components/PublicNavbar';
import PublicFooter from './components/PublicFooter';
import useScrollReveal from '../../shared/utils/useScrollReveal';
import '../../assets/css/landing.css';

const SignalsPage = () => {
  const heroRef = useScrollReveal();
  const signalsRef = useScrollReveal();
  const techRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  const signals = [
    {
      id: 'npk',
      title: 'Soil Nutrient Intelligence',
      tag: 'Soil Chemistry',
      icon: <Sprout size={24} strokeWidth={1.8} />,
      summary: 'Insights to nutrient availability and balance across fields.',
      description: 'Enables more precise input decisions and reduces inefficiencies in fertilizer use by mapping essential nutrient levels across farm plots.',
      benefits: [
        'Precise fertilizer dosing per plot',
        'Mitigate nutrient runoff and soil degradation',
        'Cost efficiency in agricultural inputs'
      ],
      metrics: 'N, P, K spatial distribution & balance index'
    },
    {
      id: 'ndvi',
      title: 'Crop Health Index',
      tag: 'Canopy Health',
      icon: <Activity size={24} strokeWidth={1.8} />,
      summary: 'Monitor overall crop condition throughout the growing cycle.',
      description: 'Identifies biological stress, water deficits, and pest vulnerabilities before they visibly manifest and permanently impact final yield.',
      benefits: [
        'Early stress detection across large acreages',
        'Quarterly vegetation health comparisons',
        'Targeted on-ground agronomy scouting'
      ],
      metrics: 'NDVI & NDRE spectral indices (0.00 - 1.00)'
    },
    {
      id: 'soc',
      title: 'Soil Organic Carbon',
      tag: 'Soil Regeneration',
      icon: <Leaf size={24} strokeWidth={1.8} />,
      summary: 'Helps farms track soil improvement and sustainability readiness.',
      description: 'Measures carbon accumulation in the soil profile resulting from regenerative farming practices, supporting long-term fertility and carbon credit claims.',
      benefits: [
        'Quantified carbon sequestration (tC/Ha)',
        'Track soil organic matter restoration',
        'Audit-ready data for carbon project developers'
      ],
      metrics: 'SOC percentage & tons of Carbon sequestered per Ha'
    },
    {
      id: 'yield',
      title: 'Productivity Analytics',
      tag: 'Harvest Intelligence',
      icon: <BarChart3 size={24} strokeWidth={1.8} />,
      summary: 'See how different areas of the farm perform and why.',
      description: 'Analyzes spatial variation in crop performance across blocks to optimize harvesting schedules and support consistent production forecasting.',
      benefits: [
        'Predictive harvest volume estimation',
        'Identify underperforming farm zones',
        'Benchmark farmer group productivity'
      ],
      metrics: 'Projected vs actual yield (tons/Ha)'
    },
    {
      id: 'biomass',
      title: 'Biomass Carbon Estimation',
      tag: 'Carbon Accounting',
      icon: <TreePine size={24} strokeWidth={1.8} />,
      summary: 'Estimate biomass development as part of overall farm performance.',
      description: 'Calculates above-ground and below-ground vegetative biomass over time to generate early indicators for carbon crediting and ESG compliance disclosures.',
      benefits: [
        'Continuous biomass growth curves',
        'Integration with agroforestry systems',
        'Third-party audit baseline documentation'
      ],
      metrics: 'Above-ground biomass (AGB) density & growth rate'
    }
  ];

  return (
    <div className="page-wrapper">
      <PublicNavbar />

      {/* PAGE HEADER - SPLIT LAYOUT */}
      <header className="hero-split hero-split--subpage" ref={heroRef}>
        <div className="hero-split-left">
          <div className="hero-split-content">
            <h1>Five Signals That Run The Farm</h1>
            <p>
              From soil chemistry to canopy vigor, we transform raw Sentinel-2 satellite data and ground truth calibration into five high-integrity agricultural metrics.
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
          <img src="/assets/images/hero_signals.png" alt="Satellite remote sensing on farmland" />
        </div>
        <div className="hero-wave">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,32 C280,96 520,12 800,64 C1080,116 1280,24 1440,48 L1440,120 L0,120 Z" fill="var(--color-surface)"></path>
          </svg>
        </div>
      </header>

      {/* FIVE SIGNALS DETAILED GRID */}
      <section className="landing-section scroll-reveal" ref={signalsRef}>
        <div className="mrv-lifecycle-grid">
          {signals.map((signal, index) => (
            <div key={signal.id} className="lifecycle-card">
              <div className="lifecycle-card-top">
                <span className="lifecycle-step-num">0{index + 1}</span>
                <div className="lifecycle-icon-wrap">{signal.icon}</div>
              </div>
              <h3>{signal.title}</h3>
              <p>{signal.description}</p>
              <div className="signal-benefits-box">
                <h4>Key Value for Farm Managers:</h4>
                <ul>
                  {signal.benefits.map((benefit, i) => (
                    <li key={i}>
                      <CheckCircle2 size={15} className="text-main-green" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="lifecycle-output">
                <span className="output-label">Key Metric:</span>
                <span className="output-text">{signal.metrics}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SENSING METHODOLOGY SECTION */}
      <section className="landing-section methodology-section scroll-reveal" ref={techRef}>
        <div className="section-header-centered">
          <span className="section-label">DATA INTEGRITY &amp; TECHNOLOGY</span>
          <h2 className="section-title text-center">How Satellite Sensing Powers The Signals</h2>
          <p className="section-intro">
            Agrivision combines quarterly multispectral satellite passes with machine learning and field calibration to guarantee data precision without high operational costs.
          </p>
        </div>

        <div className="methodology-grid">
          <div className="methodology-card">
            <ShieldCheck size={32} className="text-main-green mb-3" />
            <h3>Sentinel-2 Spectral Bands</h3>
            <p>10m to 20m resolution across red, near-infrared, and shortwave infrared bands calibrated for agricultural foliage.</p>
          </div>
          <div className="methodology-card">
            <Activity size={32} className="text-main-green mb-3" />
            <h3>Ground Truth Calibration</h3>
            <p>Regular soil sampling and farmer ground checks ensure machine learning models maintain over 90% real-world accuracy.</p>
          </div>
          <div className="methodology-card">
            <BarChart3 size={32} className="text-main-green mb-3" />
            <h3>Quarterly Time-Series</h3>
            <p>Historical and seasonal comparisons eliminate transient weather noise and capture genuine soil regeneration trends.</p>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default SignalsPage;
