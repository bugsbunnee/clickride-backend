import mongoose from "mongoose";
import _ from "lodash";

import { IService } from "./types";
import { SERVICE_CODES } from "../../utils/constants";

const ServiceSchema = new mongoose.Schema<IService>({
   name: { type: String, required: true, trim: true },
   code: { type: String, unique: true, immutable: true, required: true, enum: SERVICE_CODES, trim: true },
   description: { type: String, required: true, },
   color: { type: String, required: true },
   image: { type: String, unique: true, required: true, trim: true },
   driver: { type: String, unique: true, required: true, trim: true },
});

export const Service = mongoose.model<IService>('Service', ServiceSchema);


