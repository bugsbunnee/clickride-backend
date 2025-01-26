import mongoose from "mongoose";
import { INotification } from "./types";

const NotificationSchema = new mongoose.Schema<INotification>({
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    userId: { type: mongoose.Schema.ObjectId, ref: 'User' },
    isRead: { type: Boolean, default: false },
}, { timestamps: true });

export const Notification = mongoose.model('Notification', NotificationSchema);