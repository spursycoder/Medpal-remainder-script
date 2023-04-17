require("dotenv").config();
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI);

// create a nodemailer transporter with your email credentials
const transporter = nodemailer.createTransport({
	service: "SendinBlue",
	auth: {
		user: process.env.USER,
		pass: process.env.PASS,
	},
});

const message = `Dear ${user.name}, it's time to take your medicine: ${medicine.name}`;

// send an email to the user
transporter.sendMail(
	{
		from: "medpal96@gmail.com",
		to: user.email,
		subject: "Medicine Reminder",
		text: message,
	},
	(error, info) => {
		if (error) {
			console.error(error);
		} else {
			console.log(`Email sent to ${user.email}: ${message}`);
		}
	}
);
