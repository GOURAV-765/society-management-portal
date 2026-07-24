import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { checkPermission } from '../middlewares/rbac.js';
import {
  getMeetings,
  createMeeting,
  updateAttendance,
  bulkUpdateAttendance,
} from '../controllers/meetingController.js';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('member:read'), getMeetings);
router.post('/', checkPermission('member:read'), createMeeting);
router.post('/attendance', checkPermission('member:read'), updateAttendance);
router.post('/attendance/bulk', checkPermission('member:read'), bulkUpdateAttendance);

export default router;
