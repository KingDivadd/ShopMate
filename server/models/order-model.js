const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
    orderName: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    productList: [{ type: mongoose.Types.ObjectId, ref: "Product", required: true }],
    totalCost: { type: Number, trim: true, required: true }

}, { timestamps: true })

module.exports = mongoose.model("Orders", orderSchema)