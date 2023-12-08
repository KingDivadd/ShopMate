const mongoose = require('mongoose')

const dailyAcctSchema = new mongoose.Schema({
    expenses: { type: String, trim: true, default: "0" },
    expenses: { type: String, trim: true, default: "0" },
    expenses: { type: String, trim: true, default: "0" },
    expenses: { type: String, trim: true, default: "0" },
})

module.exports = mongoose.model("DailyAcct", dailyAcctSchema)