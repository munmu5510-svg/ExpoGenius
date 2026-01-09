import React, { useState, useEffect } from 'react';
import { User, PromoCode, GeneratedContent, ViewState, PlanType } from '../types';
import { backend } from '../services/mockBackend';
import { ArrowLeft, User as UserIcon, CreditCard, Gift, LogOut, Check, Share2, FileText, Shield } from 'lucide-react';

interface UserProfileProps {
  user: User;
  onBack: () => void;
  onNavigate: (view: ViewState) => void;
  onUpdateUser: (u: User) => void;
  onLogout: () => void;
}

export const UserProfile = ({ user, onBack, onNavigate, onUpdateUser, onLogout }: UserProfileProps) => {
  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [selectedShareDoc, setSelectedShareDoc] = useState<GeneratedContent | null>(null);
  const [userDocs, setUserDocs] = useState<GeneratedContent[]>([]);

  useEffect(() => {
      const load = async () => {
          const docs = await backend.getUserDocuments(user.id);
          setUserDocs(docs);
      };
      load();
  }, [user.id]);

  const handlePromo = () => {
      const res = backend.applyPromo(promoCode, user);
      setPromoMessage(res.message);
      if(res.success && res.user) onUpdateUser(res.user);
  };

  const handleShare = async () => {
      if (!selectedShareDoc) return;
      
      const shareData = {
          title: selectedShareDoc.title,
          text: `Descubre mi documento "${selectedShareDoc.title}" generado con WyRunner.\n\n${selectedShareDoc.content.introduction?.substring(0, 100)}...`,
          url: window.location.href 
      };

      try {
          if (navigator.share) {
              await navigator.share(shareData);
          } else {
              throw new Error("Uso compartido nativo no compatible");
          }
      } catch (err) {
          try {
              const textToCopy = `${shareData.title}\n${shareData.text}\nEnlace: ${shareData.url}`;
              await navigator.clipboard.writeText(textToCopy);
              alert("¡Enlace y descripción copiados al portapapeles!");
          } catch (copyErr) {
              alert("No se pudo compartir o copiar. Por favor, copie manualmente.");
          }
      }
  };

  const plans = [
      { id: 'freemium', name: 'Freemium', price: 'Gratis', features: ['6 generaciones gratis', 'Acceso al estudio', 'Plantillas comunitarias'] },
      { id: 'starter', name: 'Starter', price: '200 FCFA/día', features: ['Generaciones ilimitadas', 'Exportar PDF', 'Soporte prioritario'], popular: true },
      { id: 'pro_authority', name: 'Pro Authority', price: '500 FCFA/7 días', features: ['Todo en Starter', 'Exportar PDF y PPT', 'Soporte VIP'] }
  ];

  const handleSubscriptionClick = (planName: string) => {
      const paymentNumber = "+240555320354"; 
      const displayNumber = "+240 555 320 354";
      const message = `Para activar el plan ${planName}, por favor realiza una transferencia de crédito al número: ${displayNumber}.\n\nUna vez hecho, el servicio al cliente activará tu cuenta.\n\n¿Quieres abrir la aplicación de teléfono?`;
      
      if (confirm(message)) {
          window.location.href = `tel:${paymentNumber}`;
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-purple-600 transition">
            <ArrowLeft size={20} /> Volver al Dashboard
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
                        <LogOut size={16} /> Cerrar Sesión
                    </button>
                </div>

                {/* Share Section */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><Share2 size={18} /> Compartir</h3>
                    <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                        {userDocs.length === 0 && <p className="text-xs text-gray-400">Ningún documento para compartir.</p>}
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
                        <Share2 size={14} /> Compartir
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><Gift size={18} /> Código Promocional</h3>
                    <div className="flex gap-2">
                        <input 
                            value={promoCode}
                            onChange={e => setPromoCode(e.target.value)}
                            placeholder="Ej: wyr-start"
                            className="flex-1 p-2 rounded border dark:bg-gray-700 dark:border-gray-600 text-sm"
                        />
                        <button onClick={handlePromo} className="px-3 bg-purple-600 text-white rounded text-sm">OK</button>
                    </div>
                    {promoMessage && <p className="text-xs mt-2 text-green-500">{promoMessage}</p>}
                </div>

                {user.isAdmin && (
                    <div className="bg-purple-100 dark:bg-purple-900 p-4 rounded-xl text-center">
                        <p className="font-bold text-purple-700 dark:text-purple-200 mb-2">Modo Admin Activo</p>
                        <button 
                            onClick={() => onNavigate('admin')}
                            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-bold flex items-center justify-center gap-2"
                        >
                            <Shield size={16} /> Acceder al Panel
                        </button>
                    </div>
                )}
            </div>

            {/* Plans */}
            <div className="md:col-span-2 space-y-8">
                <div>
                    <h2 className="text-2xl font-bold mb-6">Tu Plan</h2>
                    <div className="grid md:grid-cols-1 gap-4">
                        {plans.map(p => (
                            <div key={p.id} className={`p-6 rounded-2xl border ${user.plan === p.id ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
                                <h3 className="font-bold">{p.name}</h3>
                                <div className="text-2xl font-bold my-2 wos-text-gradient">{p.price}</div>
                                <ul className="text-sm space-y-2 mb-4 text-gray-500 dark:text-gray-400">
                                    {p.features.map((f, i) => <li key={i} className="flex gap-2"><Check size={14} className="text-green-500 shrink-0" /> {f}</li>)}
                                </ul>
                                {user.plan === p.id ? (
                                    <button disabled className="w-full py-2 bg-gray-200 text-gray-500 rounded font-bold text-sm">Plan Actual</button>
                                ) : (
                                    <button 
                                        onClick={() => handleSubscriptionClick(p.name)}
                                        className="w-full py-2 border border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white transition rounded font-bold text-sm"
                                    >
                                        Suscribirse
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Feedback */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
                    <h3 className="font-bold mb-4">Feedback</h3>
                    <textarea className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 h-24 mb-2" placeholder="Cuéntanos lo que piensas..."></textarea>
                    <button onClick={() => alert("¡Gracias por tus comentarios!")} className="px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg text-sm">Enviar al equipo de WyRunner</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};