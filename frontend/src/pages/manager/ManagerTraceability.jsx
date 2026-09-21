import { useEffect, useState, useMemo, useRef } from 'react';
import api from '../../shared/api/axios';
import NarrativeTextarea from '../../shared/components/traceability/NarrativeTextarea';
import {
  ChevronRight, QrCode, Camera, BadgeCheck, Eye,
  Lock, MapPin, Lightbulb, Globe, Clock
} from 'lucide-react';
import Button from '../../shared/components/UI/Button';

const ManagerTraceability = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    hero_image_url: '',
    origin_story: '',
    social_narrative: '',
    economic_narrative: '',
    environmental_narrative: ''
  });
  const [status, setStatus] = useState('draft');
  const [lastPublished, setLastPublished] = useState(null);
  const [publishLoading, setPublishLoading] = useState(false);
  const [originStoryCount, setOriginStoryCount] = useState(0);
  const [qrData, setQrData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const [sdgs, setSdgs] = useState([]);
  const [savedFormData, setSavedFormData] = useState(null);
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroError, setHeroError] = useState('');
  const heroFileInputRef = useRef(null);

  const hasChanges = useMemo(() => {
    if (!savedFormData) return false;
    return JSON.stringify(formData) !== JSON.stringify(savedFormData);
  }, [formData, savedFormData]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/manager/traceability/profile');
        console.log('Profile response:', res.data); // DEBUG
        if (res.data.success) {
          const d = res.data.data;
          setFormData(d);
          setSavedFormData({ ...d });
          setOriginStoryCount(d.origin_story?.length || 0);
          // Fix #3: Load status dari API agar tombol publish/unpublish akurat saat reload
          if (d.status) {
            setStatus(d.status);
            console.log('Status from API:', d.status); // DEBUG
          } else {
            setStatus('draft');
          }
          // Extract project_id dari response jika ada
          console.log('Project ID from response:', d.project_id); // DEBUG
          if (d.project_id) {
            setProjectId(d.project_id);
          }
        }
      } catch (error) {
        console.error('Gagal load traceability profile', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!projectId) return;

    const fetchSdgs = async () => {
      try {
        const res = await api.get(`/assessment/projects/${projectId}/project-sdgs`);
        if (res.data.success && res.data.data) {
          // Filter hanya SDGs yang selected (specific untuk project ini)
          const selectedSdgs = (res.data.data.sdgs || []).filter(sdg => sdg.selected);
          setSdgs(selectedSdgs);
        }
      } catch (error) {
        console.error('Gagal load SDGs', error);
      }
    };
    fetchSdgs();
  }, [projectId]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'origin_story') setOriginStoryCount(value.length);
  };

  const handleHeroUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setHeroError('');

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setHeroError('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.');
      e.target.value = '';
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setHeroError('Ukuran file terlalu besar. Maksimum 5 MB.');
      e.target.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, hero_image_url: previewUrl }));

    setHeroUploading(true);
    try {
      const fd = new FormData();
      fd.append('hero_image', file);
      fd.append('status', status);
      const res = await api.post('/manager/traceability/profile', fd, {
        headers: { 'Content-Type': undefined }
      });
      if (res.data.success) {
        if (res.data.data?.hero_image_url) {
          setFormData(prev => ({ ...prev, hero_image_url: res.data.data.hero_image_url }));
        }
      } else {
        setHeroError(res.data.message || 'Gagal upload gambar');
        setFormData(prev => ({ ...prev, hero_image_url: '' }));
      }
    } catch (err) {
      setHeroError(err.response?.data?.message || 'Gagal upload gambar');
      setFormData(prev => ({ ...prev, hero_image_url: '' }));
    } finally {
      setHeroUploading(false);
      e.target.value = '';
    }
  };

  const handleSaveDraft = async () => {
    setShowSaveConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setShowSaveConfirmModal(false);
    setSaving(true);
    try {
      const updatedData = { ...formData, status: 'draft' };
      await api.post('/manager/traceability/profile', updatedData);
      setStatus('draft');
      setFormData(updatedData);
      setSavedFormData(updatedData);
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
      const updatedData = { ...formData, status: newStatus };
      await api.post('/manager/traceability/profile', updatedData);
      setStatus(newStatus);
      setFormData(updatedData);
      setSavedFormData(updatedData);
      if (newStatus === 'published') {
        setLastPublished(new Date().toISOString());
      }
    } catch (error) {
      console.error('Gagal mengubah status', error);
    } finally {
      setPublishLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!projectId) {
      alert('Project ID tidak ditemukan. Silakan refresh halaman.');
      return;
    }

    setQrLoading(true);
    try {
      const res = await api.post(`/manager/projects/${projectId}/traceability/qr/generate`, {
        origin: window.location.origin,
      });
      if (res.data.success) {
        setQrData(res.data.data);
        setShowQrModal(true);
      } else {
        console.error('Gagal generate QR:', res.data.message);
        alert('Gagal generate QR code: ' + res.data.message);
      }
    } catch (error) {
      console.error('Error generate QR:', error);
      alert('Gagal generate QR code. Silakan coba lagi.');
    } finally {
      setQrLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrData || !qrData.qr_image) return;

    const link = document.createElement('a');
    link.href = qrData.qr_image;
    link.download = `traceability-qr-${qrData.profile_id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = () => {
    if (!qrData || !qrData.qr_link) return;

    navigator.clipboard.writeText(qrData.qr_link);
    alert('Link copied to clipboard!');
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    try {
      const res = await api.get('/manager/traceability/preview');
      if (res.data.success) {
        setPreviewData(res.data.data);
        setShowPreviewModal(true);
      } else {
        alert('Gagal load preview: ' + res.data.message);
      }
    } catch (error) {
      console.error('Error loading preview:', error);
      alert('Gagal load preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  if (loading) return (
    <div style={{ padding: '50px', textAlign: 'center', color: '#5C7A6D' }}>
      Memuat data...
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#5C7A6D', marginBottom: 8 }}>
            <span>Dashboard</span>
            <ChevronRight size={14} />
            <span style={{ color: '#053B26' }}>Traceability Profile</span>
          </div>
          <h1 className="page-title" style={{ margin: '0 0 8px 0' }}>Edit Profile Story</h1>
          <p className="page-description">Customize how your farm's journey appears to consumers.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="primary" onClick={handlePreview} isLoading={previewLoading} loadingText="Loading..." icon={<Eye size={18} />}>
            Preview
          </Button>
          <Button variant="primary" onClick={handleGenerateQR} isLoading={qrLoading} loadingText="Generating..." icon={<QrCode size={18} />}>
            Generate QR Code
          </Button>
          <Button variant={hasChanges ? 'primary' : 'secondary'} onClick={handleSaveDraft} isLoading={saving} loadingText="Menyimpan..." disabled={!hasChanges}>
            {hasChanges ? 'Save Changes' : 'Save Draft'}
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24 }}>
        {/* Left Column */}
        <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Cover Imagery */}
          <div className="stat-card" style={{ padding: 24, background: 'linear-gradient(180deg, #0d2f1e 0%, #1f5438 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ fontSize: 20, fontWeight: 600, color: '#ffffff', margin: 0 }}>Cover Imagery</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {heroUploading && (
                  <span style={{ fontSize: 12, color: '#c8ddad' }}>Uploading...</span>
                )}
                <input
                  type="file"
                  ref={heroFileInputRef}
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleHeroUpload}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => heroFileInputRef.current?.click()}
                  disabled={heroUploading}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ffffff', border: '1px solid #ffffff', borderRadius: 8, padding: '8px 16px', cursor: heroUploading ? 'not-allowed' : 'pointer', color: '#0d2f1e', opacity: heroUploading ? 0.6 : 1 }}
                >
                  <Camera size={18} />
                  {heroUploading ? 'Uploading...' : 'Replace Image'}
                </button>
              </div>
            </div>
            {heroError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 16px', marginBottom: 12, fontSize: 13, color: '#991b1b' }}>
                {heroError}
              </div>
            )}
            <div style={{
              position: 'relative',
              aspectRatio: '16/6',
              borderRadius: 8,
              overflow: 'hidden',
              background: '#1f5438',
              border: '1px solid #053B26'
            }}>
              <img
                src={formData.hero_image_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAK_INcgpI_eLSsp6m9eiERUz_OxYr4bn4V1Rztuz27AJ4xnlbgpxh7Fn9H0TiS46jaBuNQA5X2WOF1H3gmdfH5mMJ_7RESoZamwH4T8dQOM6mo-ELlQhAj8kNKSOe7eGWd9k5E9btbk8ek-RQCJUKcUYt7fVracuGfyvqc-j15_Cn9vBtKwyw5aVutfyNtCJIgRl_siRymz3eS0mCqrS4X5XT2oXV5X3I2DNQnxrUKqaNMby1Mbxo28AzBAIoOFvQwIS5RCnPQ4f8'}
                alt="Cover"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <p style={{ fontSize: 14, color: '#c8ddad', fontStyle: 'italic', marginTop: 12, marginBottom: 0 }}>
              Recommended size: 1920x800px. JPG or PNG format.
            </p>
          </div>

          {/* Core Metadata */}
          <div className="stat-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <h4 style={{ fontSize: 20, fontWeight: 600, color: '#0d2f1e', margin: 0 }}>Core Metadata</h4>
              <span style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '2px 8px', background: '#e0f7fa', color: '#0e7490',
                borderRadius: 9999, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.01em'
              }}>
                <BadgeCheck size={12} />
                Synced
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#0d2f1e', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                  Company
                  <Lock size={14} />
                </label>
                <div style={{
                  width: '100%', padding: '12px 16px', background: '#f8f9fa',
                  border: '1px solid #E0EBE4', borderRadius: 8,
                  fontSize: 16, color: '#5C7A6D', cursor: 'not-allowed'
                }}>
                  Kadatuan Coffee
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#0d2f1e', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                  Commodity
                  <Lock size={14} />
                </label>
                <div style={{
                  width: '100%', padding: '12px 16px', background: '#f8f9fa',
                  border: '1px solid #E0EBE4', borderRadius: 8,
                  fontSize: 16, color: '#5C7A6D', cursor: 'not-allowed'
                }}>
                  Coffee
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#0d2f1e', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                  Farm Location
                  <Lock size={14} />
                </label>
                <div style={{
                  width: '100%', padding: '12px 16px', background: '#f8f9fa',
                  border: '1px solid #E0EBE4', borderRadius: 8,
                  fontSize: 16, color: '#5C7A6D', cursor: 'not-allowed',
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
              <label htmlFor="origin-story" style={{ fontSize: 20, fontWeight: 600, color: '#0d2f1e', margin: 0 }}>Origin Story</label>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: originStoryCount > 900 ? '#fdb134' : '#5C7A6D' }}>
                {originStoryCount} / 1000 chars
              </span>
            </div>
            <textarea
              id="origin-story"
              rows={8}
              value={formData.origin_story}
              onChange={(e) => handleChange('origin_story', e.target.value)}
              maxLength={1000}
              style={{
                width: '100%', padding: '12px 16px', border: '1px solid #E0EBE4',
                borderRadius: 8, fontSize: 16, color: '#191c1d',
                outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
              placeholder="Enter your farm's unique story..."
            />
          </div>

          {/* Sustainability Impact Descriptions */}
          <div className="stat-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <h4 style={{ fontSize: 20, fontWeight: 600, color: '#0d2f1e', margin: 0 }}>Sustainability Impact Descriptions</h4>
              <span style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '2px 8px', background: '#e0f7fa', color: '#0e7490',
                borderRadius: 9999, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.01em'
              }}>
                <BadgeCheck size={12} />
                Impact Narratives
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <NarrativeTextarea
                id="social-narrative"
                label="Social Impact Narrative"
                value={formData.social_narrative}
                maxLength={500}
                onChange={(e) => handleChange('social_narrative', e.target.value)}
                placeholder="Describe your social impact..."
              />
              <NarrativeTextarea
                id="economic-narrative"
                label="Economic Impact Narrative"
                value={formData.economic_narrative}
                maxLength={500}
                onChange={(e) => handleChange('economic_narrative', e.target.value)}
                placeholder="Describe your economic impact..."
              />
              <NarrativeTextarea
                id="environmental-narrative"
                label="Environmental Impact Narrative"
                value={formData.environmental_narrative}
                maxLength={500}
                onChange={(e) => handleChange('environmental_narrative', e.target.value)}
                placeholder="Describe your environmental impact..."
              />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ gridColumn: 'span 4' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Status & Publishing */}
            <div className="stat-card" style={{ padding: 24, border: '2px solid #0d2f1e' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Globe size={20} style={{ color: '#053B26' }} />
                <h4 style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#053B26', textTransform: 'uppercase', margin: 0 }}>
                  Status &amp; Publishing
                </h4>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 14, color: '#5C7A6D', fontWeight: 500 }}>Status</span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                  padding: '4px 12px', borderRadius: 9999,
                  background: status === 'published' ? '#e0f7fa' : '#E0EBE4',
                  color: status === 'published' ? '#0e7490' : '#5C7A6D'
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: status === 'published' ? '#22d3ee' : '#5C7A6D'
                  }} />
                  {status === 'published' ? 'Published' : 'Draft'}
                </span>
              </div>

              <div style={{
                background: '#f8f9fa', borderRadius: 8, border: '1px solid #E0EBE4',
                padding: 16, marginBottom: 16, textAlign: 'center'
              }}>
                <div style={{
                  width: 64, height: 64, margin: '0 auto 8px',
                  background: '#e0f7fa', borderRadius: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid #E0EBE4'
                }}>
                  <QrCode size={32} style={{ color: '#155e75' }} />
                </div>
                <p style={{ fontSize: 10, color: '#5C7A6D', margin: 0, wordBreak: 'break-all' }}>
                  {window.location.origin}/trace/{formData.batch_number || 'BATCH-001'}
                </p>
              </div>

              <Button
                variant={status === 'published' ? 'secondary' : 'primary'}
                onClick={handlePublishToggle}
                isLoading={publishLoading}
                loadingText="Processing..."
                style={{
                  width: '100%',
                  ...(publishLoading && {
                    background: '#e5e7eb',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    opacity: 1
                  }),
                  ...(status === 'published' && !publishLoading && {
                    background: '#e5e7eb',
                    color: '#374151',
                    border: '1px solid #d1d5db'
                  })
                }}
              >
                {status === 'published' ? 'Unpublish' : 'Publish'}
              </Button>
            </div>

            {/* Storytelling Tip */}
            <div style={{
              background: 'linear-gradient(180deg, #0d2f1e 0%, #1f5438 100%)', color: '#c8ddad',
              borderRadius: 12, padding: 24,
              boxShadow: '0 12px 32px rgba(5, 59, 38, 0.08)'
            }}>
              <h4 style={{ fontSize: 20, fontWeight: 600, color: '#ffffff', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lightbulb size={24} style={{ color: '#fdb134' }} />
                Storytelling Tip
              </h4>
              <p style={{ fontSize: 16, lineHeight: '24px', opacity: 0.9, margin: 0 }}>
                Consumers love transparency. Mention specific farming techniques or community impact initiatives to build stronger brand loyalty through your traceability data.
              </p>
            </div>

            {/* SDGs Contribution */}
            {sdgs && sdgs.length > 0 && (
              <div style={{
                background: '#ffffff',
                border: '1px solid #E9ECEF',
                borderRadius: 12,
                padding: 20,
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
              }}>
                <h4 style={{ fontSize: 16, fontWeight: 600, color: '#0d2f1e', margin: '0 0 16px 0' }}>
                  Sustainability Contributions
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 8
                }}>
                  {sdgs.map((sdg) => (
                    <div key={sdg.goal_number} style={{
                      aspectRatio: '1',
                      background: '#ffffff',
                      border: '1px solid #E9ECEF',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 4,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      overflow: 'hidden'
                    }}>
                      {sdg.image_url ? (
                        <img
                          src={sdg.image_url}
                          alt={`SDG ${sdg.goal_number}`}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      ) : (
                        <div style={{ textAlign: 'center', fontSize: 10, color: '#6C757D', fontWeight: 600 }}>
                          SDG {sdg.goal_number}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrModal && qrData && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 32,
            maxWidth: 500,
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0d2f1e', margin: 0 }}>
                QR Code Generated
              </h2>
              <button
                onClick={() => setShowQrModal(false)}
                style={{
                  background: 'none', border: 'none', fontSize: 24, cursor: 'pointer',
                  color: '#5C7A6D'
                }}
              >
                ×
              </button>
            </div>

            {/* QR Image */}
            <div style={{
              display: 'flex', justifyContent: 'center', marginBottom: 24,
              padding: 20, background: '#f8f9fa', borderRadius: 8, border: '1px solid #E0EBE4'
            }}>
              <img
                src={qrData.qr_image}
                alt="QR Code"
                style={{ maxWidth: '300px', width: '100%', height: 'auto' }}
              />
            </div>

            {/* Public Link */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#0d2f1e', display: 'block', marginBottom: 8 }}>
                Public Access Link
              </label>
              <div style={{
                display: 'flex', gap: 8, alignItems: 'center',
                padding: '12px 16px', background: '#f8f9fa',
                border: '1px solid #E0EBE4', borderRadius: 8,
                fontSize: 14, color: '#5C7A6D', wordBreak: 'break-all'
              }}>
                <span style={{ flex: 1 }}>{qrData.qr_link}</span>
                <button
                  onClick={handleCopyLink}
                  style={{
                    background: '#0d2f1e', color: 'white',
                    border: 'none', borderRadius: 6, padding: '6px 12px',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleDownloadQR}
                style={{
                  flex: 1, padding: '12px 24px', background: '#0d2f1e', color: 'white',
                  border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Download QR
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                style={{
                  flex: 1, padding: '12px 24px', background: 'white', color: '#0d2f1e',
                  border: '1px solid #E0EBE4', borderRadius: 8, fontSize: 14, fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>

            <p style={{
              fontSize: 12, color: '#5C7A6D', marginTop: 16, marginBottom: 0,
              textAlign: 'center'
            }}>
              Share this QR code or link with consumers to access your traceability profile.
            </p>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewData && (() => {
        const { project, profile, sdgs: previewSdgs } = previewData;
        // Gabungkan formData (data yang sedang diedit) dengan data dari DB
        const heroImage = formData.hero_image_url || profile.hero_image_url || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200';
        const previewTitle = formData.title || profile.title || project?.name || 'Untitled';
        const previewTagline = formData.tagline || profile.tagline || '';
        const previewOrigin = formData.origin_story || profile.origin_story;
        const mergedSdgs = sdgs.length > 0 ? sdgs : previewSdgs;
        return (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            zIndex: 1000, overflowY: 'auto', padding: '40px 16px'
          }}>
            <div style={{
              background: 'white',
              borderRadius: 12,
              maxWidth: 800,
              width: '100%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              marginBottom: 40
            }}>
              {/* Modal Header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 24px', borderBottom: '1px solid #E0EBE4'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0d2f1e', margin: 0 }}>
                    Profile Preview
                  </h2>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                    padding: '4px 12px', borderRadius: 9999,
                    background: status === 'published' ? '#d1fae5' : '#fef3c7',
                    color: status === 'published' ? '#065f46' : '#92400e'
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: status === 'published' ? '#10b981' : '#f59e0b'
                    }} />
                    {status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  style={{
                    background: 'none', border: 'none', fontSize: 24, cursor: 'pointer',
                    color: '#5C7A6D'
                  }}
                >
                  ×
                </button>
              </div>

              {/* Preview Content (mirrors public page) */}
              <div style={{ padding: 0 }}>
                {/* Hero Image */}
                {(heroImage || previewOrigin) && (
                  <div style={{ position: 'relative', width: '100%', height: 250, overflow: 'hidden' }}>
                    <img
                      src={heroImage}
                      alt={previewTitle}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, padding: 24, width: '100%' }}>
                      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#ffffff', margin: '0 0 4px 0' }}>
                        {previewTitle}
                      </h1>
                      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                        {project?.company_name && project?.name && project.company_name !== project.name
                          ? `${project.company_name} · ` : ''}{previewTagline}
                      </p>
                    </div>
                  </div>
                )}

                <div style={{ padding: 24 }}>
                  {/* Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
                    {[
                      { label: 'Project', value: profile.title || project?.name },
                      { label: 'Company', value: project?.company_name },
                      { label: 'Commodity', value: project?.commodity },
                      { label: 'Location', value: project?.location },
                    ].map(item => (
                      <div key={item.label} style={{ background: '#f8f9fa', padding: 12, borderRadius: 8, border: '1px solid #E0EBE4' }}>
                        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', color: '#6C757D', textTransform: 'uppercase', margin: '0 0 4px 0' }}>{item.label}</p>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#191c1d', margin: 0 }}>{item.value || '-'}</p>
                      </div>
                    ))}
                  </div>

                  {/* Origin Story */}
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0d2f1e', margin: '0 0 12px 0' }}>Origin Story</h3>
                    <p style={{ fontSize: 14, lineHeight: '22px', color: profile.origin_story ? '#414844' : '#adb5bd', fontStyle: profile.origin_story ? 'normal' : 'italic', margin: 0 }}>
                      {profile.origin_story || 'Belum diisi'}
                    </p>
                  </div>

                  {/* Sustainability Impact */}
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0d2f1e', margin: '0 0 12px 0' }}>Sustainability Impact</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                      {/* Social Impact */}
                      <div>
                        <h4 style={{ fontSize: 15, fontWeight: 600, color: '#0d2f1e', margin: '0 0 8px 0' }}>Social Impact</h4>
                        <p style={{ fontSize: 13, lineHeight: '20px', color: '#414844', margin: 0, fontStyle: 'italic' }}>
                          {formData.social_narrative || (profile && profile.origin_story ? 'Belum diisi' : '')}
                        </p>
                      </div>

                      {/* Economic Impact */}
                      <div>
                        <h4 style={{ fontSize: 15, fontWeight: 600, color: '#0d2f1e', margin: '0 0 8px 0' }}>Economic Impact</h4>
                        <p style={{ fontSize: 13, lineHeight: '20px', color: '#414844', margin: 0, fontStyle: 'italic' }}>
                          {formData.economic_narrative || 'Belum diisi'}
                        </p>
                      </div>
                    </div>

                    {/* Environmental Impact */}
                    <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #E0EBE4' }}>
                      <h4 style={{ fontSize: 15, fontWeight: 600, color: '#0d2f1e', margin: '0 0 8px 0' }}>Environmental Impact</h4>
                      <p style={{ fontSize: 13, lineHeight: '20px', color: '#414844', margin: 0, fontStyle: 'italic' }}>
                        {formData.environmental_narrative || 'Belum diisi'}
                      </p>
                    </div>
                  </div>

                  {/* SDGs */}
                  {mergedSdgs && mergedSdgs.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0d2f1e', margin: '0 0 12px 0' }}>SDGs Contribution</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                        {mergedSdgs.map(sdg => (
                          <div key={sdg.goal_number} style={{
                            aspectRatio: '1', border: '1px solid #E9ECEF', borderRadius: 8,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, overflow: 'hidden'
                          }}>
                            {sdg.image_url ? (
                              <img src={sdg.image_url} alt={`SDG ${sdg.goal_number}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                              <span style={{ fontSize: 10, color: '#6C757D', fontWeight: 600 }}>SDG {sdg.goal_number}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div style={{
                padding: '16px 24px', borderTop: '1px solid #E0EBE4',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <p style={{ fontSize: 12, color: '#5C7A6D', margin: 0 }}>
                  {status === 'published'
                    ? 'This profile is live and accessible to consumers.'
                    : 'Publish to make this profile accessible to consumers.'}
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {status === 'draft' && (
                    <button
                      onClick={async () => {
                        await handlePublishToggle();
                        setShowPreviewModal(false);
                      }}
                      disabled={publishLoading}
                      style={{
                        padding: '10px 20px', background: '#0d2f1e', color: 'white',
                        border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        cursor: publishLoading ? 'not-allowed' : 'pointer',
                        opacity: publishLoading ? 0.6 : 1
                      }}
                    >
                      {publishLoading ? 'Publishing...' : 'Publish'}
                    </button>
                  )}
                  {status === 'published' && (
                    <button
                      onClick={async () => {
                        await handlePublishToggle();
                        setShowPreviewModal(false);
                      }}
                      disabled={publishLoading}
                      style={{
                        padding: '10px 20px', background: '#fef3c7', color: '#92400e',
                        border: '1px solid #fcd34d', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        cursor: publishLoading ? 'not-allowed' : 'pointer',
                        opacity: publishLoading ? 0.6 : 1
                      }}
                    >
                      {publishLoading ? 'Processing...' : 'Unpublish'}
                    </button>
                  )}
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    style={{
                      padding: '10px 20px', background: 'white', color: '#0d2f1e',
                      border: '1px solid #E0EBE4', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Save Confirmation Modal */}
      {showSaveConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: '40px 32px 32px',
            maxWidth: 420,
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0d2f1e', margin: '0 0 12px 0' }}>
              Simpan Perubahan?
            </h3>
            <p style={{ fontSize: 14, color: '#5C7A6D', margin: '0 0 28px 0', lineHeight: 1.6 }}>
              Perubahan yang sudah disimpan tidak dapat dikembalikan.<br />
              Status akan diubah menjadi <strong style={{ color: '#0d2f1e' }}>Draft</strong>.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => setShowSaveConfirmModal(false)}
                style={{
                  padding: '10px 28px', background: 'white', color: '#5C7A6D',
                  border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.target.style.borderColor = '#0d2f1e'; e.target.style.color = '#0d2f1e'; }}
                onMouseLeave={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.color = '#5C7A6D'; }}
              >
                Tidak
              </button>
              <button
                onClick={handleConfirmSave}
                style={{
                  padding: '10px 28px', background: '#0d2f1e', color: 'white',
                  border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.target.style.background = '#1a4d33'; }}
                onMouseLeave={e => { e.target.style.background = '#0d2f1e'; }}
              >
                Ya, Simpan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManagerTraceability;