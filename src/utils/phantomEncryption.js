import nacl from "tweetnacl";
import bs58 from "bs58";
import { WALLET_CONFIG } from '@/config/wallet.config';

export class PhantomEncryption {
  static getStoredKeys() {
    const phantomPublicKey = localStorage.getItem(WALLET_CONFIG.STORAGE_KEYS.PUBLIC_KEY);
    const secretKeyBase58 = localStorage.getItem(WALLET_CONFIG.STORAGE_KEYS.CONNECTION_SECRET_KEY);
    const dappPublicKey = localStorage.getItem(WALLET_CONFIG.STORAGE_KEYS.CONNECTION_PUBLIC_KEY);

    if (!phantomPublicKey || !secretKeyBase58 || !dappPublicKey) {
      throw new Error("Missing encryption keys. Please reconnect your wallet.");
    }

    return {
      phantomPublicKey,
      secretKeyBase58,
      dappPublicKey
    };
  }

  static createSharedSecret(phantomPublicKey, secretKeyBase58) {
    const secretKey = bs58.decode(secretKeyBase58);
    const phantomPublicKeyBytes = bs58.decode(phantomPublicKey);
    return nacl.box.before(phantomPublicKeyBytes, secretKey);
  }

  static encryptPayload(payload, sharedSecret) {
    const nonce = nacl.randomBytes(24);
    const messageBytes = Buffer.from(JSON.stringify(payload));
    const encryptedPayloadBytes = nacl.box.after(messageBytes, nonce, sharedSecret);
    
    return {
      nonce: bs58.encode(nonce),
      encryptedPayload: bs58.encode(encryptedPayloadBytes)
    };
  }
} 