import crypto from 'crypto';
import { config } from '../configs/config';


export function hashString(input: string): string {
    if (!config.HASHING_SECRET_KEY) {
        throw new Error('HASHING_SECRET_KEY is not configured');
    }
    
    return crypto
        .createHmac('sha256', config.HASHING_SECRET_KEY)
        .update(input)
        .digest('hex');
}


export function verifyHash(input: string, hash: string): boolean {
    const inputHash = hashString(input);
    return crypto.timingSafeEqual(Buffer.from(inputHash, 'hex'), Buffer.from(hash, 'hex'));
}
