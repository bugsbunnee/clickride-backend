import mongoose from 'mongoose';
import { IProfileSchema, IUser } from '../models/user/types';
import { VehicleType } from './constants';

export interface DriverSession {
    _id: mongoose.Types.ObjectId;
    service: VehicleType
    user: IUser;
    profile?: IProfileSchema;
};

export interface PickerOption {
    label: string;
    value: string | number;
    image?: string;
}