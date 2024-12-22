import _ from "lodash";

import { IDriver, IUser } from "../models/user/types";
import { DriverSession } from "../utils/models";
import { USER_FIELDS_TO_EXCLUDE } from "../utils/constants";
import { signPayload } from "../utils/lib";

interface DriverSessionParams {
    driver: IDriver;
    user: IUser;
}

export const generateDriverSession = ({ driver, user } : DriverSessionParams) => {
    const account: DriverSession = {
        _id: driver._id,
        service: driver.service,
        profile: driver.profile,
        user: _.omit(user, USER_FIELDS_TO_EXCLUDE) as IUser,
    };

    return {
        token: signPayload(account),
        account,
    };
};