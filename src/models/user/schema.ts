import mongoose from "mongoose";
import moment from "moment";
import _ from "lodash";

import { ICarPersonalInformation, IDriver, IPaymentDetails, IUser, IUserMethods, IProfile, IVehicleDocuments, ITripDetails, IRouteDetails, IBusPersonalInformation } from "./types";
import { generateRandomCode, generateRandomToken, getRequestIdentificationDetails, signPayload } from "../../utils/lib";
import { EXPIRY_TIME_IN_MINUTES, GENDER_OPTIONS, LOCATION_TYPES, SAMPLE_SIZES } from "../../utils/constants";
import { sendEmail } from "../../services/email";

import VerifyEmail from '../../emails/verification';
import WelcomeEmail from '../../emails/welcome';

import logger from "../../startup/logger";
import RecentLoginEmail from '../../emails/recent-login';
import { Request } from "express";

interface UserModel extends mongoose.Model<IUser, {}, IUserMethods> {}

const PaymentDetailsSchema = new mongoose.Schema<IPaymentDetails>({
    billingType: { type: String, required: true },
    address: { type: String, required: true },
    accountName: { type: String, required: true },
    bankName: { type: String, required: true },
    accountNumber: { 
        type: String, 
        minlength: 10, 
        required: true, 
        trim: true, 
        index: {
            unique: true,
            partialFilterExpression: { 
                accountNumber: { $type: "string" }
            }
        } 
    },
});

const CarPersonalInformationSchema = new mongoose.Schema<ICarPersonalInformation>({
    gender: { type: String, enum: GENDER_OPTIONS, required: true },
    isVehicleOwner: { type: Boolean, require: true },
    vehicleManufacturer: { type: String, required: true },
    vehicleYear: { type: Number, min: 1990, required: true },
    vehicleColor: { type: String, required: true },
    vehicleLicensePlate: { type: String, trim: true, required: true },
});

const BusPersonalInformationSchema = new mongoose.Schema<IBusPersonalInformation>({
    companyName: { type: String, trim: true, required: true },
    companyLogo: { type: String, trim: true, required: true },
});

const VehicleDocumentsSchema = new mongoose.Schema<IVehicleDocuments>({
    license: { type: String, required: true },
    display: { type: String, required: true },
    interior: { type: String, required: true },
    exterior: { type: String, required: true },
    ownership: { type: String, required: true },
    roadWorthiness: { type: String, required: true },
    insurance: { type: String, required: true },
    lasrra: { type: String, required: true },
    lasdri: { type: String, required: true },
});

const TripDetailsSchema = new mongoose.Schema<ITripDetails>({
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    originCity: { type: String, required: true },
    destinationCity: { type: String, required: true },
    price: { type: Number, required: true },
    isRoundTrip: { type: Boolean, required: true },
    departureDates: [{ type: Number, min: 0 }],
    departureTime: { type: String, required: true },
    returnDates: [{ type: Number, min: 0 }],
    returnTime: { type: String, required: true },
    busType: { type: String, required: true },
    busCapacity: { type: Number, required: true },
    airConditioning: { type: Boolean, required: true },
});

const RouteDetailsSchema = new mongoose.Schema<IRouteDetails>({
    routes: [{ type: String, required: true }],
    price: { type: Number, required: true },
});

const ProfileSchema = new mongoose.Schema<IProfile>({
    carPersonalInformation: CarPersonalInformationSchema,
    busPersonalInformation: BusPersonalInformationSchema,
    paymentDetails: PaymentDetailsSchema,
    vehicleDocuments: VehicleDocumentsSchema,
    tripDetails: [TripDetailsSchema],
    routeDetails: RouteDetailsSchema,
    profilePhotoUrl: { type: String, required: false },
    inspectionUrl: { type: String, required: false },
}, { timestamps: true });

