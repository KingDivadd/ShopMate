const express = require('express')
const router = express.Router()
const { login, signup, passwordRecovery, uniqueCodeGen, verifyUniqueCode } = require("../controller/auth-controller")

router.route('/login').post(login)
router.route('/signup').post(signup)
router.route('/reset-password').patch(passwordRecovery)
router.route('/unique-code').post(uniqueCodeGen)
router.route('/verify-code').post(verifyUniqueCode)

module.exports = router