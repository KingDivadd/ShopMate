const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    productName: { type: String, trim: true, required: true, },
    price: { type: String, trim: true },
    totalCost: { type: String, trim: true },
    quantity: { type: String, trim: true, default: 0 },
    productPic: { type: String, trim: true, default: 'http://produc-image' },
    productAdder: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    productBranch: { type: mongoose.Types.ObjectId, ref: "Branch", required: true },
    unit: { type: String, enum: ["ctn(s)", "bag(s)", "keg(s)", "pack(s)", "pc(s)", "bottle(s)"] }
}, { timestamps: true })

module.exports = mongoose.model("Product", productSchema)