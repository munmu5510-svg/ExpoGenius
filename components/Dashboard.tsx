import React, { useState, useEffect, useRef } from 'react';
import { User, ViewState, GeneratedContent, Notification } from '../types';
import { Sparkles, Bell, User as UserIcon, LogOut, Sun, Moon, Search, Plus, List, Trash2, Edit2, Share2, MoreVertical, X, CheckSquare, Loader, Inbox } from 'lucide-react';
import { backend } from '../services/mockBackend';

interface DashboardProps {
  user: User;
  onNavigate: (view: ViewState) => void;
  onSelectDoc: (doc: GeneratedContent) => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

type SelectionMode = 'none' | 'delete' | 'edit' | 'template';

export const Dashboard = ({ user, onNavigate, onSelectDoc, onLogout, theme, toggleTheme }: DashboardProps) => {
  const [docs, setDocs] = useState<GeneratedContent[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('none');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Refs for click outside
  const notifRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Load Docs on Mount
  useEffect(() => {
      const loadData = async () => {
          setIsLoadingDocs(true);
          try {
              const d = await backend.getUserDocuments(user.id);
              setDocs(d);
              setNotifications(backend.getNotifications());
          } catch(e) {
              console.error(e);
          } finally {
              setIsLoadingDocs(false);
          }
      };
      loadData();
      
      // Periodic check for notifications
      const interval = setInterval(() => {
           setNotifications(backend.getNotifications());
      }, 5000);

      const handleClickOutside = (event: MouseEvent) => {
        if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
            setShowNotifPanel(false);
        }
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setIsMenuOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
          clearInterval(interval);
          document.removeEventListener('mousedown', handleClickOutside);
      };
  }, [user.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = (id: string) => {
      backend.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? {...n, read: true} : n));
  };

  const handleAction = (mode: SelectionMode) => {
      setSelectionMode(mode);
      setIsMenuOpen(false);
      setSelectedIds([]);
  };

  const toggleSelection = (id: string) => {
      if (selectedIds.includes(id)) {
          setSelectedIds(selectedIds.filter(i => i !== id));
      } else {
          // If edit mode, only allow 1 selection
          if (selectionMode === 'edit') {
              setSelectedIds([id]);
          } else {
              setSelectedIds([...selectedIds, id]);
          }
      }
  };

  const executeAction = async () => {
      if (selectedIds.length === 0) return;
      setActionLoading(true);

      try {
        if (selectionMode === 'delete') {
            if (confirm(`Supprimer ${selectedIds.length} document(s) ?`)) {
                await backend.deleteDocuments(selectedIds);
                setDocs(await backend.getUserDocuments(user.id)); // Reload
                setSelectionMode('none');
                setSelectedIds([]);
            }
        } else if (selectionMode === 'edit') {
            const doc = docs.find((d: any) => (d.id || d.createdAt.toString()) === selectedIds[0]);
            if (doc) {
                const newTitle = prompt("Nouveau titre :", doc.title);
                if (newTitle) {
                    await backend.updateDocumentTitle(selectedIds[0], newTitle);
                    setDocs(await backend.getUserDocuments(user.id));
                }
                setSelectionMode('none');
                setSelectedIds([]);
            }
        } else if (selectionMode === 'template') {
            // Mock Share
            alert(`${selectedIds.length} document(s) partagé(s) comme template(s) !`);
            setSelectionMode('none');
            setSelectedIds([]);
        }
      } catch (e) {
          alert("Erreur lors de l'action");
      } finally {
          setActionLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors relative">
      {/* Top Bar */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full wos-gradient flex items-center justify-center text-white font-serif font-bold">W</div>
            <span className="font-bold text-lg hidden md:block">WordPoz</span>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 rounded-full text-xs font-semibold uppercase whitespace-nowrap">
                {user.plan === 'standard' ? 'STD' : user.plan === 'pro_plus' ? 'PRO+' : 'FREE'}
            </div>
            
            <button onClick={toggleTheme} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
                <button 
                    onClick={() => setShowNotifPanel(!showNotifPanel)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full relative"
                >
                    <Bell size={20} className="text-gray-600 dark:text-gray-300" />
                    {unreadCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>}
                </button>

                {showNotifPanel && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border dark:border-gray-700 z-50 overflow-hidden animate-fade-in origin-top-right">
                        <div className="p-3 border-b dark:border-gray-700 font-bold flex justify-between items-center">
                            <span>Notifications</span>
                            <span className="text-xs text-gray-400">{unreadCount} non lues</span>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 flex flex-col items-center">
                                    <Inbox size={32} className="mb-2 opacity-50" />
                                    <p className="text-sm">Rien à signaler</p>
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <div 
                                        key={notif.id} 
                                        onClick={() => handleMarkRead(notif.id)}
                                        className={`p-4 border-b dark:border-gray-700 cursor-pointer transition-colors ${notif.read ? 'bg-white dark:bg-gray-800 opacity-70' : 'bg-purple-50 dark:bg-purple-900/20'}`}
                                    >
                                        <p className="text-sm text-gray-800 dark:text-gray-200 mb-1">{notif.message}</p>
                                        <span className="text-xs text-gray-400 block text-right">{new Date(notif.date).toLocaleDateString()}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            <button onClick={() => onNavigate('profile')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                <UserIcon size={20} />
            </button>
            <button onClick={onLogout} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-full">
                <LogOut size={20} />
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Rechercher une production..." 
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
                />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto relative justify-end">
                {/* Menu Action Button */}
                <div className="relative" ref={menuRef}>
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`p-2 h-full aspect-square flex items-center justify-center bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg ${selectionMode !== 'none' ? 'ring-2 ring-purple-500' : ''}`}
                    >
                        <List size={20} />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border dark:border-gray-700 z-50 overflow-hidden animate-fade-in origin-top-right">
                            <button onClick={() => handleAction('delete')} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-red-500">
                                <Trash2 size={16} /> Supprimer
                            </button>
                            <button onClick={() => handleAction('edit')} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                                <Edit2 size={16} /> Modifier (Renommer)
                            </button>
                            <button onClick={() => handleAction('template')} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-blue-500">
                                <Share2 size={16} /> Envoyer comme Template
                            </button>
                        </div>
                    )}
                </div>

                <button 
                    onClick={() => onNavigate('clipboard')}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 wos-gradient text-white rounded-lg font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all whitespace-nowrap"
                >
                    <Plus size={20} />
                    Nouveau
                </button>
            </div>
        </div>

        {/* Selection Mode Banner */}
        {selectionMode !== 'none' && (
            <div className="mb-6 p-4 bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-xl flex justify-between items-center animate-pulse">
                <div className="flex items-center gap-2 font-bold text-purple-800 dark:text-purple-200 text-sm md:text-base">
                    <CheckSquare size={20} />
                    {selectionMode === 'delete' ? 'Sélectionner pour Supprimer' : selectionMode === 'edit' ? 'Choisir pour Modifier' : 'Sélectionner pour Template'}
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setSelectionMode('none')} className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full"><X size={20} /></button>
                </div>
            </div>
        )}

        {/* Grid */}
        {isLoadingDocs ? (
             <div className="flex justify-center items-center py-20">
                 <Loader className="animate-spin text-purple-600" size={40} />
             </div>
        ) : docs.length === 0 ? (
            <div className="text-center py-20 opacity-50">
                <div className="mx-auto w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <List size={32} />
                </div>
                <p>Aucune production pour le moment.</p>
                <p className="text-sm">Cliquez sur Nouveau pour commencer.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {docs.map((doc: any, i: number) => {
                    const docId = doc.id || doc.createdAt.toString();
                    const isSelected = selectedIds.includes(docId);

                    return (
                        <div 
                            key={i} 
                            onClick={() => {
                                if (selectionMode !== 'none') {
                                    toggleSelection(docId);
                                } else {
                                    onSelectDoc(doc);
                                }
                            }}
                            className={`
                                bg-white dark:bg-gray-800 p-6 rounded-2xl border shadow-sm transition-all cursor-pointer relative
                                ${isSelected ? 'border-purple-500 ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-purple-200 dark:hover:border-purple-800'}
                            `}
                        >
                            {selectionMode !== 'none' && (
                                <div className={`absolute top-4 right-4 w-6 h-6 rounded border flex items-center justify-center ${isSelected ? 'bg-purple-500 border-purple-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                                    {isSelected && <CheckSquare size={16} />}
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                    doc.type === 'expose' ? 'bg-blue-100 text-blue-600' : 
                                    doc.type === 'dissertation' ? 'bg-orange-100 text-orange-600' : 
                                    doc.type === 'these' ? 'bg-indigo-100 text-indigo-600' :
                                    'bg-green-100 text-green-600'
                                }`}>
                                    {doc.type}
                                </span>
                                <span className="text-xs text-gray-400">{new Date(doc.createdAt).toLocaleDateString()}</span>
                            </div>
                            <h3 className="font-bold text-lg mb-2 line-clamp-2">{doc.title}</h3>
                            <p className="text-sm text-gray-500 line-clamp-3 mb-4">
                                {doc.content.introduction?.substring(0, 100)}...
                            </p>
                        </div>
                    );
                })}
            </div>
        )}

        {/* Action Confirm FAB */}
        {selectionMode !== 'none' && selectedIds.length > 0 && (
            <div className="fixed bottom-24 right-6 z-40 animate-bounce">
                <button 
                    onClick={executeAction}
                    disabled={actionLoading}
                    className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-full shadow-2xl font-bold flex items-center gap-2"
                >
                    {actionLoading ? <Loader className="animate-spin" size={18} /> : (selectionMode === 'delete' ? <Trash2 size={18} /> : selectionMode === 'edit' ? <Edit2 size={18} /> : <Share2 size={18} />)}
                    Confirmer ({selectedIds.length})
                </button>
            </div>
        )}
      </main>

      {/* AI Assistant FAB - Z-Index augmenté et position mobile ajustée pour être toujours accessible */}
      <div className="fixed bottom-20 md:bottom-6 right-6 z-[100]">
             <button 
                onClick={() => onNavigate('wos_chat')}
                className="w-14 h-14 rounded-full bg-black dark:bg-white text-white dark:text-black shadow-2xl flex items-center justify-center hover:scale-110 transition-transform ring-4 ring-white dark:ring-gray-800"
             >
                 <Sparkles size={24} />
             </button>
        </div>
    </div>
  );
};