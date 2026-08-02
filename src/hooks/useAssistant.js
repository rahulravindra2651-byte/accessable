import { useState } from 'react';

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

export const useAssistant = (language = 'en-US') => {
  const [isMicActive, setIsMicActive] = useState(false);

  const speak = async (text) => {
    return new Promise(async (resolve) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;

      // Wait for voices to be available (fixes Chrome/Edge async voice loading)
      const preferredVoice = await getBestVoice(language);
      if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.log(`Using voice: ${preferredVoice.name} for language: ${language}`);
      } else {
        console.warn(`No suitable voice found for ${language}, using browser default`);
      }

      utterance.onend = () => setTimeout(resolve, 500);
      utterance.onerror = (e) => {
        if (e.error !== 'interrupted') console.warn('[useAssistant] speak error:', e.error);
        resolve();
      };
      window.speechSynthesis.speak(utterance);
    });
  };

  const listen = () => {
    return new Promise((resolve) => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        console.error('Speech Recognition NOT supported in this browser.');
        return resolve('');
      }

      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.continuous = false;
      recognition.interimResults = false;

      let resolved = false;
      const safeResolve = (value) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          setIsMicActive(false);
          resolve(value);
        }
      };

      const timeoutId = setTimeout(() => {
        if (!resolved) {
          console.warn('[useAssistant] Voice input timed out after 12s');
          try { recognition.stop(); } catch (e) {}
          safeResolve('');
        }
      }, 12000);

      recognition.onstart = () => {
        setIsMicActive(true);
        console.log('[useAssistant] Microphone is NOW RECORDING...');
      };

      recognition.onresult = (e) => {
        const result = e.results[0][0]?.transcript?.toLowerCase() || '';
        console.log('[useAssistant] Voice Input Received:', result);
        safeResolve(result);
      };

      recognition.onerror = (err) => {
        if (err.error === 'not-allowed') {
          console.error('[useAssistant] Microphone permission denied. Please allow microphone access.');
          setIsMicActive(false);
        } else if (err.error === 'no-speech') {
          console.warn('[useAssistant] No speech detected.');
        } else {
          console.error('[useAssistant] Speech Error:', err.error);
        }
        safeResolve('');
      };

      recognition.onend = () => {
        if (!resolved) {
          console.log('[useAssistant] Recognition ended with no result.');
          safeResolve('');
        }
      };

      try {
        recognition.start();
      } catch (startErr) {
        console.error('[useAssistant] Recognition start failed:', startErr);
        safeResolve('');
      }
    });
  };

  return { speak, listen, isMicActive };
};
