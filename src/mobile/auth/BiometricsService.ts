/**
 * CampusFoundry Mobile - Biometric Security Service
 * Scaffolds Expo LocalAuthentication (FaceID, TouchID, Android Biometrics)
 * with graceful fallback for web and development simulation.
 */

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometricType?: 'FACE_ID' | 'FINGERPRINT' | 'IRIS' | 'NONE';
}

const STORAGE_BIOMETRIC_PREF_KEY = 'campusfoundry_biometric_enabled';
const STORAGE_BIOMETRIC_TOKEN_KEY = 'campusfoundry_biometric_token';

export class BiometricsService {
  /**
   * Checks whether the device hardware supports biometric authentication
   */
  static async isHardwareSupported(): Promise<boolean> {
    try {
      // In production Expo React Native:
      // const LocalAuthentication = require('expo-local-authentication');
      // return await LocalAuthentication.hasHardwareAsync();
      if (typeof window !== 'undefined' && window.PublicKeyCredential) {
        return true;
      }
      return true; // Supported in mobile context
    } catch {
      return false;
    }
  }

  /**
   * Checks whether biometric credentials (fingerprint/face) are enrolled
   */
  static async isEnrolled(): Promise<boolean> {
    try {
      // In production Expo React Native:
      // const LocalAuthentication = require('expo-local-authentication');
      // return await LocalAuthentication.isEnrolledAsync();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets the active biometric sensor type (Face ID vs Fingerprint)
   */
  static async getBiometricType(): Promise<'FACE_ID' | 'FINGERPRINT' | 'NONE'> {
    // Detect iOS vs Android user-agent or native platform
    const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
    return isIOS ? 'FACE_ID' : 'FINGERPRINT';
  }

  /**
   * Prompts user for biometric unlock
   */
  static async authenticateUser(promptMessage: string = 'Scan Face ID or Fingerprint to unlock CampusFoundry'): Promise<BiometricAuthResult> {
    const type = await this.getBiometricType();

    try {
      // In production Expo:
      // const LocalAuthentication = require('expo-local-authentication');
      // const result = await LocalAuthentication.authenticateAsync({
      //   promptMessage,
      //   fallbackLabel: 'Use UNILORIN Student Password / OTP',
      //   disableDeviceFallback: false,
      // });
      // return { success: result.success, biometricType: type, error: result.error };

      // In web/preview environment, simulate biometric prompt
      const isEnabled = this.isBiometricsEnabled();
      if (!isEnabled) {
        return {
          success: false,
          error: 'Biometrics not yet enabled for this device',
          biometricType: type,
        };
      }

      return {
        success: true,
        biometricType: type,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Biometric authentication failed',
        biometricType: type,
      };
    }
  }

  /**
   * Enables or disables biometrics for the logged-in student
   */
  static setBiometricsEnabled(enabled: boolean, studentEmail?: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_BIOMETRIC_PREF_KEY, JSON.stringify(enabled));
        if (enabled && studentEmail) {
          localStorage.setItem(STORAGE_BIOMETRIC_TOKEN_KEY, studentEmail);
        } else if (!enabled) {
          localStorage.removeItem(STORAGE_BIOMETRIC_TOKEN_KEY);
        }
      }
    } catch (e) {
      console.warn('Storage error saving biometric preference:', e);
    }
  }

  /**
   * Returns whether biometrics is active for this device
   */
  static isBiometricsEnabled(): boolean {
    try {
      if (typeof localStorage !== 'undefined') {
        const val = localStorage.getItem(STORAGE_BIOMETRIC_PREF_KEY);
        return val ? JSON.parse(val) : false;
      }
    } catch {}
    return false;
  }

  /**
   * Gets the stored student email linked to biometric credentials
   */
  static getStoredBiometricEmail(): string | null {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(STORAGE_BIOMETRIC_TOKEN_KEY);
      }
    } catch {}
    return null;
  }
}
