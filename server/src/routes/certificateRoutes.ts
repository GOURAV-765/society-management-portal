import { Router } from 'express';
import { generateCertificate } from '../controllers/certificateController.js';

const router = Router();

/**
 * @route POST /api/v1/certificates/generate
 * @desc Generate a certificate for a user/event
 * @access Public (Add auth middleware if needed)
 */
router.post('/generate', generateCertificate);

export default router;
