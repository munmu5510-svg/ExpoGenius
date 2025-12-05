import { User, Notification, PromoCode, AdminStats, GeneratedContent } from "../types";

// NOTE: Firebase imports removed due to environment issues. 
// This service will run in pure Local Mock mode.

const KEYS = {
  USERS: 'wos_users',
  CURRENT_USER: 'wos_current_user',
  DOCS: 'wos_documents',
  NOTIFS: 'wos_notifications',
  PROMOS: 'wos_promos',
  STATS: 'wos_stats'
};

// --- INITIAL DATA (Local Fallback) ---
const initLocal = () => {
  if (!localStorage.getItem(KEYS.PROMOS)) {
    localStorage.setItem(KEYS.PROMOS, JSON.stringify([
      { code: 'admin2301', type: 'admin', value: 0, active: true },
      { code: 'wos2301', type: 'generations', value: 10, active: true }
    ]));
  }
  if (!localStorage.getItem(KEYS.NOTIFS)) {
    localStorage.setItem(KEYS.NOTIFS, JSON.stringify([
        { id: '1', message: 'Bienvenue sur WordPoz !', date: Date.now(), read: false }
    ]));
  }
};
initLocal();

// --- BACKEND SERVICE ---

export const backend = {
  isFirebaseActive: () => false,

  // Auth Listener to keep app in sync
  onAuthStateChange: (callback: (user: User | null) => void) => {
      // Local Storage check
      const u = localStorage.getItem(KEYS.CURRENT_USER);
      callback(u ? JSON.parse(u) : null);
  },

  register: async (name: string, email: string, password?: string): Promise<User> => {
    // Local Implementation
    const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    if (users.find((u: User) => u.email === email)) throw new Error("Email déjà utilisé (Local)");
    
    const newUser: User = {
      id: Date.now().toString(),
      name, 
      email, 
      plan: 'freemium', 
      generationsUsed: 0, 
      generationsLimit: 6, 
      isAdmin: false
    };
    users.push(newUser);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(newUser));
    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));
    return newUser;
  },

  login: async (email: string, password?: string): Promise<User> => {
    // Local Implementation
    const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    const user = users.find((u: User) => u.email === email);
    if (!user) throw new Error("Utilisateur introuvable (Local)");
    
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    await new Promise(r => setTimeout(r, 600));
    return user;
  },

  loginWithGoogle: async (): Promise<User> => {
      // Simulation for Google Login in Local Mode
      await new Promise(r => setTimeout(r, 1000));
      const googleUser: User = {
          id: 'google-' + Date.now(),
          name: "Google User Demo",
          email: "demo@google.com",
          plan: 'freemium',
          generationsUsed: 0,
          generationsLimit: 6,
          isAdmin: false
      };
      
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(googleUser));
      return googleUser;
  },

  logout: async () => {
    localStorage.removeItem(KEYS.CURRENT_USER);
  },

  getCurrentUser: async (): Promise<User | null> => {
     const u = localStorage.getItem(KEYS.CURRENT_USER);
     return u ? JSON.parse(u) : null;
  },

  updateUser: async (user: User) => {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    
    // Sync Local List
    const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    const index = users.findIndex((u: User) => u.id === user.id);
    if (index !== -1) {
        users[index] = user;
        localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    }
  },

  saveDocument: async (docContent: GeneratedContent, userId: string) => {
      const newDoc = { ...docContent, userId, id: Date.now().toString() };

      // Local Fallback / Cache
      const docs = JSON.parse(localStorage.getItem(KEYS.DOCS) || '[]');
      docs.push(newDoc);
      localStorage.setItem(KEYS.DOCS, JSON.stringify(docs));
      
      const stats = JSON.parse(localStorage.getItem(KEYS.STATS) || '{"totalUsers":0, "revenue":0, "generationsToday":0}');
      stats.generationsToday++;
      localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
  },

  getUserDocuments: async (userId: string): Promise<GeneratedContent[]> => {
      const docs = JSON.parse(localStorage.getItem(KEYS.DOCS) || '[]');
      return docs.filter((d: any) => d.userId === userId).reverse();
  },

  deleteDocuments: async (docIds: string[]) => {
      let docs = JSON.parse(localStorage.getItem(KEYS.DOCS) || '[]');
      docs = docs.filter((d: any) => !docIds.includes(d.id || d.createdAt.toString()));
      localStorage.setItem(KEYS.DOCS, JSON.stringify(docs));
  },

  updateDocumentTitle: async (docId: string, newTitle: string) => {
      const docs = JSON.parse(localStorage.getItem(KEYS.DOCS) || '[]');
      const index = docs.findIndex((d: any) => (d.id || d.createdAt.toString()) === docId);
      if (index !== -1) {
          docs[index].title = newTitle;
          localStorage.setItem(KEYS.DOCS, JSON.stringify(docs));
      }
  },

  applyPromo: (code: string, user: User): {success: boolean, message: string, user?: User} => {
      const promos = JSON.parse(localStorage.getItem(KEYS.PROMOS) || '[]');
      const promo = promos.find((p: PromoCode) => p.code === code && p.active);
      
      if (!promo) return { success: false, message: "Code invalide ou expiré" };
      
      if (promo.type === 'admin') {
          const updatedUser = { ...user, isAdmin: true };
          backend.updateUser(updatedUser);
          return { success: true, message: "Mode Admin activé", user: updatedUser };
      } else if (promo.type === 'generations') {
          const updatedUser = { ...user, generationsLimit: user.generationsLimit + promo.value };
          backend.updateUser(updatedUser);
          return { success: true, message: `${promo.value} générations ajoutées !`, user: updatedUser };
      }
      return { success: false, message: "Erreur inconnue" };
  },

  // Admin Methods
  getStats: (): AdminStats => {
      const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
      const stats = JSON.parse(localStorage.getItem(KEYS.STATS) || '{"totalUsers":0, "revenue":0, "generationsToday":0}');
      return {
          totalUsers: users.length,
          revenue: stats.revenue,
          generationsToday: stats.generationsToday
      };
  },
  
  saveFirebaseSDK: (sdk: string) => {
      console.warn("Firebase SDK not supported in this environment.");
  },

  sendNotification: (message: string) => {
      const notifs = JSON.parse(localStorage.getItem(KEYS.NOTIFS) || '[]');
      notifs.unshift({ id: Date.now().toString(), message, date: Date.now(), read: false });
      localStorage.setItem(KEYS.NOTIFS, JSON.stringify(notifs));
  },
  
  getNotifications: (): Notification[] => {
      return JSON.parse(localStorage.getItem(KEYS.NOTIFS) || '[]');
  },

  markNotificationRead: (notifId: string) => {
      const notifs = JSON.parse(localStorage.getItem(KEYS.NOTIFS) || '[]');
      const index = notifs.findIndex((n: Notification) => n.id === notifId);
      if (index !== -1) {
          notifs[index].read = true;
          localStorage.setItem(KEYS.NOTIFS, JSON.stringify(notifs));
      }
  }
};