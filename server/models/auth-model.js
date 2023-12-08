const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const authSchema = new mongoose.Schema({
    userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    password: { type: String, required: true, trim: true },
    uniqueCode: { type: String, required: true, trim: true }
}, { timestamps: true })

// Hash Password
authSchema.pre("save", async function(next) {
    if (!this.isModified) {
        next()
    }
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
})

// Match Password
authSchema.methods.matchPassword = async function(enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password)
}
module.exports = mongoose.model("Auth", authSchema)