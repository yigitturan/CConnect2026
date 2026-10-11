import { appState, emailVerificationState } from "./state.js";
import { elements } from "./elements.js";
import { showMessage, generateVerificationCode, isValidEmail } from "./utils.js";
import { validatePassword, validatePasswordMatch } from "./validation.js";
import { sendToBackground } from "./background.js";

// ================== REAL EMAIL VERIFICATION SYSTEM ==================
  
  export function initEmailVerification() {
  if (elements.sendVerificationBtn) {
    elements.sendVerificationBtn.addEventListener("click", sendVerificationCode);
  }
  
  if (elements.verificationCodeInput) {
    elements.verificationCodeInput.addEventListener("input", handleVerificationCodeInput);
  }
  }
  
  // *** GERÇEK EMAIL GÖNDERME FONKSİYONU ***
  
  
  // *** GÜNCELLENMIŞ EMAIL GÖNDERME FONKSİYONU ***
export async function sendRealEmail(email, verificationCode, nickname) {
  try {
    console.log("📧 Firebase Extensions ile email gönderiliyor...");
    
    // Firebase Extensions'ın OAuth2 ile beklediği EXACT format
    const emailData = {
      to: email, // Array değil, string olarak
      from: "yigit.trv@gmail.com", // Extensions config'deki default FROM
      message: {
        subject: 'Cconnect - Email Verification Code',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cconnect Email Verification</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f3f4f6;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Cconnect</h1>
                <p style="color: #e2e8f0; margin: 10px 0 0 0; font-size: 16px;">Video Call & Chat Platform</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Welcome, ${nickname}!</h2>
                <p style="color: #6b7280; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
                  Thank you for joining Cconnect! To complete your registration, please verify your email address using the code below.
                </p>
                
                <!-- Verification Code Box -->
                <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border: 2px solid #6366f1; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                  <p style="color: #6b7280; margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                  <h1 style="color: #6366f1; margin: 0; font-size: 36px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">${verificationCode}</h1>
                </div>
                
                <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 30px 0;">
                  <p style="color: #92400e; margin: 0; font-size: 14px;">
                    ⏰ <strong>Important:</strong> This code will expire in 10 minutes for security reasons.
                  </p>
                </div>
                
                <div style="margin: 30px 0;">
                  <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">What's Next?</h3>
                  <ol style="color: #6b7280; padding-left: 20px; line-height: 1.8;">
                    <li>Copy the 6-digit code above</li>
                    <li>Return to the Cconnect extension</li>
                    <li>Paste the code in the verification field</li>
                    <li>Click "Create Account" to complete registration</li>
                  </ol>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; margin: 0 0 10px 0; font-size: 14px;">
                  If you didn't request this verification, please ignore this email.
                </p>
                <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                  © 2024 Cconnect. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `Welcome to Cconnect, ${nickname}!\n\nYour email verification code is: ${verificationCode}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this verification, please ignore this email.\n\n© 2024 Cconnect. All rights reserved.`
      }
    };
    
    // Firebase Firestore'a email document'ı ekle
    const docRef = await firebase.firestore().collection('mail').add(emailData);
    console.log("✅ Email document created with ID:", docRef.id);
    
    // Email gönderim durumunu kontrol et
    return await waitForEmailDelivery(docRef.id);
    
  } catch (error) {
    console.error("❌ Email gönderme hatası:", error);
    
    // Detaylı hata analizi
    if (error.code === 'permission-denied') {
      console.error("🚫 Firestore permission denied");
      console.error("📋 Çözüm: Firebase Console → Firestore → Rules");
    } else if (error.code === 'unauthenticated') {
      console.error("🔐 Authentication gerekli - Firebase Auth kurulmalı");
    }
    
    return false;
  }
}

// Email gönderim durumunu kontrol et (yeni fonksiyon)
// Test email fonksiyonu (debug için)
export async function testEmailConfiguration() {
  try {
    console.log("🔍 Email konfigürasyonu test ediliyor...");
    
    const testEmailData = {
      to: "yigit.trv@gmail.com", // Kendi email'iniz
      from: "yigit.trv@gmail.com",
      message: {
        subject: 'Cconnect Email Test',
        text: 'Bu bir test emailidir. Firebase Extensions çalışıyor!',
        html: '<h1>Test Email</h1><p>Firebase Extensions başarıyla çalışıyor!</p>'
      }
    };
    
    const docRef = await firebase.firestore().collection('mail').add(testEmailData);
    console.log("✅ Test email document oluşturuldu:", docRef.id);
    
    const result = await waitForEmailDelivery(docRef.id, 10000);
    
    if (result) {
      console.log("✅ Email sistemi çalışıyor!");
      showMessage("Email sistemi test edildi - çalışıyor!");
      return true;
    } else {
      console.log("❌ Email sistemi çalışmıyor");
      showMessage("Email sistemi test edildi - problem var!", true);
      return false;
    }
    
  } catch (error) {
    console.error("❌ Email test hatası:", error);
    return false;
  }
}

