import React, { useState } from 'react';
import { useAssistant } from '../../hooks/useAssistant';
import { AlertTriangle, MapPin, Phone } from 'lucide-react';

const EmergencyButton = () => {
  const { speak } = useAssistant();
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  // TODO: Replace with actual emergency contact number configured for deployment
  const EMERGENCY_NUMBER = '+911';

  const handleSOS = async () => {
    if (isSending) return; // Prevent double-tap
    setIsSending(true);

    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 100]);
    await speak('Emergency alert activated. Locating your position to send help.');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const link = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
          window.open(`sms:${EMERGENCY_NUMBER}?body=Emergency! My location: ${link}`);
          await speak('Emergency SMS sent with your location. Help is on the way.');
          setSent(true);
          setIsSending(false);
        },
        async (err) => {
          console.warn('[EmergencyButton] Geolocation error:', err);
          // Fallback: send SMS without location
          window.open(`sms:${EMERGENCY_NUMBER}?body=Emergency! Please help me.`);
          await speak('Location unavailable. Emergency SMS sent without location. Help is on the way.');
          setSent(true);
          setIsSending(false);
        },
        { timeout: 8000 }
      );
    } else {
      window.open(`sms:${EMERGENCY_NUMBER}?body=Emergency! Please help me.`);
      await speak('Emergency SMS sent. Help is on the way.');
      setSent(true);
      setIsSending(false);
    }
  };

  return (
    <div role="region" aria-label="Emergency SOS">
      <p
        className="text-xs font-bold uppercase tracking-wider mb-2"
        style={{ color: 'var(--c-text-muted)' }}
        id="emergency-label"
      >
        Emergency
      </p>
      <button
        onClick={handleSOS}
        disabled={isSending}
        className="w-full h-28 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200"
        style={{
          background: sent ? '#15803d' : isSending ? '#991b1b' : '#dc2626',
          border: '3px solid',
          borderColor: sent ? '#16a34a' : '#fca5a5',
          boxShadow: '0 0 20px rgb(239 68 68 / 0.4)',
          cursor: isSending ? 'wait' : 'pointer',
        }}
        aria-label={
          sent
            ? 'Emergency alert sent successfully'
            : isSending
            ? 'Sending emergency alert, please wait'
            : 'SOS Emergency button. Tap to send your location and alert emergency contacts.'
        }
        aria-describedby="emergency-desc"
        aria-live="polite"
        aria-busy={isSending}
      >
        {isSending ? (
          <>
            <MapPin size={28} className="text-white animate-bounce" aria-hidden="true" />
            <span className="text-white font-black text-lg">LOCATING…</span>
            <span className="text-white/80 text-xs font-semibold">Getting your position</span>
          </>
        ) : sent ? (
          <>
            <Phone size={28} className="text-white" aria-hidden="true" />
            <span className="text-white font-black text-lg">ALERT SENT ✓</span>
            <span className="text-white/80 text-xs font-semibold">Help is on the way</span>
          </>
        ) : (
          <>
            <AlertTriangle size={28} className="text-white" aria-hidden="true" />
            <span className="text-white font-black text-xl">SOS HELP</span>
            <span className="text-white/80 text-xs font-semibold uppercase">Tap to send location</span>
          </>
        )}
      </button>
      <p
        id="emergency-desc"
        className="sr-only"
      >
        This button sends an emergency SMS with your GPS location to emergency contacts.
        Only use in a genuine emergency situation.
      </p>
    </div>
  );
};

export default EmergencyButton;
