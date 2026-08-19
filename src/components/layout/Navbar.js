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
    <header className="sticky top-4 z-50 max-w-7xl mx-auto px-4" role="banner">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div
        className={`clay-card px-5 sm:px-8 py-3.5 flex items-center justify-between gap-4 ${
          isImpaired ? 'bg-black/90 text-amber-300 border-2 border-amber-400/40' : 'bg-white/80'
        }`}
        style={{ borderRadius: '36px' }}
      >
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-clayOrb font-black text-xl text-white ${
              isImpaired
                ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-black'
                : 'bg-gradient-to-br from-[#A78BFA] to-[#7C3AED]'
            }`}
            style={{ fontFamily: 'Nunito, sans-serif' }}
            aria-hidden="true"
          >
            A
          </div>
          <div>
            <span
              className={`text-xl font-black tracking-tight ${
                isImpaired ? 'text-amber-400' : 'text-[#332F3A]'
              }`}
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              AccessAble
            </span>
            <span
              className={`ml-2.5 clay-pill text-xs font-bold ${
                isImpaired ? 'bg-amber-400 text-black shadow-none' : 'text-[#7C3AED] bg-purple-50'
              }`}
              style={{ padding: '2px 10px' }}
              aria-label={`Role: ${isImpaired ? 'Sensory Impaired Mode' : 'Regular Mode'}`}
            >
              {isImpaired ? 'Impaired Mode' : 'Regular Mode'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Accessibility Controls (Desktop) */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Spoken Voice Guidance Prompt Toggle */}
            <button
              onClick={() => {
                toggleVoiceGuidance();
                speakGuidance(
                  `Voice guidance ${!voiceGuidance ? 'enabled' : 'disabled'}`,
                  'assertive'
                );
              }}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                voiceGuidance
                  ? isImpaired
                    ? 'bg-amber-400 text-black shadow-clayOrb'
                    : 'bg-[#7C3AED] text-white shadow-clayButton'
                  : 'bg-white text-[#635F69] shadow-clayPill hover:-translate-y-1'
              } active:scale-90`}
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
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                isListeningNav
                  ? 'bg-[#DB2777] text-white animate-pulse shadow-clayOrb'
                  : isImpaired
                  ? 'bg-amber-400/20 text-amber-400 shadow-clayPill'
                  : 'bg-white text-[#635F69] shadow-clayPill hover:-translate-y-1'
              } active:scale-90`}
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
              onClick={readPageContent}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs bg-white text-[#635F69] shadow-clayPill hover:-translate-y-1 active:scale-90 ${
                isImpaired ? 'text-amber-400 hover:text-amber-300' : ''
              }`}
              aria-label="Read current page content aloud"
              title="Read Page Aloud"
            >
              TTS
            </button>

            {/* Dark / Light Theme Toggle */}
            <button
              onClick={() => {
                toggleTheme();
                speakGuidance('Toggled color theme', 'polite');
              }}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center bg-white text-[#635F69] shadow-clayPill hover:-translate-y-1 active:scale-90 ${
                isImpaired ? 'text-amber-400 hover:text-amber-300' : ''
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
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                highContrast
                  ? 'bg-[#7C3AED] text-white shadow-clayButton'
                  : 'bg-white text-[#635F69] shadow-clayPill hover:-translate-y-1'
              } active:scale-90`}
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
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                largeFont
                  ? 'bg-[#7C3AED] text-white shadow-clayButton'
                  : 'bg-white text-[#635F69] shadow-clayPill hover:-translate-y-1'
              } active:scale-90`}
              aria-label="Toggle large font size mode"
              aria-pressed={largeFont}
              title="Large text mode"
            >
              <Type size={18} />
            </button>

            {/* Voice Help Modal Trigger */}
            <button
              onClick={() => setShowCommandsHelp(true)}
              className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white text-[#635F69] shadow-clayPill hover:-translate-y-1 active:scale-90"
              aria-label="Open voice navigation commands cheat sheet"
              title="Voice Commands Help"
            >
              <HelpCircle size={18} />
            </button>
          </div>

          {/* User Info Chip */}
          {user && (
            <div
              className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-2xl bg-white shadow-clayPill"
              tabIndex="0"
              aria-label={`Logged in user: ${user.name}, Email: ${user.email}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-clayOrb ${
                  isImpaired ? 'bg-amber-400 text-black' : 'bg-[#7C3AED] text-white'
                }`}
                style={{ fontFamily: 'Nunito, sans-serif' }}
                aria-hidden="true"
              >
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="leading-tight">
                <p className="text-xs font-extrabold text-[#332F3A]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {user.name}
                </p>
                <p className="text-[11px] text-[#635F69]">
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
            className={`clay-btn-secondary text-sm py-2 px-4 rounded-2xl flex items-center gap-2 ${
              isImpaired ? 'border border-amber-400 text-amber-400 bg-black' : ''
            }`}
            aria-label="Sign out of your account"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden w-10 h-10 rounded-2xl flex items-center justify-center bg-white shadow-clayPill active:scale-90"
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
          className="lg:hidden mt-3 clay-card p-5 grid grid-cols-2 gap-3"
          role="region"
          aria-label="Mobile Accessibility Menu"
        >
          <button
            onClick={toggleVoiceGuidance}
            className={`clay-btn-secondary text-xs py-2 px-3 rounded-2xl flex items-center justify-center gap-1.5 ${
              voiceGuidance ? 'text-[#7C3AED] font-bold' : ''
            }`}
            aria-label={voiceGuidance ? 'Disable voice guidance prompts' : 'Enable voice guidance prompts'}
            aria-pressed={voiceGuidance}
          >
            <Volume2 size={15} /> Prompts {voiceGuidance ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={readPageContent}
            className="clay-btn-secondary text-xs py-2 px-3 rounded-2xl flex items-center justify-center gap-1.5"
            aria-label="Read current page content aloud"
          >
            Read Page Aloud
          </button>
          <button
            onClick={() => {
              if (isListeningNav) stopVoiceNav();
              else startVoiceNav();
            }}
            className={`clay-btn text-xs py-2 px-3 rounded-2xl flex items-center justify-center gap-1.5 ${
              isListeningNav ? 'bg-[#DB2777]' : ''
            }`}
            aria-label={isListeningNav ? 'Stop voice navigation' : 'Start hands-free voice navigation'}
            aria-pressed={isListeningNav}
          >
            <Mic size={15} /> Nav {isListeningNav ? 'Active' : 'Start'}
          </button>
          <button
            onClick={toggleTheme}
            className="clay-btn-secondary text-xs py-2 px-3 rounded-2xl flex items-center justify-center gap-1.5"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}{' '}
            {isDark ? 'Light' : 'Dark'}
          </button>
          <button
            onClick={() => setHighContrast((v) => !v)}
            className={`clay-btn-secondary text-xs py-2 px-3 rounded-2xl flex items-center justify-center gap-1.5 ${
              highContrast ? 'text-[#7C3AED] font-bold' : ''
            }`}
            aria-label="Toggle high contrast accessibility mode"
            aria-pressed={highContrast}
          >
            <Contrast size={15} /> Contrast
          </button>
          <button
            onClick={() => setLargeFont((v) => !v)}
            className={`clay-btn-secondary text-xs py-2 px-3 rounded-2xl flex items-center justify-center gap-1.5 ${
              largeFont ? 'text-[#7C3AED] font-bold' : ''
            }`}
            aria-label="Toggle large text mode"
            aria-pressed={largeFont}
          >
            <Type size={15} /> Large Text
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
