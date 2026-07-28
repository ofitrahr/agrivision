import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../shared/api/axios';
import {
  ChevronRight, QrCode, Camera, BadgeCheck,
  Lock, MapPin, Lightbulb, Globe, Clock
} from 'lucide-react';

const ManagerTraceability = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    cover_image_url: '',
    origin_story: '',
    social_narrative: '',
    economic_narrative: '',
    environmental_narrative: ''
  });
  const [status, setStatus] = useState('draft');
  const [lastPublished, setLastPublished] = useState(null);
  const [publishLoading, setPublishLoading] = useState(false);
  const [charCounts, setCharCounts] = useState({
    origin_story: 0,
    social_narrative: 0,
    economic_narrative: 0,
    environmental_narrative: 0
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/manager/traceability/profile');
        if (res.data.success) {
          const d = res.data.data;
          setFormData(d);
          setCharCounts({
            origin_story: d.origin_story?.length || 0,
            social_narrative: d.social_narrative?.length || 0,
            economic_narrative: d.economic_narrative?.length || 0,
            environmental_narrative: d.environmental_narrative?.length || 0
          });
        }
      } catch (error) {
        console.error('Gagal load traceability profile', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setCharCounts(prev => ({ ...prev, [field]: value.length }));
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await api.post('/manager/traceability/profile', formData);
    } catch (error) {
      console.error('Gagal menyimpan draft', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToggle = async () => {
    setPublishLoading(true);
    try {
      const newStatus = status === 'published' ? 'draft' : 'published';
      await api.post('/manager/traceability/profile', { ...formData, status: newStatus });
      setStatus(newStatus);
      if (newStatus === 'published') {
        setLastPublished(new Date().toISOString());
      }
    } catch (error) {
      console.error('Gagal mengubah status', error);
    } finally {
      setPublishLoading(false);
    }
  };

  if (loading) return (
    <div style={{ padding: '50px', textAlign: 'center', color: '#6C757D' }}>
      Memuat data...
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#6C757D', marginBottom: 8 }}>
            <span>Dashboard</span>
            <ChevronRight size={14} />
            <span style={{ color: '#012d1d' }}>Traceability Profile</span>
          </div>
          <h1 className="page-title" style={{ margin: '0 0 8px 0' }}>Edit Profile Story</h1>
          <p className="page-description">Customize how your farm's journey appears to consumers.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="secondary-btn" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <QrCode size={18} />
            Download QR Code
          </button>
          <button className="primary-btn" onClick={handleSaveDraft} disabled={saving}>
            {saving ? 'Menyimpan...' : 'Save Draft'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24 }}>
        {/* Left Column */}
        <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Cover Imagery */}
          <div className="stat-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ fontSize: 20, fontWeight: 600, color: '#012d1d', margin: 0 }}>Cover Imagery</h4>
              <button className="action-btn view-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ffffff', border: '1px solid #E9ECEF', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>
                <Camera size={18} />
                Replace Image
              </button>
            </div>
            <div style={{
              position: 'relative',
              aspectRatio: '16/6',
              borderRadius: 8,
              overflow: 'hidden',
              background: '#f3f4f5',
              border: '1px solid #E9ECEF'
            }}>
              <img
                src={formData.cover_image_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAK_INcgpI_eLSsp6m9eiERUz_OxYr4bn4V1Rztuz27AJ4xnlbgpxh7Fn9H0TiS46jaBuNQA5X2WOF1H3gmdfH5mMJ_7RESoZamwH4T8dQOM6mo-ELlQhAj8kNKSOe7eGWd9k5E9btbk8ek-RQCJUKcUYt7fVracuGfyvqc-j15_Cn9vBtKwyw5aVutfyNtCJIgRl_siRymz3eS0mCqrS4X5XT2oXV5X3I2DNQnxrUKqaNMby1Mbxo28AzBAIoOFvQwIS5RCnPQ4f8'}
                alt="Cover"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <p style={{ fontSize: 14, color: '#6C757D', fontStyle: 'italic', marginTop: 12, marginBottom: 0 }}>
              Recommended size: 1920x800px. JPG or PNG format.
            </p>
          </div>

          {/* Core Metadata */}
          <div className="stat-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <h4 style={{ fontSize: 20, fontWeight: 600, color: '#012d1d', margin: 0 }}>Core Metadata</h4>
              <span style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '2px 8px', background: '#a1f4c8', color: '#1b724f',
                borderRadius: 9999, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.01em'
              }}>
                <BadgeCheck size={12} />
                Synced
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#414844', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                  Company
                  <Lock size={14} />
                </label>
                <div style={{
                  width: '100%', padding: '12px 16px', background: '#f3f4f5',
                  border: '1px solid #E9ECEF', borderRadius: 8,
                  fontSize: 16, color: '#6C757D', cursor: 'not-allowed'
                }}>
                  Kadatuan Coffee
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#414844', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                  Commodity
                  <Lock size={14} />
                </label>
                <div style={{
                  width: '100%', padding: '12px 16px', background: '#f3f4f5',
                  border: '1px solid #E9ECEF', borderRadius: 8,
                  fontSize: 16, color: '#6C757D', cursor: 'not-allowed'
                }}>
                  Coffee
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#414844', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                  Farm Location
                  <Lock size={14} />
                </label>
                <div style={{
                  width: '100%', padding: '12px 16px', background: '#f3f4f5',
                  border: '1px solid #E9ECEF', borderRadius: 8,
                  fontSize: 16, color: '#6C757D', cursor: 'not-allowed',
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <MapPin size={18} />
                  Aceh Tengah
                </div>
              </div>
            </div>
          </div>

          {/* Origin Story */}
          <div className="stat-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <label htmlFor="origin-story" style={{ fontSize: 20, fontWeight: 600, color: '#012d1d', margin: 0 }}>Origin Story</label>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: charCounts.origin_story > 900 ? '#D90429' : '#6C757D' }}>
                {charCounts.origin_story} / 1000 chars
              </span>
            </div>
            <textarea
              id="origin-story"
              rows={8}
              value={formData.origin_story}
              onChange={(e) => handleChange('origin_story', e.target.value)}
              maxLength={1000}
              style={{
                width: '100%', padding: '12px 16px', border: '1px solid #E9ECEF',
                borderRadius: 8, fontSize: 16, color: '#191c1d',
                outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
              placeholder="Enter your farm's unique story..."
            />
          </div>

          {/* SDG Impact Descriptions */}
          <div className="stat-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <h4 style={{ fontSize: 20, fontWeight: 600, color: '#012d1d', margin: 0 }}>SDG Impact Descriptions</h4>
              <span style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '2px 8px', background: '#a1f4c8', color: '#1b724f',
                borderRadius: 9999, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.01em'
              }}>
                <BadgeCheck size={12} />
                Impact Narratives
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label htmlFor="social-narrative" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#414844' }}>
                    Social Impact Narrative
                  </label>
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', color: charCounts.social_narrative > 450 ? '#D90429' : '#6C757D' }}>
                    {charCounts.social_narrative} / 500 chars
                  </span>
                </div>
                <textarea
                  id="social-narrative"
                  rows={3}
                  value={formData.social_narrative}
                  onChange={(e) => handleChange('social_narrative', e.target.value)}
                  maxLength={500}
                  style={{
                    width: '100%', padding: '12px 16px', border: '1px solid #E9ECEF',
                    borderRadius: 8, fontSize: 16, color: '#191c1d',
                    outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Describe your social impact..."
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label htmlFor="economic-narrative" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#414844' }}>
                    Economic Impact Narrative
                  </label>
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', color: charCounts.economic_narrative > 450 ? '#D90429' : '#6C757D' }}>
                    {charCounts.economic_narrative} / 500 chars
                  </span>
                </div>
                <textarea
                  id="economic-narrative"
                  rows={3}
                  value={formData.economic_narrative}
                  onChange={(e) => handleChange('economic_narrative', e.target.value)}
                  maxLength={500}
                  style={{
                    width: '100%', padding: '12px 16px', border: '1px solid #E9ECEF',
                    borderRadius: 8, fontSize: 16, color: '#191c1d',
                    outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Describe your economic impact..."
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label htmlFor="environmental-narrative" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#414844' }}>
                    Environmental Impact Narrative
                  </label>
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', color: charCounts.environmental_narrative > 450 ? '#D90429' : '#6C757D' }}>
                    {charCounts.environmental_narrative} / 500 chars
                  </span>
                </div>
                <textarea
                  id="environmental-narrative"
                  rows={3}
                  value={formData.environmental_narrative}
                  onChange={(e) => handleChange('environmental_narrative', e.target.value)}
                  maxLength={500}
                  style={{
                    width: '100%', padding: '12px 16px', border: '1px solid #E9ECEF',
                    borderRadius: 8, fontSize: 16, color: '#191c1d',
                    outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Describe your environmental impact..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ gridColumn: 'span 4' }}>
          <div style={{ position: 'sticky', top: 96, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Status & Publishing */}
            <div className="stat-card" style={{ padding: 24, border: '2px solid #E9ECEF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Globe size={20} style={{ color: '#012d1d' }} />
                <h4 style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#012d1d', textTransform: 'uppercase', margin: 0 }}>
                  Status &amp; Publishing
                </h4>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 14, color: '#414844', fontWeight: 500 }}>Status</span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                  padding: '4px 12px', borderRadius: 9999,
                  background: status === 'published' ? '#a1f4c8' : '#E9ECEF',
                  color: status === 'published' ? '#116c4a' : '#6C757D'
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: status === 'published' ? '#116c4a' : '#6C757D'
                  }} />
                  {status === 'published' ? 'Published' : 'Draft'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: 12, color: '#6C757D' }}>
                <Clock size={14} />
                <span>
                  {status === 'published' && lastPublished
                    ? `Last published ${new Date(lastPublished).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                    : 'Not yet published'}
                </span>
              </div>

              <div style={{
                background: '#f8f9fa', borderRadius: 8, border: '1px solid #E9ECEF',
                padding: 16, marginBottom: 16, textAlign: 'center'
              }}>
                <div style={{
                  width: 64, height: 64, margin: '0 auto 8px',
                  background: '#ffffff', borderRadius: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid #E9ECEF'
                }}>
                  <QrCode size={32} style={{ color: '#191c1d' }} />
                </div>
                <p style={{ fontSize: 10, color: '#6C757D', margin: 0, wordBreak: 'break-all' }}>
                  {window.location.origin}/trace/{formData.batch_number || 'BATCH-001'}
                </p>
              </div>

              <button
                onClick={handlePublishToggle}
                disabled={publishLoading}
                style={{
                  width: '100%', padding: '12px 24px', border: 'none', borderRadius: 8,
                  fontSize: 14, fontWeight: 700, letterSpacing: '0.03em', cursor: 'pointer',
                  background: status === 'published' ? '#f8f9fa' : '#012d1d',
                  color: status === 'published' ? '#012d1d' : '#ffffff',
                  border: status === 'published' ? '1px solid #012d1d' : '1px solid #012d1d',
                  transition: 'all 0.2s ease', fontFamily: 'inherit'
                }}
              >
                {publishLoading
                  ? 'Processing...'
                  : status === 'published' ? 'Unpublish' : 'Publish'}
              </button>
            </div>

            {/* Storytelling Tip */}
            <div style={{
              background: '#1b4332', color: '#86af99',
              borderRadius: 12, padding: 24,
              boxShadow: '0 12px 32px rgba(5, 59, 38, 0.08)'
            }}>
              <h4 style={{ fontSize: 20, fontWeight: 600, color: '#ffffff', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lightbulb size={24} />
                Storytelling Tip
              </h4>
              <p style={{ fontSize: 16, lineHeight: '24px', opacity: 0.9, margin: 0 }}>
                Consumers love transparency. Mention specific farming techniques or community impact initiatives to build stronger brand loyalty through your traceability data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerTraceability;