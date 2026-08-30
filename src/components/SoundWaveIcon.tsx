import React from 'react';
import { Volume2 } from 'lucide-react';

interface SoundWaveIconProps {
  isPlaying: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SoundWaveIcon: React.FC<SoundWaveIconProps> = ({
  isPlaying,
  size = 'sm',
  className = '',
}) => {
  const iconSizeClass = size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4.5 h-4.5' : 'w-4 h-4';
  const barHeights = size === 'lg' 
    ? ['h-2', 'h-4', 'h-3', 'h-4.5'] 
    : size === 'md' 
    ? ['h-1.5', 'h-3.5', 'h-2.5', 'h-4'] 
    : ['h-1.5', 'h-3', 'h-2', 'h-3.5'];

  if (!isPlaying) {
    return <Volume2 className={`${iconSizeClass} ${className} transition-transform`} />;
  }

  return (
    <div className={`flex items-center justify-center gap-[2.5px] ${iconSizeClass} ${className}`} aria-hidden="true">
      <span
        className={`w-[2.5px] bg-current rounded-full animate-sound-wave-1 ${barHeights[0]}`}
        style={{ animationDelay: '0ms' }}
      />
      <span
        className={`w-[2.5px] bg-current rounded-full animate-sound-wave-2 ${barHeights[1]}`}
        style={{ animationDelay: '150ms' }}
      />
      <span
        className={`w-[2.5px] bg-current rounded-full animate-sound-wave-3 ${barHeights[2]}`}
        style={{ animationDelay: '300ms' }}
      />
      <span
        className={`w-[2.5px] bg-current rounded-full animate-sound-wave-4 ${barHeights[3]}`}
        style={{ animationDelay: '450ms' }}
      />
    </div>
  );
};
