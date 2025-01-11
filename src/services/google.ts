import axios from "axios";

import { ICoordinates } from "../models/user/types";
import { mapCoordsToString } from "../utils/lib";
import _ from "lodash";
import logger from "../startup/logger";

interface DistanceElement {
    distance: { text: string; value: number; };
    duration: { text: string; value: number; };
    status: string;
}

interface DistanceResponse {
    destination_addresses: string[];
    origin_addresses: string[];
    status: string;
    rows: { elements: DistanceElement[] }[];
}

interface DistancePayload {
    origins: (ICoordinates | string)[];
    destinations: (ICoordinates | string)[];
}

interface GeocodeResponse {
    results: {
        formatted_address: string;
        geometry: {
            location: {
                lat: number;
                lng: number;
            };
        }
    }[];
}

interface GoogleUserProfile {
    email: string;
    family_name: string;
    given_name: string;
    id: string;
    name: string;
    picture: string;
    verified_email: boolean;
}

interface IPLocationResponse {
    ip: string;
    error?: boolean;
    version: string;
    city: string;
    region: string;
    region_code: string;
    country_code: string;
    country_code_iso3: string;
    country_name: string;
    country_capital: string;
    country_tld: string;
    continent_code: string;
    in_eu: boolean;
    postal: string;
    latitude: number;
    longitude: number;
    timezone: string;
    utc_offset: string;
    country_calling_code: string;
    currency: string;
    currency_name: string;
    languages: string;
    asn: string;
    org: string;
    hostname: string;
}

export const getDistanceBetweenCoords = async ({ origins, destinations }: DistancePayload) => {
    try {
        const endpoint = process.env.GOOGLE_API_URL + '/distancematrix/json';
        const response = await axios.get<DistanceResponse>(endpoint, {
            params: {
                origins: origins.map((location) => _.isString(location) ? location : mapCoordsToString(location)).join('|'),
                destinations: destinations.map((location) => _.isString(location) ? location : mapCoordsToString(location)).join('|'),
                key: process.env.GOOGLE_API_KEY,
            },
        });

        return response.data;
    } catch (error) {
        return null;
    }
};

export const geocodeLocations = async (addresses: string[]) => {
    try {
        const endpoint = process.env.GOOGLE_API_URL + '/geocode/json';
        const response = await axios.get<GeocodeResponse>(endpoint, {
            params: {
                address: addresses.join(','),
                key: process.env.GOOGLE_API_KEY,
            }
        });

        return response.data;
    } catch (error) {
        return null;
    }
};

export const getUserProfileFromToken = async (token: string) => {
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };
    
        try {
            const response = await axios.get<GoogleUserProfile>(process.env.GOOGLE_USER_API_URL!, config);
            return response.data;
        } catch (error) {
            logger.error(error);

            return null;
        }
};

export const getLocationFromIP = async (ipAddress: string) => {
    try {
        const endpoint = `https://ipapi.co/${ipAddress}/json/`;
        const response = await axios.get<IPLocationResponse>(endpoint);

        if (response.data.error) return '';

        return `${response.data.city} ${response.data.region} ${response.data.country_name}`;
    } catch (error) {
        return '';
    }

};