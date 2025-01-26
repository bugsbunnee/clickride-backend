import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import express, { Express } from "express";

import auth from '../routes/auth';
import geolocation from '../routes/geolocation';
import locations from '../routes/locations';
import localRideType from '../routes/localRideType';
import profile from '../routes/profile';
import notifications from '../routes/notifications';
import ride from '../routes/ride';
import rsvp from '../routes/wedding';
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
    app.use('/api/v1/local-ride-types', localRideType);
    app.use('/api/v1/profile', profile);
    app.use('/api/v1/geolocation', geolocation);
    app.use('/api/v1/notifications', notifications);
    app.use('/api/v1/ride', ride);
    app.use('/api/v1/rsvp', rsvp);
    app.use('/api/v1/seed', seed);
    app.use('/api/v1/services', services);
    app.use('/api/v1/users', users);

    app.use(error);
}

export default registerRoutes;