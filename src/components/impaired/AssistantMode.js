import React, { useState, useContext, useEffect } from 'react';
import { Mic, Eye, FileText, Sparkles } from 'lucide-react';
import LiveCaptions from './LiveCaptions';
import OCRScanner from './OCRScanner';
import VoiceForm from './VoiceForm';
import EmergencyButton from './EmergencyButton';
import PageReaderControls from '../ui/PageReaderControls';
import { AuthContext } from '../../context/AuthContext';
import { AccessibilityContext } from '../../context/AccessibilityContext';

const TOOLS = [
  {
    id: 'captions',
    icon: Mic,
    label: 'Live Captions',
    desc: 'Real-time speech to text transcription',
    ariaLabel: 'Open Live Captions tool. Speech to text.',
    gradient: 'from-pink-400 to-pink-600',
  },
  {
    id: 'form',
    icon: FileText,
    label: 'Voice Form Filling',
    desc: 'Conversational NLP-powered voice form assistant',
    ariaLabel: 'Open Voice Form Assistant tool. Interactive form filling by voice.',
    gradient: 'from-violet-400 to-violet-600',
  },
  {
    id: 'ocr',
    icon: Eye,
    label: 'OCR Document Scanner',
    desc: 'Scan & read printed documents aloud with fraud scanner',
    ariaLabel: 'Open OCR Document Scanner tool. Scan and read printed text.',
    gradient: 'from-blue-400 to-blue-600',
  },
];

const AssistantMode = () => {
  const { user } = useContext(AuthContext);
  const { speakGuidance } = useContext(AccessibilityContext);
  const [activeTool, setActiveTool] = useState('captions');

  // Announce page arrival and tool changes
  useEffect(() => {
    const userName = user?.name ? `Welcome ${user.name}. ` : 'Welcome. ';
    const toolName = TOOLS.find((t) => t.id === activeTool)?.label || 'Live Captions';
    speakGuidance(
      `${userName}You are on the Accessibility Assistant Dashboard. Active tool: ${toolName}. Press Page Reader to listen to content, or use Voice Navigation.`,
      'polite'
    );
  }, [activeTool, user?.name, speakGuidance]);

  const handleToolChange = (toolId) => {
    setActiveTool(toolId);
    const selected = TOOLS.find((t) => t.id === toolId);
    if (selected) {
      speakGuidance(`Switched to ${selected.label}. ${selected.desc}.`, 'assertive');
    }
  };

  return (
    <div
      className="clay-canvas min-h-[calc(100vh-80px)] pb-16 relative"
      id="main-content"
      tabIndex="-1"
    >
      {/* 3D Floating Blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute top-[10%] -left-[5%] w-[40vw] h-[40vw] rounded-full bg-[#F59E0B]/10 blur-3xl clay-blob-float" />
        <div className="absolute top-[40%] -right-[5%] w-[40vw] h-[40vw] rounded-full bg-[#DB2777]/10 blur-3xl clay-blob-float-delayed" />
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-8">
        {/* Top Page Reader & Voice Controls */}
        <div className="mb-6">
          <PageReaderControls />
        </div>

        {/* Dashboard Header */}
        <header className="mb-8" role="banner">
          <div className="flex items-center gap-3 mb-2">
            <span className="clay-pill text-xs font-bold text-[#F59E0B] bg-white">
              Sensory Impaired Mode
            </span>
            <span className="clay-pill text-xs font-bold text-[#10B981] bg-white flex items-center gap-1.5">
              <Sparkles size={14} /> High Visibility Contrast
            </span>
          </div>
          <h1
            className="clay-font-black text-4xl sm:text-5xl text-[#332F3A] tracking-tight"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            Accessibility Assistant
          </h1>
          <p className="clay-font-body text-lg text-[#635F69] mt-1">
            AI-powered tools designed with tactile clarity for visually and hearing impaired users.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Navigation Sidebar / Tool Chooser */}
          <nav className="space-y-4 lg:col-span-1" aria-label="Accessibility Tools Navigation">
            <p className="clay-font-heading text-xs font-black uppercase tracking-wider text-[#635F69] px-2">
              Select Tool (3 Available)
            </p>
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              const active = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => handleToolChange(tool.id)}
                  className={`w-full flex items-center gap-4 p-5 rounded-[28px] text-left transition-all duration-300 ${
                    active
                      ? 'bg-white shadow-clayButton border-2 border-[#7C3AED] scale-[1.02]'
                      : 'clay-card p-5 hover:-translate-y-1'
                  } active:scale-95`}
                  aria-label={tool.ariaLabel}
                  aria-pressed={active}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${tool.gradient} text-white shadow-clayOrb`}
                  >
                    <Icon size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p
                      className="clay-font-heading text-base sm:text-lg font-extrabold text-[#332F3A]"
                      style={{ fontFamily: 'Nunito, sans-serif' }}
                    >
                      {tool.label}
                    </p>
                    <p className="clay-font-body text-xs sm:text-sm text-[#635F69] mt-0.5">
                      {tool.desc}
                    </p>
                  </div>
                </button>
              );
            })}

            {/* Emergency Button Block */}
            <div className="mt-6 pt-4">
              <EmergencyButton />
            </div>
          </nav>

          {/* Main Active Tool Display Panel */}
          <main className="lg:col-span-2 clay-card p-6 sm:p-8" aria-live="polite" aria-atomic="true">
            {activeTool === 'captions' && <LiveCaptions />}
            {activeTool === 'form' && <VoiceForm />}
            {activeTool === 'ocr' && <OCRScanner />}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AssistantMode;