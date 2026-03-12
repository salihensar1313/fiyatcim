/** Password validation rules — single source of truth */
export const PASSWORD_MIN_LENGTH = 8;

export interface PasswordValidation {
  valid: boolean;
  error?: string;
  strength: number; // 0-4
  label: string;
}

export function validatePassword(password: string): PasswordValidation {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Şifre en az ${PASSWORD_MIN_LENGTH} karakter olmalıdır.`, strength: 0, label: "Çok Kısa" };
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (!hasUppercase || !hasLowercase) {
    return { valid: false, error: "Şifre en az bir büyük ve bir küçük harf içermelidir.", strength: 1, label: "Zayıf" };
  }

  if (!hasNumber) {
    return { valid: false, error: "Şifre en az bir rakam içermelidir.", strength: 2, label: "Orta" };
  }

  // Password is valid from here
  const strength = 2 + (hasSpecial ? 1 : 0) + (password.length >= 12 ? 1 : 0);
  const label = strength <= 2 ? "Güçlü" : strength === 3 ? "Çok Güçlü" : "Mükemmel";

  return { valid: true, strength, label };
}

/** Password strength for UI indicator (0-4 bars) */
export function getPasswordStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= PASSWORD_MIN_LENGTH) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}
