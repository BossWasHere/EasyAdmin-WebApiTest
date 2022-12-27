import { Router } from 'express';

import JwtMiddleware from '../middlewares/jwt.m';

import IdentityRouter from './identity.r';
import PlayerRouter from './player.r';
import ServerRouter from './server.r';

const router = Router();

router.use('/identity', IdentityRouter);
router.use('/players', JwtMiddleware, PlayerRouter);
router.use('/servers', JwtMiddleware, ServerRouter);

export default router;
