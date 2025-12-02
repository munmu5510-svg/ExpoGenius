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
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lang, setLang] = useState('en');
  const [selectedDoc, setSelectedDoc] = useState<GeneratedContent | null>(null);

  // Load Initial State
  useEffect(() => {
    // Language
    const browserLang = navigator.language.startsWith('fr') ? 'fr' : 'en';
    setLang(browserLang);

    // Theme
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
        document.body.classList.add('dark');
    }

    // Splash Timer
    setTimeout(() => {
        const currentUser = backend.getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
            setView('dashboard');
        } else {
            setView('landing');
        }
    }, 2500);
  }, []);

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
                onLogout={() => { backend.logout(); setUser(null); setView('auth'); }}
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
                    backend.saveDocument(doc, user!.id);
                    const updatedUser = { ...user!, generationsUsed: user!.generationsUsed + 1 };
                    backend.updateUser(updatedUser);
                    setUser(updatedUser);
                    return doc;
                }}
            />;
        case 'profile':
            return <UserProfile 
                user={user!} 
                onBack={() => setView('dashboard')}
                onUpdateUser={(u) => { backend.updateUser(u); setUser(u); }}
                onLogout={() => { backend.logout(); setUser(null); setView('auth'); }}
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
