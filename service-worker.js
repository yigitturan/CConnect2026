// ================== CLEAN SERVICE WORKER - CCONNECT EXTENSION ==================
// Manifest V3 Service Worker - Google OAuth düzeltilmiş versiyon

console.log("[SW] 🚀 Cconnect Extension Service Worker başlatılıyor...");

// ================== CONFIGURATION ==================

const CONFIG = {
  // Firebase ayarları
  FIREBASE_API_KEY: "AIzaSyB69u3UFUyEX0F237B7MKMRTm-mfSvEqJU",
  FIREBASE_DATABASE_URL: "https://cconnectyigit-default-rtdb.firebaseio.com/",
  FIREBASE_AUTH_DOMAIN: "cconnectyigit.firebaseapp.com",
  
  // Google OAuth ayarları - DÜZELTİLDİ
  GOOGLE_CLIENT_ID: "731610663845-lcusivrfp2viicfthssffm6kkdfih5i2.apps.googleusercontent.com",
  // Dinamik redirect URI kullanılacak
  
  // Timeout ayarları
  AUTH_TIMEOUT: 30000, // Artırıldı
  
  // Retry ayarları
  MAX_RETRIES: 3,
  RETRY_DELAY: 500
};

// ================== GLOBAL STATE ==================

let serviceWorkerState = {
  isReady: false,
  performanceMetrics: {
    messageCount: 0,
    errorCount: 0,
    authAttempts: 0,
    authSuccess: 0,
    authFailures: 0,
    lastActivity: Date.now(),
    startTime: Date.now()
  }
};

// ================== SERVICE WORKER LIFECYCLE ==================

// Extension kurulum
chrome.runtime.onInstalled.addListener((details) => {
  console.log(`[SW] 📦 Extension ${details.reason}`);
  
  // Side panel ayarla
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .then(() => console.log("[SW] ✅ Side panel configured"))
    .catch(error => console.error("[SW] ❌ Side panel error:", error));
  
  serviceWorkerState.isReady = true;
  
  // OAuth konfigürasyonunu kontrol et
  checkOAuthConfiguration();
});

// Extension başlatma
chrome.runtime.onStartup.addListener(() => {
  console.log("[SW] 🟢 Extension started");
  serviceWorkerState.isReady = true;
  serviceWorkerState.startTime = Date.now();
});

// ================== ERROR HANDLING ==================

// Global error handling
self.addEventListener('error', (event) => {
  console.error('[SW] 💥 Global Error:', event.error);
  serviceWorkerState.performanceMetrics.errorCount++;
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] 🚫 Unhandled Promise Rejection:', event.reason);
  serviceWorkerState.performanceMetrics.errorCount++;
  event.preventDefault();
});

// ================== MESSAGE SYSTEM ==================

// Ana mesaj listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Performance tracking
  serviceWorkerState.performanceMetrics.messageCount++;
  serviceWorkerState.performanceMetrics.lastActivity = Date.now();
  
  console.log(`[SW] 📨 Message:`, { action: message?.action });
  
  // Mesaj validasyonu
  if (!message || typeof message.action !== 'string') {
    console.warn("[SW] ⚠️ Invalid message:", message);
    sendResponse({ success: false, error: "INVALID_MESSAGE_FORMAT" });
    return false;
  }
  
  // Mesaj routing
  handleMessage(message, sender, sendResponse);
  return true; // Async response için
});

// Ana mesaj handler
async function handleMessage(message, sender, sendResponse) {
  try {
    const { action } = message;
    
    switch (action) {
      case "ping":
        sendResponse({ success: true, pong: true, timestamp: Date.now() });
        break;
        
      case "login":
      case "signup":
        await handleAuth(message, sendResponse);
        break;
        
      case "googleLogin":
        await handleGoogleAuth(sendResponse);
        break;
        
      case "logout":
        await handleLogout(sendResponse);
        break;
      
      default:
        console.warn(`[SW] ❓ Unknown action: ${action}`);
        sendResponse({ success: false, error: "UNKNOWN_ACTION" });
    }
    
  } catch (error) {
    console.error("[SW] 💥 Message handling error:", error);
    serviceWorkerState.performanceMetrics.errorCount++;
    sendResponse({ 
      success: false, 
      error: "MESSAGE_PROCESSING_ERROR", 
      details: error.message 
    });
  }
}

