import mongoose from "mongoose";
import { z } from "zod";
import { getObjectIdIsValid } from "../../utils/lib";
import { PaymentStatus, RideStatus } from "../../utils/constants";

export const rideSchema = z.object({
    driver: z.string().refine((value) => getObjectIdIsValid(value), 'Invalid driver id'),
    from: z.object({
        latitude: z.number(),
        longitude: z.number(),
        address: z.string(),
    }),
    to: z.object({
        latitude: z.number(),
        longitude: z.number(),
        address: z.string(),
    }),
});

type RidePayload = z.infer<typeof rideSchema>;

export interface IRide extends Omit<RidePayload, 'driver'> {
    service: mongoose.Types.ObjectId;
    driver: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    paymentStatus: PaymentStatus;
    rideStatus: RideStatus;
    departureDate: Date;
    price: number;
    busTripId?: mongoose.Types.ObjectId;
    bookedSeats: number[];
}
