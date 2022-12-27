import { scrypt, createHash, randomUUID } from 'crypto';
import { sign, verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'secret';

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

export function verifyJWT(token: string): Express.JWTUser | null {
    try {
        return verify(token, JWT_SECRET) as Express.JWTUser;
    } catch {
        return null;
    }
}

export function generateJWT(clientId: string, host: string, username?: string) {
    const clientIdHash = createHash('sha256').update(clientId).digest('base64');

    return sign({ username, host }, JWT_SECRET, {
        algorithm: 'HS512',
        audience: clientIdHash,
        expiresIn: '1d',
        issuer: 'ea_api_test',
        subject: randomUUID(),
    });
}
