import { AccountProfile, ContentDraft, DraftGenerationRequest, DraftUpdateRequest, RegenerateRequest } from '../types';

export const api = {
  async fetchProfiles(): Promise<AccountProfile[]> {
    const res = await fetch('/api/profiles');
    if (!res.ok) throw new Error('Gagal memuat profil akun');
    const data: any = await res.json();
    return data.profiles;
  },

  async updateProfile(id: string, updates: Partial<AccountProfile>): Promise<AccountProfile> {
    const res = await fetch(`/api/profiles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Gagal memperbarui profil akun');
    const data: any = await res.json();
    return data.profile;
  },

  async fetchDrafts(params?: { date?: string; profileId?: string; status?: string; includeArchived?: boolean }): Promise<ContentDraft[]> {
    const query = new URLSearchParams();
    if (params?.date) query.set('date', params.date);
    if (params?.profileId) query.set('profileId', params.profileId);
    if (params?.status) query.set('status', params.status);
    if (params?.includeArchived) query.set('includeArchived', 'true');

    const res = await fetch(`/api/drafts?${query.toString()}`);
    if (!res.ok) throw new Error('Gagal memuat daftar draft');
    const data: any = await res.json();
    return data.drafts;
  },

  async fetchDraft(id: string): Promise<ContentDraft> {
    const res = await fetch(`/api/drafts/${id}`);
    if (!res.ok) throw new Error('Draft tidak ditemukan');
    const data: any = await res.json();
    return data.draft;
  },

  async generateDraft(data: DraftGenerationRequest): Promise<{ draft: ContentDraft; generationRecord?: any }> {
    const res = await fetch('/api/drafts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err: any = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal membuat draft');
    }
    const resData: any = await res.json();
    return resData;
  },

  async updateDraft(id: string, updates: DraftUpdateRequest): Promise<ContentDraft> {
    const res = await fetch(`/api/drafts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err: any = await res.json().catch(() => ({}));
      if (res.status === 409) {
        throw new Error('Terjadi konflik versi: Draft telah diubah di sesi lain. Muat ulang halaman.');
      }
      throw new Error(err.error || 'Gagal menyimpan draft');
    }
    const data: any = await res.json();
    return data.draft;
  },

  async regenerateDraft(id: string, data: RegenerateRequest): Promise<ContentDraft> {
    const res = await fetch(`/api/drafts/${id}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err: any = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal regenerasi bagian');
    }
    const resData: any = await res.json();
    return resData.draft;
  },

  async archiveDraft(id: string): Promise<boolean> {
    const res = await fetch(`/api/drafts/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Gagal mengarsipkan draft');
    return true;
  },

  async fetchHealth(): Promise<any> {
    const res = await fetch('/api/health');
    return res.json();
  },

  async fetchSettings(): Promise<any> {
    const res = await fetch('/api/settings');
    return res.json();
  },

  async resetSeeds(): Promise<boolean> {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset_seeds' }),
    });
    return res.ok;
  },
};
