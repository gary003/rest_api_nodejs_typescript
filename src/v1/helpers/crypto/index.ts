import crypto from 'crypto-js'

const secretKey: string = process.env.CRYPTO_SECRET_KEY || ''

if (!secretKey) throw new Error('Please specify a secretKey for encryption')

export const encryptData = async (str: string): Promise<string> => {
  const cipher = crypto.AES.encrypt(str, secretKey)

  const encryptedStr: string = cipher.toString()

  return encryptedStr
}

export const decryptData = async (encryptedData: string): Promise<string> => {
  const bytes = crypto.AES.decrypt(encryptedData, secretKey)

  const decryptedStr: string = bytes.toString(crypto.enc.Utf8)

  return decryptedStr
}
