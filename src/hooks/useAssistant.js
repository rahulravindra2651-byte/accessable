import { useState } from 'react';
import { detectConfirmationIntent } from '../utils/nlpExtractor';

// Active recognition instance tracker across all calls
let activeRecognitionInstance = null;

/**
 * Returns a promise that resolves with the best available voice for the given language.
 * Handles the browser quirk where getVoices() returns [] on first call and requires
 * waiting for the 'voiceschanged' event.
 */
const getBestVoice = (language) => {
  return new Promise((resolve) => {
    const langCode = language.split('-')[0];
    const INDIAN_LANGS = ['hi', 'ta', 'te', 'kn', 'ml', 'bn', 'gu', 'mr', 'pa', 'or', 'as'];

    const pickVoice = (voices) => {
      if (INDIAN_LANGS.includes(langCode)) {
        return (
          voices.find((v) => v.lang === language) ||
          voices.find((v) => v.lang.startsWith(langCode)) ||
          voices.find((v) => v.lang.startsWith('en')) ||
          voices[0]
        );
      }
      return voices.find((v) => v.lang.startsWith(langCode)) || voices[0];
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(pickVoice(voices));
    } else {
      // Chrome/Edge loads voices async — wait for the event
      const onVoicesChanged = () => {
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        resolve(pickVoice(window.speechSynthesis.getVoices()));
      };
      window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
      // Safety timeout: resolve with null if event never fires
      setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        resolve(null);
      }, 2000);
    }
  });
};

// Module-level set to prevent Chrome V8 garbage collection of active utterances
const activeUtterances = new Set();

export const useAssistant = (language = 'en-US') => {
  const [isMicActive, setIsMicActive] = useState(false);

  const speak = async (text) => {
    return new Promise(async (resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) {
        return resolve();
      }

      // Clear previous speaking state safely
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
        await new Promise((r) => setTimeout(r, 60));
      }
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Keep reference in Set to prevent Chrome GC from dropping utterance mid-speech
      activeUtterances.add(utterance);

      // Wait for voices to be available (fixes Chrome/Edge async voice loading)
      const preferredVoice = await getBestVoice(language);
      if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.log(`Using voice: ${preferredVoice.name} for language: ${language}`);
      } else {
        console.warn(`No suitable voice found for ${language}, using browser default`);
      }

      let done = false;
      const finish = () => {
        if (!done) {
          done = true;
          activeUtterances.delete(utterance);
          clearTimeout(fallbackTimer);
          clearTimeout(startWatchdog);
          setTimeout(resolve, 80);
        }
      };

      // Watchdog: If onstart doesn't fire within 400ms, force resume
      const startWatchdog = setTimeout(() => {
        if (!done && window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }, 400);

      // Fallback timer: Chromium speechSynthesis onend event sometimes fails to fire
      const fallbackTimer = setTimeout(() => {
        console.warn('[useAssistant] Speech synthesis fallback timer triggered');
        finish();
      }, Math.max(2500, text.length * 80));

      utterance.onstart = () => {
        clearTimeout(startWatchdog);
      };

      utterance.onend = finish;
      utterance.onerror = (e) => {
        if (e.error !== 'interrupted') console.warn('[useAssistant] speak error:', e.error);
        finish();
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('[useAssistant] speak exception:', err);
        finish();
      }
    });
  };

  const stopAllVoice = () => {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (activeRecognitionInstance) {
        try {
          activeRecognitionInstance.abort();
        } catch (e) {}
        activeRecognitionInstance = null;
      }
      setIsMicActive(false);
    }
  };

  const listen = () => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        return resolve('');
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        console.error('Speech Recognition NOT supported in this browser.');
        return resolve('');
      }

      // 1. Immediately abort any existing recognition session to avoid duplicate listeners or busy hardware
      if (activeRecognitionInstance) {
        try {
          activeRecognitionInstance.abort();
        } catch (e) {}
        activeRecognitionInstance = null;
      }

      // 2. Stop speech synthesis if currently speaking
      if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      setIsMicActive(true);

      const recognition = new SpeechRecognition();
      activeRecognitionInstance = recognition;
      recognition.lang = language;
      recognition.continuous = false;
      recognition.interimResults = true;

      let resolved = false;
      let capturedFinal = '';
      let capturedInterim = '';

      const safeResolve = (value) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          setIsMicActive(false);
          if (activeRecognitionInstance === recognition) {
            activeRecognitionInstance = null;
          }
          try {
            recognition.abort();
          } catch (e) {}
          resolve((value || '').trim());
        }
      };

      const timeoutId = setTimeout(() => {
        if (!resolved) {
          console.warn('[useAssistant] Voice input timed out after 12s');
          safeResolve(capturedFinal || capturedInterim || '');
        }
      }, 12000);

      recognition.onstart = () => {
        setIsMicActive(true);
      };

      recognition.onresult = (e) => {
        let finalStr = '';
        let interimStr = '';

        for (let i = 0; i < e.results.length; i++) {
          const part = e.results[i][0]?.transcript || '';
          if (e.results[i].isFinal) {
            finalStr += (finalStr ? ' ' : '') + part;
          } else {
            interimStr += (interimStr ? ' ' : '') + part;
          }
        }

        const candidate = (finalStr || interimStr).trim();
        if (finalStr.trim()) {
          capturedFinal = finalStr.trim();
        }
        if (interimStr.trim()) {
          capturedInterim = interimStr.trim();
        }

        // A. If a final result is available, resolve immediately!
        if (finalStr.trim()) {
          safeResolve(finalStr.trim());
          return;
        }

        // B. If an interim result clearly matches an affirmative or negative confirmation intent (e.g. "yes", "no"),
        // resolve immediately so the user NEVER has to say "Yes" twice or wait for silence timeouts!
        if (candidate) {
          const quickIntent = detectConfirmationIntent(candidate);
          if (quickIntent === 'AFFIRMATIVE' || quickIntent === 'NEGATIVE') {
            safeResolve(candidate);
            return;
          }
        }
      };

      recognition.onerror = (err) => {
        if (err.error !== 'no-speech' && err.error !== 'aborted') {
          console.warn('[useAssistant] Speech Error:', err.error);
        }
        safeResolve(capturedFinal || capturedInterim || '');
      };

      recognition.onend = () => {
        if (!resolved) {
          safeResolve(capturedFinal || capturedInterim || '');
        }
      };

      try {
        recognition.start();
      } catch (startErr) {
        console.warn('[useAssistant] Recognition start exception:', startErr);
        safeResolve('');
      }
    });
  };

  return { speak, listen, stopAllVoice, isMicActive };
};
