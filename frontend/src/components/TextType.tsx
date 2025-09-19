'use client';

import React, { useState, useEffect } from 'react';

interface TextTypeProps {
  text: string;
  typingSpeed?: number;
  showCursor?: boolean;
  cursorCharacter?: string;
  className?: string;
  onComplete?: () => void;
}

const TextType: React.FC<TextTypeProps> = ({
  text,
  typingSpeed = 75,
  showCursor = true,
  cursorCharacter = "|",
  className = "",
  onComplete
}) => {
  const [currentText, setCurrentText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (isComplete) return;

    const timeout = setTimeout(() => {
      if (currentText.length < text.length) {
        setCurrentText(text.slice(0, currentText.length + 1));
      } else {
        setIsComplete(true);
        if (onComplete) {
          onComplete();
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [currentText, text, typingSpeed, isComplete, onComplete]);

  return (
    <span className={className}>
      {currentText}
      {showCursor && !isComplete && (
        <span className="animate-pulse">{cursorCharacter}</span>
      )}
    </span>
  );
};

export default TextType;
