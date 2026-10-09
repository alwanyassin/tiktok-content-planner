import React, { useState, useEffect } from 'react';
import { X, Settings, ShieldCheck, Download, RefreshCcw, Database, Cpu, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

interface SettingsModalProps {
  onClose: () => void;
  onReseedProfiles: () => Promise<void>;
  onShowToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  onReseedProfiles,
  onShowToast,
}) => {
  const [settings, setSettings] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    Promise.all([api.fetchSettings(), api.fetchHealth()])
      .then(([s, h]) => {
        setSettings(s);
        setHealth(h);
      })
      .catch(() => {});
  }, []);

  const handleResetSeeds = async () => {
    if (!confirm('Apakah Anda yakin ingin mereset profil akun kembali ke data bawaan spesifikasi?')) return;
    setIsResetting(true);
    try {
      await onReseedProfiles();
      onShowToast('success', 'Profil akun berhasil direset ke data awal!');
      onClose();
    } catch (err: any) {
      onShowToast('error', err.message || 'Gagal mereset profil');
    } finally {
      setIsResetting(false);
    }
  };

  const handleExport = (format: 'json' | 'csv') => {
    window.open(`/api/export?format=${format}`, '_blank');
    onShowToast('info', `Mengunduh data draf ${format.toUpperCase()}...`);
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Pengaturan & Status Sistem">
      <div className="modal-card">
        <div className="modal-header">
          <h2 className="modal-title">
            <Settings size={20} color="#00f2fe" />
            <span>Pengaturan & Diagnostik AI</span>
          </h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* AI Provider Status */}
          <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <Cpu size={18} color="#00f2fe" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Status AI Engine & Provider</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.825rem' }}>
              <div>
                <span style={{ color: '#94a3b8' }}>Mesin Aktif:</span>
                <div style={{ fontWeight: 600, color: '#f8fafc', marginTop: '0.15rem' }}>
                  {settings?.provider?.activeEngine || 'Built-in Contextual AI Engine'}
                </div>
              </div>

              <div>
                <span style={{ color: '#94a3b8' }}>Model Identifier:</span>
                <div style={{ fontWeight: 600, color: '#f8fafc', marginTop: '0.15rem', fontFamily: 'var(--font-mono)' }}>
                  {settings?.provider?.modelId || 'gpt-4o-mini'}
                </div>
              </div>

              <div>
                <span style={{ color: '#94a3b8' }}>Prompt Version:</span>
                <div style={{ fontWeight: 600, color: '#f8fafc', marginTop: '0.15rem', fontFamily: 'var(--font-mono)' }}>
                  prompts/content-draft/v1.md
                </div>
              </div>

              <div>
                <span style={{ color: '#94a3b8' }}>Koneksi Kunci Rahasia:</span>
                <div style={{ fontWeight: 600, color: settings?.provider?.configured ? '#10b981' : '#f59e0b', marginTop: '0.15rem' }}>
                  {settings?.provider?.configured ? 'Terkonfigurasi di Environment' : 'Menggunakan Mesin Kontekstual Bawaan'}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '0.85rem', lineHeight: '1.4' }}>
              Catatan Keamanan: Kunci API rahasia tidak pernah diekspos ke antarmuka peramban (browser) dan hanya diproses di lingkungan Pages Functions / Workers.
            </div>
          </div>

          {/* Database Diagnostics */}
          <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <Database size={18} color="#10b981" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Konektivitas Database D1</h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <CheckCircle2 size={16} color="#10b981" />
              <span>Status: <strong>{health?.database || 'Tersambung (D1 / SQLite)'}</strong></span>
            </div>
          </div>

          {/* Export & Data Management */}
          <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.85rem' }}>
              Cadangan Data & Pengaturan Ulang
            </h3>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => handleExport('csv')}>
                <Download size={14} /> Ekspor Semua Draf (CSV)
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleExport('json')}>
                <Download size={14} /> Ekspor Semua Draf (JSON)
              </button>
              <button
                className="btn btn-ghost btn-sm"
                style={{ color: '#fb7185', borderColor: 'rgba(251, 113, 133, 0.3)' }}
                onClick={handleResetSeeds}
                disabled={isResetting}
              >
                <RefreshCcw size={14} /> Reset 4 Akun ke Bawaan
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
