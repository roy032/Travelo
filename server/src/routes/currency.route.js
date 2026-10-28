import express from 'express';
import {
  convertController,
  getRatesController,
} from '#controllers/currency.controller.js';
import { authenticateToken } from '#middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/rates', getRatesController);
router.get('/convert', convertController);

export default router;
