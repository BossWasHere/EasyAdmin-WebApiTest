import { Request, Response, NextFunction } from 'express';
import { verifyJWT } from '../utils/security';

export default function (req: Request, res: Response, next: NextFunction) {
    const token = req.header('Authorization');

    if (!token) {
        return res
            .status(401)
            .json({ error: 'No authorization token provided' });
    }

    const decoded = verifyJWT(token);

    if (decoded == null) {
        return res.status(401).json({ error: 'JWT is not valid' });
    }

    req.user = decoded;
    next();
}
