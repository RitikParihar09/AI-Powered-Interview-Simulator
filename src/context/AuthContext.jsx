import React, { useContext, useState, useEffect, createContext } from "react";
import { auth, db } from "../firebase/firebase";
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, onSnapshot } from "firebase/firestore";


const AuthContext = createContext();

const PRIMARY_ADMIN = 'ritikparihar2040@gmail.com';
export { PRIMARY_ADMIN };

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [configLoading, setConfigLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminEmails, setAdminEmails] = useState([]);

    const PRIMARY_ADMIN = import.meta.env.VITE_ADMIN_EMAIL;

    // Listen for Admin List from Firestore
    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'settings', 'platform'), (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                const emails = (data.adminEmails || []).map(e => e.toLowerCase().trim());
                setAdminEmails(emails);
                
                // Update isAdmin if user exists
                if (currentUser && currentUser.email) {
                    const userEmail = currentUser.email.toLowerCase().trim();
                    const primaryAdmin = PRIMARY_ADMIN ? PRIMARY_ADMIN.toLowerCase().trim() : '';
                    
                    const isAuthorized = emails.includes(userEmail) || userEmail === primaryAdmin;
                    setIsAdmin(isAuthorized);
                } else {
                    setIsAdmin(false);
                }
            }
            setConfigLoading(false);
        }, (error) => {
            console.error("Settings listener error:", error);
            setConfigLoading(false);
        });
        return unsub;
    }, [currentUser]);


    async function signup(email, password) {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        const user = res.user;
        
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp()
        });
        
        return res;
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        return signOut(auth);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            
            // Sync user to Firestore if they exist but don't have a doc
            if (user) {
                const userRef = doc(db, "users", user.uid);
                try {
                    const userSnap = await getDoc(userRef);
                    if (!userSnap.exists()) {
                        await setDoc(userRef, {
                            email: user.email,
                            createdAt: serverTimestamp(),
                            lastLogin: serverTimestamp()
                        });
                        console.log("✅ Synced old user to Firestore:", user.email);
                    }
                } catch (e) {
                    console.error("User sync error:", e);
                }
            }
            
            setLoading(false);
        });
        return unsubscribe;
    }, []);


    const value = { currentUser, signup, login, logout, isAdmin, adminEmails, loading: loading || configLoading };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}