import mongoose from 'mongoose';
import { IProfile, IUser } from '../models/user/types';
import { IService } from '../models/services/types';
import { LocationType } from './constants';

export enum Currency {
    NGN = 'NGN',
}

export interface DriverSession {
    _id: mongoose.Types.ObjectId;
    service: IService;
    user: IUser;
    profile?: IProfile;
};

export interface PickerOption {
    label: string;
    value: string | number;
    image?: string;
}

export interface Location {
    type: LocationType;
    coordinates: [number, number];
}

export interface RiderForMap {
    _id: string;
    firstName: string;
    lastName: string;
    profileDisplayImage: string;
    serviceDisplayImage: string;
    timeToLocation: string;
    distanceToLocation: string;
    rating: number;
    price: number;
    coordinates: {
        longitude: number;
        latitude: number;
    };
}