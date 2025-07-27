import { Activity } from "../models/activity/schema";
import { IUser } from "../models/user/types";

interface ActivityParams {
    user: IUser;
    action: string;
}

export const createActivity = ({ user, action }: ActivityParams) => {
    return Activity.create({
        user: user._id,
        action,
    });
};


export const getActivitiesForDashboard = () => {
    return Activity
            .find()
            .populate({
                path: 'user',
                select: 'firstName lastName userType'
            })
            .sort({ createdAt: -1 })
            .limit(10)
};