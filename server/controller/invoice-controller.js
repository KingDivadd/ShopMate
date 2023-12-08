const asyncHandler = require('express-async-handler')
const { StatusCodes } = require('http-status-codes')
const Branch = require("../models/branch-model")
const Product = require("../models/product-model")
const Invoice = require("../models/invoice-model")
const User = require("../models/user-model")


const newSale = asyncHandler(async(req, res) => {
    const { branch_id, sale, customer, paymentStatus, paymentMethod, totalPaid } = req.body

    if (!branch_id || !sale.length) {
        return res.status(500).json({ err: `Error... Provide all necessary informations to make sale!!!` })
    }

    const seller = await User.findOne({ _id: req.info.id.id })
    const branchExist = await Branch.findOne({ _id: branch_id })
    if (!branchExist) {
        return res.status(404).json({ err: `Error... Branch with ID of ${branch_id} is not a registered branch!!!` })
    }
    if (req.info.id.role !== 'ADMIN' && !(req.info.id.role === 'BRANCH MANAGER' || seller.branch === branch_id) && !(req.info.id.role === 'SALES PERSON' || seller.branch === branch_id)) {
        return res.status(401).json({ err: `Error... ${req.info.id.name}, you're not authorized to make sales in ${branchExist.location} branch` })
    }

    const update = {}
    let saleListBox = []
    let productLeftBox = []
    for (let i = sale.length; i--; i > 0) {
        const productExist = await Product.findOne({ productBranch: branch_id, productName: sale[i].productName })
        if (!productExist) {
            return res.status(404).json({ err: `${sale[i].productName} not found in ${branchExist.location} branch!!!` })
        }

        if (Number(sale[i].quantity) > Number(productExist.quantity.replace(/,/g, ''))) {
            return res.status(500).json({ err: `Error... Insufficient product, restock ${sale[i].productName} in ${branchExist.location}` })
        }

        const saleList = {}
        saleList.productName = sale[i].productName
        const qty = Number(sale[i].quantity)
        saleList.quantity = qty.toLocaleString()
        saleList.unitPrice = productExist.price
        const subTotal = Number(sale[i].quantity) * Number(productExist.price.replace(/,/g, ''))
        saleList.subTotal = subTotal.toLocaleString()
        saleList.addedBy = req.info.id.id

        const newProductInfo = {}
        newProductInfo.productName = sale[i].productName
        const quantity_left = Number(productExist.quantity.replace(/,/g, '')) - Number(sale[i].quantity)
        newProductInfo.quantity = quantity_left.toLocaleString()
        newProductInfo.unitPrice = productExist.price
        const totalCost = Number(productExist.price.replace(/,/g, '')) * Number(quantity_left)
        newProductInfo.totalCost = totalCost.toLocaleString()

        saleListBox.push(saleList)
        productLeftBox.push(newProductInfo)
        await Product.findOneAndUpdate({ _id: productExist._id }, { $set: newProductInfo }, { new: true, runValidators: true })
    }


    if (branch_id.trim() !== '') {
        update.branch = branch_id.trim()
    }
    if (customer.trim() !== '') {
        update.customer = customer.trim()
    } else { update.customer = 'Walk-In Customer' }

    if (paymentStatus.trim() !== '') {
        update.paymentStatus = paymentStatus.trim()
    }
    if (paymentMethod.trim() !== '') {
        update.paymentMethod = paymentMethod.trim()
    }

    const totalSubTotal = saleListBox.reduce((accumulator, item) => {
        // Remove commas and convert to a number
        const subTotal = Number(item.subTotal.replace(/,/g, ''));

        // Add the current subTotal to the accumulator
        return accumulator + subTotal;
    }, 0);

    update.totalAmount = totalSubTotal.toLocaleString()

    const totalItems = saleListBox.reduce((accumulator, item) => {
        // Remove commas and convert to a number
        const subTotal = Number(item.quantity.replace(/,/g, ''));

        // Add the current subTotal to the accumulator
        return accumulator + subTotal;
    }, 0);
    let zero = 0
    if (totalPaid.trim() !== '') {
        if (Number(totalPaid) < Number(totalSubTotal)) {
            update.totalPaid = Number(totalPaid.trim()).toLocaleString()
            const sellDue = Number(totalSubTotal) - Number(totalPaid)
            update.sellDue = sellDue.toLocaleString()
        } else {
            update.totalPaid = Number(totalPaid.trim()).toLocaleString()
            update.sellDue = zero.toLocaleString()
        }
    } else {

        update.totalPaid = update.totalAmount
        update.sellDue = zero.toLocaleString()
    }
    update.totalItems = totalItems.toLocaleString()
    update.addedBy = req.info.id.id
    update.invoiceItems = saleListBox.reverse()

    const newInvoice = await Invoice.create(update)

    const updateCurrentBranch = await Branch.findOneAndUpdate({ _id: branch_id }, { $push: { invoiceList: newInvoice._id } }, { new: true, runValidators: true }).select("location invoiceList")

    return res.send({ msg: `Sales created successfully`, currentBranch: updateCurrentBranch, invoice: newInvoice, })
})

