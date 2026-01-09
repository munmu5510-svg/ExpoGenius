import { User, Notification, PromoCode, AdminStats, GeneratedContent } from "../types";
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser, updateProfile, Auth } from "firebase/auth";
import { getDatabase, ref, set, get, push, remove, update, query, orderByChild, equalTo, Database } from "firebase/database";

const KEYS = {
  USERS: 'wos_users',
  CURRENT_USER: 'wos_current_user',
  DOCS: 'wos_documents',
  NOTIFS: 'wos_notifications',
  PROMOS: 'wos_promos',
  STATS: 'wos_stats'
};

// --- LOCAL STORAGE HELPERS (Fallback) ---
const localData = {
  getUsers: (): User[] => JSON.parse(localStorage.getItem(KEYS.USERS) || '[]'),
  setUsers: (users: User[]) => localStorage.setItem(KEYS.USERS, JSON.stringify(users)),
  
  getDocs: (): GeneratedContent[] => JSON.parse(localStorage.getItem(KEYS.DOCS) || '[]'),
  setDocs: (docs: GeneratedContent[]) => localStorage.setItem(KEYS.DOCS, JSON.stringify(docs)),

  getCurrentUser: (): User | null => {
      const u = localStorage.getItem(KEYS.CURRENT_USER);
      return u ? JSON.parse(u) : null;
  },
  setCurrentUser: (user: User | null) => {
      if (user) localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
      else localStorage.removeItem(KEYS.CURRENT_USER);
  }
};

// --- INITIAL DATA SETUP ---
const initLocal = () => {
  if (!localStorage.getItem(KEYS.PROMOS)) {
    localStorage.setItem(KEYS.PROMOS, JSON.stringify([
      { code: 'wyr-admin', type: 'admin', value: 0, active: true },
      { code: 'wyr-start', type: 'generations', value: 10, active: true }
    ]));
  }
  if (!localStorage.getItem(KEYS.NOTIFS)) {
    localStorage.setItem(KEYS.NOTIFS, JSON.stringify([
        { id: '1', message: '¡Bienvenido a WyRunner!', date: Date.now(), read: false }
    ]));
  }
};
initLocal();

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyD-iLIxd0kGYvnwbzbnH4ywdGqINcGu4RQ",
  authDomain: "custer-1e73a.appspot.com",
  databaseURL: "https://custer-1e73a-default-rtdb.firebaseio.com",
  projectId: "custer-1e73a",
  storageBucket: "custer-1e73a.firebasestorage.app",
  messagingSenderId: "675836965390",
  appId: "1:675836965390:web:a47f6b0268c41fbf6c425f",
  measurementId: "G-9SJGRJWMPT"
};

// --- FIREBASE SETUP ---
let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Database | null = null;

const initFirebase = () => {
    try {
        if (firebaseConfig.apiKey) {
            firebaseApp = initializeApp(firebaseConfig);
            auth = getAuth(firebaseApp);
            db = getDatabase(firebaseApp);
            console.log("🔥 Firebase Initialized");
        } else {
            console.warn("Firebase Config: Clés non configurées. Passage en mode Local.");
        }
    } catch (e) {
        console.warn("Firebase Init Error:", e);
    }
};

// Initialize immediately
initFirebase();

// --- BACKEND SERVICE ---

