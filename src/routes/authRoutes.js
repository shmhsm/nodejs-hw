import { Router } from 'express';
import {
  registerUser,
  loginUser,
  refreshUserSession,
  logoutUser,
} from '../controllers/authController.js';
import {
  registerUserSchema,
  loginUserSchema,
} from '../validations/authValidation.js';

const router = Router();

router.post('/register', registerUserSchema, registerUser);
router.post('/login', loginUserSchema, loginUser);
router.post('/refresh', refreshUserSession);
router.post('/logout', logoutUser);

export default router;