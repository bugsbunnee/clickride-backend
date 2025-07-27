import { NextFunction, Request, Response } from "express";
import logger from "../startup/logger";

function error(error: Error, req: Request, res: Response, next: NextFunction) {
    console.log(error);
    logger.error(error);

    res.status(500).json({ message: error.message });
}

export default error;