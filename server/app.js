const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')
require('dotenv').config()
require('colors')
const notFoundMiddleware = require('./middleware/not-found-middleware')
const errorHandlerMiddleware = require('./middleware/error-handler-middlerware')
const authRoute = require('./routes/auth-route')
const userRoute = require('./routes/user-route')
const branchRoute = require("./routes/branch-route")
const productRoute = require("./routes/product-route")
const invoiceRoute = require('./routes/invoice-route')
const app = express()

app.use(express.json())
app.use(cors())

// Routes
app.use('/api/auth', authRoute)
app.use('/api/user', userRoute)
app.use('/api/branch', branchRoute)
app.use('/api/product', productRoute)
app.use('/api/invoice', invoiceRoute)

// Errors
app.use(notFoundMiddleware)
    // app.use(errorHandlerMiddleware)

// run app
let PORT = process.env.PORT || 5500
const start = async() => {
    try {
        await connectDB()
        app.listen(PORT, console.log(`ShopIt SERVER started and running on port ${PORT}`.cyan.bold))
    } catch (err) {
        console.log(err);
    }
}

start()