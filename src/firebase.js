import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDBY-TMFWelVzW6VjDKYCq0MqeeXTHdL9w",
  authDomain: "circolo-tennis-sant-agata.firebaseapp.com",
  projectId: "circolo-tennis-sant-agata",
  storageBucket: "circolo-tennis-sant-agata.firebasestorage.app",
  messagingSenderId: "501209589682",
  appId: "1:501209589682:web:b3355e0b52607f869466ab"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);