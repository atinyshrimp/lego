const puppeteer = require("puppeteer");
const fs = require("fs");

async function extractCookiesAndToken() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://www.vinted.fr", { waitUntil: "networkidle2" });

  // Log in manually if needed, or automate login
  // Wait for some time to ensure all data is loaded
  // await page.waitForTimeout(5000); // Wait 5 seconds

  // Extract cookies
  const cookies = await page.cookies();
  const cookieString = cookies
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  // // Extract CSRF token
  const csrfToken = await page.evaluate(() => {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.content : null;
  });

  console.log("Cookie String:", cookieString);
  console.log("CSRF Token:", csrfToken);

  await browser.close();
  return { cookieString, csrfToken };
}

async function extractCookies() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("https://www.vinted.fr", { waitUntil: "networkidle2" });

  // Log in manually if needed, or automate login
  // Wait for some time to ensure all data is loaded
  // await page.waitForTimeout(5000); // Wait 5 seconds

  // Extract cookies
  const cookies = await page.cookies();
  const cookieString = cookies
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  // console.log("Cookie String:", cookieString);

  await browser.close();
  return cookieString;
}

function parse(body) {
  // const sales = JSON.parse(body).items;
  // console.log(`After parsing: ${sales}`);

  return body.map((sale) => {
    const id = sale.id;
    const price = Number(sale.total_item_price);
    const imgUrl = sale.photo.url;
    const title = sale.title;
    const link = sale.url;

    return {
      link,
      price,
      title,
      imgUrl,
      id,
    };
  });
}

function getLegoIds() {
  // Read and parse the deals.json file
  const dealsFilePath = "server/data/deals.json";
  const dealsData = JSON.parse(fs.readFileSync(dealsFilePath, "utf-8"));

  // Extract unique Lego IDs from the deals data
  return [...new Set(dealsData.map((deal) => deal.legoId))];
}

async function scrapeVintedForLegoId(legoId, cookieString, writable = true) {
  let allItems = [];
  let currentPage = 1;
  let hasMorePages = true;
  const unixNow = Math.floor(Date.now() / 1000);

  while (hasMorePages) {
    const url = `https://www.vinted.fr/api/v2/catalog/items?page=${currentPage}&per_page=96&time=${unixNow}&search_text=${legoId}&catalog_ids=&size_ids=&brand_ids=89162&status_ids=&material_ids=`;

    const opts = {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
        Cookie: cookieString,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
      },
    };

    try {
      const response = await fetch(url, opts);
      if (response.ok) {
        const data = await response.json();
        if (data.items.length > 0) {
          allItems = allItems.concat(parse(data.items));
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
    const filePath = `server/data/sales/${legoId}.json`;
    fs.writeFileSync(filePath, JSON.stringify(allItems, null, 2));
    console.log(
      `Saved ${allItems.length} items for Lego ID ${legoId} to ${filePath}`
    );
  }

  return allItems;
}

module.exports.scrape = async (legoId = undefined) => {
  // Get cookies for Vinted session
  const cookieString = await extractCookies();

  if (legoId === undefined) {
    const legoIds = getLegoIds();

    for (const legoId of legoIds) {
      await scrapeVintedForLegoId(legoId, cookieString);
    }

    console.log("Scraping completed for all Lego IDs.");
  } else {
    const sales = await scrapeVintedForLegoId(legoId, cookieString);
    console.log(sales);
    console.log(`Scraping completed for Lego ID ${legoId}.`);
  }
};