const UserSchema = new mongoose.Schema<IUser, UserModel, IUserMethods>({
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, required: true, trim: true, unique: true },
    deviceToken: { type: String, required: false },
    phoneNumber: {
        type: String, 
        required: false, 
        minlength: 10, 
    },
    city: { type: String, required: false, },
    password: { type: String, required: true },
    lastLogin: { type: Date,  default: null },
    profilePhoto: { type: String, required: false },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: null },
    emailVerificationTokenExpiryDate: { type: Date, default: null },
    emailVerifiedAt: { type: Date, default: null },
    passwordResetToken: { type: String, default: null },
    passwordResetTokenExpiryDate: { type: Date, default: null },
    location: {
        type: { type: String, enum: LOCATION_TYPES },
        coordinates: { type: [Number] },
    },
}, { timestamps: true });

const DriverSchema = new mongoose.Schema<IDriver>({
    user: { type: mongoose.Schema.ObjectId, unique: true, required: true, ref: 'User' },
    service: { type: mongoose.Schema.ObjectId, ref: 'Service', required: true },
    rating: { type: Number, min: 0, default: 0 },
    profile: ProfileSchema,
}, { timestamps: true });

UserSchema.index({ location: '2dsphere' });

UserSchema.method('generateAuthToken', function () {
    return signPayload({
        _id: this._id,
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        phoneNumber: this.phoneNumber,
        isEmailVerified: this.isEmailVerified,
        deviceToken: this.deviceToken,
        location: this.location,
    });
});

UserSchema.method('generateResetPasswordToken', function () {
    this.passwordResetToken = generateRandomToken();
    this.passwordResetTokenExpiryDate = moment().add(EXPIRY_TIME_IN_MINUTES.PASSWORD_RESET, 'minutes').toDate();

    return this.passwordResetToken;
});

UserSchema.method('generateEmailVerificationToken', function () {
    this.emailVerificationToken = generateRandomCode(6, SAMPLE_SIZES.NUMERIC);
    this.emailVerificationTokenExpiryDate = moment().add(EXPIRY_TIME_IN_MINUTES.VERIFY_ACCOUNT, 'minutes').toDate();

    return this.emailVerificationToken;
});

UserSchema.method('sendWelcomeEmail', async function () {
    try {
        await sendEmail({
            to: this.email,
            subject: 'Welcome to ClikRide',
            text: 'Welcome to ClikRide, ' + this.firstName,
            react: WelcomeEmail({ userFirstname: this.firstName })
        });
    } catch (error) {
       logger.error(error);
    }
});

UserSchema.method('sendVerificationEmail', async function () {
    const token = this.generateEmailVerificationToken();

    try {
        await sendEmail({
            to: this.email,
            subject: 'Verify your email',
            text: 'Verify your ClikRide Email',
            react: VerifyEmail({ 
                verificationCode: token,
                validityInMinutes: EXPIRY_TIME_IN_MINUTES.VERIFY_ACCOUNT,
            })
        });
    } catch (error) {
        this.emailVerificationToken = null;
        this.emailVerificationTokenExpiryDate = null;
    }

    await this.save();
});

UserSchema.method('sendRecentLoginEmail', async function (req: Request) {
    this.lastLogin = moment().toDate();
    
    try {
        const [details, _] = await Promise.all([getRequestIdentificationDetails(req), this.save()]);

        await sendEmail({
            to: this.email,
            subject: 'Recent Login',
            text: 'Recent login to ClikRide',
            react: RecentLoginEmail({
                userFirstName: this.firstName,
                loginDate: moment(this.lastLogin).format('DD MMMM YYYY, HH:mm:ss'),
                loginDevice: details.device,
                loginIp: details.ipAddress,
                loginLocation: details.location,
            })
        })
    } catch (error) {
        logger.error(error);
    }


});

export const Driver = mongoose.model<IDriver>('Driver', DriverSchema);
export const User = mongoose.model<IUser, UserModel>('User', UserSchema);


