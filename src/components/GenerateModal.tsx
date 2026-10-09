import React, { useState } from 'react';
import { X, Sparkles, Plus, AlertCircle, ShoppingBag, ShieldCheck } from 'lucide-react';
import { AccountProfile, DraftFormat, DraftGenerationRequest } from '../types';

interface GenerateModalProps {
  profiles: AccountProfile[];
  initialProfileId?: string;
  targetDate: string;
  onClose: () => void;
  onGenerate: (data: DraftGenerationRequest) => Promise<void>;
  onBatchGenerate?: (targetDate: string) => Promise<void>;
  onShowToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const GenerateModal: React.FC<GenerateModalProps> = ({
  profiles,
  initialProfileId,
  targetDate,
  onClose,
  onGenerate,
  onBatchGenerate,
  onShowToast,
}) => {
  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    initialProfileId || (profiles[0]?.id || '')
  );
  const [isBatchMode, setIsBatchMode] = useState(initialProfileId === 'batch');
  const [date, setDate] = useState(targetDate);
  const [format, setFormat] = useState<DraftFormat>('carousel');
  const [topic, setTopic] = useState('');

  // Product context
  const [productName, setProductName] = useState('');
  const [facts, setFacts] = useState<string[]>([]);
  const [newFact, setNewFact] = useState('');
  const [sourceNotes, setSourceNotes] = useState('');
  const [affiliateDisclosureNeeded, setAffiliateDisclosureNeeded] = useState(true);

  const [isLoading, setIsLoading] = useState(false);

  const selectedProfile = profiles.find(p => p.id === selectedProfileId);
  const pillars = selectedProfile?.content_pillars || [];

  const handleAddFact = () => {
    if (newFact.trim()) {
      setFacts([...facts, newFact.trim()]);
      setNewFact('');
    }
  };

  const handleRemoveFact = (index: number) => {
    setFacts(facts.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isBatchMode && onBatchGenerate) {
        await onBatchGenerate(date);
        onShowToast('success', 'Berhasil membuat draf untuk semua 4 akun!');
        onClose();
        return;
      }

      const request: DraftGenerationRequest = {
        profileId: selectedProfileId,
        targetDate: date,
        format,
        topic: topic.trim() || undefined,
        productContext: {
          productName: productName.trim() || undefined,
          facts: facts.length > 0 ? facts : undefined,
          sourceNotes: sourceNotes.trim() ? [sourceNotes.trim()] : undefined,
          affiliateDisclosureNeeded,
        },
      };

      await onGenerate(request);
      onShowToast('success', 'Draf konten baru berhasil dibuat!');
      onClose();
    } catch (err: any) {
      onShowToast('error', err.message || 'Gagal menghasilkan draf');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Generate Konten AI">
      <div className="modal-card">
        <div className="modal-header">
          <h2 className="modal-title">
            <Sparkles size={20} color="#ff0050" />
            <span>Generate Draf Konten Harian</span>
          </h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Mode switch */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <button
                type="button"
                className={`btn btn-sm ${!isBatchMode ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setIsBatchMode(false)}
              >
                Satu Akun Spesifik
              </button>
              <button
                type="button"
                className={`btn btn-sm ${isBatchMode ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setIsBatchMode(true)}
              >
                Batch 4 Akun Sekaligus
              </button>
            </div>

            {/* Target Date */}
            <div className="form-group">
              <label className="form-label">Tanggal Target Unggah</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {!isBatchMode ? (
              <>
                {/* Account Selection */}
                <div className="form-group">
                  <label className="form-label">Pilih Akun Niche</label>
                  <select
                    className="form-select"
                    value={selectedProfileId}
                    onChange={(e) => setSelectedProfileId(e.target.value)}
                  >
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.display_name} ({p.handle || p.slug}) — {p.niche}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Content Format */}
                <div className="form-group">
                  <label className="form-label">Format Konten</label>
                  <select
                    className="form-select"
                    value={format}
                    onChange={(e) => setFormat(e.target.value as DraftFormat)}
                  >
                    <option value="carousel">🖼️ Carousel Slide (5-7 Slide Gambar/Infografis)</option>
                    <option value="short_video_outline">🎬 Outline Video Pendek (4-6 Storyboard Beats)</option>
                  </select>
                </div>

                {/* Topic / Angle */}
                <div className="form-group">
                  <label className="form-label">Topik / Ide Utama (Opsional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Urutan layering skincare pagi vs malam"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                  {pillars.length > 0 && (
                    <div style={{ marginTop: '0.4rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Saran pilar:</span>
                      {pillars.slice(0, 3).map((pillar, i) => (
                        <button
                          key={i}
                          type="button"
                          className="pillar-tag"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setTopic(pillar)}
                        >
                          + {pillar}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Context (Affiliate) */}
                <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem', marginTop: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.875rem' }}>
                    <ShoppingBag size={16} color="#fb7185" />
                    <span>Konteks Produk & Afiliasi (Opsional)</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Nama Produk / Etalase</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: Ceramide Barrier Gel Moisturizer"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                    />
                  </div>

                  {/* Facts Supplied */}
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>
                      Fakta Resmi Produk (Mencegah Halusinasi Klaim AI)
                    </label>
                    <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Contoh: BPOM NA1821010001, Isi 50ml, Mengandung 5x Ceramide"
                        value={newFact}
                        onChange={(e) => setNewFact(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFact())}
                      />
                      <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddFact}>
                        Tambah
                      </button>
                    </div>

                    {facts.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {facts.map((f, i) => (
                          <span key={i} className="input-tag-pill" style={{ fontSize: '0.75rem' }}>
                            {f}
                            <button type="button" className="input-tag-delete" onClick={() => handleRemoveFact(i)}>
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <label className="checklist-item" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                    <input
                      type="checkbox"
                      checked={affiliateDisclosureNeeded}
                      onChange={(e) => setAffiliateDisclosureNeeded(e.target.checked)}
                    />
                    <span style={{ fontSize: '0.8rem' }}>
                      Sertakan pengingat TikTok affiliate & etalase keranjang kuning
                    </span>
                  </label>
                </div>
              </>
            ) : (
              <div className="alert-box alert-info" style={{ marginTop: '0.5rem' }}>
                <Sparkles size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.85rem' }}>
                  <strong>Generate Otomatis untuk 4 Akun Niche:</strong>
                  <ul style={{ paddingLeft: '1.2rem', marginTop: '0.4rem', lineHeight: '1.4' }}>
                    {profiles.map(p => (
                      <li key={p.id}><strong>{p.display_name}</strong> ({p.niche})</li>
                    ))}
                  </ul>
                  <p style={{ marginTop: '0.5rem', color: '#cbd5e1' }}>
                    Sistem akan menyusun 4 draf terpisah yang relevan dengan pilar konten masing-masing akun untuk tanggal terpilih.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              <Sparkles size={15} />
              <span>{isLoading ? 'Sedang Memproses AI...' : isBatchMode ? 'Generate 4 Draf Sekaligus' : 'Generate Draf'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
