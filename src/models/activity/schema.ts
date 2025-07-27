import mongoose from "mongoose";
import { IActivity } from "./types";

const ActivitySchema = new mongoose.Schema<IActivity>({
    user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true, },
}, { timestamps: true });

export const Activity = mongoose.model<IActivity>('Activity', ActivitySchema);


