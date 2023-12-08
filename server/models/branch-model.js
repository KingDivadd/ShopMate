const mongoose = require('mongoose')

const branchSchema = new mongoose.Schema({
    location: { type: String, trim: true, required: true, unique: true },
    // staffs: [{ type: mongoose.Types.ObjectId, ref: "User" }],
    branchManager: { type: mongoose.Types.ObjectId, ref: "User" },
    storeManager: { type: mongoose.Types.ObjectId, ref: "User", },
    salesPerson: { type: mongoose.Types.ObjectId, ref: "User", },
    productList: [{ type: mongoose.Types.ObjectId, ref: "Product", }],
    invoiceList: [{ type: mongoose.Types.ObjectId, ref: "Invoice", }],
    orderList: [{ type: mongoose.Types.ObjectId, ref: "Orders", }],
    dailyAcct: [{ type: mongoose.Types.ObjectId, ref: "DailyAcct", }],
}, { timestamps: true })

module.exports = mongoose.model("Branch", branchSchema)