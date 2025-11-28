import React from 'react';
import { UserSettings } from '../types';
import { FileText, Coins, Printer, Palette, Sparkles, GraduationCap, Banknote } from 'lucide-react';

interface SettingsFormProps {
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  onGenerate: () => void;
  isLoading: boolean;
}

export const SettingsForm: React.FC<SettingsFormProps> = ({
  settings,
  setSettings,
  onGenerate,
  isLoading,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle string inputs vs number inputs
    let newValue: string | number = value;
    if (['bwPrice', 'colorPrice', 'budget'].includes(name)) {
        newValue = parseFloat(value) || 0;
    }
    
    setSettings((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-2xl mx-auto mb-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
          <FileText size={24} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Paramètres de l'Exposé</h2>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sujet de l'exposé
              </label>
              <input
                type="text"
                name="topic"
                value={settings.topic}
                onChange={handleChange}
                placeholder="Ex: La Révolution Française..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <GraduationCap size={16} /> Niveau scolaire / Classe
              </label>
              <input
                type="text"
                name="educationLevel"
                value={settings.educationLevel}
                onChange={handleChange}
                placeholder="Ex: CM2, 3ème, Université..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50"
              />
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative group col-span-2 md:col-span-1">
             <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
               <Banknote size={16} /> Devise
             </label>
             <input
                type="text"
                name="currency"
                value={settings.currency}
                onChange={handleChange}
                placeholder="€, $, etc."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-center"
             />
          </div>

          <div className="relative group col-span-2 md:col-span-1">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Printer size={16} /> Prix N&B
            </label>
            <input
              type="number"
              step="0.01"
              name="bwPrice"
              value={settings.bwPrice}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
            />
          </div>

          <div className="relative group col-span-2 md:col-span-1">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Palette size={16} /> Prix Couleur
            </label>
            <input
              type="number"
              step="0.01"
              name="colorPrice"
              value={settings.colorPrice}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
            />
          </div>

          <div className="relative group col-span-2 md:col-span-1">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Coins size={16} /> Budget
            </label>
            <input
              type="number"
              step="0.10"
              name="budget"
              value={settings.budget}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-green-50 font-semibold text-green-700"
            />
          </div>
        </div>

        <button
          onClick={onGenerate}
          disabled={isLoading || !settings.topic}
          className={`w-full py-4 rounded-xl font-bold text-lg text-white flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
            isLoading || !settings.topic
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyse et Rédaction...
            </>
          ) : (
            <>
              <Sparkles size={20} />
              Générer l'Exposé Optimisé
            </>
          )}
        </button>
      </div>
    </div>
  );
};