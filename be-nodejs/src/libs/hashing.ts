// import crypto from 'crypto';
// import { config } from '../configs/config';


// export function hashString(input: string): string {
//     if (!config.HASHING_SECRET_KEY) {
//         throw new Error('HASHING_SECRET_KEY is not configured');
//     }
    
//     return crypto
//         .createHmac('sha256', config.HASHING_SECRET_KEY)
//         .update(input)
//         .digest('hex');
// }


// export function verifyHash(input: string, hash: string): boolean {
//     const inputHash = hashString(input);
//     return crypto.timingSafeEqual(Buffer.from(inputHash, 'hex'), Buffer.from(hash, 'hex'));
// }
import { Buffer } from 'buffer';
import { config } from '@/configs/config';

const secret = config.HASHING_SECRET_KEY;

declare global {
    interface Window {
        crypto: {
            subtle: any;
        };
    }
    var window: Window | undefined;
}


type Hex = string;

function normalizeInput(s: string): string {
    return s.normalize('NFC');
}

function utf8ToUint8(str: string): Uint8Array {
    return new TextEncoder().encode(str);
}

function hexToUint8(hex: string): Uint8Array {
    if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2 !== 0) {
        throw new Error('Invalid hex string');
    }
    const arr = new Uint8Array(hex.length / 2);
    for (let i = 0; i < arr.length; i++) {
        arr[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return arr;
}

function uint8ToHex(arr: Uint8Array): Hex {
    return Array.from(arr)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
        diff |= a[i] ^ b[i];
    }
    return diff === 0;
}

// Detect environments
function hasBrowserSubtle(): boolean {
    return typeof window !== 'undefined' && !!window.crypto && !!window.crypto.subtle;
}
function hasNodeWebCrypto(): boolean {
    return typeof globalThis !== 'undefined' && !!(globalThis as any).crypto && !!(globalThis as any).crypto.subtle && typeof process !== 'undefined';
}

export async function hmacSha256(message: string): Promise<Hex> {
    const msg = normalizeInput(message);
    const key = normalizeInput(secret);

    if (hasBrowserSubtle()) {
        const cryptoSubtle = window!.crypto.subtle;
        const keyData = utf8ToUint8(key);
        const cryptoKey = await cryptoSubtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        const sig = await cryptoSubtle.sign('HMAC', cryptoKey, utf8ToUint8(msg));
        return uint8ToHex(new Uint8Array(sig));
    }

    if (hasNodeWebCrypto()) {
        const subtle = (globalThis as any).crypto.subtle;
        const keyData = utf8ToUint8(key);
        const cryptoKey = await subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        const sig = await subtle.sign('HMAC', cryptoKey, utf8ToUint8(msg));
        return uint8ToHex(new Uint8Array(sig));
    }
    const nodeCrypto = await import('crypto');
    return nodeCrypto
        .createHmac('sha256', key)
        .update(Buffer.from(msg, 'utf8'))
        .digest('hex');
}

export async function verifyHmacSha256(message: string, expectedHex: string): Promise<boolean> {
    const exp = expectedHex.trim();
    if (!/^[0-9a-fA-F]{64}$/.test(exp)) return false;
    const actualHex = await hmacSha256(message);
    const a = hexToUint8(actualHex);
    const b = hexToUint8(exp);
    return timingSafeEqual(a, b);
}


