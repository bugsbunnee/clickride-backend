import mongoose from "mongoose";
import { IRSVP } from "./types";

const RSVPSchema = new mongoose.Schema<IRSVP>({
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, trim: true },
    attending: { type: String, trim: true },
});

export const RSVP = mongoose.model('RSVP', RSVPSchema);
