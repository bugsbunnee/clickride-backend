import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { verifyToken } from "../utils/lib";
import { IUser } from "../models/user/types";

function authUser(req: Request, res: Response, next: NextFunction): any {
    const token = req.header('x-auth-token');
    if (!token) return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });

    req.user = verifyToken(token) as unknown as IUser;
    if (!req.user) return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Invalid token' });

    next();
}

export default authUser;