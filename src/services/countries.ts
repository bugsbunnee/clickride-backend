import axios from "axios"
import logger from "../startup/logger";

interface StatesResponse {
    data: {
        name: string;
        iso3: string;
        states: { name: string; }[];
    }
}

export const getStatesInCountry = async (country: string) => {
    try {
        const endpoint = process.env.COUNTRIES_API_URL + '/countries/states';
        const response = await axios.post<StatesResponse>(endpoint, { country });

        return response.data.data.states.map((state) => ({
            label: state.name,
            value: state.name
        }));
    } catch (error) {
        logger.error(error);

        return [];
    }
};