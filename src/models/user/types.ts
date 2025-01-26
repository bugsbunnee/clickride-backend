import mongoose from 'mongoose';

import { isValidPhoneNumber } from 'libphonenumber-js';
import { Request } from 'express';
import { z } from 'zod';

import { Gender, GENDER_OPTIONS, MIN_CAR_YEAR, PASSWORD_CHECK_REGEX, UserType } from '../../utils/constants';
import { getObjectIdIsValid } from '../../utils/lib';
import { Location } from '../../utils/models';
import { NotificationParams } from '../notifications/types';

export const emailSchema = z.object({
    email: z.string().email(),
});

export const vehicleDocumentsSchema = z.object({
    license: z.array(z.any()).min(1, 'License must be at least 1 photo'),
    display: z.array(z.any()).min(1, 'Display photo must be at least 1 photo'),
    interior: z.array(z.any()).min(1, 'Interior must be at least 1 photo'),
    exterior: z.array(z.any()).min(1, 'Exterior must be at least 1 photo'),
    ownership: z.array(z.any()).min(1, 'Proof of ownership must be at least 1 photo'),
    roadWorthiness: z.array(z.any()).min(1, 'Road worthiness must be at least 1 photo'),
    insurance: z.array(z.any()).min(1, 'Insurance must be at least 1 photo'),
    lasrra: z.array(z.any()).min(1, 'Lasrra must be at least 1 photo'),
    lasdri: z.array(z.any()).min(1, 'Lasdri must be at least 1 photo'),
});

export const locationCoordinatesSchema = z.object({
    latitude: z.number(),
    longitude: z.number(),
});

export const availableNearbyRidersSchema = z.object({
    latitude: z.number(),
    longitude: z.number(),
    rideType: z.string().refine((value) => getObjectIdIsValid(value), 'Invalid Ride Type').optional(),
});

export const localNearbyRidersSchema = z.object({
    rideType: z.string().refine((value) => getObjectIdIsValid(value), 'Invalid Ride Type').optional(),
    route: z.string(),
})

export const deviceTokenSchema = z.object({
    token: z.string(),
});

export const authSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const carPersonalInformationSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    gender: z.enum(GENDER_OPTIONS as any),
    isVehicleOwner: z.boolean(),
    numberOfSeats: z.number().min(2, 'Car capacity must be at least 2. The driver and passenger'),
    vehicleManufacturer: z.string(),
    vehicleYear: z.number().min(MIN_CAR_YEAR, `Vehicle must be at least ${MIN_CAR_YEAR} model`),
    vehicleColor: z.string(),
    vehicleLicensePlate: z.string().length(6, 'License plate must be exactly 6 characters'),
});

export const busPersonalInformationSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    companyName: z.string(),
});

export const localPersonalInformationSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    localRideType: z.string().refine((value) => getObjectIdIsValid(value), 'Invalid local ride type'),
});

export const paymentDetailsSchema = z.object({
    billingType: z.string(),
    address: z.string(),
    accountName: z.string(),
    accountNumber: z.string().length(10, 'Account number must be 10 digits'),
    bankName: z.string(),
});

export const tripDetailsSchema = z.object({
    origin: z.string(),
    destination: z.string(),
    originCity: z.string(),
    destinationCity: z.string(),
    price: z.number().positive(),
    isRoundTrip: z.boolean(),
    departureDates: z.array(z.number()).min(1, 'At least one departure date required'),
    departureTime: z.string(),
    returnDates: z.array(z.number()).min(1, 'At least one return date required'),
    returnTime: z.string(),
    busType: z.string(),
    busCapacity: z.number(),
    airConditioning: z.boolean(),
});

export const routeDetailsSchema = z.object({
    price: z.number().positive(),
    route: z.string(),
});

