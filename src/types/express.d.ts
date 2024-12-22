import { IUser } from "../models/user/types";
import { DriverSession } from "../utils/models";

declare global {
    namespace Express {
        export interface Request {
            file?: Express.Multer.File;
            files?: Record<string, Express.Multer.File[]>;
            user?: IUser; 
            driver?: DriverSession;
            paginator?: {
                pageNumber: number;
                pageSize: number;
                offset: number;
            };
        }
    }
}