import mongoose from "mongoose";

export interface INotification extends NotificationParams {
    isRead: boolean;
    userId: mongoose.Types.ObjectId;
}

export interface NotificationParams {
    title: string;
    body: string;
}