import bs58 from "bs58";
import { PhantomEncryption } from "@/utils/phantomEncryption";
import { WALLET_CONFIG } from "@/config/wallet.config";

export class PhantomMobileService {
  static async prepareTransaction(transaction) {
    const serializedTxn = transaction.serialize({ requireAllSignatures: false });
    return bs58.encode(serializedTxn);
  }

  static createTransactionPayload(serializedTransaction, sessionToken) {
    return {
      session: sessionToken,
      transaction: serializedTransaction
    };
  }

  static async createSignAndSendUrl(payload) {
    try {
      // Get stored encryption keys
      const { phantomPublicKey, secretKeyBase58, dappPublicKey } = PhantomEncryption.getStoredKeys();

      // Create shared secret and encrypt payload
      const sharedSecret = PhantomEncryption.createSharedSecret(phantomPublicKey, secretKeyBase58);
      const { nonce, encryptedPayload } = PhantomEncryption.encryptPayload(payload, sharedSecret);

      // Construct URL parameters
      const params = new URLSearchParams({
        dapp_encryption_public_key: dappPublicKey,
        nonce,
        redirect_link: `${WALLET_CONFIG.REDIRECT_BASE_URL}/phantom-transaction.html`,
        payload: encryptedPayload
      });

      return `${WALLET_CONFIG.PHANTOM_CONNECT_URL}/signAndSendTransaction?${params.toString()}`;
    } catch (error) {
      console.error("Failed to create transaction URL:", error);
      throw error;
    }
  }
} 