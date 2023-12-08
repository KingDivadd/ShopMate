// const jwt = require('jsonwebtoken')
// const { StatusCodes } = require('http-status-codes')


// const tokenDecoder = (req, res, next) => {
//     const authHeader = req.headers.authorization
//     if (authHeader && authHeader.startsWith("Bearer")) {
//         const token = authHeader.split(' ')[1]
//         try {
//             const decode = jwt.verify(token, process.env.JWT_SECRET)
//             req.info = decode
//             next()
//         } catch (err) {
//             res.status(StatusCodes.UNAUTHORIZED).json({ err: "Not authorized to access this route" })
//         }
//     } else {
//         res.status(StatusCodes.BAD_REQUEST).json({ err: "No token provided" })
//     }
// }

// module.exports = tokenDecoder

const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');

const tokenDecoder = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer")) {
        const token = authHeader.split(' ')[1];
        try {
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            req.info = decode; // Assign the entire decoded object to req.info
            next();
        } catch (err) {
            res.status(StatusCodes.UNAUTHORIZED).json({ err: "Not authorized to access this route" });
        }
    } else {
        res.status(StatusCodes.BAD_REQUEST).json({ err: "No token provided" });
    }
};

module.exports = tokenDecoder;