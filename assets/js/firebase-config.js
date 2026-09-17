import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics, isSupported as analyticsIsSupported } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAHhmRnNHFteNDCMwvYlBYJ-6DQw4cNuR4",
  authDomain: "alcons-3e8ee.firebaseapp.com",
  projectId: "alcons-3e8ee",
  storageBucket: "alcons-3e8ee.firebasestorage.app",
  messagingSenderId: "339165017858",
  appId: "1:339165017858:web:c064349ac22cfc555f341b",
  measurementId: "G-2GLVJE6YV5"
};

// Initialize Firebase SDKs
const app = initializeApp(firebaseConfig);
const analytics = await analyticsIsSupported().then((supported) => supported ? getAnalytics(app) : null).catch(() => null);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Save client lead/enquiry
export async function saveLeadToFirestore(leadData) {
  try {
    const docRef = await addDoc(collection(db, "leads"), {
      ...leadData,
      created_at: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Firestore Lead Error:", error);
    return { success: false, error };
  }
}

// Fetch all leads (Admin only)
export async function fetchLeadsFromFirestore() {
  try {
    const q = query(collection(db, "leads"), orderBy("created_at", "desc"));
    const querySnapshot = await getDocs(q);
    const leads = [];
    querySnapshot.forEach((docSnap) => {
      leads.push({ id: docSnap.id, ...docSnap.data() });
    });
    return leads;
  } catch (error) {
    console.error("Fetch Leads Error:", error);
    return [];
  }
}

// Upload file/photo to Firebase Storage
export async function uploadMediaFile(file, path) {
  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageRef = ref(storage, `${path}/${Date.now()}_${safeName}`);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    return { success: true, url };
  } catch (error) {
    console.error("Storage Upload Error:", error);
    return { success: false, error };
  }
}

// Save paid order/transaction (Razorpay)
export async function saveOrderToFirestore(orderData) {
  try {
    const docRef = await addDoc(collection(db, "orders"), {
      ...orderData,
      created_at: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Firestore Order Error:", error);
    return { success: false, error };
  }
}

// Fetch all paid orders (Admin only)
export async function fetchOrdersFromFirestore() {
  try {
    const q = query(collection(db, "orders"), orderBy("created_at", "desc"));
    const querySnapshot = await getDocs(q);
    const orders = [];
    querySnapshot.forEach((docSnap) => {
      orders.push({ id: docSnap.id, ...docSnap.data() });
    });
    return orders;
  } catch (error) {
    console.error("Fetch Orders Error:", error);
    return [];
  }
}

// Export SDKs globally for browser scripts
window.AlconsFirebase = {
  app,
  analytics,
  db,
  auth,
  storage,
  saveLeadToFirestore,
  fetchLeadsFromFirestore,
  saveOrderToFirestore,
  fetchOrdersFromFirestore,
  uploadMediaFile,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
