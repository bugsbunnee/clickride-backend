import { NextFunction, Request, Response } from "express";
import { getObjectIdIsValid } from "../utils/lib";

function validateObjectId(req: Request, res: Response, next: NextFunction): any {
    if (!getObjectIdIsValid(req.params.id)) return res.status(404).json({ message: 'Invalid ID.' });

    next();
}

export default validateObjectId;