// GÜNCELLENMIŞ sendVerificationCode fonksiyonu
// *** SADECE GERÇEK EMAIL - MOCK YOK ***

// sendVerificationCode fonksiyonunu bu kodla değiştirin
export async function sendVerificationCode() {
  const email = elements.signupEmailInput?.value?.trim();
  const password = elements.signupPasswordInput?.value?.trim();
  const confirmPassword = elements.signupPasswordConfirm?.value?.trim();
  const nickname = elements.nicknameInput?.value?.trim();
  
  // Validasyonlar
  if (!email || !password || !confirmPassword || !nickname) {
    showMessage("Lütfen tüm alanları doldurun!", true);
    return;
  }
  
  if (!isValidEmail(email)) {
    showMessage("Geçerli bir email adresi girin!", true);
    return;
  }
  
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    showMessage("Şifre gereksinimlerini karşılamıyor!", true);
    return;
  }
  
  if (!validatePasswordMatch(password, confirmPassword)) {
    showMessage("Şifreler eşleşmiyor!", true);
    return;
  }
  
  if (nickname.trim().length < 2) {
    showMessage("Görünen ad en az 2 karakter olmalı!", true);
    return;
  }
  
  // SADECE GERÇEK EMAIL GÖNDERİMİ
  try {
    elements.sendVerificationBtn.disabled = true;
    showMessage("Email gönderiliyor...");
    
    const verificationCode = generateVerificationCode();
    const expiresAt = Date.now() + (10 * 60 * 1000);
    
    console.log("📧 GERÇEK email gönderme başlatılıyor...");
    console.log("📬 Alıcı:", email);
    console.log("🔑 Kod:", verificationCode);
    
    // Firebase Extensions ile gerçek email gönder
    const emailSent = await sendRealEmailFixed(email, verificationCode, nickname);
    
    if (!emailSent) {
      throw new Error("Email gönderilemedi. Firebase Extensions konfigürasyonu kontrol edilmeli.");
    }
    
    // Firebase verification kaydı
    await appState.database.ref(`emailVerifications/${btoa(email)}`).set({
      email: email,
      code: verificationCode,
      expiresAt: expiresAt,
      userData: {
        password: password,
        nickname: nickname
      },
      timestamp: Date.now()
    });
    
    console.log("✅ Verification kaydı Firebase'e eklendi");
    
    // State güncelle
    emailVerificationState.pendingEmail = email;
    emailVerificationState.verificationCode = verificationCode;
    emailVerificationState.codeExpiresAt = expiresAt;
    emailVerificationState.emailSent = true;
    
    // UI güncelle
    showVerificationSection();
    startVerificationTimer();
    
    showMessage(`✅ Doğrulama kodu ${email} adresine gönderildi! Email'inizi kontrol edin.`);
    
    // Debug bilgisi
    console.log("📋 EMAIL DEBUG INFO:");
    console.log("Email:", email);
    console.log("Code:", verificationCode);
    console.log("Expires:", new Date(expiresAt).toLocaleString());
    
  } catch (error) {
    console.error("❌ Email gönderme hatası:", error);
    showMessage(`Email gönderilemedi: ${error.message}. Firebase Extensions ayarlarını kontrol edin.`, true);
  } finally {
    elements.sendVerificationBtn.disabled = false;
  }
}

