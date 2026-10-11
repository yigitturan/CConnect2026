import { appState } from "./state.js";
import { showMessage } from "./utils.js";

// ================== FIREBASE SETUP ==================
  
  export const firebaseConfig = {
  apiKey: "AIzaSyB69u3UFUyEX0F237B7MKMRTm-mfSvEqJU",
  authDomain: "cconnectyigit.firebaseapp.com",
  databaseURL: "https://cconnectyigit-default-rtdb.firebaseio.com",
  projectId: "cconnectyigit",
  storageBucket: "cconnectyigit.appspot.com",
  messagingSenderId: "731610663845",
  appId: "1:731610663845:web:c0c1f537d86e391169764c",
  measurementId: "G-ZFHHZN4V5P"
  };
  
  export function initFirebase() {
  try {
    if (typeof firebase === 'undefined') {
      console.error("❌ Firebase SDK not loaded");
      return false;
    }
    
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    
    appState.database = firebase.database();
    
    if (appState.database) {
      appState.database.goOnline();
      console.log("✅ Firebase initialized");
      return true;
    }
    
    console.error("❌ Firebase database could not be initialized");
    return false;
    
  } catch (error) {
    console.error("❌ Firebase error:", error);
    showMessage("Firebase connection error!", true);
    return false;
  }
  }
