import { User, Notification, PromoCode, AdminStats, GeneratedContent } from "../types";
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, deleteDoc } from "firebase/firestore";

const KEYS = {
  USERS: 'wos_users',
  CURRENT_USER: 'wos_current_user',
  DOCS: 'wos_documents',
  NOTIFS: 'wos_notifications',
  PROMOS: 'wos_promos',
  STATS: 'wos_stats',
  FIREBASE_SDK: 'wos_firebase_sdk'
};

// --- FIREBASE INITIALIZATION HELPERS ---
let firebaseApp: FirebaseApp | null = null;
let db: any = null;
let auth: any = null;

const initFirebase = () => {
    try {
        const sdkString = localStorage.getItem(KEYS.FIREBASE_SDK);
        if (sdkString) {
            let jsonString = sdkString.trim();
            
            // --- SMART JSON FIXER ---
            // 1. Remove JS variable declaration (const firebaseConfig = ...)
            if (jsonString.includes('=')) {
                jsonString = jsonString.substring(jsonString.indexOf('=') + 1).trim();
            }
            
            // 2. Cleanup syntax: comments, semicolons
            jsonString = jsonString.replace(/\/\/.*$/gm, ''); // Remove single line comments
            jsonString = jsonString.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove block comments
            jsonString = jsonString.replace(/;+\s*$/, ''); // Remove trailing semicolon

            // 3. Fix Keys: Convert { apiKey: ... } to { "apiKey": ... }
            // Regex finds keys (alphanumeric) followed by ':' that are preceded by '{' or ','
            jsonString = jsonString.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

            // 4. Fix Values: Convert single quotes to double quotes : 'value' -> : "value"
            jsonString = jsonString.replace(/:\s*'([^']+)'/g, ': "$1"');

            // 5. Remove trailing commas (valid in JS but invalid in JSON)
            jsonString = jsonString.replace(/,\s*}/g, '}');
            
            // --- END FIXER ---

            const firebaseConfig = JSON.parse(jsonString);
            
            if (getApps().length === 0) {
                firebaseApp = initializeApp(firebaseConfig);
            } else {
                firebaseApp = getApp();
            }
            auth = getAuth(firebaseApp);
            db = getFirestore(firebaseApp);
            console.log("🔥 Firebase initialized successfully");
            return true;
        }
    } catch (e) {
        console.error("❌ Firebase Init Failed (Using LocalStorage fallback).");
        console.error("Debug info - Parse Error:", e);
        console.warn("Veuillez vérifier le format dans le panneau Admin.");
    }
    return false;
};

