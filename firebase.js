// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Definimos la configuración con una limpieza forzada de strings
const k = "AIzaSyCHqXJmIhyg8bXAO7ocs65DyCn4PlyvCXs".trim();
const p = "axiom-suite".trim();

const firebaseConfig = {
  apiKey: k,
  authDomain: p + ".firebaseapp.com",
  projectId: p,
  storageBucket: p + ".firebasestorage.app",
  messagingSenderId: "735182848926",
  appId: "1:735182848926:web:a8f285840e78386537cc8f"
};

// Log de depuración para ver en consola qué está enviando el M4
console.log("PROYECTO:", firebaseConfig.projectId);
console.log("API_KEY_CHECK:", firebaseConfig.apiKey.substring(0,10) + "...");

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);