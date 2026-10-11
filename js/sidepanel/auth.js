import { setSocialSession } from './social/api.js';
import { startFriends } from './social/controller.js';
import { appState, emailVerificationState } from "./state.js";
import { elements } from "./elements.js";
import { showMessage, isValidEmail } from "./utils.js";
import { sendToBackground } from "./background.js";
import { initEmailVerification, verifyEmailCode, resetEmailVerificationState } from "./email-verification.js";
import { cleanup } from "./lifecycle.js";

// ================== AUTHENTICATION SYSTEM ==================
  
  export function initAuth() {
  // Show/Hide links
  if (elements.showSignupLink) {
    elements.showSignupLink.addEventListener("click", (e) => {
      e.preventDefault();
      showSignupForm();
    });
  }
  
  if (elements.showLoginLink) {
    elements.showLoginLink.addEventListener("click", (e) => {
      e.preventDefault();
      showLoginForm();
    });
  }
  
  // Auth buttons
  if (elements.loginBtn) {
    elements.loginBtn.addEventListener("click", handleLogin);
  }
  
  if (elements.signupBtn) {
    elements.signupBtn.addEventListener("click", handleSignup);
  }
  
  if (elements.googleLoginBtn) {
    elements.googleLoginBtn.addEventListener("click", handleGoogleLogin);
  }
  
  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener("click", handleLogout);
  }
  
  // Initialize email verification
  initEmailVerification();
  
  console.log("🔐 Auth system initialized");
  }
  
  export function showSignupForm() {
  if (elements.loginScreen) elements.loginScreen.classList.add("hidden");
  if (elements.signupScreen) elements.signupScreen.classList.remove("hidden");
  resetEmailVerificationState();
  }
  
  export function showLoginForm() {
  if (elements.signupScreen) elements.signupScreen.classList.add("hidden");
  if (elements.loginScreen) elements.loginScreen.classList.remove("hidden");
  resetEmailVerificationState();
  }
  
  export async function handleLogin() {
  const email = elements.emailInput?.value?.trim();
  const password = elements.passwordInput?.value?.trim();
  
  if (!email || !password) {
    showMessage("Please fill in all fields!", true);
    return;
  }
  
  if (!isValidEmail(email)) {
    showMessage("Please enter a valid email address!", true);
    return;
  }
  
  try {
    elements.loginBtn.disabled = true;
    showMessage("Signing in...");
    
    const response = await sendToBackground("login", { email, password });
    
    if (response.success) {
      appState.currentUser = response.nickname || email.split('@')[0];
      appState.currentUserId = response.userId || "";
      setSocialSession(response);
      showAppInterface();
      await startFriends();
      showMessage(`Welcome back, ${appState.currentUser}!`);
    } else {
      throw new Error(response.error || "Login failed");
    }
    
  } catch (error) {
    console.error("Login error:", error);
    showMessage("Login failed: " + error.message, true);
  } finally {
    elements.loginBtn.disabled = false;
  }
  }
  
  export async function handleSignup() {
  if (!emailVerificationState.emailSent) {
    showMessage("Please send verification code first!", true);
    return;
  }
  
  const code = elements.verificationCodeInput?.value?.trim();
  if (!code || code.length !== 6) {
    showMessage("Please enter the 6-digit verification code!", true);
    return;
  }
  
  await verifyEmailCode(code);
  }
  
  export async function handleGoogleLogin() {
  try {
    elements.googleLoginBtn.disabled = true;
    showMessage("Opening Google sign-in...");
    
    const response = await sendToBackground("googleLogin", {});
    
    if (response.success) {
      appState.currentUser = response.nickname || "User";
      appState.currentUserId = response.userId || "";
      setSocialSession(response);
      showAppInterface();
      await startFriends();
      showMessage(`Welcome, ${appState.currentUser}!`);
    } else {
      throw new Error(response.error || "Google login failed");
    }
    
  } catch (error) {
    console.error("Google login error:", error);
    showMessage("Google login failed: " + error.message, true);
  } finally {
    elements.googleLoginBtn.disabled = false;
  }
  }
  
  export async function handleLogout() {
  try {
    showMessage("Signing out...");
    
    const response = await sendToBackground("logout", {});
    
    cleanup();
    showLoginForm();
    
    // Clear user data
    appState.currentUser = "";
    appState.currentUserId = "";
    appState.currentVideoRoom = "";
    appState.currentChatRoom = "";
    
    showMessage("Signed out successfully");
    
  } catch (error) {
    console.error("Logout error:", error);
    showMessage("Logout error: " + error.message, true);
  }
  }
  
  export function showAppInterface() {
  if (elements.loginScreen) elements.loginScreen.classList.add("hidden");
  if (elements.signupScreen) elements.signupScreen.classList.add("hidden");
  if (elements.appContainer) elements.appContainer.classList.remove("hidden");
  
  console.log("✅ App interface shown");
  }
