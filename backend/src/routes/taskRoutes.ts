import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { checkPermission } from '../middlewares/rbac.js';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/taskController.js';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('member:read'), getTasks);
router.post('/', checkPermission('member:read'), createTask);
router.put('/:id', checkPermission('member:read'), updateTask);
router.delete('/:id', checkPermission('member:read'), deleteTask);

export default router;
