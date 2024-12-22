import 'dotenv/config';

function registerConfig() {
    if (!process.env.DB_URL) {
        throw new Error('FATAL ERROR: DB is not defined!');
    }
}

export default registerConfig;