import express, { Request, Response } from 'express';
import _ from 'lodash';
import mongoose from 'mongoose';

import { StatusCodes } from 'http-status-codes';
import { Driver, User } from '../models/user/schema';
import { deviceTokenSchema, driverRegistrationSchema, locationCoordinatesSchema, userRegistrationSchema, userUpdateSchema } from '../models/user/types';
import { hashPassword } from '../utils/lib';
import { generateDriverSession, generateUserSession } from '../controllers/user.controller';
import { Service } from '../models/services/schema';
import { LocationType } from '../utils/constants';
import { uploadStream } from '../services/cloudinary';

import authUser from '../middleware/authUser';
import authDriver from '../middleware/authDriver';
import validateWith from '../middleware/validateWith';
import upload from '../services/multer';

const router = express.Router();

router.post('/', [validateWith(userRegistrationSchema)], async (req: Request, res: Response): Promise<any> => {
    let user = await User.findOne({ email: req.body.email });
    if (user) return res.status(StatusCodes.BAD_REQUEST).json({ message: 'An account with this email already exists!' });

    let names = req.body.name.split(' ');
    if (names.length < 2) return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Name must include first and last name!' });

    user = await User.create({
        firstName: names[0],
        lastName: names[1],
        email: req.body.email,
        password: await hashPassword(req.body.password),
    });

    res.status(StatusCodes.CREATED).json(generateUserSession(user));
});

router.post('/driver', [validateWith(driverRegistrationSchema)], async (req: Request, res: Response): Promise<any> => {
    const service = await Service.findById(req.body.service);
    
    if (!service) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid service provided' });
    }

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
        rating: 0,
        service: service._id,
        user: user._id,
    });

    res.status(StatusCodes.CREATED).json(generateDriverSession({ driver, service, user }));
});

router.patch('/driver/location', [authDriver, validateWith(locationCoordinatesSchema)], async (req: Request, res: Response): Promise<any> => {
    let result = await updateUserLocation({
        userId: req.driver!.user!._id,
        longitude: req.body.longitude,
        latitude: req.body.latitude,
    });

    res.status(result.code).json({ message: result.message });
});

router.patch('/user/location', [authUser, validateWith(locationCoordinatesSchema)], async (req: Request, res: Response): Promise<any> => {
    let result = await updateUserLocation({
        userId: req.user!._id,
        longitude: req.body.longitude,
        latitude: req.body.latitude,
    });

    res.status(result.code).json({ message: result.message });
});

router.patch('/me/token', [authUser, validateWith(deviceTokenSchema)], async (req: Request, res: Response): Promise<any> => {
    let user = await User.findByIdAndUpdate(req.user!._id, { $set: { deviceToken: req.body.token }}, { new: true });

    if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
            message: 'Invalid user provided',
        });
    }

    return res.status(StatusCodes.OK).json(generateUserSession(user));
});

router.put('/me/profile', [authUser, upload.single('profilePhoto'), validateWith(userUpdateSchema)], async (req: Request, res: Response): Promise<any> => {
    const result = await uploadProfilePhoto(req);
    if (!result.status) return res.status(result.code).json({ message: result.message });

    console.log(req.file, req.files, req.body)
    console.log('fileUrl', result.fileUrl, req.file)
    const user = await User.findByIdAndUpdate(req.user!._id, {
        $set: {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            phoneNumber: req.body.phoneNumber,
            profilePhoto: result.fileUrl ? result.fileUrl : undefined,
        }
    }, { new: true });

    if (!user) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'User not found!' });
    }

    res.json(generateUserSession(user));
});

interface UserLocationUpdateParams {
    userId: mongoose.Types.ObjectId;
    longitude: number;
    latitude: number;
}

const updateUserLocation = async (params: UserLocationUpdateParams) => {
    let user = await User.findByIdAndUpdate(params.userId, {
        $set: {
            location: {
                type: LocationType.POINT,
                coordinates: [params.longitude, params.latitude],
            }
        }
    }, { new: true });

    if (user) {
        return { message: 'Location updated successfully!', code: StatusCodes.OK };
    }

    return { message: 'Invalid user provided!', code: StatusCodes.NOT_FOUND };
};

const uploadProfilePhoto = async (req: Request) => {
    if (!req.file) {
        return { code: StatusCodes.OK, message: 'No photo uploaded', status: true, fileUrl: '' };
    }

    const response = await uploadStream(req.file.buffer);
    if (!response || !response.secure_url) {
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, message: 'Something failed while uploading the file!', status: false };
    }

    return { code: StatusCodes.OK, message: 'Uploaded successfully', status: true, fileUrl: response.secure_url };
};

export default router;