// src/utils/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCWAs5LOcXvGkJ9QKz9WfHXBhkp2OAntWA",
  authDomain: "benito-store.firebaseapp.com",
  projectId: "benito-store",
  storageBucket: "benito-store.firebasestorage.app",
  messagingSenderId: "133305981902",
  appId: "1:133305981902:web:48bb76991a74295d42e99f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DOC_REF = doc(db, 'store', 'data');

export async function loadFromFirebase() {
  try {
    const snap = await getDoc(DOC_REF);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (e) {
    console.error('Error leyendo Firebase:', e);
    return null;
  }
}

export async function saveToFirebase(data) {
  try {
    await setDoc(DOC_REF, data);
  } catch (e) {
    console.error('Error guardando en Firebase:', e);
  }
}