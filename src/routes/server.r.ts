import { Router } from 'express';
import { Server } from '../controllers/server.c';

const router = Router();

router.get('/', Server.getServers);
router.get('/:id', Server.getServer);
router.get('/:id/charts', Server.getServerCharts);

Server.setup();

export default router;
