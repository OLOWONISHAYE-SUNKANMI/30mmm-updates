"use client";

<<<<<<< HEAD
import React, { createContext, useContext, useState } from 'react';
=======
import React, { createContext, useContext, useState, useCallback } from 'react';
>>>>>>> a469c3c221f469a63598086c4907ef57ad7919fc

const DevotionalContext = createContext({
  week: null,
  day: null,
  devotionalDataId: null,
  devotionalNumberId: null,
<<<<<<< HEAD
  setContext: () => {},
=======
  refreshNotesVersion: 0,
  setContext: () => {},
  triggerNoteRefresh: () => {},
>>>>>>> a469c3c221f469a63598086c4907ef57ad7919fc
});

export function DevotionalProvider({ children }) {
  const [context, setContextState] = useState({ 
    week: null, 
    day: null,
    devotionalDataId: null,
    devotionalNumberId: null
  });
<<<<<<< HEAD

  const setContext = (week, day, devotionalDataId, devotionalNumberId) => {
    setContextState({ week, day, devotionalDataId, devotionalNumberId });
  };

  return (
    <DevotionalContext.Provider value={{ ...context, setContext }}>
=======
  
  const [refreshNotesVersion, setRefreshNotesVersion] = useState(0);

  const setContext = useCallback((week, day, devotionalDataId, devotionalNumberId) => {
    setContextState({ week, day, devotionalDataId, devotionalNumberId });
  }, []);

  const triggerNoteRefresh = useCallback(() => {
    setRefreshNotesVersion(v => v + 1);
  }, []);

  return (
    <DevotionalContext.Provider value={{ ...context, refreshNotesVersion, setContext, triggerNoteRefresh }}>
>>>>>>> a469c3c221f469a63598086c4907ef57ad7919fc
      {children}
    </DevotionalContext.Provider>
  );
}

export function useDevotionalContext() {
  return useContext(DevotionalContext);
<<<<<<< HEAD
}
=======
}
>>>>>>> a469c3c221f469a63598086c4907ef57ad7919fc
