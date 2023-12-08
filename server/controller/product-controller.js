const asyncHandler = require('express-async-handler')
const { StatusCodes } = require('http-status-codes')
const User = require("../models/user-model")
const Product = require("../models/product-model")
const Branch = require("../models/branch-model")


const allProducts = asyncHandler(async(req, res) => {
    const { location } = req.body
    if (req.info.id.role === 'ADMIN') {
        const locationExist = await Branch.findOne({ location })
        if (locationExist) {
            const product = await Product.find({ productBranch: locationExist._id }).populate("productBranch", "location")
            return res.status(200).json({ msg: `${location} branch`, nbProducts: product.length, products: product })
        }
        const allProducts = await Product.find({}).populate("productBranch", "location")
        if (!allProducts) {
            return res.status(500).json({ err: `Error... Unable to fetch product data!!!` })
        }
        return res.status(StatusCodes.OK).json({ msg: `All product`, nbProducts: allProducts.length, products: allProducts })
    }

    const user = await User.findOne({ _id: req.info.id.id })
    if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({ err: `Error... User with ID ${user._id} was not found!!!` })
    }
    if (!user.branch) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ err: `Error... Only branch registred users can view branch products!!!` })
    }
    const branchExist = await Branch.findOne({ _id: String(user.branch) })
    if (!branchExist) {
        return res.status(StatusCodes.NOT_FOUND).json({ err: `Error... Branch with ID ${user.branch} not found!!!` })
    }
    const product = await Product.find({
        productBranch: { $eq: user.branch }
    }).populate("productBranch", "location")
    if (!product.length) {
        return res.status(StatusCodes.OK).json({ msg: `No product has been added to ${branchExist.location} branch yet...` })
    }
    return res.status(200).json({ location: branchExist.location, numProducts: product.length, products: product })


})

const newProduct = asyncHandler(async(req, res) => {
    const { productName, prodPrice, unit, branch_id, prodQuantity } = req.body
    if (!productName || !prodPrice || !unit || !branch_id || !prodQuantity) {
        return res.status(500).json({ err: `Please provide all product related informations!!!` })
    }

    const user = await User.findOne({ _id: req.info.id.id })

    const branchExist = await Branch.findOne({ _id: branch_id })
    if (!branchExist) {
        return res.status(500).json({ err: `Error... Product cannot be added to an unregisted business branch!!!` })
    }
    // the ADMIN
    // || (branchExist.branchManager && String(user.branch) === branch_id)
    if (req.info.id.role === "ADMIN") {

        // let's check if their's a product with the same name in the db
        const products = await Product.find({ productBranch: branch_id, productName: productName })
        if (products.length) {
            const quantity = Number(products[0].quantity.replace(/,/g, '')) + Number(prodQuantity.replace(/,/g, ''))
            const totalCost = quantity * Number(products[0].price.replace(/,/g, ''))

            const updateProduct = await Product.findOneAndUpdate({ _id: products[0]._id }, { quantity: quantity.toLocaleString(), totalCost: totalCost.toLocaleString() }, { new: true, runValidators: true })

            return res.status(200).json({ msg: `Adding ${prodQuantity} ${unit} to existing amont of ${productName} in ${branchExist.location} branch`, product: updateProduct })
        }

        const totalCost = Number(prodPrice) * Number(prodQuantity)
        req.body.productBranch = branch_id
        req.body.productAdder = req.info.id.id
        req.body.price = Number(prodPrice).toLocaleString()
        req.body.quantity = Number(prodQuantity).toLocaleString()
        req.body.totalCost = totalCost.toLocaleString()
        const newProduct = await Product.create(req.body)
            // add the new product to the branch
        const productBranch = await Branch.findOneAndUpdate({ _id: branch_id }, { $push: { productList: newProduct } }, { new: true, runValidators: true })
        return res.status(200).json({ msg: `New Product Added to ${branchExist.location} branch`, product: newProduct })
    } else {
        return res.status(StatusCodes.UNAUTHORIZED).json({ err: `${req.info.id.name}, you're not authorized to perform this operation` })
    }
})

const updateProductInfo = asyncHandler(async(req, res) => {
    const { product_id, productName, price, productPic, unit, quantity } = req.body
    const productExist = await Product.findOne({ _id: product_id })
    if (!productExist) {
        return res.status(StatusCodes.NOT_FOUND).json({ err: `Product with product ID ${product_id} not found!!!` })
    }
    const productBranch = await Branch.findOne({ _id: productExist.productBranch })

    if (req.info.id.role === "ADMIN" || (req.info.id.role === "BRANCH MANAGER" && productBranch.branchManager === req.info.id.id)) {
        const update = {}
        if (productName.trim() !== '') {
            update.productName = productName.trim()
        }

        if (productPic.trim() !== '') {
            update.productPic = productPic.trim()
        }

        if (unit.trim() !== '') {
            update.unit = unit.trim()
        }

        if (price.trim() !== '') {

            update.price = Number(price.trim()).toLocaleString()
        }

        if (quantity.trim() !== '') {
            update.quantity = Number(quantity.trim()).toLocaleString()
        }

        const newProduct = await Product.findOneAndUpdate({ _id: product_id }, { $set: update }, { new: true, runValidators: true })

        const totalCost = Number(newProduct.price.replace(/,/g, '')) * Number(newProduct.quantity.replace(/,/g, ''))

        const updateProduct = await Product.findOneAndUpdate({ _id: product_id }, { totalCost: totalCost.toLocaleString() }, { new: true, runValidators: true })
        if (!updateProduct) {
            res.status(500).json({ err: `Error, unable to update product info. contact your developers!!!` })
        }
        res.status(StatusCodes.OK).json({ msg: `Product updated successfully`, productInfo: updateProduct })
    } else {
        res.status(StatusCodes.UNAUTHORIZED).json({ err: `${req.info.id.name}, you're not authorized to perfom this operation` })
    }
})

