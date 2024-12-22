import cloudinary from 'cloudinary';
import _ from 'lodash';

const config = cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export const uploadStream = (buffer: Buffer) => {
    const options: cloudinary.UploadApiOptions = {
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
        folder: 'clickride'
    };

    return new Promise<cloudinary.UploadApiResponse | undefined>((resolve, reject) => {
        cloudinary.v2
            .uploader
            .upload_stream(options, function(error, result) {
                if (error) reject(error);
                else resolve(result);
            }).end(buffer);
    });
};

export const extractFieldsUploadFromFiles = async (files: Record<string, Express.Multer.File[]>) => {
    const uploadPromise = Object.keys(files).map(async (key) => ({
        response: await uploadStream(files[key][0].buffer),
        name: key,
    }));

    const result = await Promise.all(uploadPromise);
    const fields = result.reduce((accumulator, currentValue) => {
        _.set(accumulator, currentValue.name, currentValue.response!.secure_url);

        return accumulator;
    }, {});

    return fields;
};
