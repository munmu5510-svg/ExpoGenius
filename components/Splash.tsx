import React from 'react';
import { Sparkles } from 'lucide-react';

export const Splash = () => {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 animate-fade-in">
        <div className="relative mb-6">
             <div className="w-24 h-24 rounded-full wos-gradient flex items-center justify-center shadow-lg animate-pulse">
                <span className="text-5xl font-bold text-white font-serif">W</span>
             </div>
             <div className="absolute -top-2 -right-2 bg-white dark:bg-gray-800 p-2 rounded-full shadow-md">
                <Sparkles className="w-6 h-6 text-purple-600" />
             </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 font-serif">WordPoz</h1>
        <p className="text-gray-500 dark:text-gray-400 tracking-widest uppercase text-sm">Keep Your Idea Alive</p>
    </div>
  );
};