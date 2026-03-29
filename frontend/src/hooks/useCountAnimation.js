import { useState, useEffect } from 'react';

export default function useCountAnimation(target, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    let animationFrameId = null;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      setValue(Math.floor(target * easedProgress));
      
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    if (target > 0) {
      animationFrameId = requestAnimationFrame(step);
    } else {
      setValue(0);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [target, duration]);

  return value;
}
