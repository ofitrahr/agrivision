const PARTNERS = [
  { src: '/assets/partner/pt-lapi.webp', name: 'PT Lapi' },
  { src: '/assets/partner/itb.webp', name: 'ITB' },
  { src: '/assets/partner/labtech.webp', name: 'Labtech' },
  { src: '/assets/partner/kadatuan.webp', name: 'Kadatuan' },
  { src: '/assets/partner/biosphereplus.webp', name: 'Biosphere Plus' },
  { src: '/assets/partner/btp.webp', name: 'BTP' },
];

const PartnerMarquee = () => (
  <div className="partners-wrapper">
    <div className="partners-track">
      {PARTNERS.map((p) => (
        <img key={p.name} src={p.src} alt={p.name} loading="lazy" width="142" height="80" />
      ))}
      {/* Duplicate set for the infinite scroll; hidden from screen readers so each partner is announced once */}
      {PARTNERS.map((p) => (
        <img key={`dup-${p.name}`} src={p.src} alt="" aria-hidden="true" loading="lazy" width="142" height="80" />
      ))}
    </div>
  </div>
);

export default PartnerMarquee;
