export interface MobileUserSession {
  userId: string;
  fullName: string;
  email: string;
  role: 'patient' | 'doctor' | 'pharmacist' | 'admin';
  avatarUrl?: string;
}

export const MOCK_MOBILE_USER: MobileUserSession = {
  userId: 'usr_patient_demo_101',
  fullName: 'Dr. Ahmad Patient',
  email: 'patient@aetherishealth.com',
  role: 'patient',
};

let currentSession: MobileUserSession = { ...MOCK_MOBILE_USER };

export function getMobileSession(): MobileUserSession {
  return currentSession;
}

export function setMobileSession(session: MobileUserSession): void {
  currentSession = session;
}
