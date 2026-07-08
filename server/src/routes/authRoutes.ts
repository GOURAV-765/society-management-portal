import { Router } from 'express';
import { login, logout, getCurrentUser } from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema } from '../schemas/auth.js';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authenticate, getCurrentUser);

export default router;