// Düzeltilmiş gerçek email fonksiyonu
export async function sendRealEmailFixed(email, verificationCode, nickname) {
  try {
    console.log("📧 Firebase Extensions OAuth2 ile email gönderiliyor...");
    
    // Firebase Extensions'ın beklediği EXACT format
    const emailData = {
      to: email,
      message: {
        subject: 'Cconnect - Email Verification Code',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cconnect Email Verification</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
            <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">Cconnect</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Video Call & Chat Platform</p>
              </div>
              
              <!-- Main Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Welcome, ${nickname}!</h2>
                <p style="color: #6b7280; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
                  Thank you for joining Cconnect! To complete your registration, please verify your email address using the verification code below.
                </p>
                
                <!-- Verification Code Box -->
                <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 3px solid #6366f1; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                  <p style="color: #6b7280; margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Your Verification Code</p>
                  <h1 style="color: #6366f1; margin: 0; font-size: 42px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">${verificationCode}</h1>
                </div>
                
                <!-- Warning Box -->
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                  <p style="color: #92400e; margin: 0; font-size: 14px; font-weight: 500;">
                    ⏰ <strong>Important:</strong> This verification code will expire in 10 minutes for security reasons.
                  </p>
                </div>
                
                <!-- Instructions -->
                <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0;">
                  <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Next Steps:</h3>
                  <ol style="color: #6b7280; padding-left: 20px; line-height: 1.8; margin: 0;">
                    <li style="margin-bottom: 8px;">Copy the 6-digit verification code above</li>
                    <li style="margin-bottom: 8px;">Return to the Cconnect extension</li>
                    <li style="margin-bottom: 8px;">Paste the code in the verification field</li>
                    <li style="margin-bottom: 8px;">Click "Create Account" to complete registration</li>
                  </ol>
                </div>
                
                <!-- Features Preview -->
                <div style="margin: 30px 0;">
                  <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">What's waiting for you:</h3>
                  <div style="display: flex; flex-wrap: wrap; gap: 15px;">
                    <div style="flex: 1; min-width: 200px; background: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #0ea5e9;">
                      <h4 style="color: #0369a1; margin: 0 0 8px 0; font-size: 14px;">🎥 Video Call</h4>
                      <p style="color: #64748b; margin: 0; font-size: 13px;">Talk face to face with friends</p>
                    </div>
                    <div style="flex: 1; min-width: 200px; background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e;">
                      <h4 style="color: #16a34a; margin: 0 0 8px 0; font-size: 14px;">💬 Real-time Chat</h4>
                      <p style="color: #64748b; margin: 0; font-size: 13px;">Chat with friends in real time</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; margin: 0 0 8px 0; font-size: 14px;">
                  If you didn't request this verification, please ignore this email.
                </p>
                <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                  © 2024 Cconnect. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `Cconnect Email Verification

Hello ${nickname}!

Thank you for joining Cconnect! Your email verification code is:

${verificationCode}

This code will expire in 10 minutes.

Instructions:
1. Copy the 6-digit code above
2. Return to the Cconnect extension
3. Paste the code in the verification field
4. Click "Create Account" to complete registration

If you didn't request this verification, please ignore this email.

© 2024 Cconnect. All rights reserved.`
      }
    };
    
    // Firebase Firestore'a email gönderme talebi
    const docRef = await firebase.firestore().collection('mail').add(emailData);
    console.log("✅ Email document created with ID:", docRef.id);
    
    // Email gönderim durumunu kontrol et
    const deliveryResult = await waitForEmailDelivery(docRef.id, 20000);
    
    if (deliveryResult) {
      console.log("✅ Email başarıyla gönderildi!");
      return true;
    } else {
      console.error("❌ Email gönderimi başarısız");
      return false;
    }
    
  } catch (error) {
    console.error("❌ Email gönderme hatası:", error);
    
    // Detaylı hata analizi
    if (error.code === 'permission-denied') {
      console.error("🚫 Firestore permission denied - Rules kontrol edin");
      throw new Error("Firestore izin hatası. Firebase Console'da Rules ayarlarını kontrol edin.");
    } else if (error.code === 'unauthenticated') {
      console.error("🔐 Authentication gerekli");
      throw new Error("Firebase Authentication gerekli.");
    } else if (error.message?.includes('SSL') || error.message?.includes('ssl3_get_record')) {
      console.error("🔒 SSL bağlantı hatası");
      throw new Error("SSL bağlantı hatası. Firebase Extensions OAuth2 ayarlarını kontrol edin.");
    }
    
    throw error;
  }
}

// Geliştirilmiş email delivery kontrol
export async function waitForEmailDelivery(docId, maxWaitTime = 20000) {
  const startTime = Date.now();
  let attempts = 0;
  const maxAttempts = Math.floor(maxWaitTime / 1000);
  
  return new Promise((resolve) => {
    const checkStatus = async () => {
      attempts++;
      
      try {
        const doc = await firebase.firestore().collection('mail').doc(docId).get();
        const data = doc.data();
        const elapsed = Date.now() - startTime;
        
        console.log(`📊 Email status check (${attempts}/${maxAttempts}):`, data?.delivery?.state || 'PENDING');
        
        if (data?.delivery) {
          if (data.delivery.state === 'SUCCESS') {
            console.log("✅ Email delivery confirmed!");
            resolve(true);
            return;
          } else if (data.delivery.state === 'ERROR') {
            console.error("❌ Email delivery error:", data.delivery.error);
            console.error("🔧 Firebase Extensions error details:", data.delivery);
            resolve(false);
            return;
          }
        }
        
        if (elapsed >= maxWaitTime || attempts >= maxAttempts) {
          console.log("⏰ Email delivery timeout reached");
          console.log("📋 Final document state:", data);
          
          // Eğer hiç delivery bilgisi yoksa Extensions çalışmıyor demektir
          if (!data?.delivery) {
            console.error("❌ Firebase Extensions çalışmıyor - delivery field yok");
            resolve(false);
          } else {
            // PROCESSING state'inde kalıyorsa muhtemelen başarılı
            resolve(data.delivery.state !== 'ERROR');
          }
          return;
        }
        
        // 1 saniye sonra tekrar kontrol et
        setTimeout(checkStatus, 1000);
        
      } catch (error) {
        console.error("❌ Email status check error:", error);
        resolve(false);
      }
    };
    
    // İlk kontrol hemen başlat
    checkStatus();
  });
}

