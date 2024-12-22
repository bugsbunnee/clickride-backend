import mongoose from "mongoose";
import moment from "moment";
import _ from "lodash";

import { ICarPersonalInformation, ICoordinates, IDriver, IPaymentDetails, IUser, IUserMethods, IProfileSchema, IVehicleDocuments, ITripDetails } from "./types";
import { generateRandomCode, generateRandomToken, signPayload } from "../../utils/lib";
import { EXPIRY_TIME_IN_MINUTES, GENDER_OPTIONS, SAMPLE_SIZES } from "../../utils/constants";
import { AVAILABLE_SERVICE_TYPES } from "../../utils/data";

interface UserModel extends mongoose.Model<IUser, {}, IUserMethods> {}

const PaymentDetailsSchema = new mongoose.Schema<IPaymentDetails>({
    billingType: { type: String, required: true },
    address: { type: String, required: true },
    accountName: { type: String, required: true },
    accountNumber: { type: String, minlength: 10, required: true, unique: true },
    bankName: { type: String, required: true },
});

const PersonalInformationSchema = new mongoose.Schema<ICarPersonalInformation>({
    gender: { type: String, enum: GENDER_OPTIONS, required: true },
    isVehicleOwner: { type: Boolean, require: true },
    vehicleManufacturer: { type: String, required: true },
    vehicleYear: { type: Number, min: 1990, required: true },
    vehicleColor: { type: String, required: true },
    vehicleLicensePlate: { type: String, trim: true, unique: true, required: true },
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

const ProfileSchema = new mongoose.Schema<IProfileSchema>({
    personalInformation: PersonalInformationSchema,
    paymentDetails: PaymentDetailsSchema,
    vehicleDocuments: VehicleDocumentsSchema,
    tripDetails: [TripDetailsSchema],
    inspectionUrl: { type: String, required: false },
}, { timestamps: true });

const CoordinatesSchema = new mongoose.Schema<ICoordinates>({
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
});

const UserSchema = new mongoose.Schema<IUser, UserModel, IUserMethods>({
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, required: true, unique: true },
    deviceToken: { type: String, required: false },
    phoneNumber: { type: String, required: false, minlength: 5, unique: true },
    city: { type: String, required: false, },
    password: { type: String, required: true },
    lastLogin: { type: Date,  default: null },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: null },
    emailVerificationTokenExpiryDate: { type: Date, default: null },
    emailVerifiedAt: { type: Date, default: null },
    passwordResetToken: { type: String, default: null },
    passwordResetTokenExpiryDate: { type: Date, default: null },
    coords: CoordinatesSchema,
}, { timestamps: true });

const DriverSchema = new mongoose.Schema<IDriver>({
    user: { type: mongoose.Schema.ObjectId, unique: true, required: true, ref: 'User' },
    service: { type: String, enum: AVAILABLE_SERVICE_TYPES, required: true },
    profile: ProfileSchema,
}, { timestamps: true });

UserSchema.method('generateAuthToken', function () {
    return signPayload({
        _id: this._id,
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        phoneNumber: this.phoneNumber,
        isEmailVerified: this.isEmailVerified,
        deviceToken: this.deviceToken,
        coords: this.coords,
    });
});

UserSchema.method('generateResetPasswordToken', function () {
    this.passwordResetToken = generateRandomToken();
    this.passwordResetTokenExpiryDate = moment().add(EXPIRY_TIME_IN_MINUTES.PASSWORD_RESET, 'minutes').toDate();

    return this.passwordResetToken;
});

UserSchema.method('generateEmailVerificationToken', function () {
    this.emailVerificationToken = generateRandomCode(4, SAMPLE_SIZES.NUMERIC);
    this.emailVerificationTokenExpiryDate = moment().add(EXPIRY_TIME_IN_MINUTES.VERIFY_ACCOUNT, 'minutes').toDate();

    return this.emailVerificationToken;
});

UserSchema.method('sendRecentLoginEmail', async function (req: Request) {
    this.lastLogin = Date.now() as unknown as Date;
    
    try {
        const updatedUser = await this.save();

        // Implement email here
    } catch (error) {
    }
});

export const Driver = mongoose.model<IDriver>('Driver', DriverSchema);
export const User = mongoose.model<IUser, UserModel>('User', UserSchema);


