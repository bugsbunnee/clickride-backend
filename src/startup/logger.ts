import type { MongoDBConnectionOptions } from "winston-mongodb";
import winston from "winston";
import 'winston-mongodb';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.colorize(), winston.format.json()),
    defaultMeta: { service: 'clickride-log-service' },
    handleExceptions: true,
    transports: [],
});

if (process.env.NODE_ENV === 'production') {
    const transportOptions: MongoDBConnectionOptions = {
        db: process.env.DB_URL as string,
        dbName: 'clickride-backend',
        expireAfterSeconds: 2_592_000,
        tryReconnect: true,
        level: 'info',
    };

    logger.add(new winston.transports.MongoDB(transportOptions));
} else {
    logger.add(new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.json()), }));
    logger.add(new winston.transports.File({ filename: 'error.log', level: 'error' }));
    logger.add(new winston.transports.File({ filename: 'combined.log' }));
}

process.on('unhandledRejection', (ex) => {
    throw ex;
});

export default logger;
