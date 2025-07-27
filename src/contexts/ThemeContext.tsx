
'use client';

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserById } from '@/lib/data';
import { updateUser } from '@/lib/actions/userActions';
import type { User } from '@/lib/types';

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
  fontPair: string;
  setFontPair: (fontPair: string) => void;
  isLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const ALL_THEME_CLASSES = ['light', 'dark', 'forest', 'space', 'beach', 'superhero', 'bedtime'];
const ALL_FONT_CLASSES = ['font-pair-nunito-inter', 'font-pair-poppins-lato', 'font-pair-playfair-montserrat'];

function applyPreferences(theme?: string, fontPair?: string) {
    const root = document.documentElement;

    // Apply theme
    root.classList.remove(...ALL_THEME_CLASSES);
    const themeToApply = theme || 'light';
    root.classList.add(themeToApply);
    
    // Apply font pair
    root.classList.remove(...ALL_FONT_CLASSES);
    const fontPairToApply = fontPair || 'nunito-inter';
    root.classList.add(`font-pair-${fontPairToApply}`);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState('light');
  const [fontPair, setFontPairState] = useState('nunito-inter');
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  // Apply default theme immediately to prevent FOUC
  useEffect(() => {
    applyPreferences();
  }, []);

  // Effect to load user preferences on auth change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoaded(false);
      setCurrentUser(user);
      if (user) {
        try {
          const appUser = await getUserById(user.uid);
          if (appUser) {
            const userTheme = appUser.theme || 'light';
            const userFontPair = appUser.fontPair || 'nunito-inter';
            setThemeState(userTheme);
            setFontPairState(userFontPair);
            applyPreferences(userTheme, userFontPair);
          }
        } catch (error) {
          console.error("Failed to fetch user preferences:", error);
          applyPreferences(); // Apply defaults on error
        }
      } else {
        // User logged out, reset to defaults
        setThemeState('light');
        setFontPairState('nunito-inter');
        applyPreferences();
      }
      setIsLoaded(true);
    });

    return () => unsubscribe();
  }, []);

  const setTheme = useCallback((newTheme: string) => {
    setThemeState(newTheme);
    applyPreferences(newTheme, fontPair);
    if (currentUser) {
      updateUser(currentUser.uid, { theme: newTheme });
    }
  }, [fontPair, currentUser]);

  const setFontPair = useCallback((newFontPair: string) => {
    setFontPairState(newFontPair);
    applyPreferences(theme, newFontPair);
    if (currentUser) {
      updateUser(currentUser.uid, { fontPair: newFontPair });
    }
  }, [theme, currentUser]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, fontPair, setFontPair, isLoaded }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
