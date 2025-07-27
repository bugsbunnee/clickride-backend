import mongoose from "mongoose";
import { UserType } from "../../utils/constants";

export interface IActivity {
    user: mongoose.Types.ObjectId;
    action: string;
    createdAt: Date;
}