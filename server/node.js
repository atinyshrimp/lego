const { MongoClient, ServerApiVersion } = require("mongodb");
const fs = require("fs");
require("dotenv").config();

const MONGODB_URI = `mongodb+srv://joycelapilus:${process.env.MONGODB_CLUSTER_PWD}@fullstack-lego.lyvzb.mongodb.net/?retryWrites=true&w=majority&appName=fullstack-lego`;
const MONGODB_DB_NAME = "lego";

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
	const dealsFilePath = "data/deals.json";
	const deals = [...JSON.parse(fs.readFileSync(dealsFilePath, "utf-8"))];

	const collection = db.collection("deals");
	const result = await collection.insertMany(deals);

	console.log(result);
}

async function insertSales(db) {
	const sales = [];

	const collection = db.collection("sales");
	const result = await collection.insertMany(sales);

	console.log(result);
}

async function run() {
	try {
		// Connect the client to the server	(optional starting in v4.7)
		await client.connect();

		// Access the database
		const database = client.db(MONGODB_DB_NAME);

		await insertDeals(database);
		// await insertSales(database);

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
run().catch(console.dir);
