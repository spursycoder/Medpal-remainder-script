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

// define a cron job that runs every day
cron.schedule(
	"0 0 * * *",
	async () => {
		console.log("running a check every day");
		const now = new Date(
			new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
		);

		const medicines = await Medicines.find({
			// find all medicines whose expiry date is equal to the current date
			expiry: now.toISOString().slice(0, 10),
		});

		for (const medicine of medicines) {
			const user = await getUserById(medicine.user_id);
			console.log("user", user);
			const message = `Dear ${user.name}, your medicine: ${medicine.name} has expired today. Kindly discard it from your physical inventory.`;

			// send an email to the user
			transporter.sendMail(
				{
					from: "medpal96@gmail.com",
					to: user.email,
					subject: "Medicine Expiry Warning",
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
