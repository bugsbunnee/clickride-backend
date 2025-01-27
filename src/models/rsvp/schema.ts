import mongoose from "mongoose";
import { IRSVP } from "./types";

const RSVPSchema = new mongoose.Schema<IRSVP>({
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, unique: true, trim: true },
    attending: { type: String, trim: true },
    favoriteDanceMove:  { type: String, trim: true, required: false },
    storyName:  { type: String, trim: true, required: false },
    marriageAdvice:  { type: String, trim: true, required: false },
    hashtag: { type: String, trim: true, required: false },
    figure:  { type: String, trim: true, required: false },
    favoriteMemory:  { type: String, trim: true, required: false },
});

export const RSVP = mongoose.model('RSVP', RSVPSchema);
