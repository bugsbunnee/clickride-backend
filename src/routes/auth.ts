import express, { Request, Response } from 'express';
import _ from 'lodash';
import bcrypt from 'bcryptjs';
import moment from 'moment';

import { StatusCodes } from 'http-status-codes';
import { Driver, User } from '../models/user/schema';
import { authSchema, deviceTokenSchema, forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema } from '../models/user/types';
import { generateDriverSession, generateUserSession } from '../controllers/user.controller';
import { getUserProfileFromToken } from '../services/google';
import { hashPassword } from '../utils/lib';

import validateWith from '../middleware/validateWith';
import rateLimit from 'express-rate-limit';
import logger from '../startup/logger';

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

router.post('/login', [validateWith(authSchema)], async (req: Request, res: Response): Promise<any> => {
    let user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(StatusCodes.NOT_FOUND).json({ message: 'Invalid credentials.' });

    let validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid credentials.' });

    await user.sendRecentLoginEmail(req);

    res.json(generateUserSession(user));
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

    return res.json(generateUserSession(user));
});

router.post('/resend-verification-email', [validateWith(authSchema), rateLimit(limit)], async (req: Request, res: Response): Promise<any> => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: "The given user does not exist!" });   

    if (user.isEmailVerified) logger.info("Invalid verification request submitted!", { email: req.body.email });
    else await user.sendVerificationEmail();
 
    res.json({ message: 'Password reset mail has been sent to the user\'s email if it exists' });
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