const jwt = require('jsonwebtoken')

const genToken = (id, name, role, branch) => {
    return jwt.sign({ id, name, role, branch }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_LIFETIME })
}

module.exports = genToken