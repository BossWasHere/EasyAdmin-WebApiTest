declare namespace Express {
    export type JWTUser = {
        aud: string;
        exp: number;
        iat: number;
        iss: string;
        sub: string;
        host: string;
        username?: string;
    };

    export interface Request {
        user: JWTUser;
    }
}
