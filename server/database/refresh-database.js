const { MongoClient } = require("mongodb");
const dealabs_scraper = require("../websites/dealabs");
const vinted_scraper = require("../websites/vinted");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config();
console.log(process.env);

const MONGODB_URI = `mongodb+srv://joycelapilus:${process.env.MONGODB_CLUSTER_PWD}@fullstack-lego.lyvzb.mongodb.net/?retryWrites=true&w=majority&appName=fullstack-lego`;
const MONGODB_DB_NAME = "lego";
const DEALS_COLLECTION = "deals";
const SALES_COLLECTION = "sales";

async function refreshDatabase() {
	// Ensure all required environment variables are present
	if (!MONGODB_URI || !MONGODB_DB_NAME) {
		console.error("Missing MongoDB configuration");
		process.exit(1);
	}

	const client = new MongoClient(MONGODB_URI);

	try {
		console.log("Starting database refresh...");

		// Connect to MongoDB
		// await client.connect();
		const database = client.db(MONGODB_DB_NAME);

		// Optional: Archive old data before deletion
		const archivedDeals = await database
			.collection(DEALS_COLLECTION)
			.find()
			.toArray();
		const archivedSales = await database
			.collection(SALES_COLLECTION)
			.find()
			.toArray();

		// Create archive collections with timestamp
		const timestamp = new Date().toISOString().replace(/:/g, "-");
		await database
			.collection(`deals_archive_${timestamp}`)
			.insertMany(archivedDeals);
		await database
			.collection(`sales_archive_${timestamp}`)
			.insertMany(archivedSales);

		// Clear existing collections
		await database.collection(DEALS_COLLECTION).deleteMany({});
		await database.collection(SALES_COLLECTION).deleteMany({});

		// Delete previous scraped data
		console.log("Deleting exisiting data...");
		clearPreviousScrapedFiles();

		// Run scraping process
		console.log("Starting scraping...");
		await dealabs_scraper.scrape();
		await vinted_scraper.scrape();

		console.log("Database refresh completed successfully");
	} catch (error) {
		console.error("Database refresh failed:", error);
		process.exit(1);
	} finally {
		await client.close();
	}
}

// Clear existing files in the sales and deals directories before scraping
function clearPreviousScrapedFiles() {
	const salesDir = path.join(__dirname, "data/sales");
	const dealsDir = path.join(__dirname, "data");

	try {
		// Remove all existing files in sales directory
		fs.readdirSync(salesDir).forEach((file) => {
			fs.unlinkSync(path.join(salesDir, file));
		});

		// Optionally do the same for deals directory
		fs.readdirSync(dealsDir).forEach((file) => {
			fs.unlinkSync(path.join(dealsDir, file));
		});

		console.log("Previous scraped files cleared");
	} catch (error) {
		console.error("Error clearing previous scraped files:", error);
	}
}

// Run the refresh immediately when the script is called
// refreshDatabase();
