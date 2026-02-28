"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

const DevotionalContext = createContext({
  week: null,
  day: null,
  devotionalDataId: null,
  devotionalNumberId: null,
  refreshNotesVersion: 0,
  setContext: () => {},
  triggerNoteRefresh: () => {},
});

export function DevotionalProvider({ children }) {
  const [context, setContextState] = useState({ 
    week: null, 
    day: null,
    devotionalDataId: null,
    devotionalNumberId: null
  });
  
  const [refreshNotesVersion, setRefreshNotesVersion] = useState(0);

  const setContext = useCallback((week, day, devotionalDataId, devotionalNumberId) => {
    setContextState({ week, day, devotionalDataId, devotionalNumberId });
  }, []);

  const triggerNoteRefresh = useCallback(() => {
    setRefreshNotesVersion(v => v + 1);
  }, []);

  return (
    <DevotionalContext.Provider value={{ ...context, refreshNotesVersion, setContext, triggerNoteRefresh }}>
      {children}
    </DevotionalContext.Provider>
  );
}

export function useDevotionalContext() {
  return useContext(DevotionalContext);
}