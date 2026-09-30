const PARTNERS = [
  { src: '/assets/partner/pt-lapi.webp', name: 'PT LAPI ITB', w: 653, h: 176 },
  { src: '/assets/partner/itb.webp', name: 'ITB', w: 176, h: 176 },
  { src: '/assets/partner/labtech.webp', name: 'Labtech', w: 637, h: 176 },
  { src: '/assets/partner/kadatuan.webp', name: 'Kadatuan', w: 235, h: 176 },
  { src: '/assets/partner/biosphereplus.webp', name: 'Biosphere Plus', w: 707, h: 176 },
  { src: '/assets/partner/btp.webp', name: 'Bandung Techno Park', w: 259, h: 176 },
];

const PartnerMarquee = () => (
  <div className="partners-wrapper">
    <div className="partners-track">
      {PARTNERS.map((p) => (
        <img key={p.name} src={p.src} alt={p.name} loading="lazy" width={p.w} height={p.h} />
      ))}
      {/* Duplicate set for the infinite scroll; hidden from screen readers so each partner is announced once */}
      {PARTNERS.map((p) => (
        <img key={`dup-${p.name}`} src={p.src} alt="" aria-hidden="true" loading="lazy" width={p.w} height={p.h} />
      ))}
    </div>
  </div>
);

export default PartnerMarquee;
