'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  characters?: string;
  className?: string;
  parentClassName?: string;
  encryptedClassName?: string;
  animateOn?: 'hover' | 'view';
  revealDirection?: 'left' | 'right' | 'center';
}

const DecryptedText: React.FC<DecryptedTextProps> = ({
  text,
  speed = 50,
  maxIterations = 10,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?',
  className = '',
  parentClassName = '',
  encryptedClassName = '',
  animateOn = 'hover',
  revealDirection = 'left'
}) => {
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  const generateRandomString = (length: number): string => {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const animateText = () => {
    if (isAnimating || (animateOn === 'view' && hasAnimated)) return;
    
    setIsAnimating(true);
    const originalText = text;
    const textLength = originalText.length;
    
    let iterations = 0;
    const interval = setInterval(() => {
      setDisplayText(prev => {
        return prev
          .split('')
          .map((letter, index) => {
            if (index < iterations) {
              return originalText[index];
            }
            return generateRandomString(1);
          })
          .join('');
      });

      if (iterations >= textLength) {
        clearInterval(interval);
        setIsAnimating(false);
        setHasAnimated(true);
        setDisplayText(originalText);
      }

      iterations += 1 / maxIterations;
    }, speed);
  };

  useEffect(() => {
    if (animateOn === 'view') {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasAnimated) {
              animateText();
            }
          });
        },
        { threshold: 0.1 }
      );

      if (elementRef.current) {
        observer.observe(elementRef.current);
      }

      return () => {
        if (elementRef.current) {
          observer.unobserve(elementRef.current);
        }
      };
    }
  }, [animateOn, hasAnimated]);

  const handleMouseEnter = () => {
    if (animateOn === 'hover') {
      animateText();
    }
  };

  const getRevealDirection = () => {
    switch (revealDirection) {
      case 'right':
        return { originX: 0, originY: 0.5 };
      case 'center':
        return { originX: 0.5, originY: 0.5 };
      default:
        return { originX: 0, originY: 0.5 };
    }
  };

  return (
    <motion.div
      ref={elementRef}
      className={`${parentClassName} ${className}`}
      onMouseEnter={handleMouseEnter}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        ...getRevealDirection(),
      }}
    >
      <motion.span
        className={`font-mono ${encryptedClassName}`}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{ transformOrigin: `${getRevealDirection().originX * 100}% ${getRevealDirection().originY * 100}%` }}
      >
        {displayText}
      </motion.span>
    </motion.div>
  );
};

export default DecryptedText;
