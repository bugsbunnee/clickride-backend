import axios from "axios";
import logger from "../startup/logger";

interface NotificationPayload {
    to: string;
    title: string;
    body: string;
}

export const sendSingleNotification = async (payload: NotificationPayload) => {
    const endpoint = process.env.EXPO_NOTIFICATIONS_API_URL as string;

    try {
       const response = await axios.post(endpoint, payload);
       console.log(response);
    } catch (error) {
        logger.error((error as Error).message);
    }
};

export const sendBatchNotification = async (payload: NotificationPayload[]) => {
    const endpoint = process.env.EXPO_NOTIFICATIONS_API_URL as string;

    try {
        const response = await axios.post(endpoint, payload);
    } catch (error) {
        logger.error((error as Error).message);
    }
};