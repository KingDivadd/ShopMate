const nodemailer = require('nodemailer')
const sendEmail = (subject, note, email) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.USER,
            pass: process.env.PASS
        }
    })

    const mailOption = {
        from: {
            name: `ShopIt`,
            address: ``,
        },
        to: `${email}`,
        subject: `${subject}`,
        test: `${note}`
    }

    transporter.sendMail(mailOption, function(err, info) {
        if (err) {
            console.log(err);
        } else {
            console.log(`Email has been sent to ${email} with response code ${info.response}`.cyan.bold)
        }
    })
}