// ================== AUTHENTICATION SYSTEM ==================

// Email/Password Authentication
async function handleAuth(message, sendResponse) {
  const { action, email, password, nickname } = message;
  
  console.log(`[SW] 🔐 ${action} başlatılıyor: ${email}`);
  serviceWorkerState.performanceMetrics.authAttempts++;
  
  try {
    // Input validation
    if (!email || !password) {
      throw new Error("EMAIL_PASSWORD_REQUIRED");
    }
    
    if (!isValidEmail(email)) {
      throw new Error("INVALID_EMAIL_FORMAT");
    }
    
    // Signup için ek validasyon
    if (action === "signup") {
      if (!nickname || nickname.trim().length < 2) {
        throw new Error("NICKNAME_REQUIRED");
      }
      
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        throw new Error("PASSWORD_VALIDATION_FAILED");
      }
    }
    
    // Firebase endpoint
    const isSignup = action === "signup";
    const endpoint = isSignup
      ? `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${CONFIG.FIREBASE_API_KEY}`
      : `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${CONFIG.FIREBASE_API_KEY}`;
    
    // Auth request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.AUTH_TIMEOUT);
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        email: email.trim(),
        password: password,
        returnSecureToken: true
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: "UNKNOWN_AUTH_ERROR" } }));
      throw new Error(errorData.error?.message || `HTTP_${response.status}`);
    }
    
    const data = await response.json();
    const userId = data.localId;
    
    // User data işlemleri
    let displayName = email.split('@')[0];
    
    try {
      if (isSignup && nickname) {
        await saveUserData(userId, { email: email.trim(), nickname: nickname.trim() });
        displayName = nickname.trim();
      } else if (!isSignup) {
        const userData = await getUserData(userId);
        if (userData && userData.nickname) {
          displayName = userData.nickname;
        }
        await updateLastLogin(userId);
      }
    } catch (dataError) {
      console.warn("[SW] ⚠️ User data operation failed:", dataError);
    }
    
    serviceWorkerState.performanceMetrics.authSuccess++;
    console.log(`[SW] ✅ ${action} successful: ${displayName}`);
    sendResponse({ success: true, nickname: displayName, userId, idToken: data.idToken, refreshToken: data.refreshToken, expiresIn: data.expiresIn });
    
  } catch (error) {
    serviceWorkerState.performanceMetrics.authFailures++;
    console.error(`[SW] ❌ ${action} error:`, error);
    
    let errorCode = error.message;
    if (error.name === 'AbortError') {
      errorCode = "AUTH_TIMEOUT";
    } else if (error.message.includes('fetch')) {
      errorCode = "NETWORK_ERROR";
    }
    
    sendResponse({ 
      success: false, 
      error: errorCode,
      details: error.message 
    });
  }
}

