const asyncHandler = require('express-async-handler')
const { StatusCodes } = require('http-status-codes')
const Auth = require("../models/auth-model")
const User = require("../models/user-model")
const genToken = require('../config/genToken')
const bcrypt = require('bcryptjs')
    // const genToken = require('../config/genToken')

// code generation
function uniqueCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';

    for (let i = 0; i < 6; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomString += characters.charAt(randomIndex);
    }

    return randomString;
}

const signup = asyncHandler(async(req, res) => {
    const { name, email, phone, pic, role, branch, password } = req.body
    if (!name || !email || !password) {
        return res.status(StatusCodes.BAD_REQUEST).json({ err: "name, email password must be provided" })
    }
    // check if email already exist
    const userExist = await User.findOne({ email })
    if (userExist) {
        return res.status(500).json({ err: `oops, ${email} is aleready registered to another user.` })
    }
    const newUser = await User.create(req.body)
    if (!newUser) {
        return res.status(500).json({ err: 'User creation failed!!!' })
    }
    const newUserAuth = await Auth.create({
        userId: newUser._id,
        password: password,
        uniqueCode: uniqueCode()
    })
    if (!newUserAuth) {
        return res.status(500).json({ err: "New User Auth creation failed!!!" })
    }
    res.status(StatusCodes.CREATED).json({ userInfo: newUser, token: genToken({ id: newUser._id, name: newUser.name, role: newUser.role, branch: newUser.branch }) })

})

const login = asyncHandler(async(req, res) => {
    const { email, password } = req.body
    if (!email || !password) {
        return res.status(500).json({ msg: "Please provide login credentials" })
    }
    // check if email is registered
    const userExist = await User.findOne({ email }).populate('branch', 'location')
    if (!userExist) {
        return res.status(StatusCodes.NOT_FOUND).json({ err: `${email} is not a registered email address!!!` })
    }
    let userId = userExist._id
    const userAuth = await Auth.findOne({ userId })
        // console.log('login', userAuth, userId);
    if (userAuth && (await userAuth.matchPassword(password))) {
        return res.status(StatusCodes.ACCEPTED).json({ userInfo: userExist, token: genToken({ id: userExist._id, name: userExist.name, role: userExist.role, branch: userExist.branch }) })
    } else {
        return res.status(StatusCodes.UNAUTHORIZED).json({ err: 'Access denied, Incorrect password!!!' })
    }

})

const uniqueCodeGen = asyncHandler(async(req, res) => {
    const { email } = req.body
    const userExist = await User.findOne({ email })
    if (!userExist) {
        return res.status(StatusCodes.NOT_FOUND).json({ msg: `${email} is not a registered email adress!!!` })
    }
    // generatiing a new code for users
    let genCode = uniqueCode()
    const userAuth = await Auth.findOneAndUpdate({ userId: userExist._id }, { uniqueCode: genCode }, { new: true, runValidators: true }).select("userId uniqueCode")
        // sendEmail("DrivIt-confirmation", `Hi ${userExist.name}, Here's your password recovery code ${genCode}`, email)
    return res.status(200).json({ msg: `Recovery code has been sent to ${email}...`, info: userAuth })

})

const verifyUniqueCode = asyncHandler(async(req, res) => {
    const { email, code } = req.body
    if (!email || !code) {
        return res.status(500).json({ err: `Error... Please provide your email and unique code for verification!!!` })
    }
    const userExist = await User.findOne({ email })
    if (!userExist) {
        return res.status(StatusCodes.NOT_FOUND).json({ msg: `${email} is not a registered email adress!!!` })
    }
    const userAuth = await Auth.findOne({ userId: userExist._id })
    if (code !== userAuth.uniqueCode) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ err: `Incorrect confirmation code` })
    }
    return res.status(StatusCodes.OK).json({ msg: `Correct access code provided` })

})

const passwordRecovery = asyncHandler(async(req, res) => {
    const { email, uniqueCode, password } = req.body
        // verify email
    const userExist = await User.findOne({ email })
    if (!userExist) {
        res.status(StatusCodes.NOT_FOUND).json({ err: `${email}, is not a registered email address` })
    }
    const userAuth = await Auth.findOne({ userId: userExist._id })
    if (uniqueCode === userAuth.uniqueCode) {
        // we need to encrypt the password
        const salt = await bcrypt.genSalt(10)
        const newPassword = await bcrypt.hash(password, salt)
        const updateAuth = await Auth.findOneAndUpdate({ userId: userExist._id }, { password: newPassword }, { new: true, runValidators: true }).select("userId uniqueCode")
        if (!updateAuth) {
            res.status(500).json({ err: `Unable to change password, try again!!!` })
        }

        res.status(StatusCodes.OK).json({ msg: "Password updated successfully.", authInfo: updateAuth })
            // send an email here
    } else {
        res.status(StatusCodes.UNAUTHORIZED).json({ err: `Incorrect verification code provided` })
    }
})

module.exports = { signup, login, passwordRecovery, uniqueCodeGen, verifyUniqueCode }