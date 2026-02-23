import type { ScryptOptions } from 'node:crypto'
import { scrypt, randomBytes } from 'node:crypto'
import { Buffer } from 'node:buffer'

// Syntax is $scrypt$ln=17,r=8,p=1$saltinbase64nopadding$hashinbase64nopadding
interface ParsedPHCScrypt {
  ln: number
  r: number
  p: number
  salt: string
  hash: string
}

function encodePHCScrypt(phc: ParsedPHCScrypt): string {
  return `$scrypt$ln=${phc.ln},r=${phc.r},p=${phc.p}$${phc.salt}$${phc.hash}`
}

function decodePHCScrypt(text: string): ParsedPHCScrypt | undefined {
  try {
    const parts = text.split('$')
    if (parts.length != 5) throw `Parts count should be 5, got ${parts.length}`

    if (parts[0]!.length) throw `Expected string to start with a $ sign`

    if ('scrypt' != parts[1]) throw `Identifier should be scrypt, got ${parts[1]}`

    const params = parts[2]!
    if (!params.length) throw `Params should not be empty`

    const lnAsString = /(^|,)ln=([0-9]+)($|,)/.exec(params)?.[2]
    if (lnAsString == undefined || !lnAsString.length) throw `ln parameter not found in ${params}`
    const ln = Number(lnAsString)
    if (!Number.isInteger(ln)) throw `ln parameter should be integer, got ${ln}`

    const rAsString = /(^|,)r=([0-9]+)($|,)/.exec(params)?.[2]
    if (rAsString == undefined || !rAsString.length) throw `r parameter not found in ${params}`
    const r = Number(rAsString)
    if (!Number.isInteger(r)) throw `r parameter should be integer, got ${r}`

    const pAsString = /(^|,)p=([0-9]+)($|,)/.exec(params)?.[2]
    if (pAsString == undefined || !pAsString.length) throw `p parameter not found in ${params}`
    const p = Number(pAsString)
    if (!Number.isInteger(p)) throw `p parameter should be integer, got ${p}`

    const salt = parts[3]!
    if (!salt.length) throw `Salt should not be empty`
    if (!isBase64(salt)) throw `Salt should be base64 encoded`
    if (salt != unpad(salt)) throw `Salt should not have padding`

    const hash = parts[4]!
    if (!hash.length) throw `Hash should not be empty`
    if (!isBase64(hash)) throw `Hash should be base64 encoded`
    if (hash != unpad(hash)) throw `Hash should not have padding`

    return { ln, r, p, salt, hash }
  }
  catch {
    return undefined
  }
}

function isBase64(text: string): boolean {
  try {
    return Buffer.from(pad(text), 'base64').toString('base64') == pad(text)
  }
  catch {
    return false
  }
}

function pad(unpadded: string): string {
  const mod = unpadded.length % 4
  if (mod == 1) return `${unpadded}===`
  if (mod == 2) return `${unpadded}==`
  if (mod == 3) return `${unpadded}=`
  return unpadded
}

function unpad(padded: string): string {
  return padded.replace(/=+$/, '')
}

export async function generate_salt(length: number = 16): Promise<Buffer> {
  return await new Promise((resolve, reject) => {
    randomBytes(length, (error, buffer) => {
      if (error)
        reject(error)
      else
        resolve(buffer)
    })
  })
}

export const RECOMMENDED_LN = 17
export const RECOMMENDED_R = 8
export const RECOMMENDED_P = 1

export async function hash_password(password: string, salt?: Buffer, phc?: Pick<ParsedPHCScrypt, 'ln' | 'r' | 'p'>): Promise<string | undefined> {
  try {
    if (!salt) salt = await generate_salt()

    if (!phc) phc = { ln: RECOMMENDED_LN, r: RECOMMENDED_R, p: RECOMMENDED_P }

    const options: ScryptOptions = {
      N: Math.pow(2, phc.ln),
      r: phc.r,
      p: phc.p,
    }
    options.maxmem = 128 * options.N! * options.r! * 1.5

    const password_bytes = Buffer.from(password)

    const hash = await new Promise<Buffer>((resolve, reject) => {
      scrypt(password_bytes, salt!, 32, options, (error, derivedKey) => {
        if (error)
          reject(error)
        else
          resolve(derivedKey)
      })
    })

    return encodePHCScrypt({
      ...phc,
      salt: unpad(salt!.toString('base64')),
      hash: unpad(hash.toString('base64')),
    })
  }
  catch {
    return undefined
  }
}

export async function verify_password(provided_password: string, password_hash: string): Promise<boolean> {
  try {
    const phc = decodePHCScrypt(password_hash)
    if (!phc) return false

    const salt = Buffer.from(pad(phc.salt), 'base64')

    const provided_hash = await hash_password(provided_password, salt, phc)

    return provided_hash == password_hash
  }
  catch {
    return false
  }
}
