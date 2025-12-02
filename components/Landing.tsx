import React from 'react';
import { ArrowRight, CheckCircle, Facebook, Phone, Send } from 'lucide-react';

export const Landing = ({ onGetStarted }: { onGetStarted: () => void }) => {
  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen">
      {/* Hero */}
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full wos-gradient"></div>
            <span className="font-serif font-bold text-xl">WordShelter</span>
        </div>
        <button onClick={onGetStarted} className="px-6 py-2 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            Login
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6">
            Votre plume <span className="wos-text-gradient">intelligente</span>.
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
            Générez des exposés, dissertations et argumentations de qualité professionnelle en quelques secondes. Adapté à votre budget et votre niveau.
        </p>
        <button 
            onClick={onGetStarted}
            className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 wos-gradient rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 hover:shadow-lg hover:scale-105"
        >
            Commencer Gratuitement
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </main>

      {/* Value Prop */}
      <section className="bg-gray-50 dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                    <Send size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">Rapide & Efficace</h3>
                <p className="text-gray-500">Fini le syndrome de la page blanche. Obtenez une base solide instantanément.</p>
            </div>
            <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                    <CheckCircle size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">Haute Qualité</h3>
                <p className="text-gray-500">Contenu académique pertinent, structuré et adapté à votre niveau d'étude.</p>
            </div>
            <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm">
                 <div className="w-12 h-12 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mb-4">
                    <Phone size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">Support WhatsApp</h3>
                <p className="text-gray-500">Une question ? Contactez-nous directement au +240 555 320 354.</p>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-gray-200 dark:border-gray-800">
         <div className="flex justify-center gap-6 mb-4">
             <a href="https://facebook.com/WordShelter" target="_blank" className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700">
                 <Facebook size={20} />
             </a>
             <a href="#" className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600">
                 <Phone size={20} />
             </a>
         </div>
         <p className="text-gray-500 text-sm">© 2024 WordShelter - WySlider. All rights reserved.</p>
      </footer>
    </div>
  );
};
