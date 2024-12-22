import multer from 'multer';
import { MB_IN_BYTES } from '../utils/constants';

const upload = multer({ 
    storage: multer.memoryStorage(),
    fileFilter: function  (req, file, cb) {
        const isAllowed = file.mimetype.includes('image');
        cb(null, isAllowed);
    },
    limits: {
        fileSize: MB_IN_BYTES * 2
    }
});

export default upload;