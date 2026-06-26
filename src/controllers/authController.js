import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';
import fs from 'fs/promises';
import path from 'path';
import handlebars from 'handlebars';
import { User } from '../models/user.js';
import { Session } from '../models/session.js';
import { sendEmail } from '../utils/sendMail.js';
import crypto from 'crypto';

const setupSession = async (user) => {
  await Session.deleteOne({ userId: user._id });

  const accessToken = crypto.randomBytes(30).toString('base64');
  const refreshToken = crypto.randomBytes(30).toString('base64');

  const accessTokenValidUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 минут
  const refreshTokenValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60); // 30 дней

  return await Session.create({
    userId: user._id,
    accessToken,
    refreshToken,
    accessTokenValidUntil,
    refreshTokenValidUntil,
  });
};

export const setSessionCookies = (session, res) => {
  res.cookie('refreshToken', session.refreshToken, {
    httpOnly: true,
    expires: session.refreshTokenValidUntil,
  });
  res.cookie('sessionId', session._id, {
    httpOnly: true,
    expires: session.refreshTokenValidUntil,
  });
};

export const registerUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return next(createHttpError(409, 'Email in use'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword });

    res.status(201).json({
      status: 201,
      message: 'User successfully registered!',
      data: { id: user._id, email: user.email },
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return next(createHttpError(401, 'Invalid email or password'));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return next(createHttpError(401, 'Invalid email or password'));
    }

    const session = await setupSession(user);
    setSessionCookies(session, res);

    res.status(200).json({
      status: 200,
      message: 'Successfully logged in an user!',
      data: {
        accessToken: session.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshUserSession = async (req, res, next) => {
  try {
    const { sessionId, refreshToken } = req.cookies;

    if (!sessionId || !refreshToken) {
      return next(createHttpError(401, 'Session not found'));
    }

    const session = await Session.findOne({ _id: sessionId, refreshToken });

    if (!session || new Date() > session.refreshTokenValidUntil) {
      return next(createHttpError(401, 'Invalid session'));
    }

    const user = await User.findById(session.userId);
    if (!user) {
      return next(createHttpError(404, 'User not found'));
    }

    const newSession = await setupSession(user);
    setSessionCookies(newSession, res);

    res.status(200).json({
      status: 200,
      message: 'Successfully refreshed a session!',
      data: {
        accessToken: newSession.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    const { sessionId } = req.cookies;

    if (sessionId) {
      await Session.deleteOne({ _id: sessionId });
    }

    res.clearCookie('sessionId');
    res.clearCookie('refreshToken');

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const requestResetEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(200).json({ message: 'Password reset email sent successfully' });
    }

    const resetToken = jwt.sign(
      { sub: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const resetLink = `${process.env.FRONTEND_DOMAIN}/reset-password?token=${resetToken}`;

    const templateSource = await fs.readFile(
      path.resolve('src/templates/reset-password-email.html'),
      'utf-8'
    );
    const template = handlebars.compile(templateSource);
    const html = template({ name: user.username || user.email, link: resetLink });

    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html,
    });

    res.status(200).json({ message: 'Password reset email sent successfully' });
  } catch {
    return next(createHttpError(500, 'Failed to send the email, please try again later.'));
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { password, token } = req.body;
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return next(createHttpError(401, 'Invalid or expired token'));
    }

    const user = await User.findOne({ _id: decoded.sub, email: decoded.email });
    if (!user) {
      return next(createHttpError(404, 'User not found'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(user._id, { password: hashedPassword });
    await Session.deleteMany({ userId: user._id });

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    return next(error);
  }
};