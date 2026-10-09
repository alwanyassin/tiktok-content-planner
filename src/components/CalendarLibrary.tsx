import React, { useState } from 'react';
import { Calendar, Search, Filter, Eye, Copy, Download, Archive, Sparkles, CheckCircle2 } from 'lucide-react';
import { AccountProfile, ContentDraft, DraftStatus } from '../types';

interface CalendarLibraryProps {
  profiles: AccountProfile[];
  drafts: ContentDraft[];
  onOpenDraft: (draft: ContentDraft) => void;
  onQuickCopy: (draft: ContentDraft) => void;
  onShowToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const CalendarLibrary: React.FC<CalendarLibraryProps> = ({
  profiles,
  drafts,
  onOpenDraft,
  onQuickCopy,
  onShowToast,
}) => {
  const [selectedProfileId, setSelectedProfileId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);

  // Filter drafts
  const filteredDrafts = drafts.filter(draft => {
    if (selectedProfileId !== 'all' && draft.profile_id !== selectedProfileId) return false;
    if (selectedStatus !== 'all' && draft.status !== selectedStatus) return false;
    if (!includeArchived && draft.status === 'archived' && selectedStatus !== 'archived') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const title = (draft.output?.title || draft.topic || '').toLowerCase();
      const hook = (draft.output?.hook || '').toLowerCase();
      const caption = (draft.output?.caption || '').toLowerCase();
      return title.includes(q) || hook.includes(q) || caption.includes(q);
    }

    return true;
  });

  const handleExport = (format: 'json' | 'csv') => {
    window.open(`/api/export?format=${format}`, '_blank');
    onShowToast('info', `Mengunduh data draf format ${format.toUpperCase()}...`);
  };

  const statusLabels: Record<string, string> = {
    idea: 'Ide',
    draft: 'Draft AI',
    needs_review: 'Perlu Review',
    ready: 'Siap Posting',
    posted: 'Sudah Diposting',
    archived: 'Arsip',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header and Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 700 }}>
              Kalender Konten & Arsip Draf
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Telusuri semua draf yang telah dipersiapkan lintas akun dan tanggal.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => handleExport('csv')}>
              <Download size={14} /> Export CSV
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleExport('json')}>
              <Download size={14} /> Export JSON
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2rem', height: '36px', fontSize: '0.85rem' }}
              placeholder="Cari judul, hook, atau topik..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Account Filter */}
          <select
            className="form-select"
            style={{ width: 'auto', height: '36px', fontSize: '0.85rem' }}
            value={selectedProfileId}
            onChange={(e) => setSelectedProfileId(e.target.value)}
          >
            <option value="all">Semua Akun ({profiles.length})</option>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>{p.display_name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className="form-select"
            style={{ width: 'auto', height: '36px', fontSize: '0.85rem' }}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">Semua Status</option>
            <option value="idea">💡 Ide</option>
            <option value="draft">📝 Draf AI</option>
            <option value="needs_review">🔍 Perlu Review</option>
            <option value="ready">✅ Siap Posting</option>
            <option value="posted">🚀 Sudah Diposting</option>
            <option value="archived">📁 Arsipkan</option>
          </select>

          {/* Include Archived toggle */}
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#cbd5e1', cursor: 'pointer', margin: 'auto 0' }}>
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
            />
            <span>Sertakan Arsip</span>
          </label>
        </div>
      </div>

      {/* Drafts List */}
      {filteredDrafts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <Calendar size={40} style={{ color: '#64748b', marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Tidak ada draf yang sesuai filter</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Coba ubah kata kunci pencarian atau buat draf baru dari Dashboard.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredDrafts.map(draft => (
            <div
              key={draft.id}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                transition: 'border-color var(--transition-fast)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                  <span className={`badge badge-status-${draft.status}`}>
                    {statusLabels[draft.status] || draft.status}
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>
                    {draft.profile?.display_name || 'Akun'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    • {draft.target_date}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                    {draft.output?.slides?.length || 0} Slide
                  </span>
                </div>

                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {draft.output?.title || draft.topic || 'Draf Konten TikTok'}
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.15rem' }}>
                  "{draft.output?.hook || 'Belum ada hook'}"
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onOpenDraft(draft)}
                >
                  <Eye size={13} /> Review & Edit
                </button>
                <button
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => onQuickCopy(draft)}
                  title="Salin Cepat Paket Konten"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
