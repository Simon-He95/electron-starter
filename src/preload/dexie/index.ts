import { Buffer } from 'node:buffer'
import crypto from 'node:crypto'
// 生成一个 class 作为基础类，支持加密/解密
import * as DexiePkg from 'dexie'

export interface CipherDaoConfig {
  dbName: string
  secret: string
}

// 兼容 dexie 在不同 TS/ESM 配置下的导出
const DexieRuntime: any = (DexiePkg as any).default ?? DexiePkg

export abstract class CipherDao extends DexieRuntime {
  // 继承类实现db的申明
  secret: string
  // 放宽类型以避免在 preload 环境或不同 tsconfig 下的类型冲突
  _db: any
  constructor(config: CipherDaoConfig) {
    super(config.dbName)
    this.secret = config.secret
    this.version(1).stores({
      _db: 'key',
    })

    this._db = this.table('_db')
  }

  // 加密put
  async put(doc: { key: string, value: string }) {
    // 对 key 和 value 做 AES-128-ECB 加密（需要 16 字节 key）
    const keyBuf = Buffer.from(this.secret, 'utf8').slice(0, 16)
    const cipherV = crypto.createCipheriv('aes-128-ecb', keyBuf, null)
    let encryptedValue = cipherV.update(doc.value, 'utf8', 'hex')
    encryptedValue += cipherV.final('hex')
    const cipherKey = crypto.createCipheriv('aes-128-ecb', keyBuf, null)
    let encryptedKey = cipherKey.update(doc.key, 'utf8', 'hex')
    encryptedKey += cipherKey.final('hex')
    const encryptedDoc = {
      key: encryptedKey,
      value: encryptedValue,
    }
    await this._db.put(encryptedDoc)
  }

  async get(key: string) {
    const keyBuf = Buffer.from(this.secret, 'utf8').slice(0, 16)
    const cipherKey = crypto.createCipheriv('aes-128-ecb', keyBuf, null)
    let encryptedKey = cipherKey.update(key, 'utf8', 'hex')
    encryptedKey += cipherKey.final('hex')
    const doc = await this._db.get(encryptedKey)
    if (!doc)
      return null
    const decipher = crypto.createDecipheriv('aes-128-ecb', keyBuf, null)
    let decrypted = decipher.update(doc.value, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }

  async remove(key: string) {
    const keyBuf = Buffer.from(this.secret, 'utf8').slice(0, 16)
    const cipherKey = crypto.createCipheriv('aes-128-ecb', keyBuf, null)
    let encryptedKey = cipherKey.update(key, 'utf8', 'hex')
    encryptedKey += cipherKey.final('hex')
    await this._db.delete(encryptedKey)
  }
}

// 简单的 TokenDao，用于存取登录 token
export class TokenDao extends CipherDao {
  constructor() {
    // NOTE: AES-128-ECB 需要 16 字节 key；这里做合理的默认（可根据需要改为从安全源注入）
    // Assumption: using a fixed 16-byte secret for demo purposes
    super({ dbName: 'cipher-db', secret: '1234567890123456' })
  }

  async setToken(token: string) {
    await this.put({ key: 'auth_token', value: token })
  }

  async getToken(): Promise<string | null> {
    return (await this.get('auth_token')) as string | null
  }

  async removeToken() {
    await this.remove('auth_token')
  }

  // username helpers
  async setUsername(name: string) {
    await this.put({ key: 'username', value: name })
  }

  async getUsername(): Promise<string | null> {
    return (await this.get('username')) as string | null
  }

  async removeUsername() {
    await this.remove('username')
  }
}

// 导出一个单例，preload 可直接使用
export const tokenDao = new TokenDao()
