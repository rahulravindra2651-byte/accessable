import React from 'react';
import { useAssistant } from '../../hooks/useAssistant';

const EmergencyButton = () => {
  const { speak } = useAssistant();

  // TODO: Replace with actual emergency contact number configured for deployment
  const EMERGENCY_NUMBER = '+911'; // Change to your local emergency / caregiver number

  const handleSOS = () => {
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 100]);
    }
    speak('Emergency alert sent. Help is on the way.');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const link = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
          window.open(`sms:${EMERGENCY_NUMBER}?body=Emergency! My location: ${link}`);
        },
        (err) => {
          console.warn('Geolocation error:', err);
          // Fallback: send SMS without location
          window.open(`sms:${EMERGENCY_NUMBER}?body=Emergency! Please help me.`);
        }
      );
    } else {
      // Geolocation not available (e.g., non-HTTPS context)
      window.open(`sms:${EMERGENCY_NUMBER}?body=Emergency! Please help me.`);
    }
  };

  return (
    <button onClick={handleSOS} className="w-full bg-red-600 h-48 rounded-3xl flex flex-col items-center justify-center animate-pulse border-4 border-white shadow-2xl">
      <span className="text-5xl font-black text-white italic">SOS HELP</span>
      <p className="text-white font-bold opacity-80 mt-2 text-sm uppercase">Tap to send location</p>
    </button>
  );
};

export default EmergencyButton;
