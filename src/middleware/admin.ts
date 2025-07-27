import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { UserType } from "../utils/constants";

function admin(req: Request, res: Response, next: NextFunction) {
    if (req.user!.userType !== UserType.ADMIN) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized!' });
    }

    next();
}

export default admin;