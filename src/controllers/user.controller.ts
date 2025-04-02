import _ from "lodash";

import { IDriver, IUser } from "../models/user/types";
import { IService } from "../models/services/types";

import { DriverSession } from "../utils/models";
import { USER_FIELDS_TO_EXCLUDE } from "../utils/constants";
import { signPayload } from "../utils/lib";
import { NotificationParams } from "../models/notifications/types";
import { sendSingleNotification } from "../services/notifications";
import { Notification } from "../models/notifications/schema";
import { createUserChatToken } from "../services/stream";
import { VirtualAccount } from "../models/virtual-accounts/schema";

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

export const generateUserSession = async (user: IUser) => {
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
        'emailVerifiedAt',
        'isVirtualAccountPending',
    ]);

    let wallet = await VirtualAccount.findOne({
        user_id: user._id,
        active: true,
    }).lean();
    
    return {
        token: signPayload(authUser),
        chat: createUserChatToken(authUser._id),
        account: authUser,
        wallet: wallet ? wallet : undefined,
    };
};

export const sendUserNotification = async (user: IUser, params: NotificationParams) => {
    if (user.deviceToken) {
        await sendSingleNotification({
            to: user.deviceToken,
            title: params.title,
            body: params.body,
        });
    }

    await Notification.create({
        title: params.title,
        body: params.body,
        userId: user._id,
        isRead: false,
    });
};