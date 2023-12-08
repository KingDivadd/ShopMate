const asyncHandler = require('express-async-handler')
const mongoose = require('mongoose')
const { StatusCodes } = require('http-status-codes')
const User = require("../models/user-model")
const Branch = require("../models/branch-model")
const Product = require("../models/product-model")

// only the ADMIN can create branch. and on creation only the location is required, the rest can be filled later.
const createBranch = asyncHandler(async(req, res) => {
    const { location } = req.body
    if (req.info.id.role !== "ADMIN") {
        return res.status(StatusCodes.UNAUTHORIZED).json({ err: `Error... ${req.info.id.name} You're not authorized to create a branch!!!` })
    }
    if (!location) {
        return res.status(StatusCodes.BAD_REQUEST).json({ err: `Error... Please provide the location for the nerw Branch!!!` })
    }
    // now make sure location does not exist before
    const locationExist = await Branch.findOne({ location: location.trim() })
    if (locationExist) {
        return res.status(500).json({ err: `Error... Branch with the name '${location}' already exist!!!` })
    }

    const newBranch = await Branch.create(req.body)
    if (!newBranch) {
        return res.status(500).json({ err: `Error creating a new branch!!!` })
    }
    return res.status(StatusCodes.OK).json({ msg: `New Branch created`, branchInfo: newBranch })


})

// add branch staffs 
const addBranchStaffs = asyncHandler(async(req, res) => {
    const { branch_id, branchManager, storeManager, salesPerson, } = req.body
    if (req.info.id.role !== 'ADMIN' && req.info.id.role !== 'BRANCH MANAGER') {
        return res.status(StatusCodes.UNAUTHORIZED).json({ err: `Error... You're not authorized to perform such operation!!!` })
    }
    const branchExist = await Branch.findOne({ _id: branch_id })
    if (!branchExist) {
        return res.status(StatusCodes.NOT_FOUND).json({ err: `Error... Branch with ID ${branch_id} not found!!!` })
    }
    const update = {}
    if (req.info.id.role === 'ADMIN') {
        if (branchManager.trim() !== '') {
            // ensure that his role is a store manager
            const isBM = await User.findOne({ _id: branchManager })
            if (!isBM) {
                return res.status(StatusCodes.NOT_FOUND).json({ err: `Error... user not found!!!` })
            }
            if (isBM.role !== 'BRANCH MANAGER') {
                return res.status(500).json({ err: `Error... Selected user's role for BM's position is not branch manager!!!` })
            }
            // now let's check if he's not the branchManger for another branch
            const branch = await Branch.find({ branchManager: { $eq: branchManager } })
            if (branch.length) {
                const branchInfo = branch[0].location
                return res.status(500).json({ err: `Error... ${isBM.name} is already assigned to ${branchInfo} branch as the branch manager!!!` })
            }
            // now ensure another BM doesn't displaces the current BM
            if (branchExist.branchManager) {
                return res.status(500).json({ err: `Error... ${branchExist.location} branch already has a branch manager!!!` })
            }
            update.branchManager = branchManager.trim()
            await User.findOneAndUpdate({ _id: branchManager }, { branch: branch_id }, { new: true, runValidators: true })
        }
    }

    // also ensure the branch manager can only make changes to his branch
    const bmAccess = await User.findOne({ _id: req.info.id.id })
    if (req.info.id.role === 'ADMIN' || (req.info.id.role === 'BRANCH MANAGER' && bmAccess.branch.toString() === branch_id)) {
        if (storeManager.trim() !== '') {
            const isSM = await User.findOne({ _id: storeManager })
            if (!isSM) {
                return res.status(StatusCodes.NOT_FOUND).json({ err: `Error... user not found!!!` })
            }
            if (isSM.role !== 'STORE MANAGER') {
                return res.status(500).json({ err: `Error... Selected user's role for SM's position in ${branchExist.location} branch is not store manager!!!` })
            }
            // now let's check if he's not the storeManger for another branch
            const branch = await Branch.find({ storeManager: { $eq: storeManager } })
            if (branch.length) {
                const branchInfo = branch[0].location
                return res.status(500).json({ err: `Error... ${isSM.name} is already assigned to ${branchInfo} branch as the store manager!!!` })
            }
            // now ensure another SM doesn't displaces the current SM
            if (branchExist.storeManager) {
                return res.status(500).json({ err: `Error... ${branchExist.location} branch already has a store manager!!!` })
            }
            update.storeManager = storeManager.trim()
            await User.findOneAndUpdate({ _id: storeManager }, { branch: branch_id }, { new: true, runValidators: true })
        }

        if (salesPerson.trim() !== '') {
            const isSM = await User.findOne({ _id: salesPerson })
            if (!isSM) {
                return res.status(StatusCodes.NOT_FOUND).json({ err: `Error... user not found!!!` })
            }
            if (isSM.role !== 'SALES PERSON') {
                return res.status(500).json({ err: `Error... Selected user's role for SP's position in ${branchExist.location} branch is not sales person!!!` })
            }
            // now let's check if he's not the salesPerson for another branch
            const branch = await Branch.find({ salesPerson: { $eq: salesPerson } })
            if (branch.length) {
                const branchInfo = branch[0].location
                return res.status(500).json({ err: `Error... ${isSM.name} is already assigned to ${branchInfo} branch as the sales person!!!` })
            }
            // now ensure another SM doesn't displaces the current SM
            if (branchExist.salesPerson) {
                return res.status(500).json({ err: `Error... ${branchExist.location} branch already has a sales person!!!` })
            }
            update.salesPerson = salesPerson.trim()
            await User.findOneAndUpdate({ _id: salesPerson }, { branch: branch_id }, { new: true, runValidators: true })
        }
    }

    const updateBranch = await Branch.findOneAndUpdate({ _id: branch_id }, { $set: update }, { new: true, runValidators: true }).populate("branchManager storeManager salesPerson", "name")

    res.status(StatusCodes.OK).json({ msg: `Staff(s) added to ${updateBranch.location} branch successfully...`, branchInfo: updateBranch })

})

