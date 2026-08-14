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
      icon: <Sprout size={28} strokeWidth={1.75} />,
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
      icon: <Activity size={28} strokeWidth={1.75} />,
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
      icon: <Leaf size={28} strokeWidth={1.75} />,
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
      icon: <BarChart3 size={28} strokeWidth={1.75} />,
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
      icon: <TreePine size={28} strokeWidth={1.75} />,
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

      {/* PAGE HEADER */}
      <header className="page-header-banner" ref={heroRef}>
        <div className="page-header-container">
          <span className="section-label">AGRONOMY INTELLIGENCE</span>
          <h1 className="page-header-title">Five Signals That Run The Farm</h1>
          <p className="page-header-desc">
            From soil chemistry to canopy vigor, we transform raw Sentinel-2 satellite data and ground truth calibration into five high-integrity agricultural metrics.
          </p>
        </div>
      </header>

      {/* FIVE SIGNALS DETAILED GRID */}
      <section className="landing-section scroll-reveal" ref={signalsRef}>
        <div className="signals-grid-full">
          {signals.map((signal, index) => (
            <div key={signal.id} className="signal-card-detailed">
              <div className="signal-card-header">
                <div className="signal-icon-wrapper">{signal.icon}</div>
                <div className="signal-header-text">
                  <span className="signal-tag">{signal.tag}</span>
                  <h3>{signal.title}</h3>
                </div>
                <div className="signal-number">0{index + 1}</div>
              </div>
              <p className="signal-summary">{signal.summary}</p>
              <p className="signal-description">{signal.description}</p>
              <div className="signal-benefits-box">
                <h4>Key Value for Farm Managers:</h4>
                <ul>
                  {signal.benefits.map((benefit, i) => (
                    <li key={i}>
                      <CheckCircle2 size={16} className="text-main-green" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="signal-metric-footer">
                <span className="metric-label">Key Metric:</span>
                <span className="metric-value">{signal.metrics}</span>
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
