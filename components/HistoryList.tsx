import React from 'react';
import { HistoryItem } from '../types';
import { Clock, Trash2, ArrowRight } from 'lucide-react';

interface HistoryListProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onSelect, onClear, onDelete }) => {
  if (history.length === 0) return null;

  return (
    <div className="max-w-2xl mx-auto mt-12 animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Clock size={20} className="text-gray-500" />
          Historique des exposés
        </h3>
        <button 
          onClick={onClear}
          className="text-xs text-red-500 hover:text-red-700 hover:underline"
        >
          Tout effacer
        </button>
      </div>
      
      <div className="grid gap-3">
        {history.map((item) => (
          <div 
            key={item.id}
            onClick={() => onSelect(item)}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
          >
            <div>
              <h4 className="font-semibold text-gray-900">{item.settings.topic}</h4>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(item.timestamp).toLocaleDateString()} • {item.settings.educationLevel || "Niveau non spécifié"}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md">
                   ~{(item.content.estimatedPages * item.settings.bwPrice).toFixed(2)} {item.settings.currency}
                </span>
                <button 
                    onClick={(e) => onDelete(item.id, e)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    title="Supprimer"
                >
                    <Trash2 size={16} />
                </button>
                <ArrowRight size={18} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};