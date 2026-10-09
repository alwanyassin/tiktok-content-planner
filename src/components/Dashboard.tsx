import React from 'react';
import { Sparkles, Calendar, CheckCircle2, Send, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { AccountProfile, ContentDraft } from '../types';
import { AccountCard } from './AccountCard';

interface DashboardProps {
  currentDate: string;
  profiles: AccountProfile[];
  drafts: ContentDraft[];
  onPrepareAccount: (profile: AccountProfile) => void;
  onEditProfile: (profile: AccountProfile) => void;
  onOpenDraft: (draft: ContentDraft) => void;
  onQuickCopy: (draft: ContentDraft) => void;
  onOpenBatchGenerate: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentDate,
  profiles,
  drafts,
  onPrepareAccount,
  onEditProfile,
  onOpenDraft,
  onQuickCopy,
  onOpenBatchGenerate,
}) => {
  // Format Indonesian date
  const dateObj = new Date(currentDate + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Calculate statistics for selected date
  const draftsForDate = drafts.filter(d => d.target_date === currentDate && d.status !== 'archived');
  const readyCount = draftsForDate.filter(d => d.status === 'ready').length;
  const postedCount = draftsForDate.filter(d => d.status === 'posted').length;
  const needsReviewCount = draftsForDate.filter(d => d.status === 'draft' || d.status === 'needs_review').length;

  return (
    <div className="dashboard-container">
      {/* Dashboard Headline & Quick Stats */}
      <div className="dashboard-header">
        <div className="dashboard-headline">
          <h1>{formattedDate}</h1>
          <p>Persiapan konten terfokus untuk 4 niche affiliate TikTok tanpa distorsi branding.</p>
        </div>

        <div className="dashboard-quick-stats">
          <div className="stat-pill">
            <span className="stat-pill-count">{draftsForDate.length}/4</span>
            <span className="stat-pill-label">Draf Hari Ini</span>
          </div>

          <div className="stat-pill">
            <span className="stat-pill-count" style={{ color: '#06b6d4' }}>{readyCount}</span>
            <span className="stat-pill-label">Siap Posting</span>
          </div>

          <div className="stat-pill">
            <span className="stat-pill-count" style={{ color: '#10b981' }}>{postedCount}</span>
            <span className="stat-pill-label">Diposting</span>
          </div>

          <div className="stat-pill">
            <span className="stat-pill-count" style={{ color: '#f59e0b' }}>{needsReviewCount}</span>
            <span className="stat-pill-label">Perlu Review</span>
          </div>
        </div>
      </div>

      {/* 4 Account Cards Grid */}
      <div className="accounts-grid">
        {profiles.map(profile => {
          const draft = drafts.find(d => d.profile_id === profile.id && d.target_date === currentDate && d.status !== 'archived');
          return (
            <AccountCard
              key={profile.id}
              profile={profile}
              draft={draft}
              onPrepare={onPrepareAccount}
              onEditProfile={onEditProfile}
              onOpenDraft={onOpenDraft}
              onQuickCopy={onQuickCopy}
            />
          );
        })}
      </div>

      {/* Editorial Principles & Guidelines Notice */}
      <div className="alert-box alert-info" style={{ marginTop: '2rem' }}>
        <ShieldCheck size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ display: 'block', marginBottom: '0.2rem', color: '#fff' }}>
            Prinsip Editorial & Keamanan Akun
          </strong>
          <span style={{ fontSize: '0.825rem', color: '#cbd5e1' }}>
            Aplikasi ini tidak terhubung ke API TikTok dan tidak memposting otomatis. Setiap draf adalah rekomendasi AI yang wajib Anda tinjau, edit, dan verifikasi klaim faktualnya sebelum disalin dan diunggah secara mandiri ke TikTok.
          </span>
        </div>
      </div>
    </div>
  );
};
