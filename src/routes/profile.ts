import express, { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import _ from 'lodash';

import { USER_FIELDS_TO_EXCLUDE, VehicleType } from '../utils/constants';
import { Driver, User } from '../models/user/schema';
import { busPersonalInformationSchema, carPersonalInformationSchema, paymentDetailsSchema, tripDetailsSchema, vehicleDocumentsSchema } from '../models/user/types';
import { generateDriverSession } from '../controllers/user.controller';
import { extractFieldsUploadFromFiles, uploadStream } from '../services/cloudinary';

import authDriver from '../middleware/authDriver';
import upload from '../services/multer';
import validateWith from '../middleware/validateWith';

const router = express.Router();
const documentsUpload = upload.fields([
    { name: "license", maxCount: 1 },
    { name: "display", maxCount: 1 },
    { name: "interior", maxCount: 1 },
    { name: "exterior", maxCount: 1 },
    { name: "ownership", maxCount: 1 },
    { name: "roadWorthiness", maxCount: 1 },
    { name: "insurance", maxCount: 1 },
    { name: "lasrra", maxCount: 1 },
    { name: "lasdri", maxCount: 1 },
]);

router.put('/car/personal-information', [authDriver, validateWith(carPersonalInformationSchema)], async (req: Request, res: Response): Promise<any> => {
    if (req.driver!.service !== VehicleType.CAR) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Only car drivers can upload inspection file!' });
    }

    const driver = await Driver.findByIdAndUpdate(req.driver!._id, {
        $set: {
            'profile.personalInformation': {
                gender: req.body.gender,
                isVehicleOwner: req.body.isVehicleOwner,
                vehicleManufacturer: req.body.vehicleManufacturer,
                vehicleYear: req.body.vehicleYear,
                vehicleColor: req.body.vehicleColor,
                vehicleLicensePlate: req.body.vehicleLicensePlate,
            }
        }
    }, { new: true }).lean();

    if (!driver) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Invalid driver provided!' });
    }

    const user = await User.findByIdAndUpdate(driver.user._id, { 
        $set: {
            firstName: req.body.firstName, 
            lastName: req.body.lastName 
        }
    }, { new: true }).select(USER_FIELDS_TO_EXCLUDE.map((field) => `-${field}`).join(' ')).lean();
    
    if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Could not find the associated user!' });
    }

    res.json(generateDriverSession({ driver, user }));
});

router.put('/bus/personal-information', [authDriver, upload.single('companyLogo'), validateWith(busPersonalInformationSchema)], async (req: Request, res: Response): Promise<any> => {
    if (req.driver!.service !== VehicleType.BUS) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Only bus drivers can upload inspection file!' });
    }

    if (!req.file) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Missing file!' });
    }

    const response = await uploadStream(req.file.buffer);
    if (!response || !response.secure_url) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Something failed while uploading the file!' });
    }

    console.log(req.body);

    const driver = await Driver.findByIdAndUpdate(req.driver!._id, {
        $set: {
            'profile.personalInformation': {
                companyName: req.body.companyName,
                companyLogo: response.secure_url,
            }
        }
    }, { new: true }).lean();

    if (!driver) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Invalid driver provided!' });
    }

    const user = await User.findByIdAndUpdate(driver.user._id, { 
        $set: {
            firstName: req.body.firstName, 
            lastName: req.body.lastName 
        }
    }, { new: true }).select(USER_FIELDS_TO_EXCLUDE.map((field) => `-${field}`).join(' ')).lean();
    
    if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Could not find the associated user!' });
    }

    res.json(generateDriverSession({ driver, user }));
});

router.put('/payment-details', [authDriver, validateWith(paymentDetailsSchema)], async (req: Request, res: Response): Promise<any> => {
    const driver = await Driver.findByIdAndUpdate(req.driver!._id, {
        $set: {
            'profile.paymentDetails': {
                billingType: req.body.billingType,
                address: req.body.address,
                accountName: req.body.accountName,
                accountNumber: req.body.accountNumber,
                bankName: req.body.bankName,
            }
        }
    }, { new: true }).lean();

    if (!driver) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Invalid driver provided!' });
    }

    res.json(generateDriverSession({ driver, user: req.driver!.user! }))
});