const allSaleInvoice = asyncHandler(async(req, res) => {
    const { branch_id, invoice_id, startDate, endDate } = req.body

    const userExist = await User.findOne({ _id: req.info.id.id })
    if (!userExist) {
        return res.status(404).json({ err: `Error... User with ID ${req.info.id.id} not found!!!` })
    }
    if (!branch_id) {
        return res.status(404).json({ err: `Error... Please provide the branch id!!!` })
    }
    const branchExist = await Branch.findOne({ _id: branch_id })
    if (!branchExist) {
        return res.status(404).json({ err: `Error... Branch with ID of ${branch_id} is not a registered branch!!!` })
    }
    if (req.info.id.role !== 'ADMIN' && String(userExist.branch) !== branch_id) {
        return res.status(401).json({ err: `Error... ${req.info.id.name}, you're not authorized to view sale lists for ${branchExist.location} branch` })
    }
    const query = {}
    if (branch_id) {
        query.branch = branch_id.trim()
    }
    if (invoice_id) {
        query._id = invoice_id.trim()
    }
    if (startDate) {
        query.createdAt = { $gt: new Date(startDate) }
    }
    if (endDate) {
        query.createdAt = { $gt: new Date(endDate) }
    }
    const branchInvoice = await Invoice.find(query).populate("addedBy", "name role")
    if (!branchInvoice.length) {
        return res.status(404).json({ msg: `${branchExist.location} branch has no recorded invoices yet!!!` })
    }
    return res.status(200).json({ branch: branchExist.location, nbInvoices: branchInvoice.length, invoices: branchInvoice })
})

