import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { getFirebaseAuth } from '../lib/firebase'

export async function registerEmail(name: string, email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password)
  if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() })
  return cred.user
}

export async function loginEmail(email: string, password: string) {
  return (await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password)).user
}

export async function loginGoogle() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  try {
    return (await signInWithPopup(getFirebaseAuth(), provider)).user
  } catch (e) {
    const code = (e as { code?: string }).code
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(getFirebaseAuth(), provider)
      return null
    }
    throw e
  }
}

export function resetPassword(email: string) {
  return sendPasswordResetEmail(getFirebaseAuth(), email.trim())
}

export function logout() {
  return signOut(getFirebaseAuth())
}

export function authErrorMessage(e: unknown): string {
  const code = (e as { code?: string }).code || ''
  const map: Record<string, string> = {
    'auth/invalid-email': 'Email không hợp lệ.',
    'auth/missing-password': 'Vui lòng nhập mật khẩu.',
    'auth/weak-password': 'Mật khẩu cần ít nhất 6 ký tự.',
    'auth/email-already-in-use': 'Email này đã được đăng ký. Hãy đăng nhập.',
    'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
    'auth/wrong-password': 'Email hoặc mật khẩu không đúng.',
    'auth/user-not-found': 'Không tìm thấy tài khoản với email này.',
    'auth/too-many-requests': 'Thử quá nhiều lần, vui lòng đợi một lát.',
    'auth/popup-closed-by-user': 'Bạn đã đóng cửa sổ đăng nhập Google.',
    'auth/cancelled-popup-request': 'Đã huỷ đăng nhập Google.',
    'auth/network-request-failed': 'Lỗi mạng, vui lòng thử lại.',
    'auth/unauthorized-domain': 'Tên miền này chưa được thêm vào Authorized domains của Firebase.',
    'auth/operation-not-allowed': 'Phương thức đăng nhập này chưa được bật trong Firebase.',
  }
  return map[code] || (e instanceof Error ? e.message : 'Đã có lỗi xảy ra.')
}
