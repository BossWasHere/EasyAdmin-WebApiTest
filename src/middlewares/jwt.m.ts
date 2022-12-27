import { Request, Response, NextFunction } from 'express';

import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'secret';

export default function (req: Request, res: Response, next: NextFunction) {
    const token = req.header('Authorization');

    if (!token) {
        return res
            .status(401)
            .json({ error: 'No authorization token provided' });
    }

    try {
        const decoded = verify(token, JWT_SECRET);

        // TODO authenticated user model
        // req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ error: 'JWT is not valid' });
    }
}
