import express from 'express';
import { getTripWeatherController } from '#controllers/weather.controller.js';
import { authenticateToken, isTripMember } from '#middlewares/auth.middleware.js';

const router = express.Router();

router.get(
  '/trips/:tripId/weather',
  authenticateToken,
  isTripMember,
  getTripWeatherController
);

export default router;