const transferProduct = asyncHandler(async(req, res) => {
    const { old_branch, productName, quantity, new_branch } = req.body
    if (req.info.id.role !== 'ADMIN') {
        return res.status(401).json({ err: `Error... ${req.info.name} you're not authorized to transfer product to another branch!!!` })
    }

    if (!old_branch || !productName || !quantity || !new_branch) {
        return res.status(500).json({ err: `Error... Please provide required information for product transfer!!!` })
    }
    if (old_branch === new_branch) {
        return res.status(500).json({ err: `Error... You cannot transfer goods between the same branch!!!` })
    }

    const old_branchExist = await Branch.findOne({ _id: old_branch }).populate("productList", "productName")
    if (!old_branchExist) {
        return res.status(404).json({ err: `Error... Branch with ID ${old_branch} not found!!!` })
    }
    const productList = old_branchExist.productList
    let index = ''
    const old_branch_info = {}
    productList.forEach((data, ind) => {
        if (data.productName === productName) {
            index = ind
        }
    });
    if (index === '') {
        return res.status(404).json({ err: `Error... ${productName} isn't available in ${old_branchExist.location} branch!!!` })
    }
    const product = await Product.findOne({ _id: productList[index]._id })
    if (Number(product.quantity.replace(/,/g, '')) < Number(quantity)) {
        return res.status(500).json({ err: `Error... Insufficient product... restock ${productName} in ${old_branchExist.location} branch!!!` })
    }
    const old_quantity = Number(product.quantity.replace(/,/g, '')) - Number(quantity)
    const totalCost = old_quantity * Number(product.price.replace(/,/g, ''))
    old_branch_info.quantity = old_quantity.toLocaleString()
    old_branch_info.totalCost = totalCost.toLocaleString()

    const update_old_product = await Product.findOneAndUpdate({ _id: product._id }, { $set: old_branch_info }, { new: true, runValidators: true }).select("productName price quantity totalCost productBranch").populate("productBranch", "location")

    let new_index = ''
    const new_branch_info = {}
    const new_branchExist = await Branch.findOne({ _id: new_branch }).populate("productList", "productName")
    if (!new_branchExist) {
        return res.status(404).json({ err: `Error... Branch with ID ${new_branch} not found!!!` })
    }
    const new_productList = new_branchExist.productList
    new_productList.forEach((data, ind) => {
        if (data.productName === productName) {
            new_index = ind
        }
    });
    if (new_index === '') {
        return res.status(404).json({ err: `Error... ${productName} isn't present in ${new_branchExist.location} branch` })
            // here we will create a new product in the branch
    }
    // here we will add to it
    const new_product = await Product.findOne({ _id: new_productList[new_index]._id }).populate("productBranch", "location")
    const new_quantity = Number(new_product.quantity.replace(/,/g, '')) + Number(quantity)
    const new_totalCost = new_quantity * Number(new_product.price.replace(/,/g, ''))
    new_branch_info.quantity = new_quantity.toLocaleString()
    new_branch_info.totalCost = new_totalCost.toLocaleString()

    const update_new_product = await Product.findOneAndUpdate({ _id: new_product._id }, { $set: new_branch_info }, { new: true, runValidators: true }).select("productName price quantity totalCost productBranch").populate("productBranch", "location")


    res.status(200).json({ msg: `${quantity} ${product.unit} of ${productName} has been transfered from ${old_branchExist.location} to ${new_branchExist.location} branch successfully`, oldProductInfo: update_old_product, newBranchNewInfo: update_new_product })
})

const deleteProduct = asyncHandler(async(req, res) => {
    const { product_id } = req.body

    const productExist = await Product.findOne({ _id: product_id })
    if (!productExist) {
        return res.status(404).json({ err: `Error... Product with ID ${product_id} not found!!!` })
    }
    const user = await User.findOne({ _id: req.info.id.id })
    if (!user) {
        return res.status(404).json({ err: `Error... User not found!!!` })
    }
    if (!user.branch) {
        return res.status(401).json({ err: `Error... You're not authorized to delete product` })
    }


    if (!productExist.productBranch) {
        const removeProduct = await Product.findOneAndDelete({ _id: product_id })
        return res.status(StatusCodes.OK).json({ msg: `Product deleted successfully`, deletedProduct: removeProduct })

    }

    if (req.info.id.role === "ADMIN" || (req.info.id.role === "BRANCH MANAGER" && String(user.branch) === productExist.productBranch)) {
        const removeProduct = await Product.findOneAndDelete({ _id: product_id }).select("productName quantity unit")
        if (!removeProduct) {
            return res.status(500).json({ err: `Error... Unable to detele ${productExist.productName}!!!` })
        }
        // new removing the product from the branch
        const updatedBranch = await Branch.findOneAndUpdate({ _id: productExist.productBranch }, { $pull: { productList: product_id } }, { new: true, runValidators: true }).select("productList")
        if (!updatedBranch) {
            return res.status(500).json({ err: `Error... Unable to remove deleted product from ${updatedBranch.location} branch!!!` })
        }
        return res.status(StatusCodes.OK).json({ msg: `Product deleted successfully`, productInfo: removeProduct, newBranch: updatedBranch })
    } else {
        return res.status(StatusCodes.UNAUTHORIZED).json({ err: `${req.info.id.name}, you're not authorized to perfom this operation!!!` })
    }
})

module.exports = { newProduct, updateProductInfo, transferProduct, deleteProduct, allProducts }