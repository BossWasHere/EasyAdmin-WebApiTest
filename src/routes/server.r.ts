import { Router } from 'express';
import { Server } from '../controllers/server.c';

const router = Router();

router.get('/', Server.getServers);

Server.setup();

export default router;
