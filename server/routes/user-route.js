const express = require('express')
const router = express.Router()
const { allUsers, oneUser, removeUser, updateUserInfo, findUser, filterUser, deBranchUser } = require('../controller/user-controller')
const tokenDecoder = require('../middleware/auth-middleware')

router.route('/users').get(tokenDecoder, allUsers)
router.route('/filter-users').post(filterUser)
router.route('/find-user').post(tokenDecoder, findUser)
router.route('/de-branch-user').patch(tokenDecoder, deBranchUser)
router.route('/one-user').post(oneUser)
router.route('/update-user-info').patch(tokenDecoder, updateUserInfo)
    // router.route('/update-user-pic/:id').patch(tokenDecoder, uploadImage)s
router.route('/delete-user').delete(tokenDecoder, removeUser)

module.exports = router