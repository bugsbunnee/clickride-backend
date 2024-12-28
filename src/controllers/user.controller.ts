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
        rating: driver.rating,
        profile: driver.profile,
        service,
        user: _.omit(user, USER_FIELDS_TO_EXCLUDE) as IUser,
    };

    return {
        token: signPayload(account),
        account,
    };
};