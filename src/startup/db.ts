import mongoose from "mongoose";
import logger from "./logger";

async function registerDB() {
    try {
        await mongoose.connect(process.env.DB_URL as string);
        logger.info(`Connected to DB: ${process.env.DB_URL}`);
    } catch (error) {
        logger.error(error);
    }
}

export default registerDB;