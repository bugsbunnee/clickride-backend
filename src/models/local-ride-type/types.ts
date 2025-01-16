import mongoose from "mongoose";
import { z } from "zod";

export const localRideTypeSchema = z.object({
    name: z.string(),
});

export interface ILocalRideType extends z.infer<typeof localRideTypeSchema> {
    _id: mongoose.Types.ObjectId;
}