// listed below are to be updated in their respective controllers
const changeBranchLocation = asyncHandler(async(req, res) => {
    const { branch_id, location } = req.body
    const user = await User.findOne({ _id: req.info.id.id })
    if (req.info.id.role === 'ADMIN' || (req.info.id.role === 'BRANCH MANAGER' && String(user.branch) === branch_id)) {
        // make sure the entered branch is not already in use
        const locationExist = await Branch.find({ location })
        if (locationExist.length) {
            return res.status(500).json({ err: `Selected location already exist, please choose another...` })
        }
        const branch = await Branch.findOneAndUpdate({ _id: branch_id }, { location }, { new: true, runValidators: true })
        if (!branch) {
            return res.status(500).json({ err: `Error... Unable to make changes` })
        }
        return res.status(200).json({ msg: `Branch location changed successfully...`, newBranchInfo: branch })
    } else {
        return res.status(StatusCodes.UNAUTHORIZED).json({ err: `Error... You're not authorized to make this change!!!` })
    }
})
const getAllBranch = asyncHandler(async(req, res) => {
    const { branch_id, location } = req.body

    if (req.info.id.role !== 'ADMIN' && req.info.id.role !== 'BRANCH MANAGER') {
        res.status(StatusCodes.UNAUTHORIZED).json({ err: `Error... You're not authorized to perform such operation!!!` })
    }
    if (req.info.id.role === 'ADMIN') {
        const query = {};
        if (branch_id) {
            query._id = branch_id;
        }

        if (location) {
            query.location = { $regex: new RegExp(location, 'i') };
        }

        const branches = await Branch.find(query).populate("branchManager storeManager salesPerson", "name");

        if (!branches.length) {
            return res.status(404).json({ err: `Error... No store branches found with provided criteria.` });
        }

        res.status(StatusCodes.OK).json({ nbHit: branches.length, allBranch: branches });
    }
    if (req.info.id.role === 'BRANCH MANAGER') {
        const user = await User.findOne({ _id: req.info.id.id })
        if (!user.branch) {
            return res.status(500).json({ err: `Error... ${user.name}, with role as Branch Manager hasn't been assigned to any branch yet!!!` })
        }
        const branch_id = user.branch
        const branchExist = await Branch.findOne({ _id: branch_id })
        if (!branchExist) {
            return res.status(404).json({ err: `Error... Branch with ID ${branch_id} not found!!!` })
        }
        return res.status(200).json({ branch: branchExist })

    }


})
const deleteBranch = asyncHandler(async(req, res) => {
    const { branch_id } = req.body
    if (req.info.id.role !== 'ADMIN') {
        return res.status(401).json({ err: `Error... ${req.info.id.id} you're not authorized to delete any branch!!!` })
    }
    const branchExist = await Branch.findOne({ _id: branch_id })
    if (!branchExist) {
        return res.status(404).json({ err: `Error... Branch with ID '${branch_id}' not found!!!` })
    }
    // first all users who is linked to this branch will have it's id replaced by nothing
    await User.updateMany({ branch: branch_id }, { $unset: { branch: 1 } }, { new: true, runValidators: true })
        // delete all product in the branch

    // delete all invoice in the branch

    // delete all orderList in the branch

    // delete all daily account in the branch

    const delBranch = await Branch.findOneAndDelete({ _id: branch_id })
    return res.status(200).json({ msg: `${delBranch.location} branch has been deleted successfully` })
        // return res.json({ msg: `Kindly bear with us we are working on it!!!` })

})

module.exports = { createBranch, changeBranchLocation, deleteBranch, getAllBranch, addBranchStaffs }