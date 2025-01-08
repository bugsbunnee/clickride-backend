import express, { Request, Response } from 'express';
import _ from 'lodash';
import bcrypt from 'bcrypt';
import moment from 'moment';

import { StatusCodes } from 'http-status-codes';
import { Driver, User } from '../models/user/schema';
import { authSchema } from '../models/user/types';
import { generateDriverSession, generateUserSession } from '../controllers/user.controller';

import validateWith from '../middleware/validateWith';

const router = express.Router();

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

    user.lastLogin = moment().toDate();
    user = await user.save();

    res.json(generateUserSession(user));
});

export default router;