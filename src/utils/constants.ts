export const EXPIRY_TIME_IN_MINUTES = {
    PASSWORD_RESET: 15,
    VERIFY_ACCOUNT: 30,
};

export const SAMPLE_SIZES = {
    ALPHA: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    ALPHANUMERIC: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    NUMERIC: '0123456789',
};

export enum Gender {
    MALE = 'Male',
    FEMALE = 'Female'
};

export enum ServiceCode {
    CAR = 'car',
    BUS = 'bus',
    LOCAL = 'local',
}

export const SERVICE_CODES = Object.values(ServiceCode);
export const GENDER_OPTIONS = Object.values(Gender);
export const MB_IN_BYTES = 1_048_576;
export const MIN_CAR_YEAR = 1990;
export const PASSWORD_CHECK_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
export const USER_FIELDS_TO_EXCLUDE = [
    'emailVerificationToken',
    'emailVerificationTokenExpiryDate',
    'emailVerifiedAt',
    'passwordResetToken',
    'passwordResetTokenExpiryDate',
];