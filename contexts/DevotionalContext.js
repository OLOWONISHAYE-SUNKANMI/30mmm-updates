"use client";

import React, { createContext, useContext, useState } from 'react';

const DevotionalContext = createContext({
  week: null,
  day: null,
  devotionalDataId: null,
  devotionalNumberId: null,
  setContext: () => {},
});

export function DevotionalProvider({ children }) {
  const [context, setContextState] = useState({ 
    week: null, 
    day: null,
    devotionalDataId: null,
    devotionalNumberId: null
  });

  const setContext = (week, day, devotionalDataId, devotionalNumberId) => {
    setContextState({ week, day, devotionalDataId, devotionalNumberId });
  };

  return (
    <DevotionalContext.Provider value={{ ...context, setContext }}>
      {children}
    </DevotionalContext.Provider>
  );
}

export function useDevotionalContext() {
  return useContext(DevotionalContext);
}
