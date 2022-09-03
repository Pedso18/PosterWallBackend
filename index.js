const https = require("https");
const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");
const mongoDb = require("./mongodb");
const secrets = require("./secrets.json");
const stripe = require("stripe")(secrets.secretStripeKey);

const port = 8080;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

const httpsOptions = {
	cert: fs.readFileSync(path.join(__dirname, "selfsigned.crt")),
	key: fs.readFileSync(path.join(__dirname, "selfsigned.key")),
};

const server = http.createServer(httpsOptions, app).listen(port, function () {
	console.log("listening on port: " + port);
});

mongoDb.connect(async () => {
	app.post("/addPostIt", async (req, res) => {
		console.log(req.body.position);
		let result = await mongoDb.addPostIt(
			{
				position: req.body.position,
				size: req.body.size,
				color: req.body.color,
				text: req.body.text,
				author: req.body.author,
			},
			req.body.path
		);
		res.send(result);
	});
	app.post("/getRoom", async (req, res) => {
		// returns an empty object if no room is found
		let room = await mongoDb.findRoom(req.body.path);
		res.send(room);
	});

	app.post("/createAccount", async (req, res) => {
		console.log(req.body);
		let result = await mongoDb.createAccount(req.body.username, req.body.password);
		console.log(result);
		res.send(result);
	});

	app.post("/findAccount", async (req, res) => {
		console.log(req.body);
		let result = await mongoDb.findAccount(req.body.username, req.body.password);
		console.log(result);
		res.send(result);
	});

	app.post("/updateAccount", async (req, res) => {
		console.log(req.body);
		let result = await mongoDb.updateAccount(req.body);
		console.log(result);
		res.send(result);
	});

	app.post("/checkout", async (req, res) => {
		// Use an existing Customer ID if this is a returning customer.
		const customer = await stripe.customers.create();
		const ephemeralKey = await stripe.ephemeralKeys.create(
			{ customer: customer.id },
			{ apiVersion: "2020-08-27" }
		);
		const paymentIntent = await stripe.paymentIntents.create({
			amount: 50,
			currency: "usd",
			customer: customer.id,
			automatic_payment_methods: {
				enabled: true,
			},
		});

		res.json({
			paymentIntent: paymentIntent.client_secret,
			ephemeralKey: ephemeralKey.secret,
			customer: customer.id,
			publishableKey:
				"pk_test_51KTWwEB39IIlbu9jgwhtMnkEuxHv39keql0rKev6bBY03FaMr6sROaG0T8WG9rUbHn8ut9hxih4Cqmwo3wKS9B9A00mBJwZ8Mw",
		});
	});
});