export const driverRegistrationSchema = z.object({
    email: z.string().email(),
    phoneNumber: z.string().refine((value) => isValidPhoneNumber(value, 'NG'), {
        message: 'Please provide a valid Nigerian phone number',
    }),
    city: z.string().min(1, 'City must be at least one character long'),
    password: z.string().regex(PASSWORD_CHECK_REGEX, "Password must have at least 1 uppercase letter, 1 lowercase letter, 1 special character, 1 numeric character, and be at least 8 characters long."),
    service: z.string().refine((value) => getObjectIdIsValid(value), 'Invalid service'),
});

export const userRegistrationSchema = z.object({
    name: z.string().min(3, 'Full name must be at least 3 characters'),
    email: z.string().email(),
    password: z.string().regex(PASSWORD_CHECK_REGEX, "Password must have at least 1 uppercase letter, 1 lowercase letter, 1 special character, 1 numeric character, and be at least 8 characters long."),
});

export const userUpdateSchema = z.object({
    firstName: z.string().min(3, 'Last name must be at least 3 characters'),
    lastName: z.string().min(3, 'Last name must be at least 3 characters'),
    email: z.string().email(),
    phoneNumber: z.string().refine((value) => isValidPhoneNumber(value, 'NG'), {
        message: 'Please provide a valid Nigerian phone number',
    }),
});

export const verifyEmailJoiSchema = z.object({
    email: z.string().email(),
    token: z.string(),
});

export type ICoordinates = z.infer<typeof locationCoordinatesSchema>;
export type IPaymentDetails = z.infer<typeof paymentDetailsSchema>;
export type ITripDetails = z.infer<typeof tripDetailsSchema>;
export type IRouteDetails = z.infer<typeof routeDetailsSchema>;

export interface IUser {
    _id: mongoose.Types.ObjectId;
    firstName: string;
    lastName: string;
    city: string;
    deviceToken: string;
    email: string;
    phoneNumber: string;
    password: string;
    profilePhoto: string;
    lastLogin: Date | null,
    isEmailVerified: boolean;
    emailVerificationToken: string | null;
    emailVerificationTokenExpiryDate: Date | null;
    emailVerifiedAt: Date | null;
    passwordResetToken: string | null;
    passwordResetTokenExpiryDate: Date | null;
    rating: number;
    location: Location;
    userType: UserType;
}

export interface IDriver {
    _id: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    service: mongoose.Types.ObjectId;
    profile?: IProfile;
}

export interface ICarPersonalInformation {
    gender: Gender;
    isVehicleOwner: boolean;
    numberOfSeats: number;
    vehicleManufacturer: string;
    vehicleYear: number;
    vehicleColor: string;
    vehicleLicensePlate: string;
}

export interface IBusPersonalInformation {
    companyName: string;
    companyLogo: string;
}

export interface ILocalRidePersonalInformation {
    localRideType: mongoose.Types.ObjectId;
    profilePhotoUrl: string;
}

export interface IVehicleDocuments {
    license: string;
    display: string;
    interior: string;
    exterior: string;
    ownership: string;
    roadWorthiness: string;
    insurance: string;
    lasrra: string;
    lasdri: string;
}

export interface IProfile {
    carPersonalInformation: ICarPersonalInformation;
    busPersonalInformation: IBusPersonalInformation;
    localRidePersonalInformation: ILocalRidePersonalInformation;
    paymentDetails: IPaymentDetails;
    vehicleDocuments: IVehicleDocuments;
    tripDetails: ITripDetails[];
    routeDetails: IRouteDetails[];
    inspectionUrl?: string;
}

export interface IUserMethods {
    generateAuthToken: () => string;
    generateResetPasswordToken: () => string;
    generateEmailVerificationToken: () => string;
    sendPasswordResetEmail: () => Promise<void>;
    sendWelcomeEmail: () => Promise<void>;
    sendVerificationEmail: () => Promise<void>;
    sendNotification: (notificationParams: NotificationParams) => Promise<void>;
    sendRecentLoginEmail: (request: Request) => Promise<void>;
}

export interface IDriverMethods {}


