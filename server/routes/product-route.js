const express = require('express')
const router = express.Router()
const { deleteProduct, newProduct, transferProduct, updateProductInfo, allProducts } = require("../controller/product-controller")
const tokenDecoder = require('../middleware/auth-middleware')

router.route('/new-product').post(tokenDecoder, newProduct)
router.route('/all-branch-products').post(tokenDecoder, allProducts)
router.route('/edit-product-info').patch(tokenDecoder, updateProductInfo)
router.route('/tranfer-product').patch(tokenDecoder, transferProduct)
router.route('/delete-product').delete(tokenDecoder, deleteProduct)

module.exports = router