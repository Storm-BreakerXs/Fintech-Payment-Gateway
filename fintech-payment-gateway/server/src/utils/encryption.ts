import CryptoJS from 'crypto-js'
import { config } from '../config/env'

export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, config.encryptionKey).toString()
}

export function decrypt(encryptedText: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedText, config.encryptionKey)
  return bytes.toString(CryptoJS.enc.Utf8)
}

export function hashData(data: string): string {
  return CryptoJS.SHA256(data).toString()
}
