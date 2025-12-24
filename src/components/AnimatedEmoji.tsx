import React, { useState, useEffect } from 'react';
import { emojiMapping } from '@/utils/emojiMapping';

interface AnimatedEmojiProps {
  emoji: string;
  className?: string;
  size?: number;
  hovered?: boolean; // External control from parent components
  delay?: number; // Delay in milliseconds before starting the animation
  timeout?: number; // Duration in milliseconds before stopping the animation
}

/**
 * A reusable component that renders an animated Noto Emoji GIF on hover.
 * Displays a static PNG by default.
 * 
 * New features:
 * - `delay`: Wait X ms before starting the animation.
 * - `timeout`: Stop the animation after X ms.
 * 
 * Falls back to the static PNG if the GIF is missing, and to text if both are missing.
 */
export const AnimatedEmoji: React.FC<AnimatedEmojiProps> = ({ 
  emoji, 
  className = "", 
  size = 64,
  hovered: externalHovered,
  delay,
  timeout
}) => {
  const [internalHovered, setInternalHovered] = useState(false);
  const [playState, setPlayState] = useState(false);
  const [hasGifError, setHasGifError] = useState(false);
  const [hasPngError, setHasPngError] = useState(false);

  // Use external hover state if provided, otherwise use internal state
  const isHovered = externalHovered !== undefined ? externalHovered : internalHovered;

  useEffect(() => {
    let delayTimer: ReturnType<typeof setTimeout>;
    let timeoutTimer: ReturnType<typeof setTimeout>;

    if (isHovered) {
      if (delay) {
        delayTimer = setTimeout(() => {
          setPlayState(true);
          if (timeout) {
            timeoutTimer = setTimeout(() => {
              setPlayState(false);
            }, timeout);
          }
        }, delay);
      } else {
        setPlayState(true);
        if (timeout) {
          timeoutTimer = setTimeout(() => {
            setPlayState(false);
          }, timeout);
        }
      }
    } else {
      setPlayState(false);
    }

    return () => {
      clearTimeout(delayTimer);
      clearTimeout(timeoutTimer);
    };
  }, [isHovered, delay, timeout]);

  // Normalize emoji by removing variation selectors (FE0F)
  const normalizedEmoji = emoji.replace(/\uFE0F/g, '');
  
  // Get the base code
  let code = emojiMapping[emoji] || emojiMapping[normalizedEmoji];
  
  // Premium overrides (e.g., Baby -> Teddy Bear for better animation)
  if (emoji === "👶" || normalizedEmoji === "👶") {
    code = "1f9f8"; 
  }

  // If no mapping or both images failed, show the text emoji
  if (!code || (hasPngError && hasGifError)) {
    return <span className={className} style={{ fontSize: size }}>{emoji}</span>;
  }

  const staticUrl = `https://fonts.gstatic.com/s/e/notoemoji/latest/${code}/512.png`;
  const animatedUrl = `https://fonts.gstatic.com/s/e/notoemoji/latest/${code}/512.gif`;

  // Only attempt to show GIF if playState is true and it hasn't failed before
  const showGif = playState && !hasGifError;

  return (
    <div 
      className={`inline-flex items-center justify-center ${className}`}
      onMouseEnter={() => setInternalHovered(true)}
      onMouseLeave={() => setInternalHovered(false)}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      <img
        // If PNG failed, try GIF directly (maybe only GIF exists)
        // Otherwise use static as default and switch to GIF on hover/playState
        src={hasPngError ? animatedUrl : (showGif ? animatedUrl : staticUrl)}
        alt={emoji}
        width={size}
        height={size}
        loading="lazy"
        className="object-contain"
        onError={() => {
          if (showGif || hasPngError) {
            setHasGifError(true);
          } else {
            setHasPngError(true);
          }
        }}
        // The key ensures that when we toggle between static and animated,
        // the browser tries to load the new source and triggers onError if needed.
        key={showGif ? 'gif' : 'png'}
      />
    </div>
  );
};
