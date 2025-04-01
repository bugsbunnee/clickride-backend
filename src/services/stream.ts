import moment from "moment";
import mongoose from "mongoose";
import { StreamChat } from "stream-chat";

export const getStreamChatInstance = () => {
    const apiKey = process.env.STREAM_PUBLIC_KEY;
    const apiSecret = process.env.STREAM_SECRET_KEY;

    if (!apiKey || !apiSecret) {
        throw new Error('Invalid Stream Keys!');
    }
    
    return StreamChat.getInstance(apiKey, apiSecret);
};

export const createUserChatToken = (id: mongoose.Types.ObjectId) => {
    const timestamp = Number(moment().add("1h").format("X"))
    const token = getStreamChatInstance().createToken(id.toString());

    return token;
};
