import mongoose from 'mongoose';
import { IProfile, IUser } from '../models/user/types';
import { IService } from '../models/services/types';

export interface DriverSession {
    _id: mongoose.Types.ObjectId;
    service: IService;
    rating: number;
    user: IUser;
    profile?: IProfile;
};

export interface PickerOption {
    label: string;
    value: string | number;
    image?: string;
}