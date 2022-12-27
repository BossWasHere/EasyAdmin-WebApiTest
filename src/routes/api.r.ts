import { Router } from 'express';

import IdentityRouter from './identity.r';
import PlayerRouter from './player.r';
import ServerRouter from './server.r';

const router = Router();

router.use('/identity', IdentityRouter);
router.use('/players', PlayerRouter);
router.use('/servers', ServerRouter);

export default router;
