import React, { useState } from 'react';
import { User, PromoCode, GeneratedContent } from '../types';
import { backend } from '../services/mockBackend';
import { ArrowLeft, User as UserIcon, CreditCard, Gift, LogOut, Check, Share2, FileText } from 'lucide-react';

interface UserProfileProps {
  user: User;
  onBack: () => void;
  onUpdateUser: (u: User) => void;
  onLogout: () => void;
}

export const UserProfile = ({ user, onBack, onUpdateUser, onLogout }: UserProfileProps) => {
  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [selectedShareDoc, setSelectedShareDoc] = useState<GeneratedContent | null>(null);
  
  const userDocs = backend.getUserDocuments(user.id);

  const handlePromo = () => {
      const res = backend.applyPromo(promoCode, user);
      setPromoMessage(res.message);
      if(res.success && res.user) onUpdateUser(res.user);
  };

  const handleShare = async () => {
      if (!selectedShareDoc) return;
      
      const shareData = {
          title: selectedShareDoc.title,
          text: `Découvrez mon document "${selectedShareDoc.title}" généré avec WordPoz.\n\n${selectedShareDoc.content.introduction?.substring(0, 100)}...`,
          url: window.location.href // Ideally a direct link to the doc if backend existed
      };

      try {
          if (navigator.share) {
              await navigator.share(shareData);
          } else {
              alert("Le partage n'est pas supporté sur cet appareil. Copiez ce texte : " + shareData.text);
          }
      } catch (err) {
          console.error("Error sharing", err);
      }
  };

  const plans = [
      { id: 'freemium', name: 'Freemium', price: 'Gratuit', features: ['6 Générations', 'Export PDF', 'Support basique'] },
      { id: 'standard', name: 'Standard', price: '$1 / gen', features: ['Générations illimitées', 'Export PDF', 'Support prioritaire'], popular: true },
      { id: 'pro_plus', name: 'Pro+', price: '$5 / pack', features: ['Tout Standard', 'Pack Complet (PDF+PPT+Speech)', 'Questions-Réponses'] }
  ];

  const handleSubscriptionClick = () => {
      window.open('https://chat.whatsapp.com/k1T86s9DT4I7Yfg55xs6rc?mode=wwt', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-purple-600 transition">
            <ArrowLeft size={20} /> Retour Dashboard
        </button>

        <div className="grid md:grid-cols-3 gap-8">
            {/* Sidebar */}
            <div className="md:col-span-1 space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm text-center">
                    <div className="w-20 h-20 mx-auto rounded-full wos-gradient flex items-center justify-center text-white text-3xl font-bold mb-4">
                        {user.name.charAt(0)}
                    </div>
                    <h2 className="font-bold text-xl">{user.name}</h2>
                    <p className="text-sm text-gray-500 mb-4">{user.email}</p>
                    <button onClick={onLogout} className="text-red-500 text-sm flex items-center justify-center gap-2 w-full p-2 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg">
                        <LogOut size={16} /> Se déconnecter
                    </button>
                </div>

                {/* Share Section */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><Share2 size={18} /> Partager</h3>
                    <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                        {userDocs.length === 0 && <p className="text-xs text-gray-400">Aucun document à partager.</p>}
                        {userDocs.map(doc => (
                            <div 
                                key={doc.createdAt}
                                onClick={() => setSelectedShareDoc(doc)}
                                className={`p-2 rounded cursor-pointer text-sm flex items-center gap-2 ${selectedShareDoc?.createdAt === doc.createdAt ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            >
                                <FileText size={14} />
                                <span className="truncate">{doc.title}</span>
                            </div>
                        ))}
                    </div>
                    <button 
                        onClick={handleShare} 
                        disabled={!selectedShareDoc}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Share2 size={14} /> Partager
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><Gift size={18} /> Code Promo</h3>
                    <div className="flex gap-2">
                        <input 
                            value={promoCode}
                            onChange={e => setPromoCode(e.target.value)}
                            placeholder="Ex: wos2301"
                            className="flex-1 p-2 rounded border dark:bg-gray-700 dark:border-gray-600 text-sm"
                        />
                        <button onClick={handlePromo} className="px-3 bg-purple-600 text-white rounded text-sm">OK</button>
                    </div>
                    {promoMessage && <p className="text-xs mt-2 text-green-500">{promoMessage}</p>}
                </div>

                {user.isAdmin && (
                    <div className="bg-purple-100 dark:bg-purple-900 p-4 rounded-xl text-center">
                        <p className="font-bold text-purple-700 dark:text-purple-200">Mode Admin Actif</p>
                        <p className="text-xs text-purple-600 dark:text-purple-300">Code: admin2301 utilisé</p>
                    </div>
                )}
            </div>

            {/* Plans */}
            <div className="md:col-span-2 space-y-8">
                <div>
                    <h2 className="text-2xl font-bold mb-6">Votre Formule</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        {plans.map(p => (
                            <div key={p.id} className={`p-6 rounded-2xl border ${user.plan === p.id ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
                                <h3 className="font-bold">{p.name}</h3>
                                <div className="text-2xl font-bold my-2 wos-text-gradient">{p.price}</div>
                                <ul className="text-sm space-y-2 mb-4 text-gray-500 dark:text-gray-400">
                                    {p.features.map((f, i) => <li key={i} className="flex gap-2"><Check size={14} className="text-green-500 shrink-0" /> {f}</li>)}
                                </ul>
                                {user.plan === p.id ? (
                                    <button disabled className="w-full py-2 bg-gray-200 text-gray-500 rounded font-bold text-sm">Actuel</button>
                                ) : (
                                    <button 
                                        onClick={handleSubscriptionClick}
                                        className="w-full py-2 border border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white transition rounded font-bold text-sm"
                                    >
                                        Souscrire
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Feedback */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
                    <h3 className="font-bold mb-4">Feedback</h3>
                    <textarea className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 h-24 mb-2" placeholder="Dites-nous ce que vous pensez..."></textarea>
                    <button onClick={() => alert("Merci pour votre retour !")} className="px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg text-sm">Envoyer à la Team WordPoz</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};