import { Ride } from "../models/ride/schema";
import { User } from "../models/user/schema";
import { UserType } from "../utils/constants";

export const getRiders = () => {
    return User
            .find({ userType: UserType.RIDER })
            .select('firstName lastName email isActive lastLogin isEmailVerified phoneNumber profilePhoto');  
};

export const getTotalRevenue = async () => {
    const result = await Ride.aggregate([
        {
            $group: {
                _id: null,
                totalPrice: { $sum: '$price' }
            },
        },
    ]);

    const totalPrice = result.length > 0 ? result[0].totalPrice : 0;
    return totalPrice;
};
