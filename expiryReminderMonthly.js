const cron = require("node-cron");
require("dotenv").config();
const nodemailer = require("nodemailer");
const Medicines = require("./medicineModel.js");
const mongoose = require("mongoose");
const axios = require("axios");

mongoose.connect(process.env.MONGO_URI);

// create a nodemailer transporter with your email credentials
const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: "medpal96@gmail.com",
		pass: process.env.PASS,
	},
});

// define a cron job that runs every day at 12am
cron.schedule(
	"0 0 1 * *",
	async () => {
		console.log("running a check on the first day of every month");
		const now = new Date();
		const thisMonth = now.getMonth() + 1;
		const thisYear = now.getFullYear();

		// find all medicines that expire on the current month and year
		const medicines = await Medicines.find({
			expiry: {
				$gte: new Date(`${thisYear}-${thisMonth}-01`),
				$lt: new Date(`${thisYear}-${thisMonth + 1}-01`),
			},
		});

		console.log(medicines);

		for (const medicine of medicines) {
			const user = await getUserById(medicine.user_id);
			console.log("user", user);
			const message = `Dear ${user.name}, your medicine ${medicine.name} will expire this month.`;

			// send an email to the user
			transporter.sendMail(
				{
					from: "medpal96@gmail.com",
					to: user.email,
					subject: "Medicine Expiry Reminder",
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
