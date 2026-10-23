import User from '#models/user.model.js';
import {
  deleteAccount,
  exportAccountData,
} from '#services/accountData.service.js';
import { revokeSessions } from '#services/session.service.js';
import { deleteAccountSchema } from '#validations/user.validation.js';
import { formatValidationError } from '#utils/format.js';
import { cookies } from '#utils/cookies.js';

/**
 * GET /api/profile/export - download everything stored about the user
 */
export const exportMyData = async (req, res, next) => {
  try {
    const data = await exportAccountData(req.user.id);
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="travelo-data-${date}.json"`
    );
    res.type('application/json').send(JSON.stringify(data, null, 2));
  } catch (e) {
    next(e);
  }
};

/**
 * DELETE /api/profile - permanently delete the signed-in account
 */
export const deleteMyAccount = async (req, res, next) => {
  try {
    const validationResult = deleteAccountSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user || !(await user.comparePassword(validationResult.data.password))) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Password is incorrect',
      });
    }

    const result = await deleteAccount(req.user.id);
    cookies.clear(res, 'token');
    res.status(200).json({ message: 'Your account has been deleted', ...result });
  } catch (e) {
    next(e);
  }
};

/**
 * POST /api/auth/sign-out-everywhere - end every session of this user,
 * including the current one
 */
export const signOutEverywhere = async (req, res, next) => {
  try {
    await revokeSessions(req.user.id);
    cookies.clear(res, 'token');
    res.status(200).json({ message: 'Signed out on all devices' });
  } catch (e) {
    next(e);
  }
};
