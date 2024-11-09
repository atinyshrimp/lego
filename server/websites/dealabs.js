const fetch = require("node-fetch");
const cheerio = require("cheerio");
const fs = require("fs");

/** Parses the HTML response and extracts deal information.
 *
 * @param {string} data - The HTML response as a string.
 * @returns {Object[]} - An array of deal objects containing details such as imgUrl, title, legoId, price, etc.
 */
const parse = (data) => {
  const $ = cheerio.load(data, { xmlMode: true }, true);

  return $("article.thread")
    .map((_, element) => {
      const content = JSON.parse(
        $(element).find("div.js-vue2").attr("data-vue2")
      ).props.thread;

      /** Get content from the "data-vue2" */
      const id = content.threadId;
      const title = content.title;

      /** Get the Lego set ID from the title of the deal */
      const idPattern = /\d{5}/; // Regular expression pattern for 5 digits in a row (Lego set ID)
      const foundLegoId = title.match(idPattern);
      const legoId = foundLegoId === null ? "" : foundLegoId[0];

      /** Get the different links */
      const link = content.shareableLink; // URL to the description of the deal on Dealabs
      const merchantLink = content.link; // URL to the original link of the offer

      /** Get the price infos */
      const price = content.price;

      const nextBestPrice = content.nextBestPrice;

      const discount =
        nextBestPrice !== 0
          ? Number(Number((1 - price / nextBestPrice) * 100).toFixed(0))
          : NaN;

      /** Get different dates */
      const publication = content.publishedAt;
      const expirationDate =
        content.endDate !== null ? content.endDate.timestamp : null;

      /** Miscellaneous infos */
      const comments = content.commentCount;

      const temperature = content.temperature;

      /** Get image URL from brother element */
      const imgUrl = JSON.parse(
        $(element).find("div.threadGrid-image div.js-vue2").attr("data-vue2")
      ).props.threadImageUrl;

      return {
        id,
        imgUrl,
        title,
        legoId,
        price,
        nextBestPrice,
        discount,
        link,
        merchantLink,
        comments,
        temperature,
        publication,
        expirationDate,
      };
    })
    .get();
};

/** Saves a JSON document to a file.
 *
 * @param {string} path - The directory path where the file will be saved.
 * @param {string} fileName - The name of the JSON file (without extension).
 * @param {Object[]} document - The JSON document to be saved.
 */
const saveJSONfile = (path, fileName, document) => {
  try {
    // Check path name
    const pathName = String(path).endsWith("/") ? path : path + "/";

    // Store the JSON documents into a JSON file
    fs.writeFileSync(
      `${pathName}${fileName}.json`,
      JSON.stringify(document, null, 2)
    );

    console.log(`${document.length} documents saved!`);
  } catch (e) {
    console.error(e);
  }
};

/** Scrapes deals from a given URL and saves the data as JSON.
 *
 * @async
 * @param {string} baseUrl - The base URL to scrape from.
 * @param {number} [maxPages=12] - The maximum number of pages to scrape.
 * @returns {Promise<Object[]>} - A promise that resolves to an array of deal objects.
 */
module.exports.scrape = async (
  baseUrl = "https://www.dealabs.com/groupe/lego?hide_expired=true"
) => {
  console.log(`🕵️‍♀️  browsing ${baseUrl}`);

  let currentPage = 1;
  let allDeals = [];
  let hasMorePages = true;

  while (hasMorePages) {
    // Update page
    const url = `${baseUrl}${
      baseUrl.includes("?") ? "&" : "?"
    }page=${currentPage}`;
    console.log(`Scraping page: ${currentPage}`);

    // Making the browser believe the scraper is a "real person"
    const opts = {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
      },
    };

    // Get HTTP response
    const response = await fetch(url, opts);

    if (response.ok) {
      const body = await response.text();
      const dealsDoc = parse(body);
      if (dealsDoc.length === 0) {
        hasMorePages = false;
      } else {
        allDeals = allDeals.concat(dealsDoc);
        currentPage++;
      }
    } else {
      console.error(`Failed to fetch page ${currentPage}:`, response.status);
      hasMorePages = false;
    }
  }

  // Remove empty legoId, mostly not Lego sets
  allDeals = allDeals.filter((deal) => deal.legoId !== "");

  console.log(`Saving ${allDeals.length} JSON documents...`);
  saveJSONfile("server/data", "deals", allDeals);
  // Return the JSON documents
  return allDeals;
};
