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

// define a cron job that runs every minute
cron.schedule("* * * * *", async () => {
	console.log("running a check every minute");
	const now = new Date();
	const hour = now.getHours();

	// check if it's time to send emails for morning, afternoon, evening, and night
	if (hour === 8 || hour === 13 || hour === 17 || hour === 21) {
		const medicines = await Medicines.find({
			// find all medicines that have the respective timeOfDay set to true
			[`timeOfDay.${hourToTimeOfDay(hour)}.yesOrNot`]: true,
		});

		for (const medicine of medicines) {
			const user = await getUserById(medicine.user_id);
			console.log("user", user);
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
		}
	}
});

// helper function to convert hour to timeOfDay string
function hourToTimeOfDay(hour) {
	if (hour === 8) return "morning";
	if (hour === 13) return "afternoon";
	if (hour === 17) return "evening";
	if (hour === 21) return "night";
	throw new Error("Invalid hour");
}

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
