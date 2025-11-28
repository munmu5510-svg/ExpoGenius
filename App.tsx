import React, { useState, useEffect } from 'react';
import { SettingsForm } from './components/SettingsForm';
import { ReportView } from './components/ReportView';
import { HistoryList } from './components/HistoryList';
import { ExposeContent, UserSettings, HistoryItem } from './types';
import { generateExpose } from './services/geminiService';
import { BookOpen } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<UserSettings>({
    topic: '',
    educationLevel: '',
    currency: '€',
    bwPrice: 0.10,
    colorPrice: 0.50,
    budget: 5.00,
  });

  const [content, setContent] = useState<ExposeContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history from local storage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('exposeHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history helper
  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem('exposeHistory', JSON.stringify(newHistory));
  };

  const addToHistory = (settings: UserSettings, content: ExposeContent) => {
    const newItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        settings: { ...settings }, // Copy settings
        content: content
    };
    const updatedHistory = [newItem, ...history];
    saveHistory(updatedHistory);
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setContent(null);

    try {
      const result = await generateExpose(settings);
      setContent(result);
      addToHistory(settings, result);
    } catch (err) {
      setError("Une erreur est survenue lors de la génération de l'exposé. Veuillez vérifier votre clé API ou réessayer plus tard.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
      setSettings(item.settings);
      setContent(item.content);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const updatedHistory = history.filter(item => item.id !== id);
      saveHistory(updatedHistory);
  };

  const handleClearHistory = () => {
      if(window.confirm("Voulez-vous vraiment effacer tout l'historique ?")) {
        saveHistory([]);
      }
  };

  const resetForm = () => {
    setContent(null);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 mb-8 sticky top-0 z-50 shadow-sm no-print">
        <div className="container mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={resetForm}>
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-2 rounded-lg">
                    <BookOpen size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">ExpoGenius</h1>
                    <p className="text-xs text-gray-500">Générateur d'exposé budget-friendly</p>
                </div>
            </div>
            {content && (
                 <button 
                 onClick={resetForm}
                 className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors"
               >
                 Nouvel exposé
               </button>
            )}
        </div>
      </header>

      <main className="container mx-auto px-4">
        {!content ? (
          <div className="animate-fade-in-up">
            <div className="text-center mb-10 max-w-2xl mx-auto">
                <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Créez des exposés parfaits,<br/><span className="text-blue-600">sans dépasser votre budget.</span></h2>
                <p className="text-lg text-gray-600">
                    Entrez votre sujet, votre niveau scolaire et vos coûts d'impression. Notre IA rédige le contenu et adapte la longueur pour que vous puissiez imprimer sans surprise.
                </p>
            </div>
            
            <SettingsForm 
                settings={settings} 
                setSettings={setSettings} 
                onGenerate={handleGenerate} 
                isLoading={isLoading} 
            />

            {error && (
                <div className="max-w-2xl mx-auto mt-4 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                    {error}
                </div>
            )}

            <HistoryList 
                history={history} 
                onSelect={handleSelectHistory} 
                onClear={handleClearHistory}
                onDelete={handleDeleteHistory}
            />
          </div>
        ) : (
          <ReportView content={content} settings={settings} />
        )}
      </main>
    </div>
  );
}