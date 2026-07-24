export const useSpeech = (language = 'en-US') => {
  const isSupported = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const speak = (text) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    // Set voice based on language
    const voices = window.speechSynthesis.getVoices();
    const langCode = language.split('-')[0];
    const preferredVoice = voices.find(voice => voice.lang.startsWith(langCode)) || voices[0];
    if (preferredVoice) {
      msg.voice = preferredVoice;
    }
    msg.lang = language;
    window.speechSynthesis.speak(msg);
  };

  const startListening = () => {
    return new Promise((resolve) => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        const err = 'SpeechRecognition not supported in this browser.';
        console.error(err);
        return resolve({ success: false, error: err });
      }

      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.continuous = false;
      recognition.interimResults = false;

      let resolved = false;
      const finish = (data) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          resolve(data);
        }
      };

      const timeoutId = setTimeout(() => {
        if (!resolved) {
          console.warn('SpeechRecognition timeout: no speech detected within 12 seconds.');
          try { recognition.stop(); } catch (err) {}
          finish({ success: false, error: 'timeout' });
        }
      }, 12000);

      recognition.onstart = () => console.log('SpeechRecognition started');

      recognition.onresult = (e) => {
        const text = e.results?.[0]?.[0]?.transcript?.toLowerCase() || '';
        console.log('SpeechRecognition onresult:', text);
        finish({ success: true, transcript: text });
      };

      recognition.onerror = (e) => {
        const err = e.error || 'recognition_error';
        console.error('SpeechRecognition error:', err);
        finish({ success: false, error: err });
      };

      recognition.onnomatch = () => {
        console.warn('SpeechRecognition onnomatch');
        finish({ success: false, error: 'no_match' });
      };

      recognition.onend = () => {
        if (!resolved) {
          console.log('SpeechRecognition ended without result.');
          finish({ success: false, error: 'ended_no_result' });
        }
      };

      try {
        recognition.start();
      } catch (startErr) {
        console.error('SpeechRecognition start failed:', startErr);
        finish({ success: false, error: 'start_failed' });
      }
    });
  };

  return { speak, startListening, isSupported };
};
