import express, { Request, Response } from 'express';
import _ from 'lodash';

import { StatusCodes } from 'http-status-codes';
import { Driver, User } from '../models/user/schema';
import { deviceTokenSchema, driverRegistrationSchema, locationCoordinatesSchema } from '../models/user/types';
import { hashPassword } from '../utils/lib';
import { generateDriverSession } from '../controllers/user.controller';

import validateWith from '../middleware/validateWith';
import authUser from '../middleware/authUser';
import authDriver from '../middleware/authDriver';

const router = express.Router();

router.post('/driver', [validateWith(driverRegistrationSchema)], async (req: Request, res: Response): Promise<any> => {
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
            $match: {
                $or: [
                    { 'user.email': req.body.email }, 
                    { 'user.phoneNumber': req.body.phoneNumber }
                ],
            }
        }
    ]);

    if (results.length > 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'A user with this email or phone number already exists!' });
    }

    const user = await User.create({
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        city: req.body.city,
        password: await hashPassword(req.body.password)
    });

    const driver = await Driver.create({
        service: req.body.service,
        user: user._id,
    });

    res.status(StatusCodes.CREATED).json(generateDriverSession({ driver, user }));
});

router.patch('/me/location', [authDriver, validateWith(locationCoordinatesSchema)], async (req: Request, res: Response): Promise<any> => {
    let user = await User.findByIdAndUpdate(req.driver!.user!._id, {
        $set: {
            coords: {
                latitude: req.body.latitude,
                longitude: req.body.longitude,
            }
        }
    }, { new: true });

    if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
            message: 'Invalid user provided',
        })
    }

    return res.status(StatusCodes.OK).json({ message: 'Location updated successfully!' });
});

router.patch('/me/token', [authUser, validateWith(deviceTokenSchema)], async (req: Request, res: Response): Promise<any> => {
    let user = await User.findByIdAndUpdate(req.user!._id, { $set: { deviceToken: req.body.token }}, { new: true });

    if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
            message: 'Invalid user provided',
        })
    }

    return res.status(StatusCodes.OK).json({ message: 'Device token updated successfully!' });
});

export default router;