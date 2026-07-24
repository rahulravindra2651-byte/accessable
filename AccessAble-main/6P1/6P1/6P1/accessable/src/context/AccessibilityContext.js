import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { announce, stopSpeech } from '../utils/speechAnnouncer';
import { matchVoiceCommand, VOICE_COMMANDS } from '../utils/voiceCommands';

export const AccessibilityContext = createContext(null);

const VOICE_GUIDANCE_KEY = 'accessableVoiceGuidance';

export const AccessibilityProvider = ({ children }) => {
  const [voiceGuidance, setVoiceGuidance] = useState(() => {
    const saved = localStorage.getItem(VOICE_GUIDANCE_KEY);
    return saved !== null ? JSON.parse(saved) : true; // Default ON for accessibility
  });

  const [isReadingPage, setIsReadingPage] = useState(false);
  const [isListeningNav, setIsListeningNav] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.95);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [showCommandsHelp, setShowCommandsHelp] = useState(false);

  const recognitionRef = useRef(null);

  // Load available SpeechSynthesis voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        if (voices.length > 0 && !selectedVoice) {
          const defaultVoice =
            voices.find((v) => v.lang.startsWith('en') && v.default) || voices[0];
          setSelectedVoice(defaultVoice);
        }
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoice]);

  // Persist voice guidance state
  useEffect(() => {
    localStorage.setItem(VOICE_GUIDANCE_KEY, JSON.stringify(voiceGuidance));
  }, [voiceGuidance]);

  /**
   * Speak a live guidance or system message.
   */
  const speakGuidance = useCallback(
    (message, priority = 'polite') => {
      if (voiceGuidance) {
        announce(message, priority, true, {
          rate: speechRate,
          pitch: speechPitch,
          voice: selectedVoice,
        });
      } else {
        announce(message, priority, false); // Screen reader ARIA only
      }
    },
    [voiceGuidance, speechRate, speechPitch, selectedVoice]
  );

  /**
   * Read the main page content aloud.
   */
  const readPageContent = useCallback(() => {
    const mainEl = document.getElementById('main-content') || document.body;
    if (!mainEl) return;

    stopSpeech();
    setIsReadingPage(true);

    // Collect all visible headings, paragraphs, and buttons text
    const textNodes = Array.from(
      mainEl.querySelectorAll('h1, h2, h3, h4, p, button, label, [role="tab"]')
    )
      .map((el) => {
        if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') {
          return `Button: ${el.getAttribute('aria-label') || el.innerText || ''}`;
        }
        return el.innerText || '';
      })
      .filter((t) => t.trim().length > 0);

    const fullText = textNodes.join('. ');

    if (!fullText.trim()) {
      speakGuidance('Page has no readable text content.', 'polite');
      setIsReadingPage(false);
      return;
    }

    speakGuidance(`Reading page content. ${fullText}`, 'polite');
  }, [speakGuidance]);

  const stopReadingPage = useCallback(() => {
    stopSpeech();
    setIsReadingPage(false);
  }, []);

  /**
   * Global Voice Navigation Listener.
   */
  const startVoiceNav = useCallback(
    (onCommandMatched) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        speakGuidance('Voice navigation is not supported in this browser.', 'assertive');
        return;
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }

      const recognition = new SR();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListeningNav(true);
        speakGuidance('Voice navigation active. Say a command or say help.', 'polite');
      };

      recognition.onresult = (e) => {
        const lastResult = e.results[e.results.length - 1];
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript;
          const match = matchVoiceCommand(transcript);

          if (match) {
            speakGuidance(`Command recognized: ${match.description}`, 'polite');

            if (match.id === 'help') {
              setShowCommandsHelp(true);
            } else if (match.id === 'read_page') {
              readPageContent();
            } else if (match.id === 'stop_reading') {
              stopReadingPage();
            } else if (onCommandMatched) {
              onCommandMatched(match);
            }
          }
        }
      };

      recognition.onerror = (e) => {
        if (e.error !== 'no-speech') {
          console.warn('[VoiceNav] error:', e.error);
        }
      };

      recognition.onend = () => {
        setIsListeningNav(false);
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (err) {
        console.error('[VoiceNav] start error:', err);
      }
    },
    [speakGuidance, readPageContent, stopReadingPage]
  );

  const stopVoiceNav = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListeningNav(false);
    speakGuidance('Voice navigation stopped.', 'polite');
  }, [speakGuidance]);

  return (
    <AccessibilityContext.Provider
      value={{
        voiceGuidance,
        setVoiceGuidance,
        toggleVoiceGuidance: () => setVoiceGuidance((v) => !v),
        speakGuidance,
        isReadingPage,
        readPageContent,
        stopReadingPage,
        isListeningNav,
        startVoiceNav,
        stopVoiceNav,
        speechRate,
        setSpeechRate,
        speechPitch,
        setSpeechPitch,
        availableVoices,
        selectedVoice,
        setSelectedVoice,
        showCommandsHelp,
        setShowCommandsHelp,
        VOICE_COMMANDS,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};