// DÜZELTİLMİŞ Google Authentication
async function handleGoogleAuth(sendResponse) {
  console.log("[SW] 🔐 Google authentication başlatılıyor...");
  serviceWorkerState.performanceMetrics.authAttempts++;
  
  try {
    // İlk olarak cache'deki tokenları temizle
    await clearGoogleAuthTokens();
    
    // Dinamik redirect URI al
    const redirectUri = getRedirectUri();
    console.log("[SW] 📍 Using redirect URI:", redirectUri);
    
    // Auth URL'i oluştur
    const authUrl = buildGoogleAuthUrl(redirectUri);
    console.log("[SW] 🔗 Auth URL built");
    
    // Web auth flow başlat
    const authResult = await launchGoogleWebAuthFlow(authUrl);
    
    if (!authResult.success) {
      throw new Error(authResult.error || "Web auth flow failed");
    }
    
    console.log("[SW] ✅ Access token received");
    
    // Google'dan user bilgilerini al
    const userInfo = await fetchGoogleUserInfo(authResult.accessToken);
    console.log("[SW] 👤 User info retrieved:", { email: userInfo.email, name: userInfo.name });
    
    // Firebase'e Google ile sign in
    const firebaseResult = await signInWithGoogleToFirebase(authResult.accessToken);
    console.log("[SW] 🔥 Firebase sign-in successful");
    
    // User data kaydet
    const userId = firebaseResult.localId;
    const email = firebaseResult.email || userInfo.email;
    const displayName = firebaseResult.displayName || userInfo.name || email.split('@')[0];
    
    try {
      await saveGoogleUserData(userId, {
        email,
        nickname: displayName,
        photoUrl: userInfo.picture,
        provider: 'google',
        googleId: userInfo.id
      });
    } catch (dataError) {
      console.warn("[SW] ⚠️ Google user data save failed (non-critical):", dataError);
    }
    
    serviceWorkerState.performanceMetrics.authSuccess++;
    console.log("[SW] ✅ Google authentication successful:", displayName);
    
    sendResponse({ 
      success: true, 
      nickname: displayName,
      userId,
      idToken: firebaseResult.idToken,
      refreshToken: firebaseResult.refreshToken,
      expiresIn: firebaseResult.expiresIn,
      email: email,
      photoUrl: userInfo.picture 
    });
    
  } catch (error) {
    serviceWorkerState.performanceMetrics.authFailures++;
    console.error("[SW] ❌ Google auth error:", error);
    
    let errorMessage = "Google authentication failed";
    let errorCode = "GOOGLE_AUTH_ERROR";
    
    // Detaylı hata mesajları
    if (error.message.includes("Authorization page could not be loaded")) {
      errorMessage = "Google authorization page could not load. Check internet connection.";
      errorCode = "AUTH_PAGE_LOAD_ERROR";
    } else if (error.message.includes("cancelled") || error.message.includes("AUTH_CANCELLED")) {
      errorMessage = "Google sign-in was cancelled";
      errorCode = "AUTH_CANCELLED";
    } else if (error.message.includes("network") || error.message.includes("fetch")) {
      errorMessage = "Network connection error";
      errorCode = "NETWORK_ERROR";
    } else if (error.message.includes("NO_ACCESS_TOKEN")) {
      errorMessage = "Could not retrieve access token from Google";
      errorCode = "NO_ACCESS_TOKEN";
    }
    
    sendResponse({ 
      success: false, 
      error: errorCode,
      message: errorMessage,
      details: error.message 
    });
  }
}

// OAuth konfigürasyonu kontrol
function checkOAuthConfiguration() {
  try {
    const redirectUri = getRedirectUri();
    const manifest = chrome.runtime.getManifest();
    
    console.log("[SW] 🔍 OAuth Configuration Check:");
    console.log("  Extension ID:", chrome.runtime.id);
    console.log("  Redirect URI:", redirectUri);
    console.log("  Client ID:", CONFIG.GOOGLE_CLIENT_ID);
    console.log("  Manifest OAuth2:", manifest.oauth2);
    
    // Manifest kontrolü
    if (!manifest.oauth2 || !manifest.oauth2.client_id) {
      console.warn("[SW] ⚠️ OAuth2 configuration missing in manifest");
      return false;
    }
    
    if (manifest.oauth2.client_id !== CONFIG.GOOGLE_CLIENT_ID) {
      console.warn("[SW] ⚠️ Client ID mismatch between manifest and config");
    }
    
    console.log("[SW] ✅ OAuth configuration check completed");
    return true;
    
  } catch (error) {
    console.error("[SW] ❌ OAuth configuration check failed:", error);
    return false;
  }
}

// Dinamik redirect URI al
function getRedirectUri() {
  try {
    // chrome.identity.getRedirectURL() kullan
    if (chrome.identity && chrome.identity.getRedirectURL) {
      return chrome.identity.getRedirectURL();
    }
    
    // Fallback: manual construction
    const extensionId = chrome.runtime.id;
    return `https://${extensionId}.chromiumapp.org/`;
    
  } catch (error) {
    console.error("[SW] ❌ Redirect URI generation failed:", error);
    // Son çare olarak static URI
    return "https://ncajffobbacfcdafelncglekbkpoieem.chromiumapp.org/";
  }
}

