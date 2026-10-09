import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' && <CheckCircle2 size={18} color="#10b981" />}
          {t.type === 'error' && <AlertCircle size={18} color="#fb7185" />}
          {t.type === 'info' && <Info size={18} color="#3b82f6" />}
          <span>{t.text}</span>
          <button
            onClick={() => onDismiss(t.id)}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', marginLeft: 'auto' }}
            aria-label="Tutup notifikasi"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
