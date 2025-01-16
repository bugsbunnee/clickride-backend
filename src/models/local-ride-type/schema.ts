import mongoose from "mongoose";
import { ILocalRideType } from "./types";

const LocalRideTypeSchema = new mongoose.Schema<ILocalRideType>({
    name: { type: String, trim: true },
});

export const LocalRideType = mongoose.model('LocalRideType', LocalRideTypeSchema);