import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB_13DBhlALcBR7tSd3xQg6xXChLq7-r7E",
  authDomain: "myarrange-35e45.firebaseapp.com",
  projectId: "myarrange-35e45",
  storageBucket: "myarrange-35e45.firebasestorage.app",
  messagingSenderId: "427104022619",
  appId: "1:427104022619:web:976e971d441708cc3dcf7e"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
