import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import express, { Express } from "express";

import auth from '../routes/auth';
import geolocation from '../routes/geolocation';
import locations from '../routes/locations';
import profile from '../routes/profile';
import ride from '../routes/ride';
import seed from '../routes/seed';
import services from '../routes/services';
import users from '../routes/users';

import error from "../middleware/error";

function registerRoutes(app: Express) {
    app.use(cors());
    app.use(compression());
    app.use(helmet());
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static('public'));
    
    app.use('/api/v1/auth', auth);
    app.use('/api/v1/locations', locations);
    app.use('/api/v1/profile', profile);
    app.use('/api/v1/geolocation', geolocation);
    app.use('/api/v1/ride', ride);
    app.use('/api/v1/seed', seed);
    app.use('/api/v1/services', services);
    app.use('/api/v1/users', users);

    app.use(error);
}

export default registerRoutes;