// Firebase Extensions durumunu kontrol et
export async function checkFirebaseExtensionsStatus() {
  try {
    console.log("🔍 Firebase Extensions durumu kontrol ediliyor...");
    
    // Test email gönder
    const testData = {
      to: "yigit.trv@gmail.com",
      message: {
        subject: "Cconnect Extensions Test",
        text: "Bu bir Firebase Extensions test email'idir.",
        html: "<h1>Test Email</h1><p>Firebase Extensions çalışıyor!</p>"
      }
    };
    
    const docRef = await firebase.firestore().collection('mail').add(testData);
    console.log("✅ Test email document oluşturuldu:", docRef.id);
    
    // 10 saniye bekle ve sonucu kontrol et
    setTimeout(async () => {
      try {
        const doc = await firebase.firestore().collection('mail').doc(docRef.id).get();
        const data = doc.data();
        
        console.log("📊 Extensions test result:", data);
        
        if (data?.delivery) {
          if (data.delivery.state === 'SUCCESS') {
            console.log("✅ Firebase Extensions çalışıyor!");
            showMessage("Firebase Extensions test başarılı!");
          } else if (data.delivery.state === 'ERROR') {
            console.error("❌ Extensions error:", data.delivery.error);
            showMessage("Firebase Extensions hatası: " + data.delivery.error, true);
          } else {
            console.log("⏳ Extensions hala processing...");
            showMessage("Extensions yavaş çalışıyor, tekrar deneyin.");
          }
        } else {
          console.error("❌ Extensions çalışmıyor - delivery field yok");
          showMessage("Firebase Extensions kurulmamış veya çalışmıyor!", true);
        }
      } catch (error) {
        console.error("❌ Test result check error:", error);
      }
    }, 10000);
    
  } catch (error) {
    console.error("❌ Extensions status check error:", error);
    showMessage("Extensions status check failed!", true);
  }
}

// Global debug function
window.checkFirebaseExtensions = checkFirebaseExtensionsStatus;

console.log("📧 Real Email Only System Loaded");
console.log("🛠️ Debug command: window.checkFirebaseExtensions()");


