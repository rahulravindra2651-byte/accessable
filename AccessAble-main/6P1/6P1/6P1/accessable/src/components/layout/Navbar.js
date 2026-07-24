import React, { useContext, useState } from 'react';
import {
  LogOut, Sun, Moon, Contrast, Type, Menu, X, Mic, Volume2, HelpCircle
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import { AccessibilityContext } from '../../context/AccessibilityContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { isDark, toggleTheme, highContrast, setHighContrast, largeFont, setLargeFont } = useContext(ThemeContext);
  const {
    voiceGuidance,
    toggleVoiceGuidance,
    readPageContent,
    isListeningNav,
    startVoiceNav,
    stopVoiceNav,
    setShowCommandsHelp,
    speakGuidance,
  } = useContext(AccessibilityContext);

  const [menuOpen, setMenuOpen] = useState(false);
  const isImpaired = user?.role === 'impaired';

  return (
    <header
      className={`sticky top-0 z-50 border-b ${isImpaired
          ? 'bg-black border-amber-500/30'
          : 'bg-white/90 backdrop-blur-xl border-slate-200'
        }`}
      role="banner"
    >
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="container-app h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
            aria-hidden="true"
          >
            <span className="text-white font-black text-base">A</span>
          </div>
          <div>
            <span
              className={`text-base font-black tracking-tight ${isImpaired ? 'text-amber-400' : 'text-slate-900'
                }`}
            >
              AccessAble
            </span>
            <span
              className={`ml-2 badge text-xs ${isImpaired ? 'badge-warning' : 'badge-primary'
                }`}
              aria-label={`Role: ${isImpaired ? 'Sensory Impaired Mode' : 'Regular Mode'}`}
            >
              {isImpaired ? 'Impaired Mode' : 'Regular Mode'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Accessibility Controls (Desktop) */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Spoken Voice Guidance Prompt Toggle */}
            <button
              onClick={() => {
                toggleVoiceGuidance();
                speakGuidance(
                  `Voice guidance ${!voiceGuidance ? 'enabled' : 'disabled'}`,
                  'assertive'
                );
              }}
              className={`btn btn-ghost btn-icon ${voiceGuidance ? (isImpaired ? 'text-amber-400' : 'text-indigo-600') : ''
                }`}
              aria-label={
                voiceGuidance
                  ? 'Disable audio voice prompts'
                  : 'Enable audio voice prompts'
              }
              aria-pressed={voiceGuidance}
              title="Voice Prompts"
            >
              <Volume2 size={18} />
            </button>

            {/* Global Hands-Free Voice Command Listener */}
            <button
              onClick={() => {
                if (isListeningNav) {
                  stopVoiceNav();
                } else {
                  startVoiceNav();
                }
              }}
              className={`btn btn-ghost btn-icon ${isListeningNav
                  ? 'text-red-500 animate-pulse'
                  : isImpaired
                    ? 'text-amber-400'
                    : ''
                }`}
              aria-label={
                isListeningNav
                  ? 'Stop voice navigation listener'
                  : 'Start hands-free voice command listener'
              }
              aria-pressed={isListeningNav}
              title="Voice Command Navigation"
            >
              <Mic size={18} />
            </button>

            {/* Read Page Aloud Trigger */}
            <button
              onClick={() => {
                readPageContent();
              }}
              className={`btn btn-ghost btn-icon ${isImpaired ? 'text-amber-400 hover:text-amber-300' : ''
                }`}
              aria-label="Read current page content aloud"
              title="Read Page Aloud"
            >
              <span className="font-bold text-xs">TTS</span>
            </button>

            {/* Dark / Light Theme Toggle */}
            <button
              onClick={() => {
                toggleTheme();
                speakGuidance('Toggled color theme', 'polite');
              }}
              className={`btn btn-ghost btn-icon ${isImpaired ? 'text-amber-400 hover:text-amber-300' : ''
                }`}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* High Contrast Mode Toggle */}
            <button
              onClick={() => {
                setHighContrast((v) => !v);
                speakGuidance('Toggled high contrast mode', 'polite');
              }}
              className={`btn btn-ghost btn-icon ${highContrast ? 'text-indigo-600' : ''
                } ${isImpaired ? 'text-amber-400' : ''}`}
              aria-label="Toggle high contrast accessibility mode"
              aria-pressed={highContrast}
              title="High contrast mode"
            >
              <Contrast size={18} />
            </button>

            {/* Large Font Mode Toggle */}
            <button
              onClick={() => {
                setLargeFont((v) => !v);
                speakGuidance('Toggled large font mode', 'polite');
              }}
              className={`btn btn-ghost btn-icon ${largeFont ? 'text-indigo-600' : ''
                } ${isImpaired ? 'text-amber-400' : ''}`}
              aria-label="Toggle large font size mode"
              aria-pressed={largeFont}
              title="Large text mode"
            >
              <Type size={18} />
            </button>

            {/* Voice Help Modal Trigger */}
            <button
              onClick={() => setShowCommandsHelp(true)}
              className={`btn btn-ghost btn-icon ${isImpaired ? 'text-amber-400' : ''
                }`}
              aria-label="Open voice navigation commands cheat sheet"
              title="Voice Commands Help"
            >
              <HelpCircle size={18} />
            </button>
          </div>

          {/* User Info Chip */}
          {user && (
            <div
              className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border"
              style={{
                borderColor: 'var(--c-border)',
                background: 'var(--c-surface-2)',
              }}
              tabIndex="0"
              aria-label={`Logged in user: ${user.name}, Email: ${user.email}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isImpaired ? 'bg-amber-500 text-black' : 'bg-indigo-600 text-white'
                  }`}
                aria-hidden="true"
              >
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="leading-tight">
                <p className="text-xs font-semibold" style={{ color: 'var(--c-text)' }}>
                  {user.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>
                  {user.email}
                </p>
              </div>
            </div>
          )}

          {/* Sign Out Button */}
          <button
            onClick={() => {
              speakGuidance('Signed out of AccessAble.', 'assertive');
              logout();
            }}
            className={`btn btn-sm gap-1.5 ${isImpaired
                ? 'border border-amber-500 text-amber-400 hover:bg-amber-500/10'
                : 'btn-secondary'
              }`}
            aria-label="Sign out of your account"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden btn btn-ghost btn-icon"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Accessibility Drawer */}
      {menuOpen && (
        <div
          className="lg:hidden border-t px-4 py-4 grid grid-cols-2 gap-3"
          style={{
            borderColor: 'var(--c-border)',
            background: 'var(--c-surface)',
          }}
          role="region"
          aria-label="Mobile Accessibility Menu"
        >
          <button
            onClick={toggleVoiceGuidance}
            className={`btn btn-sm ${voiceGuidance ? 'btn-primary' : 'btn-secondary'
              }`}
          >
            <Volume2 size={15} /> Prompts {voiceGuidance ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={readPageContent}
            className="btn btn-secondary btn-sm"
          >
            Read Page Aloud
          </button>
          <button
            onClick={() => {
              if (isListeningNav) stopVoiceNav();
              else startVoiceNav();
            }}
            className={`btn btn-sm ${isListeningNav ? 'btn-danger' : 'btn-accent'
              }`}
          >
            <Mic size={15} /> Nav {isListeningNav ? 'Active' : 'Start'}
          </button>
          <button
            onClick={toggleTheme}
            className="btn btn-secondary btn-sm"
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}{' '}
            {isDark ? 'Light' : 'Dark'}
          </button>
          <button
            onClick={() => setHighContrast((v) => !v)}
            className={`btn btn-sm ${highContrast ? 'btn-primary' : 'btn-secondary'
              }`}
          >
            <Contrast size={15} /> Contrast
          </button>
          <button
            onClick={() => setLargeFont((v) => !v)}
            className={`btn btn-sm ${largeFont ? 'btn-primary' : 'btn-secondary'
              }`}
          >
            <Type size={15} /> Large Text
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
