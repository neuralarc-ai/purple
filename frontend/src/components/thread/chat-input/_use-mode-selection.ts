'use client';

import { useState, useEffect } from 'react';

export const STORAGE_KEY_MODE = 'suna-preferred-mode-v1';
export const DEFAULT_MODE: 'default' | 'agent' = 'default';

export type ModeType = 'default' | 'agent';

// Helper to save mode preference to localStorage safely
const saveModePreference = (mode: ModeType): void => {
  try {
    localStorage.setItem(STORAGE_KEY_MODE, mode);
    // console.log('✅ useModeSelection: Saved mode preference to localStorage:', mode);
  } catch (error) {
    console.warn('❌ useModeSelection: Failed to save mode preference to localStorage:', error);
  }
};

// Helper to load mode preference from localStorage safely
const loadModePreference = (): ModeType => {
  try {
    if (typeof window === 'undefined') {
      return DEFAULT_MODE;
    }
    
    const savedMode = localStorage.getItem(STORAGE_KEY_MODE);
    // console.log('🔧 useModeSelection: Saved mode from localStorage:', savedMode);
    
    if (savedMode === 'default' || savedMode === 'agent') {
      return savedMode;
    }
    
    return DEFAULT_MODE;
  } catch (error) {
    console.warn('❌ useModeSelection: Failed to load mode preference from localStorage:', error);
    return DEFAULT_MODE;
  }
};

export const useModeSelection = () => {
  const [selectedMode, setSelectedMode] = useState<ModeType>(DEFAULT_MODE);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize selected mode from localStorage ONLY ONCE
  useEffect(() => {
    if (!hasInitialized && typeof window !== 'undefined') {
      const savedMode = loadModePreference();
      // console.log('🔧 useModeSelection: Initializing with saved mode:', savedMode);
      setSelectedMode(savedMode);
      setHasInitialized(true);
    }
  }, [hasInitialized]);

  // Handle mode selection change
  const handleModeChange = (mode: ModeType) => {
    // console.log('🔧 useModeSelection: handleModeChange called with:', mode);
    
    // console.log('✅ useModeSelection: Setting mode to:', mode);
    setSelectedMode(mode);
    saveModePreference(mode);
    // console.log('✅ useModeSelection: Mode change completed successfully');
  };

  return {
    selectedMode,
    setSelectedMode: handleModeChange,
    hasInitialized,
  };
};
