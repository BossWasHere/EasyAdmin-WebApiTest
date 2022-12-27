import { Request, Response } from 'express';

import { generateJWT, validateV1Password } from '../utils/security';

export namespace Identity {
    const nonceMap = new Map<string, string>();
    const passwordMap = new Map<string, string>();
    let nextOtp = 0;

    let enablePassword = false;
    let enableOtp = false;
    let enableOpen = false;

    type PasswordLogin = {
        method: 'password';
        clientId: string;
        username: string;
        password: string;
        nonce: string;
    };

    type OTPLogin = {
        method: 'otp';
        clientId: string;
        otp: string;
    };

    type OpenLogin = {
        method: 'open';
        clientId: string;
    };

    export function setup() {
        console.log('Performing identity setup...');

        const enabledModes = process.env.AUTH_MODES_SUPPORTED?.split(',') ?? [];

        if (enabledModes.includes('password')) {
            enablePassword = true;
            console.log('-- Password authentication enabled');

            const accounts = process.env.USER_PASS_ACCOUNTS?.split(',') ?? [];
            for (const account of accounts) {
                const point = account.indexOf(':');
                if (point === -1) {
                    console.error(
                        `-- Invalid account: ${account} (should be user:pass)`
                    );
                    continue;
                }
                const username = account.slice(0, point);
                const password = account.slice(point + 1);
                passwordMap.set(username, password);
                console.log(`-- Added account: ${username} -> ${password}`);
            }
        }
        if (enabledModes.includes('otp')) {
            enableOtp = true;
            console.log('-- OTP authentication enabled.');
            generateNewOtp();
        }
        if (enabledModes.includes('open')) {
            enableOpen = true;
            console.log('-- Open authentication enabled');
        }

        console.log('Identity setup complete.');
    }

    export function generateNewOtp() {
        nextOtp = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        console.log(`-- Current OTP code: ${nextOtp}`);
    }

    export async function login(req: Request, res: Response) {
        if (!req.body) {
            return res.status(400).json({
                error: 'Missing login body',
            });
        }

        const proxyHost = req.headers['x-forwarded-host'];
        const host = proxyHost ? (proxyHost as string) : req.headers.host;

        if (!host) {
            return res.status(400).json({
                error: 'Host header must be provided for token generation',
            });
        }

        const login = req.body as PasswordLogin | OTPLogin | OpenLogin;

        if (login.method === 'password') {
            if (!enablePassword) {
                return res.status(400).json({
                    error: 'Password authentication not supported',
                });
            }

            const { clientId, username, password, nonce } = login;

            if (!clientId || !username || !password || !nonce) {
                return res.status(400).json({
                    error: 'Missing fields',
                });
            }

            if (nonceMap.get(clientId) !== nonce) {
                return res.status(400).json({
                    error: 'Invalid nonce',
                });
            }

            const storedPassword = passwordMap.get(username);

            if (
                storedPassword &&
                (await validateV1Password(storedPassword + nonce, password))
            ) {
                return res.json({
                    token: generateJWT(clientId, host, 'user'),
                });
            }

            return res.status(401).json({
                error: 'Invalid password',
            });
        }

        if (login.method === 'otp') {
            if (!enableOtp) {
                return res.status(400).json({
                    error: 'OTP authentication not supported',
                });
            }

            const { clientId, otp } = login;

            if (!clientId || !otp) {
                return res.status(400).json({
                    error: 'Missing fields',
                });
            }

            if (otp === nextOtp.toString()) {
                generateNewOtp();
                return res.json({
                    token: generateJWT(clientId, host, 'user'),
                });
            }

            return res.status(401).json({
                error: 'Invalid OTP code',
            });
        }

        if (login.method === 'open') {
            if (!enableOpen) {
                return res.status(400).json({
                    error: 'Open authentication not supported',
                });
            }

            const { clientId } = login;

            if (!clientId) {
                return res.status(400).json({
                    error: 'Missing fields',
                });
            }

            return res.json({
                token: generateJWT(clientId, host, 'user'),
            });
        }

        return res.status(400).json({
            error: 'Unsupported autnentication method',
        });
    }

    export async function getNonce(req: Request, res: Response) {
        const { clientId } = req.body ?? {};

        if (!clientId) {
            return res.status(400).json({
                error: 'Missing clientId',
            });
        }

        const nonce =
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
        nonceMap.set(clientId, nonce);

        return res.json({
            nonce,
        });
    }
}
