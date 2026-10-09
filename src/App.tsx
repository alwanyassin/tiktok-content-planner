import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { CalendarLibrary } from './components/CalendarLibrary';
import { DraftEditor } from './components/DraftEditor';
import { GenerateModal } from './components/GenerateModal';
import { ProfileEditorModal } from './components/ProfileEditorModal';
import { SettingsModal } from './components/SettingsModal';
import { Toast, ToastMessage } from './components/Toast';
import { api } from './services/api';
import { AccountProfile, ContentDraft, DraftGenerationRequest } from './types';

export const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [activeView, setActiveView] = useState<'dashboard' | 'calendar'>('dashboard');

  const [profiles, setProfiles] = useState<AccountProfile[]>([]);
  const [drafts, setDrafts] = useState<ContentDraft[]>([]);
  const [healthInfo, setHealthInfo] = useState<any>(null);

  // Modals state
  const [editingDraft, setEditingDraft] = useState<ContentDraft | null>(null);
  const [editingProfile, setEditingProfile] = useState<AccountProfile | null>(null);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [generateTargetProfileId, setGenerateTargetProfileId] = useState<string | undefined>(undefined);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Toasts state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const loadData = useCallback(async () => {
    try {
      const [loadedProfiles, loadedDrafts, health] = await Promise.all([
        api.fetchProfiles(),
        api.fetchDrafts({ includeArchived: true }),
        api.fetchHealth().catch(() => null),
      ]);
      setProfiles(loadedProfiles);
      setDrafts(loadedDrafts);
      setHealthInfo(health);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memuat data awal');
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDateChange = (newDate: string) => {
    setCurrentDate(newDate);
  };

  const handlePrepareAccount = (profile: AccountProfile) => {
    setGenerateTargetProfileId(profile.id);
    setIsGenerateOpen(true);
  };

  const handleOpenBatchGenerate = () => {
    setGenerateTargetProfileId('batch');
    setIsGenerateOpen(true);
  };

  const handleGenerateSubmit = async (request: DraftGenerationRequest) => {
    const res = await api.generateDraft(request);
    await loadData();
    // Open editor for newly created draft right away
    if (res.draft) {
      setEditingDraft(res.draft);
    }
  };

  const handleBatchGenerate = async (targetDate: string) => {
    for (const p of profiles) {
      await api.generateDraft({
        profileId: p.id,
        targetDate,
        format: 'carousel',
      });
    }
    await loadData();
  };

  const handleSaveDraft = async (updated: ContentDraft) => {
    const saved = await api.updateDraft(updated.id, {
      status: updated.status,
      output: updated.output,
      user_notes: updated.user_notes,
      user_rating: updated.user_rating,
      posted_at: updated.posted_at,
      expectedVersion: updated.version,
    });
    setEditingDraft(saved);
    await loadData();
  };

  const handleRegenerate = async (scope: 'all' | 'hook' | 'slides' | 'caption' | 'checklist', slidePos?: number) => {
    if (!editingDraft) return;
    const res = await api.regenerateDraft(editingDraft.id, {
      scope,
      slidePosition: slidePos,
      expectedVersion: editingDraft.version,
    });
    setEditingDraft(res);
    await loadData();
  };

  const handleArchiveDraft = async (id: string) => {
    await api.archiveDraft(id);
    if (editingDraft?.id === id) {
      setEditingDraft(null);
    }
    await loadData();
    showToast('info', 'Draf berhasil diarsipkan.');
  };

  const handleDuplicateDraft = (draft: ContentDraft) => {
    setGenerateTargetProfileId(draft.profile_id);
    setIsGenerateOpen(true);
    setEditingDraft(null);
  };

  const handleQuickCopy = (draft: ContentDraft) => {
    const slides = draft.output?.slides || [];
    const formattedSlides = slides.map(s => `[SLIDE ${s.position}]\n${s.text}\nVisual: ${s.visual_direction}`).join('\n\n');
    const tagsString = (draft.output?.hashtags || []).map(h => `#${h}`).join(' ');

    const packageText = `📌 JUDUL: ${draft.output?.title || draft.topic}
🎯 HOOK: ${draft.output?.hook}

🖼️ SLIDE CAROUSEL:
${formattedSlides}

📝 CAPTION:
${draft.output?.caption}

🏷️ HASHTAGS:
${tagsString}

${draft.output?.disclosure_reminder ? `⚠️ DISCLOSURE: ${draft.output.disclosure_reminder}\n` : ''}`;

    navigator.clipboard.writeText(packageText);
    showToast('success', `Paket konten "${draft.profile?.display_name}" berhasil disalin!`);
  };

  const handleSaveProfile = async (id: string, updates: Partial<AccountProfile>) => {
    await api.updateProfile(id, updates);
    await loadData();
  };

  const handleReseedProfiles = async () => {
    await api.resetSeeds();
    await loadData();
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        currentDate={currentDate}
        onDateChange={handleDateChange}
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenBatchGenerate={handleOpenBatchGenerate}
        aiStatus={healthInfo?.ai}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {activeView === 'dashboard' ? (
          <Dashboard
            currentDate={currentDate}
            profiles={profiles}
            drafts={drafts}
            onPrepareAccount={handlePrepareAccount}
            onEditProfile={setEditingProfile}
            onOpenDraft={setEditingDraft}
            onQuickCopy={handleQuickCopy}
            onOpenBatchGenerate={handleOpenBatchGenerate}
          />
        ) : (
          <CalendarLibrary
            profiles={profiles}
            drafts={drafts}
            onOpenDraft={setEditingDraft}
            onQuickCopy={handleQuickCopy}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Modals */}
      {editingDraft && (
        <DraftEditor
          draft={editingDraft}
          onClose={() => setEditingDraft(null)}
          onSave={handleSaveDraft}
          onRegenerate={handleRegenerate}
          onArchive={handleArchiveDraft}
          onDuplicate={handleDuplicateDraft}
          onShowToast={showToast}
        />
      )}

      {isGenerateOpen && (
        <GenerateModal
          profiles={profiles}
          initialProfileId={generateTargetProfileId}
          targetDate={currentDate}
          onClose={() => setIsGenerateOpen(false)}
          onGenerate={handleGenerateSubmit}
          onBatchGenerate={handleBatchGenerate}
          onShowToast={showToast}
        />
      )}

      {editingProfile && (
        <ProfileEditorModal
          profile={editingProfile}
          onClose={() => setEditingProfile(null)}
          onSave={handleSaveProfile}
          onShowToast={showToast}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          onReseedProfiles={handleReseedProfiles}
          onShowToast={showToast}
        />
      )}

      {/* Floating Toasts */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
