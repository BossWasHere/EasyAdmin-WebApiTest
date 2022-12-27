import { scrypt } from 'crypto';

export function validateV1Password(plain: string, hash: string) {
    if (hash.indexOf(':') === -1) {
        return false;
    }

    return new Promise((resolve, reject) => {
        const [salt, passHash] = hash.split(':');

        const saltBuffer = Buffer.from(salt, 'hex');
        const passBuffer = Buffer.from(passHash, 'hex');
        const plainBuffer = new TextEncoder().encode(plain.normalize('NFKC'));

        scrypt(
            plainBuffer,
            saltBuffer,
            32,
            { N: 1024, r: 8, p: 1 },
            (err, derivedKey) => {
                if (err) {
                    return reject(err);
                }

                resolve(Buffer.compare(derivedKey, passBuffer) === 0);
            }
        );
    });
}
