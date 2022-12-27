import { Router } from 'express';

import { Identity } from '../controllers/identity.c';

const router = Router();

router.post('/login', Identity.login);
router.post('/nonce', Identity.getNonce);

Identity.setup();

export default router;
