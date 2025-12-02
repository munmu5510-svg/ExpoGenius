import React, { useState } from 'react';
import { backend } from '../services/mockBackend';
import { User } from '../types';

export const Auth = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
        if (isLogin) {
            const user = await backend.login(email, password);
            onLogin(user);
        } else {
            if(!name) return setError("Nom requis");
            const user = await backend.register(name, email, password);
            onLogin(user);
        }
    } catch (err: any) {
        setError(err.message || "Une erreur est survenue");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 dark:border-gray-700">
        <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full wos-gradient mx-auto mb-4 flex items-center justify-center text-white text-2xl font-serif font-bold">W</div>
            <h2 className="text-2xl font-bold dark:text-white">{isLogin ? 'Bon retour' : 'Créer un compte'}</h2>
            <p className="text-gray-500 text-sm">
                {backend.isFirebaseActive() ? 'Cloud Secure Auth' : 'Mode Local / Démo'}
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom complet</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Votre nom" />
                </div>
            )}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" placeholder="exemple@email.com" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mot de passe</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" placeholder="••••••••" required />
            </div>
            
            {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</p>}

            <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 rounded-lg wos-gradient text-white font-bold hover:opacity-90 transition disabled:opacity-50 flex justify-center items-center"
            >
                {loading ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span> : (isLogin ? 'Se connecter' : "S'inscrire")}
            </button>
        </form>

        <div className="mt-6 text-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-purple-600 hover:underline">
                {isLogin ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
            </button>
        </div>
      </div>
    </div>
  );
};