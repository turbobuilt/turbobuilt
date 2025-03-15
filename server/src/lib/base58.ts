const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE = ALPHABET.length;

function encodeBase58(buffer) {
    if (buffer.length === 0) return '';

    let digits = [0];
    for (let i = 0; i < buffer.length; i++) {
        let carry = buffer[i];
        for (let j = 0; j < digits.length; j++) {
            carry += digits[j] << 8;
            digits[j] = carry % BASE;
            carry = (carry / BASE) | 0;
        }
        while (carry > 0) {
            digits.push(carry % BASE);
            carry = (carry / BASE) | 0;
        }
    }

    let result = '';
    for (let k = 0; buffer[k] === 0 && k < buffer.length - 1; k++) {
        result += ALPHABET[0];
    }
    for (let q = digits.length - 1; q >= 0; q--) {
        result += ALPHABET[digits[q]];
    }

    return result;
}

export function createGuid() {
    const timestamp = BigInt(Date.now()) * 1000000n + BigInt(process.hrtime.bigint() % 1000000n);
    const timestampBytes = new Uint8Array(8);
    for (let i = 0; i < 8; i++) {
        timestampBytes[7 - i] = Number((timestamp >> BigInt(i * 8)) & 0xffn);
    }

    const randomBytes = new Uint8Array(8);
    crypto.getRandomValues(randomBytes);

    const combined = new Uint8Array(16);
    combined.set(timestampBytes);
    combined.set(randomBytes, 8);

    let encoded = encodeBase58(combined);

    // Ensure the encoded string has a consistent length
    const targetLength = 22; // Adjust based on desired length
    if (encoded.length < targetLength) {
        encoded = ALPHABET[0].repeat(targetLength - encoded.length) + encoded;
    }

    return encoded;
}