import express, { Request, Response } from 'express';
import _ from 'lodash';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';

import { StatusCodes } from 'http-status-codes';
import { Driver, User } from '../models/user/schema';
import { authSchema, deviceTokenSchema, forgotPasswordSchema, resetPasswordSchema, updatePasswordSchema, verifyEmailSchema } from '../models/user/types';
import { generateAdminSession, generateDriverSession, generateUserSession } from '../controllers/user.controller';
import { getUserProfileFromToken } from '../services/google';
import { hashPassword } from '../utils/lib';
import { UserType } from '../utils/constants';

import authUser from '../middleware/authUser';
import validateWith from '../middleware/validateWith';
import logger from '../startup/logger';
import { createActivity } from '../controllers/activity.controller';

const router = express.Router();
const limit = {
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 3,
};

router.post('/driver/login', [validateWith(authSchema)], async (req: Request, res: Response): Promise<any> => {
    const results = await Driver.aggregate([
        {
            $lookup: {
                from: 'users',
                foreignField: '_id',
                localField: 'user',
                as: 'user',
                pipeline: [
                    { 
                        $project: {
                            emailVerificationToken: 0,
                            emailVerificationTokenExpiryDate: 0,
                            emailVerifiedAt: 0,
                            passwordResetToken: 0,
                            passwordResetTokenExpiryDate: 0,
                        } 
                    }
                ]
            },
        },
        {
            $unwind: '$user'
        },
        {
            $lookup: {
                from: 'services',
                foreignField: '_id',
                localField: 'service',
                as: 'service',
            },
        },
        {
            $unwind: '$service'
        },
        {
            $match: { 'user.email': req.body.email }
        }
    ]);

    if (results.length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid credentials' });
    }

    let driver = results[0];
    let validPassword = await bcrypt.compare(req.body.password, driver.user.password);

    if (!validPassword) return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid credentials!' });

    res.json(generateDriverSession({ driver, service: driver.service,  user: driver.user }));
});

router.post('/admin/login', [validateWith(authSchema)], async (req: Request, res: Response): Promise<any> => {
    let user = await User.findOne({ email: req.body.email, userType: UserType.ADMIN });
    if (!user) return res.status(StatusCodes.NOT_FOUND).json({ message: 'Invalid credentials.' });
    if (!user.isActive) return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Your account is inactive. Kindly contact admin' });

    let validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid credentials.' });

    await user.sendRecentLoginEmail(req);
    await createActivity({ user, action: 'Login to admin dashboard' });
    
    let session = await generateAdminSession(user);
    res.json(session);
});

router.post('/login', [validateWith(authSchema)], async (req: Request, res: Response): Promise<any> => {
    let user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(StatusCodes.NOT_FOUND).json({ message: 'Invalid credentials.' });

    let validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid credentials.' });

    await user.sendRecentLoginEmail(req);
    
    let session = await generateUserSession(user);
    res.json(session);
});

router.post('/google', [validateWith(deviceTokenSchema)], async (req: Request, res: Response): Promise<any> => {
    let profile = await getUserProfileFromToken(req.body.token);
    if (!profile) return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Could not fetch the user profile!' });

    let user = await User.findOne({ email: profile.email });

    if (user) {
        await user.sendRecentLoginEmail(req);
    } else {
        user = await User.create({
            firstName: profile.given_name,
            lastName: profile.family_name,
            email: profile.email,
            password: await hashPassword(profile.id),
        });

        await user.sendWelcomeEmail();
    }

    let session = await generateUserSession(user);
    return res.json(session);
});

router.post('/resend-verification-email', [validateWith(authSchema), rateLimit(limit)], async (req: Request, res: Response): Promise<any> => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: "The given user does not exist!" });   

    if (user.isEmailVerified) logger.info("Invalid verification request submitted!", { email: req.body.email });
    else await user.sendVerificationEmail();
 
    res.json({ message: 'Password reset mail has been sent to the user\'s email if it exists' });
});

router.post('/update-password', [authUser, validateWith(updatePasswordSchema)], async (req: Request, res: Response): Promise<any> => {
	let user = await User.findOne({
        email: req.user!.email,
	});

	if (!user) {
		return res.status(StatusCodes.NOT_FOUND).json({ message: 'The token is invalid or has expired!' });
	}

    let isPasswordValid = await bcrypt.compare(req.body.oldPassword, user.password);
    
    if (!isPasswordValid) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Please ensure you provide the correct password!' });
    }

    if (req.body.oldPassword === req.body.newPassword) {
        return res.status(StatusCodes.BAD_REQUEST).json({ 
            message: 'You cannot update your password with the old one, please choose a differet password',
        });
    }

	user.password = await hashPassword(req.body.newPassword);
	user = await user.save();
    await createActivity({ user, action: 'Updated Password' });
    
    
	res.json({ message: 'Password updated successfully! Please login with the new credentials.' });
});

router.post('/reset-password', validateWith(resetPasswordSchema), async (req: Request, res: Response): Promise<any> => {
	const user = await User.findOne({
        email: req.body.email,
		passwordResetToken: req.body.token,
		passwordResetTokenExpiryDate: { $gt: Date.now() },
	});

	if (!user) {
		return res.status(404).json({ message: 'The token is invalid or has expired!' });
	}

	user.password = await hashPassword(req.body.password);
	user.passwordResetToken = null;
	user.passwordResetTokenExpiryDate = null;

	await user.save();

	res.json({ message: 'Password updated successfully! Please login with the new credentials.' });
});

router.post('/verify', [validateWith(verifyEmailSchema), rateLimit(limit)], async (req: Request, res: Response): Promise<any> => {
    const filter = { 
        email: req.body.email,
        emailVerificationToken: req.body.token, 
        emailVerificationTokenExpiryDate: { $gt: Date.now() }
    };

    const user = await User.findOneAndUpdate(filter, {
        $set: {
            isEmailVerified: true,
            emailVerifiedAt: Date.now() as unknown as Date,
            emailVerificationToken: null,
            emailVerificationTokenExpiryDate: null,
        }
    });

    if (!user) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'The token is invalid or has expired!' });
    }

    await user.sendWelcomeEmail();

    res.json({ message: 'Email verified successfully!' });
});

router.post('/forgot-password', [validateWith(forgotPasswordSchema), rateLimit(limit)], async (req: Request, res: Response): Promise<any> => {
	const user = await User.findOne({ email: req.body.email });
	if (!user) return res.status(404).json({ message: 'The given user does not exist!' });

	await user.sendPasswordResetEmail();

	res.json({ message: "Password reset instructions have been sent to the provided email." });
});

export default router;