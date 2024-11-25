const puppeteer = require("puppeteer");
const fs = require("fs");
const tqdm = require("tqdm");
const uuidv5 = require("uuid").v5;

// Get cookies for Vinted session
var cookieString;

var opts = {
	method: "GET",
	headers: {
		Accept: "application/json, text/plain, */*",
		Cookie: cookieString,
		"User-Agent":
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
	},
};

/** Extracts cookies from the Vinted website.
 *
 * @async
 * @returns {Promise<string>} - A string of cookies in the format "name=value; name=value".
 */
async function extractCookies() {
	const browser = await puppeteer.launch({ headless: true });
	const page = await browser.newPage();
	await page.goto("https://www.vinted.fr", { waitUntil: "networkidle2" });

	// Extract cookies
	const cookies = await page.cookies();
	const cookieString = cookies
		.map((cookie) => `${cookie.name}=${cookie.value}`)
		.join("; ");

	await browser.close();
	return cookieString;
}

/** Parses the body of the Vinted API response to extract sale details.
 *
 * @param {Object[]} body - The response body from the Vinted API.
 * @returns {Object[]} - An array of sale objects containing id, price, imgUrl, title, and link.
 */
function parse(body, legoId) {
	return body.map((sale) => {
		const _id = uuidv5(sale.url, uuidv5.URL);
		const price = Number(sale.total_item_price.amount);
		const imgUrl = sale.photo.url;
		const title = sale.title;
		const link = sale.url;
		const publicationDate = sale.photo.high_resolution.timestamp;

		return {
			_id,
			legoId,
			link,
			price,
			title,
			imgUrl,
			publicationDate,
		};
	});
}

/** Reads and extracts unique Lego IDs from the deals.json file.
 *
 * @returns {number[]} - An array of unique Lego IDs sorted in ascending order.
 */
function getLegoIds() {
	// Read and parse the deals.json file
	const dealsFilePath = "data/deals.json";
	const dealsData = JSON.parse(fs.readFileSync(dealsFilePath, "utf-8"));

	// Extract unique Lego IDs from the deals data
	return [
		...new Set(dealsData.map((deal) => deal.legoId).sort((a, b) => a - b)),
	];
}

/** Scrapes Vinted for items related to a given Lego ID.
 *
 * @async
 * @param {number} legoId - The Lego ID to search for.
 * @param {string} cookieString - The cookie string for authentication.
 * @param {boolean} [writable=true] - Whether to write the results to a JSON file.
 * @returns {Promise<Object[]>} - A promise that resolves to an array of item objects.
 */
async function scrapeVintedForLegoId(legoId, writable = true) {
	let allItems = [];
	let currentPage = 1;
	let hasMorePages = true;
	const unixNow = Math.floor(Date.now() / 1000);

	while (hasMorePages) {
		const url = `https://www.vinted.fr/api/v2/catalog/items?page=${currentPage}&per_page=96&time=${unixNow}&search_text=${legoId}&catalog_ids=&size_ids=&brand_ids=89162&status_ids=&material_ids=`;

		try {
			const response = await fetch(url, opts);
			if (response.ok) {
				const data = await response.json();
				if (data.items.length > 0) {
					allItems = allItems.concat(parse(data.items, legoId));
					currentPage++;
					hasMorePages = currentPage <= data.pagination.total_pages;
				} else {
					hasMorePages = false;
				}
			} else {
				console.error(
					`Failed to fetch data for Lego ID ${legoId}:`,
					response.status
				);
				hasMorePages = false;
			}
		} catch (error) {
			console.error(`Error fetching data for Lego ID ${legoId}:`, error);
			hasMorePages = false;
		}
	}

	if (writable) {
		// Save the items to a separate JSON file for this Lego ID
		const filePath = `data/sales/${legoId}.json`;
		fs.writeFileSync(filePath, JSON.stringify(allItems, null, 2));
		// console.log(
		//     `Saved ${allItems.length} items for Lego ID ${legoId} to ${filePath}`
		// );
	}

	return allItems;
}

/** Pauses execution for a specified amount of time.
 *
 * @param {number} ms - The number of milliseconds to sleep.
 * @returns {Promise<void>} - A promise that resolves after the specified delay.
 */
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Main function to scrape Vinted for Lego deals. Can scrape for a single Lego ID or all IDs from the deals.json file.
 *
 * @async
 * @param {number} [legoId=undefined] - A specific Lego ID to scrape for, or undefined to scrape for all IDs.
 * @returns {Promise<void>} - A promise that resolves when the scraping is complete.
 */
module.exports.scrape = async (legoId = undefined) => {
	cookieString = await extractCookies();
	opts.headers.Cookie = cookieString;

	if (legoId === undefined) {
		const legoIds = getLegoIds();
		let counter = 0;

		for (const legoId of tqdm(legoIds)) {
			counter++;
			// console.log(`[${counter}/${legoIds.length}]`);
			await scrapeVintedForLegoId(legoId);

			// Delay of 1000ms (1 second) between each request
			await sleep(1000);
		}

		console.log(`Scraping completed for all ${legoIds.length} Lego IDs.`);
	} else {
		const sales = await scrapeVintedForLegoId(legoId, false);
		console.log(sales);
		console.log(`Scraping completed for Lego ID ${legoId}.`);
	}
};
