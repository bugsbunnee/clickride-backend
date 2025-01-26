import mongoose from "mongoose";
import { IRide } from "./types";
import { PAYMENT_STATUS, PaymentStatus, RIDE_STATUS, RideStatus } from "../../utils/constants";

const LocationSchema = new mongoose.Schema({
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
});

const RideSchema = new mongoose.Schema<IRide>({
    service: { type: mongoose.Schema.ObjectId, ref: 'Service', required: true },
    driver: { type: mongoose.Schema.ObjectId, ref: 'Driver', required: true },
    user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUS, default: PaymentStatus.PENDING },
    rideStatus: { type: String, enum: RIDE_STATUS, default: RideStatus.PENDING },
    from: LocationSchema,
    to: LocationSchema,
    busTripId: { type: mongoose.Schema.ObjectId },
    departureDate: { type: Date, required: true },
    bookedSeats: [{ type: Number, min: 1 }],
    price: { type: Number },
}, { timestamps: true });

export const Ride = mongoose.model('Ride', RideSchema);