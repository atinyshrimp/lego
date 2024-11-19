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
	const dealsFilePath = "data/deals.json";
	const deals = [...JSON.parse(fs.readFileSync(dealsFilePath, "utf-8"))];

	const collection = db.collection(DEALS_COLLECTION);
	const result = await collection.insertMany(deals);

	console.log(`${result.insertedCount} deals records inserted`);
}

async function insertSales(db) {
	// Path to the folder containing the JSON files
	const salesFolderPath = "data/sales";

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
	const result = await collection.insertMany(sales);

	console.log(`${result.insertedCount} sales records inserted`);
}

async function run() {
	try {
		// Connect the client to the server	(optional starting in v4.7)
		await client.connect();

		// Access the database
		const database = client.db(MONGODB_DB_NAME);

		// Add data to collections
		// await insertDeals(database);
		// await insertSales(database);

		// await findBestDiscountDeals(database, 40);
		// await findMostCommentedDeals(database);
		// await findDealsSortedByPrice(database);
		// await findDealsSortedByDate(database);
		// await findSalesByLegoID(database, "71043");
		// await findRecentSales(database);
		// await findHotDeals(database);
		await findDealsEndingSoon(database);

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

async function findBestDiscountDeals(db, minDiscount) {
	const collection = db.collection(DEALS_COLLECTION);

	const bestDiscountDeals = await collection
		.find({ discount: { $gte: minDiscount } })
		.sort({ discount: -1 })
		.toArray();
	console.log(`Deals with Discount above ${minDiscount}%: `);
	return bestDiscountDeals;
}

async function findMostCommentedDeals(db, minComments = 100) {
	const collection = db.collection(DEALS_COLLECTION);

	const mostCommentedDeals = await collection
		.find({ comments: { $gte: minComments } })
		.sort({ comments: -1 })
		.toArray();
	console.log(mostCommentedDeals);
	return mostCommentedDeals;
}

async function findDealsSortedByPrice(db, ascending = false) {
	const collection = db.collection(DEALS_COLLECTION);

	const sortedDeals = await collection
		.find()
		.sort({ price: ascending ? 1 : -1 })
		.toArray();
	console.log(sortedDeals);
	return sortedDeals;
}

async function findDealsSortedByDate(db, ascending = false) {
	const collection = db.collection(DEALS_COLLECTION);

	const sortedDeals = await collection
		.find()
		.sort({ publication: ascending ? 1 : -1 })
		.toArray();
	console.log(sortedDeals);
	return sortedDeals;
}

async function findSalesByLegoID(db, legoId) {
	const collection = db.collection(SALES_COLLECTION);

	const legoSales = await collection.find({ legoId: legoId }).toArray();
	console.log(legoSales);
	return legoSales;
}

async function findRecentSales(db, days = 21) {
	const collection = db.collection(SALES_COLLECTION);

	// Query to find sales that were scraped less than 3 weeks ago, assuming a "scrapedDate" field exists
	const deltaDate = new Date();
	console.log(`Created date: ${deltaDate}`);
	deltaDate.setDate(deltaDate.getDate() - days); // Substract by the number of days

	console.log(`Delayed date: ${deltaDate}`);

	const deltaTimeUnix = Math.floor(deltaDate.getTime() * 1e-3);
	console.log(
		`Converted delayed date: ${deltaTimeUnix} (${typeof deltaTimeUnix})`
	);

	const recentSales = await collection
		.find({ publicationDate: { $gte: deltaTimeUnix } })
		.sort({ publicationDate: -1 })
		.toArray();
	console.log(recentSales);
	return recentSales;
}

async function findHotDeals(db, minTemperature = 100) {
	const collection = db.collection(DEALS_COLLECTION);

	const hotDeals = await collection
		.find({ temperature: { $gte: minTemperature } })
		.sort({ temperature: -1 })
		.toArray();
	console.log(hotDeals);
	return hotDeals;
}

async function findDealsEndingSoon(db, days = 7) {
	const collection = db.collection(DEALS_COLLECTION);

	// Query to find sales that were scraped less than 3 weeks ago, assuming a "scrapedDate" field exists
	const deltaDate = new Date();
	console.log(`Created date: ${deltaDate}`);
	deltaDate.setDate(deltaDate.getDate() + days); // Substract by the number of days

	console.log(`Delayed date: ${deltaDate}`);

	const deltaTimeUnix = Math.floor(deltaDate.getTime() * 1e-3);
	console.log(
		`Converted delayed date: ${deltaTimeUnix} (${typeof deltaTimeUnix})`
	);

	const dealsSoonToExpire = await collection
		.find({ expirationDate: { $lt: deltaTimeUnix } })
		.sort({ expirationDate: -1 })
		.toArray();
	console.log(dealsSoonToExpire);
	return dealsSoonToExpire;
}

module.exports = {
	findBestDiscountDeals,
	findMostCommentedDeals,
	findDealsSortedByPrice,
	findDealsSortedByDate,
	findSalesByLegoID,
	findRecentSales,
	findHotDeals,
	findDealsEndingSoon,
};