export const backend = {
  isFirebaseActive: () => !!firebaseApp,

  onAuthStateChange: (callback: (user: User | null) => void) => {
      // 1. Firebase Listener
      if (auth) {
          onAuthStateChanged(auth, async (firebaseUser) => {
              if (firebaseUser) {
                  // Fetch full user profile from DB
                  try {
                      const userSnapshot = await get(ref(db!, `users/${firebaseUser.uid}`));
                      if (userSnapshot.exists()) {
                          const userData = userSnapshot.val() as User;
                          // Update local cache
                          localData.setCurrentUser(userData);
                          callback(userData);
                      } else {
                          // Profile missing in DB? Create one based on Auth
                          const newUser: User = {
                              id: firebaseUser.uid,
                              name: firebaseUser.displayName || 'Usuario',
                              email: firebaseUser.email || '',
                              plan: 'freemium',
                              generationsUsed: 0,
                              generationsLimit: 6,
                              isAdmin: false
                          };
                          await set(ref(db!, `users/${firebaseUser.uid}`), newUser);
                          localData.setCurrentUser(newUser);
                          callback(newUser);
                      }
                  } catch (e) {
                      console.error("Error fetching user profile", e);
                      // Fallback to local cache if DB fails
                      callback(localData.getCurrentUser());
                  }
              } else {
                  localData.setCurrentUser(null);
                  callback(null);
              }
          });
      } else {
          // 2. Local Fallback Listener (Simulated via storage events or manual check)
          const u = localData.getCurrentUser();
          callback(u);
      }
  },

  register: async (name: string, email: string, password?: string): Promise<User> => {
    // FIREBASE
    if (auth && db && password) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const newUser: User = {
                id: userCredential.user.uid,
                name,
                email,
                plan: 'freemium',
                generationsUsed: 0,
                generationsLimit: 6,
                isAdmin: false
            };
            
            // Update Auth Profile
            await updateProfile(userCredential.user, { displayName: name });
            // Save to Realtime DB
            await set(ref(db, `users/${newUser.id}`), newUser);
            
            localData.setCurrentUser(newUser);
            return newUser;
        } catch (e: any) {
            console.warn("Firebase Register Failed, using Local:", e);
            if (e.code === 'auth/email-already-in-use') throw new Error("Este email ya está en uso.");
            // Fallthrough to local
        }
    }

    // LOCAL FALLBACK
    const users = localData.getUsers();
    if (users.find((u: User) => u.email === email)) throw new Error("Email ya en uso (Local)");
    
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
    localData.setUsers(users);
    localData.setCurrentUser(newUser);
    await new Promise(r => setTimeout(r, 800));
    return newUser;
  },

  login: async (email: string, password?: string): Promise<User> => {
    // FIREBASE
    if (auth && db && password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const userId = userCredential.user.uid;
            const snapshot = await get(ref(db, `users/${userId}`));
            
            if (snapshot.exists()) {
                const user = snapshot.val();
                localData.setCurrentUser(user);
                return user;
            }
        } catch (e: any) {
             console.warn("Firebase Login Failed, using Local:", e);
             if (e.code === 'auth/invalid-credential') throw new Error("Email o contraseña incorrectos.");
             // Fallthrough to local
        }
    }

    // LOCAL FALLBACK
    const users = localData.getUsers();
    const user = users.find((u: User) => u.email === email);
    if (!user) throw new Error("Usuario no encontrado (Local)");
    
    localData.setCurrentUser(user);
    await new Promise(r => setTimeout(r, 600));
    return user;
  },

  loginWithGoogle: async (): Promise<User> => {
      // NOTE: For full Google Auth in Firebase, we need GoogleAuthProvider.
      // Keeping this as "Simulated" for now unless specifically requested to switch to real Google Auth provider
      console.warn("⚠️ Modo Local : Simulación de inicio de sesión con Google");
      await new Promise(r => setTimeout(r, 800));
      
      const users = localData.getUsers();
      let googleUser = users.find((u: User) => u.email === "demo@google.com");

      if (!googleUser) {
          googleUser = {
            id: 'google-demo-user-persistent',
            name: "Usuario Demo Google",
            email: "demo@google.com",
            plan: 'freemium',
            generationsUsed: 0,
            generationsLimit: 6,
            isAdmin: false
          };
          users.push(googleUser);
          localData.setUsers(users);
      }

      localData.setCurrentUser(googleUser);
      return googleUser;
  },

  logout: async () => {
    if (auth) {
        try {
            await signOut(auth);
        } catch (e) {
            console.error("Firebase SignOut Error", e);
        }
    }
    localData.setCurrentUser(null);
  },

  getCurrentUser: async (): Promise<User | null> => {
      // In Firebase, we rely on the AuthListener, but we can return the local cache for sync access
      return localData.getCurrentUser();
  },

  updateUser: async (user: User) => {
    // Sync Local Cache
    localData.setCurrentUser(user);
    
    // FIREBASE
    if (db && auth && auth.currentUser) {
        try {
            await update(ref(db, `users/${user.id}`), user);
        } catch (e) {
            console.warn("Firebase User Update Failed", e);
        }
    }

    // LOCAL FALLBACK
    const users = localData.getUsers();
    const index = users.findIndex((u: User) => u.id === user.id);
    if (index !== -1) {
        users[index] = user;
        localData.setUsers(users);
    }
  },

  saveDocument: async (docContent: GeneratedContent, userId: string) => {
      const newDoc = { ...docContent, userId, id: docContent.id || Date.now().toString() };
      
      // FIREBASE
      if (db) {
          try {
             // Save under documents/docId
             await set(ref(db, `documents/${newDoc.id}`), newDoc);
             
             // Update stats
             const statsRef = ref(db, 'stats');
             const snapshot = await get(statsRef);
             const currentStats = snapshot.val() || { generationsToday: 0 };
             await update(statsRef, { generationsToday: currentStats.generationsToday + 1 });
          } catch (e) {
              console.warn("Firebase Save Doc Failed", e);
          }
      }

      // LOCAL FALLBACK
      const docs = localData.getDocs();
      docs.push(newDoc);
      localData.setDocs(docs);
      
      const stats = JSON.parse(localStorage.getItem(KEYS.STATS) || '{"totalUsers":0, "revenue":0, "generationsToday":0}');
      stats.generationsToday++;
      localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
  },

  getUserDocuments: async (userId: string): Promise<GeneratedContent[]> => {
      // FIREBASE
      if (db) {
          try {
              const q = query(ref(db, 'documents'), orderByChild('userId'), equalTo(userId));
              const snapshot = await get(q);
              if (snapshot.exists()) {
                  const data = snapshot.val();
                  // Convert object to array
                  const docsArray = Object.values(data) as GeneratedContent[];
                  return docsArray.sort((a, b) => b.createdAt - a.createdAt);
              }
              return [];
          } catch (e) {
              console.warn("Firebase Fetch Docs Failed, using Local:", e);
          }
      }

      // LOCAL FALLBACK
      const docs = localData.getDocs();
      return docs.filter((d: any) => d.userId === userId).reverse();
  },

  deleteDocuments: async (docIds: string[]) => {
      // FIREBASE
      if (db) {
          try {
              const updates: any = {};
              docIds.forEach(id => {
                  updates[`documents/${id}`] = null;
              });
              await update(ref(db), updates);
          } catch (e) {
              console.warn("Firebase Delete Docs Failed", e);
          }
      }

      // LOCAL FALLBACK
      let docs = localData.getDocs();
      docs = docs.filter((d: any) => !docIds.includes(d.id || d.createdAt.toString()));
      localData.setDocs(docs);
  },

  updateDocumentTitle: async (docId: string, newTitle: string) => {
      // FIREBASE
      if (db) {
          try {
              await update(ref(db, `documents/${docId}`), { title: newTitle });
          } catch (e) {
               console.warn("Firebase Update Title Failed", e);
          }
      }

      // LOCAL FALLBACK
      const docs = localData.getDocs();
      const index = docs.findIndex((d: any) => (d.id || d.createdAt.toString()) === docId);
      if (index !== -1) {
          docs[index].title = newTitle;
          localData.setDocs(docs);
      }
  },

  applyPromo: (code: string, user: User): {success: boolean, message: string, user?: User} => {
      const promos = JSON.parse(localStorage.getItem(KEYS.PROMOS) || '[]');
      const promo = promos.find((p: PromoCode) => p.code === code && p.active);
      
      if (!promo) return { success: false, message: "Código inválido o expirado" };
      
      if (promo.type === 'admin') {
          const updatedUser = { ...user, isAdmin: true };
          backend.updateUser(updatedUser); // Will sync both FB and Local
          return { success: true, message: "Modo Admin activado", user: updatedUser };
      } else if (promo.type === 'generations') {
          const updatedUser = { ...user, generationsLimit: user.generationsLimit + promo.value };
          backend.updateUser(updatedUser); // Will sync both FB and Local
          return { success: true, message: `¡${promo.value} generaciones añadidas!`, user: updatedUser };
      }
      return { success: false, message: "Error desconocido" };
  },

  // Admin Methods
  getStats: (): AdminStats => {
      const users = localData.getUsers();
      const stats = JSON.parse(localStorage.getItem(KEYS.STATS) || '{"totalUsers":0, "revenue":0, "generationsToday":0}');
      return {
          totalUsers: users.length,
          revenue: stats.revenue,
          generationsToday: stats.generationsToday
      };
  },

  sendNotification: (message: string) => {
      const notifs = JSON.parse(localStorage.getItem(KEYS.NOTIFS) || '[]');
      notifs.unshift({ id: Date.now().toString(), message, date: Date.now(), read: false });
      localStorage.setItem(KEYS.NOTIFS, JSON.stringify(notifs));
      
      // Also push to Firebase if available
      if (db) {
          push(ref(db, 'notifications'), { message, date: Date.now() });
      }
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