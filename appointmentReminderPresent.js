const cron = require("node-cron");
require("dotenv").config();
const nodemailer = require("nodemailer");
const Appointments = require("./appointmentModel.js");
const mongoose = require("mongoose");
const axios = require("axios");
const moment = require("moment-timezone");

mongoose.connect(process.env.MONGO_URI);

// create a nodemailer transporter with your email credentials
const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: "medpal96@gmail.com",
		pass: process.env.PASS,
	},
});

// Create a cron job that runs every day at 5 pm
cron.schedule(
	"0 5 * * *",
	async () => {
		console.log("checking.....");
		// Get the appointments scheduled for the next day
		const today = new Date(
			new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
		);
		console.log(today);
		today.setDate(today.getDate());
		const appointments = await Appointments.find({
			timeAndDate: {
				$gte: today.setHours(5, 0, 0, 0),
				$lt: today.setHours(23, 59, 59, 999),
			},
		});

		for (const appointment of appointments) {
			const user = await getUserById(appointment.user_id);
			console.log("user", user);
			const message = `Dear ${user.name}, you have an appointment today with ${appointment.doctorName} at ${appointment.timeAndDate.toTimeString()}. Check MedPal for more details.`;
			console.log(message);
			// send an email to the user
			transporter.sendMail(
				{
					from: "medpal96@gmail.com",
					to: user.email,
					subject: "Appointment Reminder",
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
		}
	},
	{
		timezone: "Asia/Kolkata",
	}
);

async function getUserById(userId) {
	const config = {
		method: "get",
		url: "https://medpal-backend.onrender.com/api/user/" + userId,
		headers: {},
	};

	try {
		const response = await axios.request(config);
		console.log(JSON.stringify(response.data));
		return response.data;
	} catch (error) {
		console.log(error);
		throw new Error("Unable to get user");
	}
}