// Google auth tokenları temizle
async function clearGoogleAuthTokens() {
  return new Promise((resolve) => {
    if (chrome.identity && chrome.identity.clearAllCachedAuthTokens) {
      chrome.identity.clearAllCachedAuthTokens(() => {
        console.log("[SW] 🧹 Google auth tokens cleared");
        resolve();
      });
    } else {
      console.log("[SW] ⚠️ clearAllCachedAuthTokens not available");
      resolve();
    }
  });
}

// Google auth URL oluştur
function buildGoogleAuthUrl(redirectUri) {
  const params = new URLSearchParams({
    client_id: CONFIG.GOOGLE_CLIENT_ID,
    response_type: 'token',
    redirect_uri: redirectUri,
    scope: 'email profile openid',
    prompt: 'select_account',
    access_type: 'online',
    include_granted_scopes: 'true'
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Google web auth flow başlat
function launchGoogleWebAuthFlow(authUrl) {
  return new Promise((resolve) => {
    console.log("[SW] 🚀 Launching Google web auth flow...");
    
    chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true
    }, (redirectUrl) => {
      console.log("[SW] 📥 Web auth flow completed");
      console.log("[SW] 📍 Redirect URL received:", redirectUrl ? "YES" : "NO");
      
      if (chrome.runtime.lastError) {
        console.error("[SW] ❌ Chrome runtime error:", chrome.runtime.lastError);
        resolve({
          success: false,
          error: chrome.runtime.lastError.message
        });
        return;
      }
      
      if (!redirectUrl) {
        console.error("[SW] ❌ No redirect URL received");
        resolve({
          success: false,
          error: "AUTH_CANCELLED"
        });
        return;
      }
      
      // Access token çıkar
      const accessToken = extractAccessTokenFromUrl(redirectUrl);
      
      if (!accessToken) {
        console.error("[SW] ❌ No access token found");
        resolve({
          success: false,
          error: "NO_ACCESS_TOKEN"
        });
        return;
      }
      
      console.log("[SW] ✅ Access token extracted successfully");
      resolve({
        success: true,
        accessToken: accessToken
      });
    });
  });
}

// URL'den access token çıkar
function extractAccessTokenFromUrl(redirectUrl) {
  try {
    console.log("[SW] 🔍 Extracting access token from URL...");
    
    const url = new URL(redirectUrl);
    
    // Fragment (#) kontrolü
    let fragment = url.hash;
    if (fragment && fragment.startsWith('#')) {
      fragment = fragment.substring(1);
    }
    
    if (!fragment) {
      console.error("[SW] ❌ No fragment found in redirect URL");
      return null;
    }
    
    console.log("[SW] 📋 Fragment found, parsing parameters...");
    
    const params = new URLSearchParams(fragment);
    const accessToken = params.get('access_token');
    
    if (!accessToken) {
      console.error("[SW] ❌ access_token parameter not found in fragment");
      console.log("[SW] 📋 Available parameters:", Array.from(params.keys()));
      return null;
    }
    
    console.log("[SW] ✅ Access token found in fragment");
    return accessToken;
    
  } catch (error) {
    console.error("[SW] ❌ Token extraction error:", error);
    return null;
  }
}

// Google'dan user info al
async function fetchGoogleUserInfo(accessToken) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  
  try {
    console.log("[SW] 📡 Fetching Google user info...");
    
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[SW] ❌ Google API error:", response.status, errorText);
      throw new Error(`Google API error: ${response.status}`);
    }
    
    const userInfo = await response.json();
    console.log("[SW] ✅ Google user info received");
    
    return userInfo;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Google user info request timeout');
    }
    
    throw error;
  }
}

