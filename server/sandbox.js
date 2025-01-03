/* eslint-disable no-console, no-process-exit */
const dealabs = require("./websites/dealabs");
const vinted = require("./websites/vinted");

async function sandbox() {
	try {
		await dealabs.scrape();
		await vinted.scrape();

		console.log("💾 Scraping done ✅");
		process.exit(0);
	} catch (e) {
		console.error(e);
		process.exit(1);
	}
}

const [, , eshop] = process.argv;

sandbox(eshop);
