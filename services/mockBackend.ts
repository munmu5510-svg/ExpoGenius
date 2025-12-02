import { User, Notification, PromoCode, AdminStats, GeneratedContent } from "../types";

const KEYS = {
  USERS: 'wos_users',
  CURRENT_USER: 'wos_current_user',
  DOCS: 'wos_documents',
  NOTIFS: 'wos_notifications',
  PROMOS: 'wos_promos',
  STATS: 'wos_stats',
  FIREBASE_SDK: 'wos_firebase_sdk'
};

// Initialize Mock Data
const init = () => {
  if (!localStorage.getItem(KEYS.PROMOS)) {
    localStorage.setItem(KEYS.PROMOS, JSON.stringify([
      { code: 'admin2301', type: 'admin', value: 0, active: true },
      { code: 'wos2301', type: 'generations', value: 10, active: true }
    ]));
  }
  if (!localStorage.getItem(KEYS.NOTIFS)) {
    localStorage.setItem(KEYS.NOTIFS, JSON.stringify([
        { id: '1', message: 'Bienvenue sur WordShelter !', date: Date.now(), read: false }
    ]));
  }
};
init();

export const backend = {
  register: (name: string, email: string): User => {
    const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    if (users.find((u: User) => u.email === email)) throw new Error("Email déjà utilisé");
    
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
    return newUser;
  },

  login: (email: string): User => {
    const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    // Simulating password check by just checking email for this demo
    const user = users.find((u: User) => u.email === email);
    if (!user) throw new Error("Utilisateur introuvable");
    
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    return user;
  },

  logout: () => {
    localStorage.removeItem(KEYS.CURRENT_USER);
  },

  getCurrentUser: (): User | null => {
    const u = localStorage.getItem(KEYS.CURRENT_USER);
    return u ? JSON.parse(u) : null;
  },

  updateUser: (user: User) => {
    const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    const index = users.findIndex((u: User) => u.id === user.id);
    if (index !== -1) {
        users[index] = user;
        localStorage.setItem(KEYS.USERS, JSON.stringify(users));
        localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    }
  },

  saveDocument: (doc: GeneratedContent, userId: string) => {
      const docs = JSON.parse(localStorage.getItem(KEYS.DOCS) || '[]');
      const newDoc = { ...doc, userId, id: Date.now().toString() }; // Ensure ID
      docs.push(newDoc);
      localStorage.setItem(KEYS.DOCS, JSON.stringify(docs));
      
      // Update stats
      const stats = JSON.parse(localStorage.getItem(KEYS.STATS) || '{"totalUsers":0, "revenue":0, "generationsToday":0}');
      stats.generationsToday++;
      localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
  },

  getUserDocuments: (userId: string): GeneratedContent[] => {
      const docs = JSON.parse(localStorage.getItem(KEYS.DOCS) || '[]');
      return docs.filter((d: any) => d.userId === userId).reverse();
  },

  deleteDocuments: (docIds: string[]) => {
      let docs = JSON.parse(localStorage.getItem(KEYS.DOCS) || '[]');
      // Filter out documents whose createdAt (used as ID in prev versions) or id matches
      // Compatibility with older mock data which might not have 'id' property explicitly separate from createdAt
      docs = docs.filter((d: any) => !docIds.includes(d.id || d.createdAt.toString()));
      localStorage.setItem(KEYS.DOCS, JSON.stringify(docs));
  },

  updateDocumentTitle: (docId: string, newTitle: string) => {
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
          // Mark used logic could go here
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
          revenue: stats.revenue, // Simulated revenue
          generationsToday: stats.generationsToday
      };
  },
  
  saveFirebaseSDK: (sdk: string) => {
      localStorage.setItem(KEYS.FIREBASE_SDK, sdk);
  },

  sendNotification: (message: string) => {
      const notifs = JSON.parse(localStorage.getItem(KEYS.NOTIFS) || '[]');
      notifs.unshift({ id: Date.now().toString(), message, date: Date.now(), read: false });
      localStorage.setItem(KEYS.NOTIFS, JSON.stringify(notifs));
  },
  
  getNotifications: (): Notification[] => {
      return JSON.parse(localStorage.getItem(KEYS.NOTIFS) || '[]');
  }
};
