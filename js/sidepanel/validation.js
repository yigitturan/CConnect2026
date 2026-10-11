import { emailVerificationState } from "./state.js";
import { elements } from "./elements.js";

// ================== PASSWORD VALIDATION ==================
  
  export function validatePassword(password) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
  }
  
  export function validatePasswordMatch(password, confirmPassword) {
  return password === confirmPassword;
  }
  
  export function setupPasswordValidation() {
  if (elements.signupPasswordInput) {
    elements.signupPasswordInput.addEventListener("input", updatePasswordValidation);
  }
  
  if (elements.signupPasswordConfirm) {
    elements.signupPasswordConfirm.addEventListener("input", updatePasswordValidation);
  }
  }
  
  export function updatePasswordValidation() {
  const password = elements.signupPasswordInput?.value || "";
  const confirmPassword = elements.signupPasswordConfirm?.value || "";
  
  const validation = validatePassword(password);
  const passwordsMatch = validatePasswordMatch(password, confirmPassword);
  
  let errorElement = document.getElementById("password-requirements");
  if (!errorElement) {
    errorElement = document.createElement("div");
    errorElement.id = "password-requirements";
    errorElement.className = "password-requirements";
    errorElement.innerHTML = `
      <h4>Password Requirements:</h4>
      <ul></ul>
    `;
    elements.signupPasswordConfirm.parentNode.insertBefore(errorElement, elements.signupPasswordConfirm.nextSibling);
  }
  
  const ul = errorElement.querySelector('ul');
  if (ul) {
    let htmlContent = "";
    
    // Şifre gereksinimleri
    validation.errors.forEach(error => {
      htmlContent += `<li style="color: #f59e0b;">${error}</li>`;
    });
    
    if (validation.isValid) {
      htmlContent += `<li style="color: #10b981;">✓ Password requirements met</li>`;
    }
    
    // Şifre eşleşmesi kontrolü
    if (confirmPassword) {
      if (passwordsMatch) {
        htmlContent += `<li style="color: #10b981;">✓ Passwords match</li>`;
      } else {
        htmlContent += `<li style="color: #f59e0b;">Passwords do not match</li>`;
      }
    }
    
    ul.innerHTML = htmlContent;
  }
  
  // Form validation
  const isFormValid = validation.isValid && passwordsMatch && confirmPassword;
  
  // Update Send Verification button state
  if (elements.sendVerificationBtn && !emailVerificationState.isVerifying) {
    elements.sendVerificationBtn.disabled = !isFormValid;
  }
  }
