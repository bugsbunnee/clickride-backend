import mongoose from "mongoose";
import { IReview } from "./types";

const ReviewSchema = new mongoose.Schema<IReview>({ // @ts-ignore
    userId: { type: mongoose.Schema.ObjectId, ref: 'User' },
    message: { type: String, required: true },
    rating: { type: Number, min: 0, max: 5, required: true },
});

export const Review = mongoose.model('Review', ReviewSchema);