
import React from 'react';
import { ArrowRight, CheckCircle, Users, FileText, BarChart, Sparkles, DollarSign, Quote, Languages } from 'lucide-react';
import { translations } from '../locales';

export const Landing = ({ onGetStarted, lang, onSetLang }: { onGetStarted: () => void, lang: 'en' | 'fr' | 'es', onSetLang: (l: 'en' | 'fr' | 'es') => void }) => {
  const t = translations[lang].landing;

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <nav className="p-4 flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full wos-gradient flex items-center justify-center text-white font-serif font-bold">W</div>
              <span className="font-serif font-bold text-xl">WyRunner</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">
              <a href="#features" className="hover:text-purple-600 transition">{t.features}</a>
              <a href="#pricing" className="hover:text-purple-600 transition">{t.pricing}</a>
              <a href="#" className="hover:text-purple-600 transition">{t.templates}</a>
          </div>
          <div className="flex items-center gap-4">
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-full border dark:border-gray-700">
                  <button onClick={() => onSetLang('en')} className={`px-2 py-1 rounded-full text-xs font-bold transition ${lang === 'en' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:bg-gray-200'}`}>EN</button>
                  <button onClick={() => onSetLang('fr')} className={`px-2 py-1 rounded-full text-xs font-bold transition ${lang === 'fr' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:bg-gray-200'}`}>FR</button>
                  <button onClick={() => onSetLang('es')} className={`px-2 py-1 rounded-full text-xs font-bold transition ${lang === 'es' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:bg-gray-200'}`}>ES</button>
              </div>
              <button onClick={onGetStarted} className="px-5 py-2 rounded-full border border-gray-300 dark:border-gray-700 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                  {t.login}
              </button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-6 py-16 md:py-24 text-center">
        <div className="inline-block px-3 py-1 text-xs font-semibold tracking-wider text-purple-700 bg-purple-100 rounded-full mb-4">
          Powered by AI
        </div>
        <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">
            {t.heroTitle}<br/><span className="wos-text-gradient">{t.heroGradient}</span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
            {t.heroSub}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
                onClick={onGetStarted}
                className="group relative inline-flex items-center justify-center px-8 py-3 text-base font-bold text-white transition-all duration-200 wos-gradient rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 hover:shadow-lg hover:scale-105"
            >
                {t.getStarted}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <a href="#pricing" className="inline-flex items-center justify-center px-8 py-3 text-base font-bold rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                {t.viewPricing}
            </a>
        </div>
        {/* ... stats ... */}
      </main>
      {/* ... rest of components ... */}
    </div>
  );
};
