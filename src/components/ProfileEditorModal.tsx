import React, { useState } from 'react';
import { X, Save, Edit3, ShieldAlert, Sparkles, Check } from 'lucide-react';
import { AccountProfile } from '../types';

interface ProfileEditorModalProps {
  profile: AccountProfile;
  onClose: () => void;
  onSave: (id: string, updates: Partial<AccountProfile>) => Promise<void>;
  onShowToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const ProfileEditorModal: React.FC<ProfileEditorModalProps> = ({
  profile,
  onClose,
  onSave,
  onShowToast,
}) => {
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [handle, setHandle] = useState(profile.handle || '');
  const [niche, setNiche] = useState(profile.niche);
  const [audience, setAudience] = useState(profile.audience);
  const [tone, setTone] = useState(profile.tone);
  const [ctaStyle, setCtaStyle] = useState(profile.cta_style);

  // Content Pillars tags
  const [pillars, setPillars] = useState<string[]>(profile.content_pillars || []);
  const [newPillar, setNewPillar] = useState('');

  // Avoid List tags
  const [avoidList, setAvoidList] = useState<string[]>(profile.avoid_list || []);
  const [newAvoid, setNewAvoid] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  const handleAddPillar = () => {
    if (newPillar.trim() && !pillars.includes(newPillar.trim())) {
      setPillars([...pillars, newPillar.trim()]);
      setNewPillar('');
    }
  };

  const handleRemovePillar = (item: string) => {
    setPillars(pillars.filter(p => p !== item));
  };

  const handleAddAvoid = () => {
    if (newAvoid.trim() && !avoidList.includes(newAvoid.trim())) {
      setAvoidList([...avoidList, newAvoid.trim()]);
      setNewAvoid('');
    }
  };

  const handleRemoveAvoid = (item: string) => {
    setAvoidList(avoidList.filter(a => a !== item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(profile.id, {
        display_name: displayName.trim(),
        handle: handle.trim() || null,
        niche: niche.trim(),
        audience: audience.trim(),
        tone: tone.trim(),
        cta_style: ctaStyle.trim(),
        content_pillars: pillars,
        avoid_list: avoidList,
      });
      onShowToast('success', `Profil "${displayName}" berhasil diperbarui!`);
      onClose();
    } catch (err: any) {
      onShowToast('error', err.message || 'Gagal menyimpan profil');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Edit Profil Akun">
      <div className="modal-card">
        <div className="modal-header">
          <h2 className="modal-title">
            <Edit3 size={18} color="#00f2fe" />
            <span>Edit Profil Akun & Identitas Niche</span>
          </h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Nama Tampilan Akun</label>
                <input
                  type="text"
                  className="form-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Handle TikTok</label>
                <input
                  type="text"
                  className="form-input"
                  value={handle}
                  placeholder="@username"
                  onChange={(e) => setHandle(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Deskripsi Niche Spesifik</label>
              <input
                type="text"
                className="form-input"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target Audiens</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: '65px' }}
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="Demografi dan kebutuhan penonton..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tone & Gaya Bahasa</label>
              <input
                type="text"
                className="form-input"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="Contoh: Edukatif, santai, lugas, ramah..."
              />
            </div>

            {/* Content Pillars */}
            <div className="form-group">
              <label className="form-label">Pilar Konten Utama ({pillars.length})</label>
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Tambah pilar konten baru..."
                  value={newPillar}
                  onChange={(e) => setNewPillar(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPillar())}
                />
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddPillar}>
                  Tambah
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {pillars.map((pillar, idx) => (
                  <span key={idx} className="input-tag-pill">
                    {pillar}
                    <button type="button" className="input-tag-delete" onClick={() => handleRemovePillar(pillar)}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Avoid List */}
            <div className="form-group">
              <label className="form-label" style={{ color: '#fb7185' }}>
                Daftar yang Harus Dihindari (Avoid List)
              </label>
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Hal terlarang (misal: klaim instan, body shaming)..."
                  value={newAvoid}
                  onChange={(e) => setNewAvoid(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAvoid())}
                />
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddAvoid}>
                  Tambah
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {avoidList.map((avoid, idx) => (
                  <span key={idx} className="input-tag-pill" style={{ borderColor: 'rgba(251, 113, 133, 0.4)' }}>
                    {avoid}
                    <button type="button" className="input-tag-delete" onClick={() => handleRemoveAvoid(avoid)}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* CTA Style */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Gaya Ajakan Bertindak (Call to Action / CTA)</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: '65px' }}
                value={ctaStyle}
                onChange={(e) => setCtaStyle(e.target.value)}
                placeholder="Contoh: Save konten ini buat referensi, cek keranjang kuning..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              <Save size={15} />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Profil'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
