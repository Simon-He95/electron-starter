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
      _db: 'key'
    })

    this._db = this.table('_db')
  }

  // 加密put
  async put(doc: { key: string; value: string }) {
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
      value: encryptedValue
    }
    await this._db.put(encryptedDoc)
  }

  async get(key: string) {
    const keyBuf = Buffer.from(this.secret, 'utf8').slice(0, 16)
    const cipherKey = crypto.createCipheriv('aes-128-ecb', keyBuf, null)
    let encryptedKey = cipherKey.update(key, 'utf8', 'hex')
    encryptedKey += cipherKey.final('hex')
    const doc = await this._db.get(encryptedKey)
    if (!doc) return null
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
