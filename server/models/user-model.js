const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: { type: String, trim: true, required: true },
    email: { type: String, trim: true, required: true, unique: true },
    phone: { type: Number, trim: true },
    pic: { type: String, trim: true, default: 'http://here.' },
    role: { type: String, enum: ["CUSTOMER", "STORE MANAGER", "SALES PERSON", "BRANCH MANAGER", "ADMIN"] },
    branch: { type: mongoose.Types.ObjectId, ref: "Branch" }

}, { timestamps: true })

module.exports = mongoose.model("User", userSchema)