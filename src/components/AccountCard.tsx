import React from 'react';
import { Sparkles, Edit3, PlusCircle, CheckCircle, Clock, Copy, ArrowRight, Eye, ShieldCheck } from 'lucide-react';
import { AccountProfile, ContentDraft } from '../types';

interface AccountCardProps {
  profile: AccountProfile;
  draft?: ContentDraft;
  onPrepare: (profile: AccountProfile) => void;
  onEditProfile: (profile: AccountProfile) => void;
  onOpenDraft: (draft: ContentDraft) => void;
  onQuickCopy: (draft: ContentDraft) => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  profile,
  draft,
  onPrepare,
  onEditProfile,
  onOpenDraft,
  onQuickCopy,
}) => {
  // Determine niche class and icon
  let nicheClass = 'niche-beauty';
  let nicheIcon = '💄';

  if (profile.slug.includes('fashion-wanita')) {
    nicheClass = 'niche-fashion-wanita';
    nicheIcon = '👗';
  } else if (profile.slug.includes('techno')) {
    nicheClass = 'niche-techno';
    nicheIcon = '⚡';
  } else if (profile.slug.includes('fashion-pria')) {
    nicheClass = 'niche-fashion-pria';
    nicheIcon = '👔';
  }

  const pillars = profile.content_pillars || [];
  const statusLabels: Record<string, string> = {
    idea: 'Ide',
    draft: 'Draft AI',
    needs_review: 'Perlu Review',
    ready: 'Siap Posting',
    posted: 'Sudah Diposting',
    archived: 'Arsip',
  };

  return (
    <div className={`account-card ${nicheClass}`}>
      <div className="account-card-header">
        <div className="niche-icon-box" aria-hidden="true">
          {nicheIcon}
        </div>
        <div className="account-titles">
          <h3 className="account-name">{profile.display_name}</h3>
          <span className="account-handle">{profile.handle || '@username'}</span>
        </div>
        <button
          className="btn btn-ghost btn-icon btn-sm"
          onClick={() => onEditProfile(profile)}
          title="Edit Profil & Pilar Niche"
          aria-label={`Edit profil ${profile.display_name}`}
        >
          <Edit3 size={15} />
        </button>
      </div>

      {/* Pillars Preview */}
      <div className="account-pillars-preview" title="Pilar Konten Utama">
        {pillars.slice(0, 3).map((p, idx) => (
          <span key={idx} className="pillar-tag">{p}</span>
        ))}
        {pillars.length > 3 && (
          <span className="pillar-tag">+{pillars.length - 3} lainnya</span>
        )}
      </div>

      {/* Today's Draft Status */}
      <div className="card-draft-section">
        {draft ? (
          <>
            <div className="card-draft-top">
              <span className={`badge badge-status-${draft.status}`}>
                {statusLabels[draft.status] || draft.status}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                {draft.output?.slides?.length || 0} Slide
              </span>
            </div>

            <div className="card-draft-title" title={draft.output?.title}>
              {draft.output?.title || draft.topic || 'Konten TikTok'}
            </div>

            <div className="card-draft-hook" title={draft.output?.hook}>
              "{draft.output?.hook || 'Belum ada hook'}"
            </div>

            {draft.output?.claims_to_verify && draft.output.claims_to_verify.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#fbbf24' }}>
                <ShieldCheck size={12} />
                <span>{draft.output.claims_to_verify.length} klaim perlu dicek</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
                onClick={() => onOpenDraft(draft)}
              >
                <Eye size={13} />
                <span>Review & Edit</span>
              </button>
              <button
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => onQuickCopy(draft)}
                title="Salin Cepat Paket Konten"
              >
                <Copy size={14} />
              </button>
            </div>
          </>
        ) : (
          <div className="card-empty-state">
            <span className="card-empty-text">Belum ada konten untuk tanggal ini</span>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onPrepare(profile)}
            >
              <Sparkles size={13} />
              <span>Generate Draf Harian</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
