import React, { useState, useEffect } from 'react';
import { ViewState, User, DocType, GeneratedContent, GenerationConfig } from './types';
import { backend } from './services/mockBackend';
import { generateDocument } from './services/geminiService';

// Components
import { Splash } from './components/Splash';
import { Landing } from './components/Landing';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Clipboard } from './components/Clipboard';
import { UserProfile } from './components/UserProfile';
import { AdminPanel } from './components/AdminPanel';
import { WosAiChat } from './components/WosAiChat';

export default function App() {
  const [view, setView] = useState<ViewState>('splash');
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [lang, setLang] = useState('en');
  const [selectedDoc, setSelectedDoc] = useState<GeneratedContent | null>(null);

  // Load Initial State and Auth Listener
  useEffect(() => {
    // Language
    const browserLang = navigator.language.startsWith('fr') ? 'fr' : 'en';
    setLang(browserLang);

    // Theme - Force Dark by default
    document.body.classList.add('dark');

    // Initialize Auth Listener
    // This handles both Firebase Auth changes AND initial local storage checks
    backend.onAuthStateChange((currentUser) => {
        if (currentUser) {
            setUser(currentUser);
            // Only switch to dashboard if we are currently in splash or landing or auth
            // This prevents redirecting if user is already deep in the app
            setView(prev => (prev === 'splash' || prev === 'landing' || prev === 'auth') ? 'dashboard' : prev);
        } else {
            setUser(null);
            // If we were expecting a user, go to landing, but give splash a moment
            setView(prev => prev === 'splash' ? 'landing' : 'auth');
        }
    });

    // Fallback for splash if auth is slow or empty
    const timer = setTimeout(() => {
        if (!user && view === 'splash') {
            setView('landing');
        }
    }, 2500);

    return () => clearTimeout(timer);
  }, []); // Run once

  const toggleTheme = () => {
      if (theme === 'light') {
          setTheme('dark');
          document.body.classList.add('dark');
      } else {
          setTheme('light');
          document.body.classList.remove('dark');
      }
  };

  const handleDocSelect = (doc: GeneratedContent) => {
      setSelectedDoc(doc);
      setView('clipboard');
  };

  // View Routing
  const renderView = () => {
    switch(view) {
        case 'splash': return <Splash />;
        case 'landing': return <Landing onGetStarted={() => setView('auth')} />;
        case 'auth': return <Auth onLogin={(u) => { setUser(u); setView('dashboard'); }} />;
        case 'dashboard': 
            return <Dashboard 
                user={user!} 
                onNavigate={setView}
                onSelectDoc={handleDocSelect}
                onLogout={async () => { await backend.logout(); setUser(null); setView('auth'); }}
                theme={theme}
                toggleTheme={toggleTheme}
            />;
        case 'clipboard': 
            return <Clipboard 
                user={user!} 
                onBack={() => {
                    setSelectedDoc(null); // Clear selection when going back
                    setView('dashboard');
                }}
                initialDoc={selectedDoc}
                onGenerate={async (config) => {
                    if (user!.generationsUsed >= user!.generationsLimit) {
                        alert("Limite atteinte ! Passez à Standard.");
                        return null;
                    }
                    const doc = await generateDocument(config, user!.name);
                    await backend.saveDocument(doc, user!.id);
                    const updatedUser = { ...user!, generationsUsed: user!.generationsUsed + 1 };
                    await backend.updateUser(updatedUser);
                    setUser(updatedUser);
                    return doc;
                }}
            />;
        case 'profile':
            return <UserProfile 
                user={user!} 
                onBack={() => setView('dashboard')}
                onNavigate={setView}
                onUpdateUser={async (u) => { await backend.updateUser(u); setUser(u); }}
                onLogout={async () => { await backend.logout(); setUser(null); setView('auth'); }}
            />;
        case 'admin':
            return <AdminPanel 
                user={user!} 
                onBack={() => setView('dashboard')} 
            />;
        case 'wos_chat':
            return <WosAiChat onBack={() => setView('dashboard')} />;
        default: return <Landing onGetStarted={() => setView('auth')} />;
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
       {renderView()}
    </div>
  );
}