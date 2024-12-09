const { MongoClient, ServerApiVersion } = require("mongodb");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const MONGODB_URI = `mongodb+srv://joycelapilus:${process.env.MONGODB_CLUSTER_PWD}@fullstack-lego.lyvzb.mongodb.net/?retryWrites=true&w=majority&appName=fullstack-lego`;
const MONGODB_DB_NAME = "lego";

const DEALS_COLLECTION = "deals";
const SALES_COLLECTION = "sales";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(MONGODB_URI, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

async function insertDeals(db) {
	// Read and parse the deals.json file
	const dealsFilePath = "../data/deals.json";
	const deals = [...JSON.parse(fs.readFileSync(dealsFilePath, "utf-8"))];

	const collection = db.collection(DEALS_COLLECTION);
	const result = await collection.insertMany(deals);

	console.log(`${result.insertedCount} deals records inserted`);
}

async function insertSales(db) {
	// Path to the folder containing the JSON files
	const salesFolderPath = "../data/sales";

	// Read all the files in the folder
	const salesFiles = fs.readdirSync(salesFolderPath);

	const sales = [];

	// Iterate over each file, read and parse the JSON content
	for (const file of salesFiles) {
		const filePath = path.join(salesFolderPath, file);
		const fileContent = fs.readFileSync(filePath, "utf-8");
		const salesData = JSON.parse(fileContent);

		// Ensure the parsed content is an array and add it to sales
		if (Array.isArray(salesData)) {
			sales.push(...salesData);
		} else {
			console.warn(`File ${file} did not contain an array of sales data`);
		}
	}

	// Insert all sales data into the "sales" collection
	const collection = db.collection(SALES_COLLECTION);
	try {
		const result = await collection.insertMany(sales, {
			ordered: false,
			upsert: true,
		});
		console.log(`${result.insertedCount} sales records inserted`);
	} catch (error) {
		if (error.code === 11000) {
			console.log("Some documents were duplicates and skipped");
		} else {
			throw error;
		}
	}
}

async function run() {
	try {
		// Connect the client to the server	(optional starting in v4.7)
		await client.connect();

		// Access the database
		const database = client.db(MONGODB_DB_NAME);

		// Add data to collections
		await insertDeals(database);
		await insertSales(database);

		// Send a ping to confirm a successful connection
		await client.db("admin").command({ ping: 1 });
		console.log(
			"Pinged your deployment. You successfully connected to MongoDB!"
		);
	} finally {
		// Ensures that the client will close when you finish/error
		await client.close();
	}
}

module.exports = {
	insertDeals,
	insertSales,
};
