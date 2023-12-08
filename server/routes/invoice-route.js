const express = require('express')
const router = express.Router()
const { deleteInvoice, newSale, allSaleInvoice, editSaleInvoice } = require('../controller/invoice-controller')
const tokenDecoder = require('../middleware/auth-middleware')

router.route('/new-sale').post(tokenDecoder, newSale)
router.route('/all-sale').get(tokenDecoder, allSaleInvoice)
router.route('/edit-sale-invoice').patch(tokenDecoder, editSaleInvoice)
router.route('/delete-invoice').delete(tokenDecoder, deleteInvoice)

module.exports = router