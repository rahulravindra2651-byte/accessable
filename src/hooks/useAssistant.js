import { useState } from 'react';

export const useAssistant = (language = 'en-US') => {
  const [isMicActive, setIsMicActive] = useState(false);

  const speak = (text) => {
    return new Promise((resolve) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      // Set language and try to find appropriate voice
      utterance.lang = language;
      const voices = window.speechSynthesis.getVoices();
      const langCode = language.split('-')[0]; // e.g., 'en' from 'en-US'

      // For Indian languages, try multiple fallbacks
      let preferredVoice = null;
      if (['hi', 'ta', 'te', 'kn', 'ml', 'bn', 'gu', 'mr', 'pa', 'or', 'as'].includes(langCode)) {
        // Try exact language match first
        preferredVoice = voices.find(voice => voice.lang === language) ||
                        voices.find(voice => voice.lang.startsWith(langCode)) ||
                        voices.find(voice => voice.lang.startsWith('en')); // Fallback to English
      } else {
        preferredVoice = voices.find(voice => voice.lang.startsWith(langCode)) || voices[0];
      }

      if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.log(`Using voice: ${preferredVoice.name} for language: ${language}`);
      } else {
        console.warn(`No suitable voice found for ${language}, using default`);
      }

      utterance.onend = () => setTimeout(resolve, 500);
      window.speechSynthesis.speak(utterance);
    });
  };

  const listen = (callback) => {
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
          console.warn('Voice input timed out');
          try { recognition.stop(); } catch (e) {}
          safeResolve('');
        }
      }, 12000);

      recognition.onstart = () => {
        setIsMicActive(true);
        console.log('Microphone is NOW RECORDING...');
      };

      recognition.onresult = (e) => {
        const result = e.results[0][0]?.transcript?.toLowerCase() || '';
        console.log('Voice Input Received:', result);
        if (typeof callback === 'function') callback(result);
        safeResolve(result);
      };

      recognition.onerror = (err) => {
        console.error('Speech Error:', err.error); 
        safeResolve('');
      };

      recognition.onend = () => {
        if (!resolved) {
          console.log('Recognition ended with no speech. Returning empty string.');
          safeResolve('');
        }
      };

      try {
        recognition.start();
      } catch (startErr) {
        console.error('Recognition start failed', startErr);
        safeResolve('');
      }
    });
  };

  return { speak, listen, isMicActive };
};