const editSaleInvoice = asyncHandler(async(req, res) => {
    const { branch_id, invoice_id, sale, customer, paymentStatus, paymentMethod, totalPaid } = req.body

    // return res.status("Edit sale invoice under design")
    if (!branch_id || !invoice_id) {
        return res.status(500).json({ err: `Error... Provide banch and invoice IDs!!!` })
    }

    const user = await User.findOne({ _id: req.info.id.id })
    const branchExist = await Branch.findOne({ _id: branch_id }).populate("productList", "productName price quantity")
    if (!branchExist) {
        return res.status(404).json({ err: `Error... Branch with ID of ${branch_id} was not found!!!` })
    }
    const invoiceExist = await Invoice.findOne({ _id: invoice_id, branch: branch_id })
    if (!invoiceExist) {
        return res.status(404).json({ err: `Error... Invoice with ID of ${invoice_id} was not found in ${branchExist.location} branch's inventory!!!` })
    }

    if (req.info.id.role !== 'ADMIN' && !(req.info.id.role === 'BRANCH MANAGER' || user.branch === branch_id)) {
        return res.status(401).json({ err: `Error... ${req.info.id.name}, you're not authorized to make changes to sales invoice in ${branchExist.location} branch` })
    }

    // ensure all new entered products exist in the branch
    const invalidProducts = [];
    for (const data of sale) {
        const productExist = await Product.findOne({ productBranch: branch_id, productName: data.productName });
        if (!productExist) {
            invalidProducts.push(data.productName);
        }
    }
    if (invalidProducts.length > 0) {
        return res.status(404).json({ err: `${invalidProducts.join(', ')} not found in ${branchExist.location} branch!!!` });
    }
    // now let's get a list of products that exist in the invoice and branchProduct (basically what was sold)
    const add = []
    const invoiceItem = invoiceExist.invoiceItems
    invoiceItem.forEach(async(data, ind) => {
        for (const name of sale) {
            if (data.productName === name.productName) {
                add.push(data)
            }
        }
    });

    // now let's return all initially sold products
    const store = []
    const productList = branchExist.productList
    const updatePromise = productList.map(async(data) => {
        for (const name of add) {
            if (data.productName === name.productName) {
                const update = {}
                    // now adding their quantity
                const quantity = Number(data.quantity.replace(/,/g, '')) + Number(name.quantity.replace(/,/g, ''))
                update.productName = data.productName
                const price = Number(data.price.replace(/,/g, ''))
                const totalCost = quantity * price
                update.quantity = quantity.toLocaleString()
                update.price = price.toLocaleString()
                update.totalCost = totalCost.toLocaleString()
                store.push(update)
                await Product.findOneAndUpdate({ productBranch: branch_id, productName: data.productName }, { $set: update }, { new: true, runValidators: true })
            }
        }
    });

    await Promise.all(updatePromise)

    const update = {}
    let saleListBox = [];

    for (const data of sale) {
        const product = await Product.findOne({ productBranch: branch_id, productName: data.productName }).select("productName price quantity")
        if (!product) {
            return res.status(404).json({ err: `Error... ${data.productName} was not found in ${branchExist.location} branch!!!` });
        }
        if (Number(data.quantity) > Number(product.quantity.replace(/,/g, ''))) {
            return res.status(500).json({ err: `Error... Insufficient amount of ${data.productName} in ${branchExist.location} branch!!!` })
        }
        //upate for the new invoice
        const saleList = {}
        saleList.productName = data.productName
        const qty = Number(data.quantity)
        saleList.quantity = qty.toLocaleString()
        saleList.unitPrice = product.price
        const subTotal = Number(data.quantity) * Number(product.price.replace(/,/g, ''))
        saleList.subTotal = subTotal.toLocaleString()
        saleListBox.push(saleList)

        const newProductInfo = {}
        newProductInfo.productName = data.productName
        const quantity_left = Number(product.quantity.replace(/,/g, '')) - Number(data.quantity)
        newProductInfo.quantity = quantity_left.toLocaleString()
        newProductInfo.unitPrice = product.price
        const totalCost = Number(product.price.replace(/,/g, '')) * Number(quantity_left)
        newProductInfo.totalCost = totalCost.toLocaleString()

        await Product.findOneAndUpdate({ productBranch: branch_id, productName: product.productName }, { $set: newProductInfo }, { new: true, runValidators: true })
    }

    if (customer.trim() !== '') {
        update.customer = customer.trim()
    } else { update.customer = 'Walk-In Customer' }

    if (paymentStatus.trim() !== '') {
        update.paymentStatus = paymentStatus.trim()
    }
    if (paymentMethod.trim() !== '') {
        update.paymentMethod = paymentMethod.trim()
    }

    const totalSubTotal = saleListBox.reduce((accumulator, item) => {
        // Remove commas and convert to a number
        const subTotal = Number(item.subTotal.replace(/,/g, ''));

        // Add the current subTotal to the accumulator
        return accumulator + subTotal;
    }, 0);

    update.totalAmount = totalSubTotal.toLocaleString()

    const totalItems = saleListBox.reduce((accumulator, item) => {
        // Remove commas and convert to a number
        const subTotal = Number(item.quantity.replace(/,/g, ''));

        // Add the current subTotal to the accumulator
        return accumulator + subTotal;
    }, 0);
    let zero = 0
    if (totalPaid.trim() !== '') {
        if (Number(totalPaid) < Number(totalSubTotal)) {
            update.totalPaid = Number(totalPaid.trim()).toLocaleString()
            const sellDue = Number(totalSubTotal) - Number(totalPaid)
            update.sellDue = sellDue.toLocaleString()
        } else {
            update.totalPaid = Number(totalPaid.trim()).toLocaleString()
            update.sellDue = zero.toLocaleString()
        }
    } else {

        update.totalPaid = update.totalAmount
        update.sellDue = zero.toLocaleString()
    }
    update.totalItems = totalItems.toLocaleString()
    update.addedBy = req.info.id.id
    update.invoiceItems = saleListBox.reverse()

    const newInvoice = await Invoice.findOneAndUpdate({ _id: invoice_id, branch: branch_id }, { $set: update }, { new: true, runValidators: true })

    return res.status(200).json({ msg: `Invoice with ID ${invoice_id} for ${branchExist.location} branch has been updated successfully`, newInvoice: newInvoice })
})

const deleteInvoice = asyncHandler(async(req, res) => {
    const { branch_id, invoice_id } = req.body
    if (req.info.id.role !== 'ADMIN') {
        return res.status(401).json({ err: `Error... ${req.info.id.name}, you're not authorized to delete any invoice!!!` })
    }
    const branchExist = await Branch.findOne({ _id: branch_id })
    if (!branchExist) {
        return res.status(404).json({ err: `Error... Branch with ID ${branch_id} not found!!!` })
    }
    const invoiceExist = await Invoice.findOne({ _id: invoice_id, branch: branch_id })
    if (!invoiceExist) {
        return res.status(404).json({ err: `Error... Invoice with ID ${invoice_id} not found in ${branchExist.location} branch's inventory` })
    }

    // we remove any traces of the invoice id
    const unLinkBranch = await Branch.findOneAndUpdate({ _id: branch_id }, { $pull: { invoiceList: invoice_id } }, { new: true, runValidators: true }).select("location invoiceList")

    const delInvoice = await Invoice.findOneAndDelete({ _id: invoice_id })
    return res.status(200).json({ msg: `Invoice with ID ${invoice_id} has been deleted from ${branchExist.location} branch successfully!!!`, newBranchInfo: unLinkBranch })


})

module.exports = { newSale, editSaleInvoice, deleteInvoice, allSaleInvoice }