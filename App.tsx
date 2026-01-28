
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
import { RunnaAiChat } from './components/WosAiChat';

export default function App() {
  const [view, setView] = useState<ViewState>('splash');
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [selectedDoc, setSelectedDoc] = useState<GeneratedContent | null>(null);
  const [lang, setLang] = useState<'en' | 'fr' | 'es'>('es');

  useEffect(() => {
    document.body.classList.add('dark');
    backend.onAuthStateChange((currentUser) => {
        if (currentUser) {
            setUser(currentUser);
            setView(prev => (prev === 'splash' || prev === 'landing' || prev === 'auth') ? 'dashboard' : prev);
        } else {
            setUser(null);
            setView(prev => prev === 'splash' ? 'landing' : 'auth');
        }
    });
    const timer = setTimeout(() => { if (!user && view === 'splash') setView('landing'); }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
      if (theme === 'light') { setTheme('dark'); document.body.classList.add('dark'); }
      else { setTheme('light'); document.body.classList.remove('dark'); }
  };

  const handleDocSelect = (doc: GeneratedContent) => { setSelectedDoc(doc); setView('clipboard'); };

  const renderView = () => {
    switch(view) {
        case 'splash': return <Splash />;
        case 'landing': return <Landing lang={lang} onSetLang={setLang} onGetStarted={() => setView('auth')} />;
        case 'auth': return <Auth lang={lang} onLogin={(u) => { setUser(u); setView('dashboard'); }} />;
        case 'dashboard': 
            return <Dashboard lang={lang} user={user!} onNavigate={setView} onSelectDoc={handleDocSelect} onLogout={async () => { await backend.logout(); setUser(null); setView('auth'); }} theme={theme} toggleTheme={toggleTheme} />;
        case 'clipboard': 
            return <Clipboard 
                lang={lang}
                user={user!} 
                onBack={() => { setSelectedDoc(null); setView('dashboard'); }} 
                initialDoc={selectedDoc}
                onGenerate={async (config) => {
                    if (user!.generationsUsed >= user!.generationsLimit && !user!.customApiKey) {
                        alert(lang === 'es' ? "Límite de generaciones alcanzado." : "Generation limit reached.");
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
            return <UserProfile lang={lang} user={user!} onBack={() => setView('dashboard')} onNavigate={setView} onUpdateUser={async (u) => { await backend.updateUser(u); setUser(u); }} onLogout={async () => { await backend.logout(); setUser(null); setView('auth'); }} />;
        case 'admin': return <AdminPanel lang={lang} user={user!} onBack={() => setView('dashboard')} />;
        case 'wos_chat': return <RunnaAiChat lang={lang} user={user!} onBack={() => setView('dashboard')} />;
        default: return <Landing lang={lang} onSetLang={setLang} onGetStarted={() => setView('auth')} />;
    }
  };

  return (<div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>{renderView()}</div>);
}
