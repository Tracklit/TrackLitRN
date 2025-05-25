import React, { useRef, useEffect } from 'react';

interface AudioPlayerProps {
  src: string;
  autoPlay?: boolean;
  controls?: boolean;
  volume?: number;
  onEnded?: () => void;
  hidden?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  src, 
  autoPlay = false, 
  controls = false, 
  volume = 1,
  onEnded,
  hidden = true
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      
      // Add event listener for when audio completes
      if (onEnded) {
        const handleEnded = () => {
          onEnded();
        };
        
        audioRef.current.addEventListener('ended', handleEnded);
        
        // Cleanup
        return () => {
          if (audioRef.current) {
            audioRef.current.removeEventListener('ended', handleEnded);
          }
        };
      }
    }
  }, [volume, onEnded]);
  
  return (
    <audio 
      ref={audioRef}
      src={src} 
      autoPlay={autoPlay} 
      controls={controls}
      style={{ display: hidden ? 'none' : 'block' }}
      preload="auto"
    />
  );
};