// Debug fonksiyonu - console'dan test edebilirsiniz
window.testEmail = testEmailConfiguration;


  export function showVerificationSection() {
  if (elements.verificationSection) {
    elements.verificationSection.classList.remove("hidden");
  }
  
  if (elements.sendVerificationBtn) {
    elements.sendVerificationBtn.innerHTML = `
      <svg class="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
        <polyline points="22,6 12,13 2,6"></polyline>
      </svg>
      <span>Resend Code</span>
    `;
    elements.sendVerificationBtn.disabled = true; // Cooldown için
  }
  
  if (elements.signupBtn) {
    elements.signupBtn.classList.remove("hidden");
  }
  }
  
  export function startVerificationTimer() {
  let timeLeft = 60; // 60 saniye cooldown
  
  emailVerificationState.timer = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(emailVerificationState.timer);
      if (elements.sendVerificationBtn) {
        elements.sendVerificationBtn.disabled = false;
      }
      if (elements.verificationTimerText) {
        elements.verificationTimerText.textContent = "Code expired. Click to resend email.";
      }
      return;
    }
    
    if (elements.verificationTimerText) {
      elements.verificationTimerText.textContent = `Email sent! Check your inbox. Resend in ${timeLeft}s`;
    }
    timeLeft--;
  }, 1000);
  }
  
  export function handleVerificationCodeInput(event) {
  const code = event.target.value.trim();
  
  // Sadece rakam kabul et
  event.target.value = code.replace(/[^0-9]/g, '');
  
  if (code.length === 6) {
    verifyEmailCode(code);
  }
  }
  
  export async function verifyEmailCode(enteredCode) {
  if (emailVerificationState.isVerifying) return;
  
  try {
    emailVerificationState.isVerifying = true;
    showMessage("Kod doğrulanıyor...");
    
    // Zaman aşımı kontrolü
    if (Date.now() > emailVerificationState.codeExpiresAt) {
      showMessage("Doğrulama kodu süresi dolmuş! Yeni kod isteyin.", true);
      elements.verificationCodeInput.value = "";
      return;
    }
    
    // Kod kontrolü
    if (enteredCode !== emailVerificationState.verificationCode) {
      showMessage("Doğrulama kodu yanlış! Tekrar deneyin.", true);
      elements.verificationCodeInput.value = "";
      
      // Input'a error animasyonu ekle
      elements.verificationCodeInput.classList.add('verification-error');
      setTimeout(() => {
        elements.verificationCodeInput.classList.remove('verification-error');
      }, 500);
      return;
    }
    
    // Kod doğru - hesap oluştur
    await createVerifiedAccount();
    
  } catch (error) {
    console.error("Kod doğrulama hatası:", error);
    showMessage("Doğrulama sırasında hata oluştu!", true);
  } finally {
    emailVerificationState.isVerifying = false;
  }
  }
  
  export async function createVerifiedAccount() {
  try {
    showMessage("Hesap oluşturuluyor...");
    
    // Firebase'den geçici veriyi al
const verificationRef = appState.database.ref(`emailVerifications/${btoa(emailVerificationState.pendingEmail)}`);
const snapshot = await verificationRef.once('value');
const verificationData = snapshot.val();

if (!verificationData) {
 throw new Error("Doğrulama verisi bulunamadı");
}

// Firebase Authentication ile hesap oluştur
const response = await sendToBackground("signup", {
 email: verificationData.email,
 password: verificationData.userData.password,
 nickname: verificationData.userData.nickname
});

if (response.success) {
 // Geçici veriyi temizle
 await verificationRef.remove();
 
 // Timer'ı temizle
 if (emailVerificationState.timer) {
   clearInterval(emailVerificationState.timer);
 }
 
 // Success animasyonu
 elements.verificationCodeInput.classList.add('verification-success');
 
 // State'i sıfırla
 resetEmailVerificationState();
 
 showMessage("🎉 Hesap başarıyla oluşturuldu! Giriş yapabilirsiniz.");
 
 // Login ekranına dön
 setTimeout(() => {
   if (elements.signupScreen) elements.signupScreen.classList.add("hidden");
   if (elements.loginScreen) elements.loginScreen.classList.remove("hidden");
   
   // Email'i login formuna doldur
   if (elements.emailInput) elements.emailInput.value = verificationData.email;
 }, 2000);
 
} else {
 throw new Error(response.error || "Hesap oluşturma başarısız");
}

} catch (error) {
console.error("Hesap oluşturma hatası:", error);
showMessage("Hesap oluşturulamadı: " + error.message, true);
}
}

// ================== COMPLETE resetEmailVerificationState() FUNCTION ==================

export function resetEmailVerificationState() {
Object.assign(emailVerificationState, {
 pendingEmail: "",
 verificationCode: "",
 codeExpiresAt: 0,
 isVerifying: false,
 timer: null,
 emailSent: false
});

// UI'ı sıfırla
if (elements.verificationSection) {
 elements.verificationSection.classList.add("hidden");
}

if (elements.verificationCodeInput) {
 elements.verificationCodeInput.value = "";
 elements.verificationCodeInput.classList.remove('verification-success', 'verification-error');
}

if (elements.signupBtn) {
 elements.signupBtn.classList.add("hidden");
}

if (elements.sendVerificationBtn) {
 elements.sendVerificationBtn.innerHTML = `
   <svg class="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
     <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
     <polyline points="22,6 12,13 2,6"></polyline>
   </svg>
   <span>Send Verification Code</span>
 `;
 elements.sendVerificationBtn.disabled = false;
}

// Clear form
if (elements.signupEmailInput) elements.signupEmailInput.value = "";
if (elements.signupPasswordInput) elements.signupPasswordInput.value = "";
if (elements.signupPasswordConfirm) elements.signupPasswordConfirm.value = "";
if (elements.nicknameInput) elements.nicknameInput.value = "";

// Clear verification timer text
if (elements.verificationTimerText) {
 elements.verificationTimerText.textContent = "";
}

// Clear timer if exists
if (emailVerificationState.timer) {
 clearInterval(emailVerificationState.timer);
 emailVerificationState.timer = null;
}

console.log("🧹 Email verification state reset");
}
