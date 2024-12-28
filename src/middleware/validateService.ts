import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Service } from "../models/services/schema";
import { ServiceCode } from "../utils/constants";

const validateService = (serviceCode: ServiceCode) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.driver) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'User profile not found!' });
        }
    
        // @ts-ignore
        const service = await Service.findById(req.driver.service._id);
        if (!service) return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid service!' });

        if (service.code !== serviceCode) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: `Driver must be on ${serviceCode} to update this information` });
        }
        
        next();
    }
};

export default validateService;