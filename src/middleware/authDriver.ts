import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { verifyToken } from "../utils/lib";
import { DriverSession } from "../utils/models";

function authDriver(req: Request, res: Response, next: NextFunction): any {
    const token = req.header('x-auth-token');
    if (!token) return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });

    req.driver = verifyToken(token) as unknown as DriverSession;
    if (!req.driver) return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Invalid token' });

    next();
}

export default authDriver;