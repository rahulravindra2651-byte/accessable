import React, { useState, useContext, useEffect } from 'react';
import { Mic, Eye, FileText } from 'lucide-react';
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
  },
  {
    id: 'form',
    icon: FileText,
    label: 'Voice Form Filling',
    desc: 'Conversational NLP-powered voice form assistant',
    ariaLabel: 'Open Voice Form Assistant tool. Interactive form filling by voice.',
  },
  {
    id: 'ocr',
    icon: Eye,
    label: 'OCR Document Scanner',
    desc: 'Scan & read printed documents aloud with fraud scanner',
    ariaLabel: 'Open OCR Document Scanner tool. Scan and read printed text.',
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
      className="min-h-[calc(100vh-64px)] pb-16 impaired-theme"
      style={{ background: 'var(--c-bg)' }}
      id="main-content"
      tabIndex="-1"
    >
      <div className="container-app pt-6">
        {/* Top Page Reader & Voice Controls */}
        <PageReaderControls />

        {/* Dashboard Header */}
        <header className="mb-6" role="banner">
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-warning" aria-label="Current Mode: Sensory Impaired Mode">
              Sensory Impaired Mode
            </span>
            <span className="badge badge-neutral" aria-label="Theme Status: High Visibility Amber Contrast">
              High Visibility
            </span>
          </div>
          <h1 className="text-3xl font-black" style={{ color: 'var(--c-text)' }}>
            Accessibility Assistant
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--c-text-muted)' }}>
            AI-powered tools designed for visually and hearing impaired users
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Navigation Sidebar / Tool Chooser */}
          <nav className="space-y-3 lg:col-span-1" aria-label="Accessibility Tools Navigation">
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--c-text-muted)' }}>
              Select Tool (3 Available)
            </p>
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              const active = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => handleToolChange(tool.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200"
                  style={{
                    border: `2px solid ${active ? '#f59e0b' : 'var(--c-border)'}`,
                    background: active ? 'rgb(245 158 11 / .08)' : 'var(--c-surface)',
                  }}
                  aria-label={tool.ariaLabel}
                  aria-pressed={active}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: active ? '#f59e0b' : 'rgb(245 158 11 / .15)' }}
                  >
                    <Icon
                      size={20}
                      style={{ color: active ? '#000' : '#f59e0b' }}
                    />
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--c-text)' }}>
                      {tool.label}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>
                      {tool.desc}
                    </p>
                  </div>
                </button>
              );
            })}


            {/* Emergency Button Block */}
            <div
              className="mt-4 pt-4 border-t"
              style={{ borderColor: 'var(--c-border)' }}
            >
              <EmergencyButton />
            </div>
          </nav>

          {/* Main Active Tool Display Panel */}
          <main className="lg:col-span-2" aria-live="polite" aria-atomic="true">
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