router.put('/vehicle-documents', [authDriver, documentsUpload], async (req: Request, res: Response): Promise<any> => {
    if (req.driver!.service !== VehicleType.CAR) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Only car drivers can upload inspection file!' });
    }
    
    if (!req.files) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Missing file!' });
    }

    const validation = vehicleDocumentsSchema.safeParse(req.files);
    if (!validation.success) return res.status(StatusCodes.BAD_REQUEST).json(validation.error.flatten());

    const driver = await Driver.findByIdAndUpdate(req.driver!._id, {
        $set: {
            'profile.vehicleDocuments': await extractFieldsUploadFromFiles(req.files! as any)
        }
    }, { new: true }).lean();

    if (!driver) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Invalid driver provided!' });
    }

    res.json(generateDriverSession({ driver, user: req.driver!.user! }))
});

router.put('/vehicle-inspection', [authDriver, upload.single('inspection')], async (req: Request, res: Response): Promise<any> => {
    if (req.driver!.service !== VehicleType.CAR) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Only car drivers can upload inspection file!' });
    }

    if (!req.file) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Missing file!' });
    }

    const response = await uploadStream(req.file.buffer);
    if (!response || !response.secure_url) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Something failed while uploading the file!' });
    }

    const driver = await Driver.findByIdAndUpdate(req.driver!._id, {
        $set: {
            'profile.inspectionUrl': response.secure_url
        }
    }, { new: true }).lean();

    if (!driver) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Invalid driver provided!' });
    }

    res.json(generateDriverSession({ driver, user: req.driver!.user! }))
});

router.put('/trip-details', [authDriver, validateWith(tripDetailsSchema)], async (req: Request, res: Response): Promise<any> => {
    if (req.driver!.service !== VehicleType.BUS) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Only bus drivers can upload inspection file!' });
    }

    const driver = await Driver.findById(req.driver!._id);
    if (!driver) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Invalid driver provided!' });
    }

    if (driver.profile) {
        const tripMatch = driver.profile.tripDetails.find((trip) => {
            const isSameOrigin = trip.origin.toLowerCase().trim() === req.body.origin.toLowerCase().trim();
            const isSameDestination = trip.destination.toLowerCase().trim() === req.body.destination.toLowerCase().trim();

            return isSameOrigin && isSameDestination;
        });

        if (tripMatch) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: `Matching trip with Origin: ${req.body.origin} & Destination: ${req.body.destination} already exists!` });
        }

        driver.profile.tripDetails.push({
            origin: req.body.origin,
            destination: req.body.destination,
            price: req.body.price,
            isRoundTrip: req.body.isRoundTrip,
            departureDates: req.body.departureDates,
            departureTime: req.body.departureTime,
            returnDates: req.body.returnDates,
            returnTime: req.body.returnTime,
            busType: req.body.busType,
            busCapacity: req.body.busCapacity,
            airConditioning: req.body.airConditioning,
        })
    } else {
        // @ts-ignore
        driver.profile = {
            tripDetails: [
                {
                    origin: req.body.origin,
                    destination: req.body.destination,
                    price: req.body.price,
                    isRoundTrip: req.body.isRoundTrip,
                    departureDates: req.body.departureDates,
                    departureTime: req.body.departureTime,
                    returnDates: req.body.returnDates,
                    returnTime: req.body.returnTime,
                    busType: req.body.busType,
                    busCapacity: req.body.busCapacity,
                    airConditioning: req.body.airConditioning,
                }
            ]
        };
    }

    await driver.save();

    res.json(generateDriverSession({ driver, user: req.driver!.user! }))
});

export default router;