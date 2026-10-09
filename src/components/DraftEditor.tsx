import React, { useState, useEffect } from 'react';
import {
  X, Save, RefreshCw, Copy, CheckCircle2, AlertTriangle, Smartphone,
  Layers, Plus, Trash2, ShieldAlert, Sparkles, Send, Check, ChevronLeft, ChevronRight,
  ExternalLink, Archive, FileText, Hash, CheckSquare
} from 'lucide-react';
import { ContentDraft, ContentDraftOutput, DraftStatus, SlideItem } from '../types';

interface DraftEditorProps {
  draft: ContentDraft;
  onClose: () => void;
  onSave: (updated: ContentDraft) => Promise<void>;
  onRegenerate: (scope: 'all' | 'hook' | 'slides' | 'caption' | 'checklist', slidePos?: number) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onDuplicate: (draft: ContentDraft) => void;
  onShowToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const DraftEditor: React.FC<DraftEditorProps> = ({
  draft,
  onClose,
  onSave,
  onRegenerate,
  onArchive,
  onDuplicate,
  onShowToast,
}) => {
  // Local state for draft fields
  const [title, setTitle] = useState(draft.output?.title || '');
  const [hook, setHook] = useState(draft.output?.hook || '');
  const [slides, setSlides] = useState<SlideItem[]>(draft.output?.slides || []);
  const [caption, setCaption] = useState(draft.output?.caption || '');
  const [hashtags, setHashtags] = useState<string[]>(draft.output?.hashtags || []);
  const [newHashtag, setNewHashtag] = useState('');
  const [sourceNotes, setSourceNotes] = useState<string[]>(draft.output?.source_notes || []);
  const [claimsToVerify, setClaimsToVerify] = useState<string[]>(draft.output?.claims_to_verify || []);
  const [disclosureReminder, setDisclosureReminder] = useState(draft.output?.disclosure_reminder || '');
  const [checklist, setChecklist] = useState<string[]>(draft.output?.checklist || []);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const [status, setStatus] = useState<DraftStatus>(draft.status);
  const [userNotes, setUserNotes] = useState(draft.user_notes || '');
  const [userRating, setUserRating] = useState<number | null>(draft.user_rating);

  // Active slide in phone preview
  const [previewSlideIdx, setPreviewSlideIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'slides' | 'preview'>('slides');
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showPostedModal, setShowPostedModal] = useState(false);
  const [postedTimestamp, setPostedTimestamp] = useState(new Date().toISOString().slice(0, 16));

  useEffect(() => {
    // If slides length changes, clamp preview index
    if (previewSlideIdx >= slides.length) {
      setPreviewSlideIdx(Math.max(0, slides.length - 1));
    }
  }, [slides.length, previewSlideIdx]);

  const handleAddSlide = () => {
    const newPos = slides.length + 1;
    const newSlide: SlideItem = {
      position: newPos,
      text: `Slide ${newPos}: [Tulis poin baru di sini]`,
      visual_direction: 'Visual estetik mendukung poin di atas',
      image_prompt: 'Aesthetic vertical 9:16 commercial photograph, modern minimalist studio lighting, high resolution --ar 9:16',
    };
    setSlides([...slides, newSlide]);
  };

  const handleUpdateSlide = (idx: number, updates: Partial<SlideItem>) => {
    const updated = slides.map((s, i) => i === idx ? { ...s, ...updates } : s);
    setSlides(updated);
  };

  const handleDeleteSlide = (idx: number) => {
    if (slides.length <= 1) {
      onShowToast('error', 'Minimal harus ada 1 slide');
      return;
    }
    const filtered = slides.filter((_, i) => i !== idx).map((s, i) => ({ ...s, position: i + 1 }));
    setSlides(filtered);
  };

  const handleAddHashtag = () => {
    const cleaned = newHashtag.replace(/^#/, '').trim();
    if (cleaned && !hashtags.includes(cleaned)) {
      setHashtags([...hashtags, cleaned]);
      setNewHashtag('');
    }
  };

  const handleRemoveHashtag = (tag: string) => {
    setHashtags(hashtags.filter(t => t !== tag));
  };

  const handleToggleChecklist = (idx: number) => {
    setCheckedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const buildCurrentOutput = (): ContentDraftOutput => ({
    title,
    format: draft.format,
    hook,
    slides,
    caption,
    hashtags,
    source_notes: sourceNotes,
    claims_to_verify: claimsToVerify,
    disclosure_reminder: disclosureReminder || null,
    checklist,
  });

  const handleSave = async (customStatus?: DraftStatus, postedAtVal?: string | null) => {
    setIsSaving(true);
    try {
      const targetStatus = customStatus || status;
      const updatedDraft: ContentDraft = {
        ...draft,
        status: targetStatus,
        user_notes: userNotes,
        user_rating: userRating,
        posted_at: postedAtVal !== undefined ? postedAtVal : draft.posted_at,
        output_json: JSON.stringify(buildCurrentOutput()),
        output: buildCurrentOutput(),
      };
      await onSave(updatedDraft);
      if (customStatus) setStatus(customStatus);
      onShowToast('success', 'Perubahan draft berhasil disimpan!');
    } catch (err: any) {
      onShowToast('error', err.message || 'Gagal menyimpan draf');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: DraftStatus) => {
    if (newStatus === 'ready') {
      // Check if all checklist items are checked
      const uncompleted = checklist.some((_, idx) => !checkedItems[idx]);
      if (uncompleted) {
        const proceed = confirm('Beberapa item pre-publish checklist belum dicentang. Tetap tandai sebagai "Siap Posting (Ready)"?');
        if (!proceed) return;
      }
    }

    if (newStatus === 'posted') {
      setShowPostedModal(true);
      return;
    }

    setStatus(newStatus);
    await handleSave(newStatus);
  };

  const handleConfirmPosted = async () => {
    setShowPostedModal(false);
    setStatus('posted');
    await handleSave('posted', new Date(postedTimestamp).toISOString());
    onShowToast('success', 'Konten ditandai sebagai Posted!');
  };

  const handleTriggerRegenerate = async (scope: 'all' | 'hook' | 'slides' | 'caption' | 'checklist', slidePos?: number) => {
    const confirmMsg = scope === 'all'
      ? 'Apakah Anda yakin ingin meregenerasi seluruh draft? Editan teks Anda akan ditimpa dengan draft baru.'
      : `Apakah Anda ingin meregenerasi bagian ${scope}?`;
    if (!confirm(confirmMsg)) return;

    setIsRegenerating(true);
    try {
      await onRegenerate(scope, slidePos);
      onShowToast('success', `Bagian ${scope} berhasil diregenerasi!`);
    } catch (err: any) {
      onShowToast('error', err.message || 'Gagal meregenerasi');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Copy full package formatted for TikTok
  const handleCopyFullPackage = () => {
    const formattedSlides = slides.map(s => {
      const cleanText = s.text.replace(/^Slide \d+:\s*/i, '');
      const imgPrompt = s.image_prompt || `Vertical 9:16 composition. Visual & Background: ${s.visual_direction}. Text on slide: "${cleanText}" --ar 9:16`;
      return `[SLIDE ${s.position}]\n${s.text}\nVisual & Background: ${s.visual_direction}\nPrompt AI Image (9:16): ${imgPrompt}`;
    }).join('\n\n');
    const tagsString = hashtags.map(h => `#${h}`).join(' ');

    const packageText = `📌 JUDUL: ${title}
🎯 HOOK: ${hook}

🖼️ SLIDE CAROUSEL:
${formattedSlides}

📝 CAPTION:
${caption}

🏷️ HASHTAGS:
${tagsString}

${disclosureReminder ? `⚠️ DISCLOSURE: ${disclosureReminder}\n` : ''}
🔍 CATATAN SUMBER:
${sourceNotes.join('\n')}`;

    navigator.clipboard.writeText(packageText);
    onShowToast('success', 'Paket konten lengkap (termasuk prompt gambar) disalin!');
  };

  const handleCopyImagePrompt = (promptText: string, slideNumber: number) => {
    navigator.clipboard.writeText(promptText);
    onShowToast('success', `Prompt gambar Slide ${slideNumber} disalin!`);
  };

  const handleCopyAllImagePrompts = () => {
    const allPrompts = slides.map(s => {
      const cleanText = s.text.replace(/^Slide \d+:\s*/i, '');
      const promptContent = s.image_prompt || `Vertical 9:16 composition. Visual & Background: ${s.visual_direction}. Text on slide: "${cleanText}" --ar 9:16`;
      return `[Slide ${s.position} - Prompt AI Image 9:16]\n${promptContent}`;
    }).join('\n\n');
    navigator.clipboard.writeText(allPrompts);
    onShowToast('success', 'Semua prompt gambar (teks + visual 9:16) disalin!');
  };

  const handleSyncImagePrompt = (idx: number) => {
    const s = slides[idx];
    const cleanText = s.text.replace(/^Slide \d+:\s*/i, '');
    const newPrompt = `Vertical 9:16 composition. Visual & Background: ${s.visual_direction}. Text on slide: "${cleanText}". Soft clean studio lighting, minimalist editorial layout, highly detailed 8k --ar 9:16`;
    handleUpdateSlide(idx, { image_prompt: newPrompt });
    onShowToast('info', `Prompt gambar Slide ${s.position} disinkronkan dengan teks & visual terbaru!`);
  };

  const handleCopyCaptionOnly = () => {
    const tagsString = hashtags.map(h => `#${h}`).join(' ');
    navigator.clipboard.writeText(`${caption}\n\n${tagsString}`);
    onShowToast('success', 'Caption & Hashtag disalin ke clipboard!');
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Editor Draf Konten">
      <div className="modal-card modal-card-large">
        {/* Editor Top Bar */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.85rem' }}>
              {draft.profile?.display_name || 'Akun'}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Target: <strong>{draft.target_date}</strong>
            </span>
            <span style={{ fontSize: '0.75rem', color: '#cbd5e1', background: 'rgba(59,130,246,0.15)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
              v{draft.version} • AI Draft
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {/* Status Selector */}
            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.825rem', fontWeight: 600 }}
              value={status}
              onChange={(e) => handleStatusChange(e.target.value as DraftStatus)}
              aria-label="Status Draf"
            >
              <option value="idea">💡 Ide</option>
              <option value="draft">📝 Draf AI</option>
              <option value="needs_review">🔍 Perlu Review</option>
              <option value="ready">✅ Siap Posting (Ready)</option>
              <option value="posted">🚀 Sudah Diposting (Posted)</option>
              <option value="archived">📁 Arsipkan</option>
            </select>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onDuplicate(draft)}
              title="Duplikasi Draf ke Tanggal Lain"
            >
              Duplikat
            </button>

            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={() => onArchive(draft.id)}
              title="Arsipkan Draf"
              aria-label="Arsipkan Draf"
            >
              <Archive size={16} />
            </button>

            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={onClose}
              title="Tutup Editor"
              aria-label="Tutup Editor"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Editor Body */}
        <div className="modal-body">
          {/* Claims to Verify Notice Banner */}
          {claimsToVerify.length > 0 && (
            <div className="alert-box alert-warning" style={{ marginBottom: '1.25rem' }}>
              <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', marginBottom: '0.2rem' }}>
                  Klaim Faktual Perlu Diverifikasi Sebelum Posting!
                </strong>
                <ul style={{ paddingLeft: '1.2rem', margin: '0.3rem 0 0', fontSize: '0.8rem', lineHeight: '1.4' }}>
                  {claimsToVerify.map((claim, idx) => (
                    <li key={idx}>{claim}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Affiliate Disclosure Reminder Banner */}
          {disclosureReminder && (
            <div className="alert-box alert-info" style={{ marginBottom: '1.25rem' }}>
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: '0.8rem', display: 'block' }}>Pengingat Disclosure Affiliate</strong>
                <input
                  type="text"
                  className="form-input"
                  style={{ marginTop: '0.3rem', fontSize: '0.8rem', padding: '0.3rem 0.5rem' }}
                  value={disclosureReminder}
                  onChange={(e) => setDisclosureReminder(e.target.value)}
                  placeholder="Keterangan pengungkapan afiliasi..."
                />
              </div>
            </div>
          )}

          {/* Title & Opening Hook */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Judul Internal Konten</label>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Judul draf..."
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" style={{ color: '#00f2fe' }}>
                  🎯 Hook / Headline Slide 1 (Krusial untuk FYP)
                </label>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem' }}
                  onClick={() => handleTriggerRegenerate('hook')}
                  disabled={isRegenerating}
                >
                  <RefreshCw size={11} /> Regen Hook
                </button>
              </div>
              <input
                type="text"
                className="form-input"
                style={{ fontWeight: 600, fontSize: '0.95rem', borderColor: 'rgba(0, 242, 254, 0.4)' }}
                value={hook}
                onChange={(e) => setHook(e.target.value)}
                placeholder="Kalimat pembuka 3 detik pertama..."
              />
            </div>
          </div>

          {/* Tabs for Mobile/Desktop: Slide Editor vs TikTok Smartphone Preview */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            <button
              className={`btn btn-sm ${activeTab === 'slides' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('slides')}
            >
              <Layers size={14} /> Slide Editor ({slides.length})
            </button>
            <button
              className={`btn btn-sm ${activeTab === 'preview' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('preview')}
            >
              <Smartphone size={14} /> TikTok Phone Preview
            </button>
          </div>

          {/* Two-Column Editor Layout */}
          <div className="editor-layout">
            {/* Main Column */}
            <div className="editor-main-col">
              {activeTab === 'slides' ? (
                <div className="slides-container">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>
                      Slide-by-Slide Copywriting
                    </span>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handleAddSlide}
                    >
                      <Plus size={14} /> Tambah Slide
                    </button>
                  </div>

                  {slides.map((slide, idx) => (
                    <div key={idx} className="slide-editor-card">
                      <div className="slide-editor-header">
                        <span className="slide-number-pill">Slide {slide.position}</span>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => handleTriggerRegenerate('slides', slide.position)}
                            title="Regenerasi slide ini"
                          >
                            <RefreshCw size={12} /> Regen
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleDeleteSlide(idx)}
                            style={{ color: '#fb7185' }}
                            title="Hapus slide"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Teks di Layar (On-Screen Copy)</label>
                        <textarea
                          className="form-textarea"
                          style={{ minHeight: '65px' }}
                          value={slide.text}
                          onChange={(e) => handleUpdateSlide(idx, { text: e.target.value })}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: '0.65rem' }}>
                        <label className="form-label" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Arahan Visual & Background</label>
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: '0.8rem', color: '#cbd5e1' }}
                          value={slide.visual_direction}
                          onChange={(e) => handleUpdateSlide(idx, { visual_direction: e.target.value })}
                        />
                      </div>

                      {/* AI Image Generation Prompt */}
                      <div className="form-group" style={{ marginBottom: 0, background: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: 'var(--radius-sm)', padding: '0.6rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <label className="form-label" style={{ fontSize: '0.75rem', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0, fontWeight: 700 }}>
                            <Sparkles size={12} /> Prompt AI Image (Midjourney / Flux / DALL-E)
                            <span style={{ fontSize: '0.68rem', background: 'rgba(168, 85, 247, 0.2)', padding: '0.1rem 0.4rem', borderRadius: '4px', color: '#e9d5ff' }}>
                              9:16
                            </span>
                          </label>
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem', color: '#cbd5e1' }}
                              onClick={() => handleSyncImagePrompt(idx)}
                              title="Sinkronkan prompt dengan teks & arahan visual saat ini"
                            >
                              <RefreshCw size={11} /> Sinkronkan
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem', color: '#e9d5ff', border: '1px solid rgba(168, 85, 247, 0.3)' }}
                              onClick={() => handleCopyImagePrompt(slide.image_prompt || '', slide.position)}
                              title="Salin Prompt Gambar Slide Ini"
                            >
                              <Copy size={11} /> Salin Prompt
                            </button>
                          </div>
                        </div>
                        <textarea
                          className="form-textarea"
                          style={{ minHeight: '50px', fontSize: '0.78rem', color: '#f3e8ff', background: 'rgba(15, 23, 42, 0.6)', borderColor: 'rgba(168, 85, 247, 0.3)' }}
                          value={slide.image_prompt || ''}
                          placeholder="Prompt gambar Midjourney/Flux dalam bahasa Inggris..."
                          onChange={(e) => handleUpdateSlide(idx, { image_prompt: e.target.value })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* TikTok Smartphone Live Mockup */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <div className="tiktok-preview-phone">
                    <div className="phone-screen" style={{ backgroundColor: '#131b2a' }}>
                      {/* Top Bar */}
                      <div className="phone-top-bar">
                        <span>LIVE</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <span>Following</span>
                          <span style={{ textDecoration: 'underline' }}>For You</span>
                        </div>
                        <span>🔍</span>
                      </div>

                      {/* Center Slide Card */}
                      <div className="phone-slide-content">
                        <div style={{ fontSize: '0.75rem', color: '#00f2fe', fontWeight: 700, marginBottom: '0.35rem' }}>
                          Slide {previewSlideIdx + 1} dari {slides.length}
                        </div>
                        <div className="phone-slide-text">
                          {slides[previewSlideIdx]?.text || 'Teks slide kosong'}
                        </div>
                        <div className="phone-visual-hint">
                          👁️ {slides[previewSlideIdx]?.visual_direction || 'Visual estetik'}
                        </div>
                      </div>

                      {/* Right Interaction Icons */}
                      <div className="phone-right-actions">
                        <div className="phone-action-item">
                          <span style={{ fontSize: '1.4rem' }}>❤️</span>
                          <span>18.4K</span>
                        </div>
                        <div className="phone-action-item">
                          <span style={{ fontSize: '1.4rem' }}>💬</span>
                          <span>420</span>
                        </div>
                        <div className="phone-action-item">
                          <span style={{ fontSize: '1.4rem' }}>⭐</span>
                          <span>2.1K</span>
                        </div>
                        <div className="phone-action-item">
                          <span style={{ fontSize: '1.4rem' }}>↗️</span>
                          <span>Share</span>
                        </div>
                      </div>

                      {/* Bottom Caption Overlay */}
                      <div className="phone-bottom-caption">
                        <div className="phone-caption-handle">
                          {draft.profile?.handle || '@creator'}
                        </div>
                        <div className="phone-caption-body">
                          {caption || 'Caption konten TikTok...'}
                        </div>
                        <div className="phone-nav-dots">
                          {slides.map((_, i) => (
                            <div
                              key={i}
                              className={`phone-dot ${i === previewSlideIdx ? 'active' : ''}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preview Navigation Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setPreviewSlideIdx(Math.max(0, previewSlideIdx - 1))}
                      disabled={previewSlideIdx === 0}
                    >
                      <ChevronLeft size={16} /> Slide Sebelumnya
                    </button>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      {previewSlideIdx + 1} / {slides.length}
                    </span>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setPreviewSlideIdx(Math.min(slides.length - 1, previewSlideIdx + 1))}
                      disabled={previewSlideIdx >= slides.length - 1}
                    >
                      Slide Berikutnya <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Side Column: Caption, Hashtags, Checklist */}
            <div className="editor-side-col">
              {/* Caption Box */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Caption TikTok</label>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.72rem', padding: '0.1rem 0.35rem' }}
                    onClick={handleCopyCaptionOnly}
                  >
                    <Copy size={12} /> Salin Caption
                  </button>
                </div>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '110px', fontSize: '0.85rem' }}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Caption postingan..."
                />
              </div>

              {/* Hashtags Editor */}
              <div className="form-group">
                <label className="form-label">Hashtags ({hashtags.length})</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
                  {hashtags.map((tag, idx) => (
                    <span key={idx} className="input-tag-pill" style={{ fontSize: '0.75rem' }}>
                      #{tag}
                      <button
                        className="input-tag-delete"
                        onClick={() => handleRemoveHashtag(tag)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }}
                    placeholder="Tambah hashtag baru..."
                    value={newHashtag}
                    onChange={(e) => setNewHashtag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddHashtag())}
                  />
                  <button className="btn btn-secondary btn-sm" onClick={handleAddHashtag}>
                    Tambah
                  </button>
                </div>
              </div>

              {/* Pre-publish Checklist */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CheckSquare size={14} color="#06b6d4" /> Pre-Publish Checklist
                </label>
                <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
                  {checklist.map((item, idx) => (
                    <label key={idx} className="checklist-item">
                      <input
                        type="checkbox"
                        checked={!!checkedItems[idx]}
                        onChange={() => handleToggleChecklist(idx)}
                      />
                      <span style={{ color: checkedItems[idx] ? '#94a3b8' : '#f8fafc', textDecoration: checkedItems[idx] ? 'line-through' : 'none' }}>
                        {item}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Source & Research Notes */}
              {sourceNotes.length > 0 && (
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    Catatan Sumber & Riset
                  </label>
                  <ul style={{ paddingLeft: '1.2rem', fontSize: '0.75rem', color: '#cbd5e1' }}>
                    {sourceNotes.map((note, idx) => (
                      <li key={idx}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Editor Bottom Action Bar */}
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Scoped Regeneration Dropdown */}
            <select
              className="form-select"
              style={{ width: 'auto', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
              onChange={(e) => {
                if (e.target.value) {
                  handleTriggerRegenerate(e.target.value as any);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              disabled={isRegenerating}
            >
              <option value="" disabled>✨ Regenerasi Bagian...</option>
              <option value="all">Seluruh Draft</option>
              <option value="hook">Hook Saja</option>
              <option value="slides">Semua Slide Saja</option>
              <option value="caption">Caption & Hashtag</option>
              <option value="checklist">Checklist Saja</option>
            </select>

            <button
              className="btn btn-secondary btn-sm"
              onClick={handleCopyFullPackage}
              title="Salin Hook, Slide, Caption, dan Hashtag sekaligus"
            >
              <Copy size={14} /> Salin Paket Lengkap
            </button>

            <button
              className="btn btn-secondary btn-sm"
              style={{ color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.4)' }}
              onClick={handleCopyAllImagePrompts}
              title="Salin semua prompt AI Image Generator (Midjourney / Flux / DALL-E) untuk seluruh slide"
            >
              <Sparkles size={13} /> Salin Semua Image Prompt
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => handleSave()}
              disabled={isSaving}
            >
              <Save size={14} />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Draf'}</span>
            </button>

            {status !== 'posted' && (
              <button
                className="btn btn-primary"
                onClick={() => setShowPostedModal(true)}
              >
                <Send size={14} />
                <span>Tandai Sudah Diposting</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for "Mark as Posted" per Spec §2.6 and §4.4 */}
      {showPostedModal && (
        <div className="modal-overlay" style={{ zIndex: 110 }}>
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ fontSize: '1.05rem' }}>
                <Send size={16} /> Tandai Sudah Diposting
              </h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowPostedModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '1rem' }}>
                Perhatian: Status ini adalah pencatatan manual Anda. Aplikasi ini tidak terhubung ke TikTok API dan tidak memverifikasi unggahan secara otomatis.
              </p>
              <div className="form-group">
                <label className="form-label">Waktu Posting</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={postedTimestamp}
                  onChange={(e) => setPostedTimestamp(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowPostedModal(false)}>
                Batal
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleConfirmPosted}>
                Konfirmasi Status Posted
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