const useFirebase = initFirebase();

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
  isFirebaseActive: () => !!auth,

  // Auth Listener to keep app in sync
  onAuthStateChange: (callback: (user: User | null) => void) => {
      if (auth) {
          onAuthStateChanged(auth, async (fbUser) => {
              if (fbUser) {
                  // Fetch full user profile from Firestore
                  const userDoc = await getDoc(doc(db, "users", fbUser.uid));
                  if (userDoc.exists()) {
                      callback(userDoc.data() as User);
                  } else {
                      // Should not happen if registered correctly, but fallback
                      callback({
                          id: fbUser.uid,
                          name: fbUser.displayName || "User",
                          email: fbUser.email || "",
                          plan: 'freemium',
                          generationsUsed: 0,
                          generationsLimit: 6,
                          isAdmin: false
                      });
                  }
              } else {
                  callback(null);
              }
          });
      } else {
          // Local Storage check
          const u = localStorage.getItem(KEYS.CURRENT_USER);
          callback(u ? JSON.parse(u) : null);
      }
  },

  register: async (name: string, email: string, password?: string): Promise<User> => {
    // 1. Try Firebase
    if (auth && password) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const fbUser = userCredential.user;
            
            const newUser: User = {
                id: fbUser.uid,
                name,
                email,
                plan: 'freemium',
                generationsUsed: 0,
                generationsLimit: 6,
                isAdmin: false
            };
            
            // Save extended profile to Firestore
            await setDoc(doc(db, "users", fbUser.uid), newUser);
            return newUser;
        } catch (error: any) {
            console.error("Firebase Register Error", error);
            throw new Error(error.message || "Erreur d'inscription Firebase");
        }
    }

    // 2. Fallback Local
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
    // 1. Try Firebase
    if (auth && password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const fbUser = userCredential.user;
            const userDoc = await getDoc(doc(db, "users", fbUser.uid));
            if (userDoc.exists()) {
                return userDoc.data() as User;
            }
            // If auth works but no doc (legacy?), return minimal
            return {
                id: fbUser.uid,
                name: fbUser.displayName || "Utilisateur",
                email: fbUser.email || email,
                plan: 'freemium',
                generationsUsed: 0,
                generationsLimit: 6,
                isAdmin: false
            };
        } catch (error: any) {
             throw new Error("Login échoué : Vérifiez vos identifiants.");
        }
    }

    // 2. Fallback Local
    const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    const user = users.find((u: User) => u.email === email);
    if (!user) throw new Error("Utilisateur introuvable (Local)");
    
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    await new Promise(r => setTimeout(r, 600));
    return user;
  },

  logout: async () => {
    if (auth) {
        await signOut(auth);
    }
    localStorage.removeItem(KEYS.CURRENT_USER);
  },

  getCurrentUser: async (): Promise<User | null> => {
     // This is mostly used for initial load before listener kicks in
     if (auth && auth.currentUser) {
         // We rely on listener mostly, but sync return for logic
         return null; // Let listener handle it
     }
     const u = localStorage.getItem(KEYS.CURRENT_USER);
     return u ? JSON.parse(u) : null;
  },

  updateUser: async (user: User) => {
    if (auth) {
        try {
            const userRef = doc(db, "users", user.id);
            await updateDoc(userRef, { ...user }); // Spread to ensure plain object
        } catch (e) {
            console.error("Error updating user in FB", e);
        }
    }

    // Always update local cache for UI responsiveness
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
      
      if (auth) {
          try {
              // We use subcollections for users or root collection? Root is easier to query groupwise
              // Let's use root collection "documents"
              await setDoc(doc(db, "documents", newDoc.id), newDoc);
          } catch(e) {
              console.error("FB Save Doc Error", e);
          }
      }

      // Local Fallback / Cache
      const docs = JSON.parse(localStorage.getItem(KEYS.DOCS) || '[]');
      docs.push(newDoc);
      localStorage.setItem(KEYS.DOCS, JSON.stringify(docs));
      
      // Update stats
      const stats = JSON.parse(localStorage.getItem(KEYS.STATS) || '{"totalUsers":0, "revenue":0, "generationsToday":0}');
      stats.generationsToday++;
      localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
  },

  getUserDocuments: async (userId: string): Promise<GeneratedContent[]> => {
      if (auth) {
          try {
            const q = query(collection(db, "documents"), where("userId", "==", userId));
            const querySnapshot = await getDocs(q);
            const fbDocs: GeneratedContent[] = [];
            querySnapshot.forEach((doc) => {
                fbDocs.push(doc.data() as GeneratedContent);
            });
            // Sort locally
            return fbDocs.sort((a, b) => b.createdAt - a.createdAt);
          } catch (e) {
              console.error("FB Fetch Docs Error", e);
              // Fallback to local if fetch fails (offline?)
          }
      }

      const docs = JSON.parse(localStorage.getItem(KEYS.DOCS) || '[]');
      return docs.filter((d: any) => d.userId === userId).reverse();
  },

  deleteDocuments: async (docIds: string[]) => {
      if (auth) {
          for (const id of docIds) {
              try {
                  await deleteDoc(doc(db, "documents", id));
              } catch(e) { console.error("FB Delete Error", e); }
          }
      }

      let docs = JSON.parse(localStorage.getItem(KEYS.DOCS) || '[]');
      docs = docs.filter((d: any) => !docIds.includes(d.id || d.createdAt.toString()));
      localStorage.setItem(KEYS.DOCS, JSON.stringify(docs));
  },

  updateDocumentTitle: async (docId: string, newTitle: string) => {
      if (auth) {
          try {
              const docRef = doc(db, "documents", docId);
              await updateDoc(docRef, { title: newTitle });
          } catch(e) { console.error("FB Update Title Error", e); }
      }

      const docs = JSON.parse(localStorage.getItem(KEYS.DOCS) || '[]');
      const index = docs.findIndex((d: any) => (d.id || d.createdAt.toString()) === docId);
      if (index !== -1) {
          docs[index].title = newTitle;
          localStorage.setItem(KEYS.DOCS, JSON.stringify(docs));
      }
  },

  applyPromo: (code: string, user: User): {success: boolean, message: string, user?: User} => {
      // Promos are kept local/simple for this demo, or would require a 'promos' collection in FB
      const promos = JSON.parse(localStorage.getItem(KEYS.PROMOS) || '[]');
      const promo = promos.find((p: PromoCode) => p.code === code && p.active);
      
      if (!promo) return { success: false, message: "Code invalide ou expiré" };
      
      if (promo.type === 'admin') {
          const updatedUser = { ...user, isAdmin: true };
          // Don't await here to keep UI snappy, but trigger update
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
      localStorage.setItem(KEYS.FIREBASE_SDK, sdk);
      // Force reload to apply new config
      window.location.reload();
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