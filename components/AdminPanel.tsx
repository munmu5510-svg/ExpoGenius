import React, { useState, useEffect } from 'react';
import { User, AdminStats } from '../types';
import { backend } from '../services/mockBackend';
import { ArrowLeft, Database, Users, DollarSign, Bell, Shield, CheckCircle, XCircle, Trash2 } from 'lucide-react';

export const AdminPanel = ({ user, onBack }: { user: User, onBack: () => void }) => {
  if (!user.isAdmin) return <div className="p-10 text-center">Accès refusé</div>;

  const stats = backend.getStats();
  const [notifMsg, setNotifMsg] = useState('');
  const [firebaseSDK, setFirebaseSDK] = useState('');
  const isFirebaseActive = backend.isFirebaseActive();

  useEffect(() => {
      const stored = localStorage.getItem('wos_firebase_sdk');
      if (stored) setFirebaseSDK(stored);
  }, []);

  const handleClearSDK = () => {
      if (confirm('Voulez-vous vraiment déconnecter Firebase et revenir au mode Local ?')) {
          localStorage.removeItem('wos_firebase_sdk');
          window.location.reload();
      }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 animate-fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 border-b border-gray-700 pb-4 gap-4">
          <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-full transition-colors"><ArrowLeft /></button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="text-purple-500" /> Admin WordPoz</h1>
                <div className="flex items-center gap-2 text-sm mt-1">
                    Statut Backend : 
                    {isFirebaseActive ? (
                        <span className="text-green-400 flex items-center gap-1 font-bold"><CheckCircle size={14} /> Firebase (Cloud)</span>
                    ) : (
                        <span className="text-orange-400 flex items-center gap-1 font-bold"><Database size={14} /> LocalStorage (Démo)</span>
                    )}
                </div>
              </div>
          </div>
          <div className="text-xs text-gray-500 font-mono bg-gray-800 px-3 py-1 rounded-full">v1.1.0-hybrid</div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 relative overflow-hidden group">
              <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Users size={64} /></div>
              <div className="flex justify-between mb-2 text-gray-400 font-medium">Utilisateurs Inscrits</div>
              <div className="text-4xl font-bold text-white">{stats.totalUsers}</div>
              <div className="text-xs text-gray-500 mt-2">Total enregistré en base</div>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 relative overflow-hidden group">
              <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign size={64} /></div>
              <div className="flex justify-between mb-2 text-gray-400 font-medium">Revenus (Simulés)</div>
              <div className="text-4xl font-bold text-green-400">${stats.revenue}</div>
              <div className="text-xs text-gray-500 mt-2">Basé sur les crédits</div>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 relative overflow-hidden group">
               <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Database size={64} /></div>
               <div className="flex justify-between mb-2 text-gray-400 font-medium">Gen. Aujourd'hui</div>
              <div className="text-4xl font-bold text-blue-400">{stats.generationsToday}</div>
              <div className="text-xs text-gray-500 mt-2">Documents créés</div>
          </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
          {/* Notification System */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-lg"><Bell className="text-yellow-500" size={20} /> Diffuser une Notification</h3>
              <p className="text-sm text-gray-400 mb-4">Envoyez un message qui apparaîtra sur le tableau de bord de tous les utilisateurs (stockage local simulation).</p>
              <div className="space-y-3">
                <input 
                    value={notifMsg}
                    onChange={e => setNotifMsg(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all" 
                    placeholder="Message système (ex: Maintenance prévue...)" 
                />
                <button 
                    onClick={() => { backend.sendNotification(notifMsg); setNotifMsg(''); alert('Notification envoyée au système local'); }}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg font-bold transition-all shadow-lg active:scale-95"
                >
                    Envoyer à tous
                </button>
              </div>
          </div>

          {/* Firebase Configuration */}
          <div className={`p-6 rounded-xl border shadow-lg transition-colors ${isFirebaseActive ? 'bg-green-900/20 border-green-800' : 'bg-gray-800 border-gray-700'}`}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold flex items-center gap-2 text-lg">
                    <Database className={isFirebaseActive ? "text-green-500" : "text-gray-400"} size={20} /> 
                    Configuration Firebase
                </h3>
                {isFirebaseActive && (
                    <span className="px-2 py-1 bg-green-900 text-green-300 text-xs rounded uppercase font-bold tracking-wider">Actif</span>
                )}
              </div>
              
              <p className="text-sm text-gray-400 mb-4">
                  Collez votre configuration SDK (<code>const firebaseConfig = ...</code>) ci-dessous. <br/>
                  <span className="text-xs italic text-gray-500">Le champ 'storageBucket' (...appspot.com) est optionnel pour cette version, mais recommandé.</span>
              </p>
              
              <textarea 
                value={firebaseSDK}
                onChange={e => setFirebaseSDK(e.target.value)}
                className={`w-full h-40 bg-gray-900 border rounded-lg p-3 mb-4 text-xs font-mono text-gray-300 focus:ring-2 outline-none resize-none ${isFirebaseActive ? 'border-green-700 focus:ring-green-500' : 'border-gray-600 focus:ring-blue-500'}`}
                placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "mon-projet.firebaseapp.com",\n  projectId: "mon-projet",\n  storageBucket: "mon-projet.appspot.com",\n  messagingSenderId: "...",\n  appId: "..."\n};`} 
              />
              
              <div className="flex gap-3">
                  <button 
                    onClick={() => { backend.saveFirebaseSDK(firebaseSDK); }}
                    className={`flex-1 py-3 rounded-lg font-bold transition-all shadow-lg active:scale-95 ${isFirebaseActive ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                  >
                      {isFirebaseActive ? 'Mettre à jour SDK' : 'Connecter Firebase'}
                  </button>
                  
                  {isFirebaseActive && (
                      <button 
                        onClick={handleClearSDK}
                        className="px-4 py-3 bg-red-900/50 text-red-400 border border-red-900 hover:bg-red-900 hover:text-white rounded-lg transition-colors"
                        title="Déconnecter et supprimer les clés"
                      >
                          <Trash2 size={20} />
                      </button>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};