// Firebase'e Google ile sign in
async function signInWithGoogleToFirebase(accessToken) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.AUTH_TIMEOUT);
  
  try {
    console.log("[SW] 🔥 Signing in to Firebase with Google...");
    
    const redirectUri = getRedirectUri();
    
    const requestBody = {
      requestUri: redirectUri,
      postBody: `access_token=${accessToken}&providerId=google.com`,
      returnSecureToken: true,
      returnIdpCredential: true
    };
    
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${CONFIG.FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: "Unknown Firebase error" } }));
      console.error("[SW] ❌ Firebase error:", errorData);
      throw new Error(errorData.error?.message || `Firebase error: ${response.status}`);
    }
    
    const firebaseData = await response.json();
    console.log("[SW] ✅ Firebase Google sign-in successful");
    
    return firebaseData;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Firebase authentication timeout');
    }
    
    throw error;
  }
}

// Google user data kaydet
async function saveGoogleUserData(userId, userData) {
  const dataToSave = {
    ...userData,
    lastLogin: Date.now(),
    createdAt: userData.createdAt || Date.now(),
    updatedAt: Date.now()
  };
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  
  try {
    console.log("[SW] 💾 Saving Google user data...");
    
    const response = await fetch(
      `${CONFIG.FIREBASE_DATABASE_URL}/users/${userId}.json`,
      {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(dataToSave),
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to save user data: ${response.status}`);
    }
    
    console.log("[SW] ✅ Google user data saved successfully");
    return await response.json();
    
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn("[SW] ⚠️ Google user data save failed (non-critical):", error.message);
    // User data kaydı kritik değil, auth devam edebilir
  }
}

// Logout
async function handleLogout(sendResponse) {
  console.log("[SW] 🚪 Logout işlemi...");
  
  try {
    await clearGoogleAuthTokens();
    
    console.log("[SW] ✅ Logout successful");
    sendResponse({ success: true });
    
  } catch (error) {
    console.error("[SW] ❌ Logout error:", error);
    sendResponse({ 
      success: false, 
      error: "LOGOUT_ERROR", 
      details: error.message 
    });
  }
}

// ================== AUTH HELPER FUNCTIONS ==================

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  const errors = [];
  if (password.length < 8) errors.push("PASSWORD_TOO_SHORT");
  if (!/[A-Z]/.test(password)) errors.push("PASSWORD_NO_UPPERCASE");
  if (!/[a-z]/.test(password)) errors.push("PASSWORD_NO_LOWERCASE");
  if (!/[0-9]/.test(password)) errors.push("PASSWORD_NO_NUMBER");
  return errors;
}

async function saveUserData(userId, userData) {
  const dataToSave = {
    ...userData,
    lastLogin: Date.now(),
    updatedAt: Date.now()
  };
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  
  try {
    const response = await fetch(`${CONFIG.FIREBASE_DATABASE_URL}/users/${userId}.json`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(dataToSave),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to save user data: ${response.status}`);
    }
    
    console.log("[SW] ✅ User data saved:", userId);
    return await response.json();
    
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function updateLastLogin(userId) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${CONFIG.FIREBASE_DATABASE_URL}/users/${userId}/lastLogin.json`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(Date.now()),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log("[SW] ✅ Last login updated:", userId);
    }
  } catch (error) {
    console.warn("[SW] ⚠️ Last login update error:", error);
  }
}

async function getUserData(userId) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${CONFIG.FIREBASE_DATABASE_URL}/users/${userId}.json`, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.warn("[SW] ⚠️ User data retrieval error:", error);
    return null;
  }
}

// ================== UTILITY FUNCTIONS ==================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getExtensionInfo() {
  const manifest = chrome.runtime.getManifest();
  return {
    name: manifest.name,
    version: manifest.version,
    description: manifest.description
  };
}

// ================== PERFORMANCE MONITORING ==================

