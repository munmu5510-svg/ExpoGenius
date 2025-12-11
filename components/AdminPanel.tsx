import React, { useState } from 'react';
import { User } from '../types';
import { backend } from '../services/mockBackend';
import { ArrowLeft, Database, Users, DollarSign, Bell, Shield, CheckCircle } from 'lucide-react';

export const AdminPanel = ({ user, onBack }: { user: User, onBack: () => void }) => {
  if (!user.isAdmin) return <div className="p-10 text-center">Accès refusé</div>;

  const stats = backend.getStats();
  const [notifMsg, setNotifMsg] = useState('');
  const isFirebaseActive = backend.isFirebaseActive();

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
          <div className="text-xs text-gray-500 font-mono bg-gray-800 px-3 py-1 rounded-full">v1.3.0-cloud</div>
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

      <div className="grid md:grid-cols-1 gap-8">
          {/* Notification System */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-lg"><Bell className="text-yellow-500" size={20} /> Diffuser une Notification</h3>
              <p className="text-sm text-gray-400 mb-4">Envoyez un message qui apparaîtra sur le tableau de bord de tous les utilisateurs (via Firebase Realtime Database).</p>
              <div className="space-y-3">
                <input 
                    value={notifMsg}
                    onChange={e => setNotifMsg(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all" 
                    placeholder="Message système (ex: Maintenance prévue...)" 
                />
                <button 
                    onClick={() => { backend.sendNotification(notifMsg); setNotifMsg(''); alert('Notification diffusée'); }}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg font-bold transition-all shadow-lg active:scale-95"
                >
                    Envoyer à tous
                </button>
              </div>
          </div>
      </div>
    </div>
  );
};