
import React, { useState, useEffect, useRef } from 'react';
import { User, PromoCode, GeneratedContent, ViewState, PlanType } from '../types';
import { backend } from '../services/mockBackend';
import { ArrowLeft, User as UserIcon, CreditCard, Gift, LogOut, Check, Share2, FileText, Shield, Key, ExternalLink, Save, Camera, Plus, CheckCircle2 } from 'lucide-react';
import { translations } from '../locales';

interface UserProfileProps {
  user: User;
  onBack: () => void;
  onNavigate: (view: ViewState) => void;
  onUpdateUser: (u: User) => void;
  onLogout: () => void;
  lang: 'en' | 'fr' | 'es';
}

export const UserProfile = ({ user, onBack, onNavigate, onUpdateUser, onLogout, lang }: UserProfileProps) => {
  const t = translations[lang].profile;
  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [selectedShareIds, setSelectedShareIds] = useState<string[]>([]);
  const [userDocs, setUserDocs] = useState<GeneratedContent[]>([]);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  const [userApiKey, setUserApiKey] = useState(user.customApiKey || '');
  const [isSavingKey, setIsSavingKey] = useState(false);

  useEffect(() => {
      const load = async () => {
          const docs = await backend.getUserDocuments(user.id);
          setUserDocs(docs);
      };
      load();
  }, [user.id]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = async (ev) => {
              if (ev.target?.result) {
                  const updatedUser = { ...user, avatar: ev.target.result as string };
                  await backend.updateUser(updatedUser);
                  onUpdateUser(updatedUser);
              }
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  const handleSaveApiKey = async () => {
      setIsSavingKey(true);
      const updatedUser = { ...user, customApiKey: userApiKey };
      await backend.updateUser(updatedUser);
      onUpdateUser(updatedUser);
      setIsSavingKey(false);
      alert(lang === 'es' ? "Configuración guardada" : "Configuration saved");
  };

  const handlePromo = () => {
      const res = backend.applyPromo(promoCode, user);
      setPromoMessage(res.message);
      if(res.success && res.user) onUpdateUser(res.user);
  };

  const toggleShareDoc = (id: string) => {
      if (selectedShareIds.includes(id)) {
          setSelectedShareIds(selectedShareIds.filter(i => i !== id));
      } else {
          setSelectedShareIds([...selectedShareIds, id]);
      }
  };

  const handleShare = async () => {
      if (selectedShareIds.length === 0) return;
      
      const docsToShare = userDocs.filter(d => selectedShareIds.includes(d.id || d.createdAt.toString()));
      const shareTitle = docsToShare.length === 1 ? docsToShare[0].title : `${docsToShare.length} Documents from WyRunner`;
      const shareText = docsToShare.map(d => `"${d.title}": ${d.content.introduction?.substring(0, 50)}...`).join('\n\n');
      const shareUrl = window.location.origin;

      try {
          if (navigator.share) {
              await navigator.share({
                  title: shareTitle,
                  text: shareText,
                  url: shareUrl
              });
          } else {
              await navigator.clipboard.writeText(`${shareTitle}\n\n${shareText}\n\nLink: ${shareUrl}`);
              alert(t.sharedSuccess);
          }
      } catch (err) {
          console.error("Error sharing", err);
      }
  };

  const plans = [
      { id: 'freemium', name: 'Freemium', price: 'Gratis', features: ['6 generaciones gratis', 'Acceso al estudio', 'Plantillas comunitarias'] },
      { id: 'starter', name: 'Starter', price: '200 FCFA/día', features: ['Generaciones ilimitadas', 'Exportar PDF', 'Soporte prioritario'], popular: true },
      { id: 'pro_authority', name: 'Pro Authority', price: '500 FCFA/7 días', features: ['Todo en Starter', 'Exportar PDF y PPT', 'Soporte VIP'] }
  ];

  const handleSubscriptionClick = (planName: string) => {
      const message = `Para activar el plan ${planName}, por favor realiza una transferencia de crédito al número: +240 555 320 354.`;
      if (confirm(message)) window.location.href = `tel:+240555320354`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-purple-600 transition">
            <ArrowLeft size={20} /> {t.back}
        </button>

        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm text-center relative group">
                    <div 
                      onClick={() => avatarInputRef.current?.click()}
                      className="w-24 h-24 mx-auto rounded-full wos-gradient flex items-center justify-center text-white text-4xl font-bold mb-4 cursor-pointer overflow-hidden relative"
                    >
                        {user.avatar ? (
                          <img src={user.avatar} className="w-full h-full object-cover" />
                        ) : (
                          user.name.charAt(0)
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera size={24} className="text-white" />
                        </div>
                    </div>
                    <input 
                      type="file" 
                      ref={avatarInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleAvatarChange} 
                    />
                    <h2 className="font-bold text-xl">{user.name}</h2>
                    <p className="text-sm text-gray-500 mb-4">{user.email}</p>
                    <button onClick={onLogout} className="text-red-500 text-sm flex items-center justify-center gap-2 w-full p-2 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg"><LogOut size={16} /> {t.logout}</button>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border-t-4 border-purple-500">
                    <h3 className="font-bold mb-2 flex items-center gap-2"><Key size={18} className="text-purple-500" /> {t.apiKey}</h3>
                    <p className="text-[10px] text-gray-500 mb-4">Usa tu propia clave de Google AI Studio para mayor autonomía.</p>
                    <div className="space-y-3">
                        <input 
                            type="password"
                            value={userApiKey}
                            onChange={e => setUserApiKey(e.target.value)}
                            placeholder="Introducir clave API..."
                            className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 text-xs font-mono"
                        />
                        <button 
                            onClick={handleSaveApiKey}
                            disabled={isSavingKey}
                            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold flex items-center justify-center gap-2"
                        >
                            {isSavingKey ? 'Guardando...' : <><Save size={14} /> {t.saveKey}</>}
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><Share2 size={18} /> {t.share}</h3>
                    <div className="space-y-2 mb-4 max-h-48 overflow-y-auto custom-scrollbar">
                        {userDocs.length === 0 && <p className="text-xs text-gray-400">{t.noDocsToShare}</p>}
                        {userDocs.map(doc => {
                            const docId = doc.id || doc.createdAt.toString();
                            const isSelected = selectedShareIds.includes(docId);
                            return (
                                <div 
                                  key={docId} 
                                  onClick={() => toggleShareDoc(docId)} 
                                  className={`p-3 rounded-lg cursor-pointer text-sm flex items-center justify-between border transition ${isSelected ? 'bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-900/40' : 'hover:bg-gray-50 border-transparent dark:hover:bg-gray-700'}`}
                                >
                                    <div className="flex items-center gap-3 truncate">
                                      <FileText size={16} className={isSelected ? 'text-purple-500' : 'text-gray-400'} />
                                      <span className="truncate font-medium">{doc.title}</span>
                                    </div>
                                    {isSelected && <CheckCircle2 size={16} className="text-purple-500 shrink-0" />}
                                </div>
                            );
                        })}
                    </div>
                    <button 
                      onClick={handleShare} 
                      disabled={selectedShareIds.length === 0} 
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                    >
                        <Share2 size={16} /> {t.share} ({selectedShareIds.length})
                    </button>
                </div>
            </div>

            <div className="md:col-span-2 space-y-8">
                <div>
                    <h2 className="text-2xl font-bold mb-6">{t.plans}</h2>
                    <div className="grid md:grid-cols-1 gap-4">
                        {plans.map(p => (
                            <div key={p.id} className={`p-6 rounded-2xl border ${user.plan === p.id ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
                                <h3 className="font-bold">{p.name}</h3>
                                <div className="text-2xl font-bold my-2 wos-text-gradient">{p.price}</div>
                                <ul className="text-sm space-y-2 mb-4 text-gray-500 dark:text-gray-400">
                                    {p.features.map((f, i) => <li key={i} className="flex gap-2"><Check size={14} className="text-green-500 shrink-0" /> {f}</li>)}
                                </ul>
                                <button onClick={() => handleSubscriptionClick(p.name)} disabled={user.plan === p.id} className="w-full py-2 border border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white transition rounded font-bold text-sm">
                                    {user.plan === p.id ? 'Plan Actual' : 'Suscribirse'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                {/* feedback... */}
            </div>
        </div>
      </div>
    </div>
  );
};