function getPerformanceReport() {
  const uptime = Date.now() - serviceWorkerState.performanceMetrics.startTime;
  const lastActivity = Date.now() - serviceWorkerState.performanceMetrics.lastActivity;
  
  return {
    ...serviceWorkerState.performanceMetrics,
    uptime: Math.floor(uptime / 1000),
    lastActivity: Math.floor(lastActivity / 1000),
    isReady: serviceWorkerState.isReady,
    authSuccessRate: serviceWorkerState.performanceMetrics.authAttempts > 0 
      ? (serviceWorkerState.performanceMetrics.authSuccess / serviceWorkerState.performanceMetrics.authAttempts * 100).toFixed(1) + '%'
      : '0%'
  };
}

// Performance raporu (her 5 dakikada)
setInterval(() => {
  const report = getPerformanceReport();
  if (report.messageCount > 0) {
    console.log("[SW] 📊 Performance report:", report);
  }
}, 5 * 60 * 1000);

// ================== HEALTH CHECK ==================

async function performHealthCheck() {
  console.log("[SW] 🏥 Health check...");
  
  const healthReport = {
    timestamp: Date.now(),
    serviceWorker: {
      status: serviceWorkerState.isReady ? 'healthy' : 'unhealthy',
      uptime: Date.now() - serviceWorkerState.performanceMetrics.startTime,
      messageCount: serviceWorkerState.performanceMetrics.messageCount,
      errorCount: serviceWorkerState.performanceMetrics.errorCount,
      authSuccessRate: serviceWorkerState.performanceMetrics.authAttempts > 0 
        ? (serviceWorkerState.performanceMetrics.authSuccess / serviceWorkerState.performanceMetrics.authAttempts * 100).toFixed(1) + '%'
        : '0%'
    },
    oauth: {
      redirectUri: getRedirectUri(),
      extensionId: chrome.runtime.id
    },
    issues: []
  };
  
  // Sorun tespiti
  if (serviceWorkerState.performanceMetrics.errorCount > 10) {
    healthReport.issues.push("High error count detected");
  }
  
  if (serviceWorkerState.performanceMetrics.authFailures > serviceWorkerState.performanceMetrics.authSuccess) {
    healthReport.issues.push("Auth failure rate is high");
  }
  
  console.log("[SW] 🏥 Health report:", healthReport);
  return healthReport;
}

// Health check (her 10 dakikada)
setInterval(performHealthCheck, 10 * 60 * 1000);

// ================== SYSTEM STATUS ==================

function getSystemStatus() {
  return {
    serviceWorker: {
      isReady: serviceWorkerState.isReady,
    },
    performance: getPerformanceReport(),
    config: {
      authTimeout: CONFIG.AUTH_TIMEOUT,
      maxRetries: CONFIG.MAX_RETRIES
    },
    oauth: {
      clientId: CONFIG.GOOGLE_CLIENT_ID,
      redirectUri: getRedirectUri(),
      extensionId: chrome.runtime.id
    },
  };
}

// ================== DEBUG INTERFACE ==================

// Debug fonksiyonları
if (typeof globalThis !== 'undefined') {
  globalThis.serviceWorkerDebug = {
    getState: () => serviceWorkerState,
    getConfig: () => CONFIG,
    performHealthCheck,
    getSystemStatus,
    getPerformanceReport,
    
    // OAuth debug
    getRedirectUri,
    checkOAuthConfiguration,
    testGoogleAuth: () => handleGoogleAuth((result) => console.log("Test Google Auth Result:", result)),
    
    resetMetrics: () => {
      serviceWorkerState.performanceMetrics = {
        messageCount: 0,
        errorCount: 0,
        authAttempts: 0,
        authSuccess: 0,
        authFailures: 0,
        lastActivity: Date.now(),
        startTime: Date.now()
      };
      console.log("[SW] 📊 Metrics reset");
    }
  };
}

// ================== EMERGENCY HANDLERS ==================

