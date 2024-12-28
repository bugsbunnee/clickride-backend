import crypto from 'crypto';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import _ from 'lodash';

import { SAMPLE_SIZES } from './constants';
import { IUser } from '../models/user/types';

export const generateAuthTokenFromUser = (user: IUser) => {
    return signPayload({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isEmailVerified: user.isEmailVerified,
        deviceToken: user.deviceToken,
        coords: user.coords,
    })
};

export const generateRandomToken = () => {
	const token = crypto.randomBytes(32).toString('hex');
	return crypto.createHash('sha256').update(token).digest('hex');
};

export const generateRandomCode = (digitLength: number, sampleSize: string = SAMPLE_SIZES.ALPHANUMERIC) => {
    return _.sampleSize(sampleSize.split(''), digitLength).join('');
};

export const getObjectIdIsValid = (objectId: string) => {
    return mongoose.Types.ObjectId.isValid(objectId);
};

export const hashPassword = async (password: string) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt); 

    return hashedPassword;
};

export const signPayload = (payload: Record<string, any>) => {
    return jwt.sign(payload, process.env.JWT_SECRET as string);
};

export const verifyToken = (token: string) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET as string);
    } catch (error) {
        return null;
    }
};