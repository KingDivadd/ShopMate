const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    firstName: { type: String, trim: true, required: true },
    lastName: { type: String, trim: true, required: true },
    email: { type: String, trim: true, required: true, unique: true },
    phone: { type: String, trim: true, unique: true },
    pic: { type: String, trim: true, default: 'http://here.' },
    role: { type: String, enum: ["store-manager", "sales-person", "branch-manager", "admin"], required: true },
    branch: { type: mongoose.Types.ObjectId, ref: "Branch" }

}, { timestamps: true })

module.exports = mongoose.model("User", userSchema)