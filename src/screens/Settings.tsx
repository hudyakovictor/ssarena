// ============================================================
// SIGNAL ARENA — SETTINGS SCREEN
// Language, theme, sound, notifications, wallet, about
// ============================================================
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Palette, Volume2, Bell, Wallet, Info, Trash2 } from 'lucide-react';
import { useT, setLocale, getLocale, type Locale } from '../i18n';
import { C, getState, setState as updateGlobalState, resetState } from '../lib/gameState';

export function SettingsScreen() {
  const { t } = useT();
  const [state, setLocalState] = useState(getState());
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const currentLocale = getLocale();
  
  const toggleLanguage = () => {
    const newLang: Locale = currentLocale === 'ru' ? 'en' : 'ru';
    setLocale(newLang);
    updateGlobalState({ language: newLang });
    setLocalState(getState());
  };
  
  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-black uppercase tracking-wider">{t('settings.title')}</h1>
      </motion.div>
      
      {/* Language */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="panel p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe size={20} className="text-[var(--signal)]" />
            <div>
              <p className="font-heading text-sm font-bold">{t('settings.language')}</p>
              <p className="font-mono text-[10px] text-[var(--inkDim)]">{currentLocale === 'ru' ? 'Русский' : 'English'}</p>
            </div>
          </div>
          <button onClick={toggleLanguage} className="btn-ghost px-4 py-2 text-sm">
            {currentLocale === 'ru' ? 'English' : 'Русский'}
          </button>
        </div>
      </motion.div>
      
      {/* Theme */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="panel p-5">
        <div className="flex items-center gap-3 mb-3">
          <Palette size={20} className="text-[var(--grape)]" />
          <p className="font-heading text-sm font-bold">{t('settings.theme')}</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'dark', label: t('settings.dark_theme'), color: '#05070f' },
            { id: 'terminal', label: t('settings.terminal_theme'), color: '#001100' },
            { id: 'midnight', label: t('settings.midnight_theme'), color: '#0a0a2e' },
          ].map(theme => (
            <button key={theme.id} onClick={() => updateGlobalState({ theme: theme.id as any })}
              className={`p-3 rounded-xl border text-center transition-all ${
                state.theme === theme.id ? 'border-[var(--signal)]/40 bg-[var(--signal)]/5' : 'border-[var(--edge)] hover:bg-white/[0.02]'
              }`}>
              <div className="w-8 h-8 rounded-lg mx-auto mb-2" style={{ background: theme.color, border: '1px solid var(--edge)' }} />
              <p className="font-mono text-[10px]">{theme.label}</p>
            </button>
          ))}
        </div>
      </motion.div>
      
      {/* Sound */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="panel p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Volume2 size={20} className="text-[var(--gold)]" />
          <p className="font-heading text-sm font-bold">{t('settings.sound')}</p>
        </div>
        <button onClick={() => updateGlobalState({ soundEnabled: !state.soundEnabled })}
          className={`w-12 h-6 rounded-full transition-all ${state.soundEnabled ? 'bg-[var(--long)]' : 'bg-[var(--edge)]'}`}>
          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${state.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </motion.div>
      
      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="panel p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell size={20} className="text-[var(--short)]" />
          <p className="font-heading text-sm font-bold">{t('settings.notifications')}</p>
        </div>
        <button onClick={() => updateGlobalState({ notifications: !state.notifications })}
          className={`w-12 h-6 rounded-full transition-all ${state.notifications ? 'bg-[var(--long)]' : 'bg-[var(--edge)]'}`}>
          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${state.notifications ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </motion.div>
      
      {/* Wallet */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="panel p-5">
        <div className="flex items-center gap-3 mb-3">
          <Wallet size={20} className="text-[var(--signal)]" />
          <p className="font-heading text-sm font-bold">{t('settings.wallet')}</p>
        </div>
        <button className="btn-primary w-full py-2.5">{t('common.btn_connect')}</button>
      </motion.div>
      
      {/* About */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="panel p-5">
        <div className="flex items-center gap-3 mb-3">
          <Info size={20} className="text-[var(--inkSoft)]" />
          <p className="font-heading text-sm font-bold">{t('settings.about')}</p>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-mono text-xs text-[var(--inkDim)]">{t('settings.version')}</span>
            <span className="font-mono text-xs text-[var(--inkSoft)]">2.0.0</span>
          </div>
          <p className="font-mono text-[10px] text-[var(--inkDim)]">
            Signal Arena: Proof of Skill — A crypto game that makes you smarter, not poorer.
          </p>
          <p className="font-mono text-[10px] text-[var(--inkDim)]">
            Play the market. Don't become the liquidity.
          </p>
        </div>
      </motion.div>
      
      {/* Danger Zone */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="panel p-5 border-2" style={{ borderColor: `${C.short}22` }}>
        <div className="flex items-center gap-3 mb-3">
          <Trash2 size={20} className="text-[var(--short)]" />
          <p className="font-heading text-sm font-bold text-[var(--short)]">{t('settings.clear_data')}</p>
        </div>
        {showResetConfirm ? (
          <div className="space-y-3">
            <p className="text-sm text-[var(--inkSoft)]">{t('settings.clear_confirm')}</p>
            <div className="flex gap-2">
              <button onClick={() => { resetState(); setLocalState(getState()); setShowResetConfirm(false); }}
                className="btn-primary px-4 py-2 text-sm bg-[var(--short)]">{t('common.yes')}</button>
              <button onClick={() => setShowResetConfirm(false)} className="btn-ghost px-4 py-2 text-sm">{t('common.no')}</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowResetConfirm(true)}
            className="btn-ghost w-full py-2 text-sm text-[var(--short)] border border-[var(--short)]/20">
            {t('settings.clear_data')}
          </button>
        )}
      </motion.div>
    </div>
  );
}