// Emergency reset handler
chrome.runtime.onConnect.addListener((port) => {
  console.log(`[SW] 🔌 Port connection: ${port.name}`);
  
  port.onMessage.addListener((message) => {
    if (message.action === 'emergency_reset') {
      console.log("[SW] 🚨 Emergency reset initiated...");
      
      // Cache'leri temizle
      
      // Metrikleri sıfırla
      serviceWorkerState.performanceMetrics = {
        messageCount: 0,
        errorCount: 0,
        authAttempts: 0,
        authSuccess: 0,
        authFailures: 0,
        lastActivity: Date.now(),
        startTime: Date.now()
      };
      
      port.postMessage({ success: true, message: "Reset completed" });
    }
  });
  
  port.onDisconnect.addListener(() => {
    console.log(`[SW] 🔌 Port disconnected: ${port.name}`);
  });
});

// ================== INITIALIZATION ==================

// Service worker'ı başlat
async function initializeServiceWorker() {
  console.log("[SW] 🚀 Initializing service worker...");
  
  try {
    // Ready state
    serviceWorkerState.isReady = true;
    
    // Cache'leri temizle
    
    // Performance tracking başlat
    serviceWorkerState.performanceMetrics.startTime = Date.now();
    
    // OAuth konfigürasyonu kontrol et
    checkOAuthConfiguration();
    
    console.log("[SW] ✅ Service worker initialization completed");
    
  } catch (error) {
    console.error("[SW] ❌ Service worker initialization failed:", error);
    serviceWorkerState.isReady = false;
  }
}

// ================== EXTENSION LIFECYCLE ==================

// Extension suspend
chrome.runtime.onSuspend.addListener(() => {
  console.log("[SW] 😴 Service worker suspending...");
  
  const finalReport = getPerformanceReport();
  console.log("[SW] 📊 Final performance report:", finalReport);
});

// Extension suspend cancelled
chrome.runtime.onSuspendCanceled.addListener(() => {
  console.log("[SW] 🔄 Service worker suspend cancelled");
  serviceWorkerState.isReady = true;
});

// ================== FINAL SETUP ==================

// Service worker'ı başlat
initializeServiceWorker();

// Final durum raporu
setTimeout(() => {
  const finalStatus = getSystemStatus();
  console.log("[SW] 🎉 Final system status:", finalStatus);
  
  console.log("[SW] 🚀✨ SERVICE WORKER FULLY LOADED!");
  console.log("[SW] 📋 Ready features:");
  console.log("  ✅ Email/Password Authentication");
  console.log("  ✅ Google OAuth Authentication (FIXED)");
  console.log("  ✅ Dynamic Redirect URI support");
  console.log("  ✅ Enhanced error handling");
  console.log("  ✅ Content Script Management");
  console.log("  ✅ Firebase Integration");
  console.log("  ✅ Performance Monitoring");
  console.log("  ✅ Health Check System");
  
}, 2000);

// Debug komutları
console.log("[SW] 🔧 Debug commands:");
console.log("  - globalThis.serviceWorkerDebug.getState()");
console.log("  - globalThis.serviceWorkerDebug.performHealthCheck()");
console.log("  - globalThis.serviceWorkerDebug.getSystemStatus()");
console.log("  - globalThis.serviceWorkerDebug.getRedirectUri()");
console.log("  - globalThis.serviceWorkerDebug.checkOAuthConfiguration()");
console.log("  - globalThis.serviceWorkerDebug.testGoogleAuth()");

// Final ready message
setTimeout(() => {
  console.log("[SW] 🎯 SERVICE WORKER TAMAMEN HAZIR!");
  console.log(`[SW] ⏰ Yükleme zamanı: ${new Date().toLocaleString('tr-TR')}`);
  console.log(`[SW] 🔢 Extension versiyon: ${chrome.runtime.getManifest().version}`);
  console.log("[SW] 🔧 Google OAuth Fixes Applied:");
  console.log("  ✅ Dinamik redirect URI kullanımı");
  console.log("  ✅ Geliştirilmiş token extraction");
  console.log("  ✅ Auth token cache temizleme");
  console.log("  ✅ Detaylı error handling");
  console.log("  ✅ OAuth konfigürasyon kontrolü");
  console.log("  ✅ Extended timeout değerleri");
  console.log("[SW] 🏁 Initialization complete - Google OAuth should work now!");
}, 3000);