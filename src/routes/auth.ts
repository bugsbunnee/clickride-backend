import express, { Request, Response } from 'express';
import _ from 'lodash';
import bcrypt from 'bcrypt';

import { StatusCodes } from 'http-status-codes';
import { Driver } from '../models/user/schema';
import { authSchema, IUser } from '../models/user/types';
import { generateDriverSession } from '../controllers/user.controller';

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
            $match: { 'user.email': req.body.email }
        }
    ]);

    if (results.length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid credentials' });
    }

    let driver = results[0];
    let validPassword = await bcrypt.compare(req.body.password, driver.user.password);

    if (!validPassword) return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid credentials!' });

    res.json(generateDriverSession({ driver, user: driver.user }));
});

export default router;