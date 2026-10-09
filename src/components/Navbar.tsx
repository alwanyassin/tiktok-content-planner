import React from 'react';
import { Sparkles, Calendar, ChevronLeft, ChevronRight, Settings, Layers, Flame } from 'lucide-react';

interface NavbarProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  activeView: 'dashboard' | 'calendar';
  onViewChange: (view: 'dashboard' | 'calendar') => void;
  onOpenSettings: () => void;
  onOpenBatchGenerate: () => void;
  aiStatus?: { configured: boolean; mode?: string };
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDate,
  onDateChange,
  activeView,
  onViewChange,
  onOpenSettings,
  onOpenBatchGenerate,
  aiStatus,
}) => {
  const handleShiftDate = (days: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    onDateChange(d.toISOString().slice(0, 10));
  };

  const handleSetToday = () => {
    onDateChange(new Date().toISOString().slice(0, 10));
  };

  const isToday = currentDate === new Date().toISOString().slice(0, 10);

  return (
    <nav className="navbar" aria-label="Main Navigation">
      <div className="navbar-inner">
        {/* Brand */}
        <div className="brand-section" onClick={() => onViewChange('dashboard')}>
          <div className="brand-logo-badge">
            <Flame size={20} />
          </div>
          <div className="brand-titles">
            <span className="brand-title">TikTok Content Studio</span>
            <span className="brand-tagline">Niche-Aligned Editorial Planner</span>
          </div>
        </div>

        {/* Date Selector Navigation */}
        <div className="date-selector-bar" role="group" aria-label="Pilih Tanggal Konten">
          <button
            className="date-btn-nav"
            onClick={() => handleShiftDate(-1)}
            title="Hari Sebelumnya"
            aria-label="Hari Sebelumnya"
          >
            <ChevronLeft size={16} />
          </button>
          
          <input
            type="date"
            className="date-picker-input"
            value={currentDate}
            onChange={(e) => e.target.value && onDateChange(e.target.value)}
            aria-label="Tanggal Target"
          />

          <button
            className="date-btn-nav"
            onClick={() => handleShiftDate(1)}
            title="Hari Berikutnya"
            aria-label="Hari Berikutnya"
          >
            <ChevronRight size={16} />
          </button>

          {!isToday && (
            <button className="date-quick-today" onClick={handleSetToday}>
              Hari Ini
            </button>
          )}
        </div>

        {/* Navigation Actions */}
        <div className="nav-actions">
          <div className="nav-tabs" role="tablist">
            <button
              className={`nav-tab-btn ${activeView === 'dashboard' ? 'active' : ''}`}
              onClick={() => onViewChange('dashboard')}
              role="tab"
              aria-selected={activeView === 'dashboard'}
            >
              <Layers size={15} />
              <span>Dashboard</span>
            </button>
            <button
              className={`nav-tab-btn ${activeView === 'calendar' ? 'active' : ''}`}
              onClick={() => onViewChange('calendar')}
              role="tab"
              aria-selected={activeView === 'calendar'}
            >
              <Calendar size={15} />
              <span>Kalender & Library</span>
            </button>
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={onOpenBatchGenerate}
            title="Generate otomatis draf harian untuk 4 akun"
          >
            <Sparkles size={14} />
            <span>Siapkan 4 Akun</span>
          </button>

          <button
            className="btn btn-secondary btn-icon btn-sm"
            onClick={onOpenSettings}
            title="Pengaturan & Status AI"
            aria-label="Pengaturan & Status AI"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
};
