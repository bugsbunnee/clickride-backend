import _ from "lodash";

import { IDriver, IUser } from "../models/user/types";
import { IService } from "../models/services/types";

import { DriverSession } from "../utils/models";
import { USER_FIELDS_TO_EXCLUDE } from "../utils/constants";
import { signPayload } from "../utils/lib";

interface DriverSessionParams {
    driver: IDriver;
    service: IService;
    user: IUser;
}

export const generateDriverSession = ({ driver, service, user } : DriverSessionParams) => {
    const account: DriverSession = {
        _id: driver._id,
        profile: driver.profile,
        service,
        user: _.omit(user, USER_FIELDS_TO_EXCLUDE) as IUser,
    };

    return {
        token: signPayload(account),
        account,
    };
};

export const generateUserSession = (user: IUser) => {
    let authUser = _.pick(user, [
        '_id',
        'firstName',
        'lastName',
        'phoneNumber',
        'userType',
        'deviceToken',
        'profilePhoto',
        'city',
        'email',
        'rating',
        'isEmailVerified',
        'emailVerifiedAt'
    ]);
    
    return {
        token: signPayload(authUser),
        account: authUser,
    };
};