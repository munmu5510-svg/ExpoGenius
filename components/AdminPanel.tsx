import React, { useState } from 'react';
import { User, AdminStats } from '../types';
import { backend } from '../services/mockBackend';
import { ArrowLeft, Database, Users, DollarSign, Bell, Shield } from 'lucide-react';

export const AdminPanel = ({ user, onBack }: { user: User, onBack: () => void }) => {
  if (!user.isAdmin) return <div className="p-10 text-center">Accès refusé</div>;

  const stats = backend.getStats();
  const [notifMsg, setNotifMsg] = useState('');
  const [firebaseSDK, setFirebaseSDK] = useState('');

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
          <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-full"><ArrowLeft /></button>
              <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="text-purple-500" /> Admin WordShelter</h1>
          </div>
          <div className="text-xs text-gray-400">v1.0.0</div>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <div className="flex justify-between mb-4 text-gray-400"><Users size={20} /> Utilisateurs</div>
              <div className="text-3xl font-bold">{stats.totalUsers}</div>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <div className="flex justify-between mb-4 text-gray-400"><DollarSign size={20} /> Revenus (Simulés)</div>
              <div className="text-3xl font-bold">${stats.revenue}</div>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
               <div className="flex justify-between mb-4 text-gray-400"><Database size={20} /> Gen. Aujourd'hui</div>
              <div className="text-3xl font-bold">{stats.generationsToday}</div>
          </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h3 className="font-bold mb-4 flex items-center gap-2"><Bell size={18} /> Envoyer Notification</h3>
              <input 
                value={notifMsg}
                onChange={e => setNotifMsg(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded p-2 mb-2 text-white" 
                placeholder="Message à tous les utilisateurs..." 
              />
              <button 
                onClick={() => { backend.sendNotification(notifMsg); setNotifMsg(''); alert('Envoyé'); }}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 rounded font-bold"
              >
                  Envoyer
              </button>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h3 className="font-bold mb-4 flex items-center gap-2"><Database size={18} /> Configuration Firebase</h3>
              <textarea 
                value={firebaseSDK}
                onChange={e => setFirebaseSDK(e.target.value)}
                className="w-full h-32 bg-gray-700 border border-gray-600 rounded p-2 mb-2 text-xs font-mono text-white" 
                placeholder="{ apiKey: '...', ... }" 
              />
              <button 
                onClick={() => { backend.saveFirebaseSDK(firebaseSDK); alert('Sauvegardé'); }}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded font-bold"
              >
                  Enregistrer SDK
              </button>
          </div>
      </div>
    </div>
  );
};
