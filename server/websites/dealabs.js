const fetch = require("node-fetch");
const cheerio = require("cheerio");
const fs = require("fs");
const { text } = require("express");

/** Parse webpage data response
 *
 * @param  {String} data - html response
 * @return {Object} deal
 */
const parse = (data) => {
  const $ = cheerio.load(data, { xmlMode: true }, true);
  // console.log($);

  return $("article.thread")
    .map((_, element) => {
      const content = JSON.parse(
        $(element).find("div.js-vue2").attr("data-vue2")
      ).props.thread;
      /** Get content from the header of the deal */
      const imgUrl = JSON.parse(
        $(element).find("div.threadGrid-image div.js-vue2").attr("data-vue2")
      ).props.threadImageUrl;

      const title = content.title;

      const link = content.link;

      /** Get the Lego set ID from the title of the deal */
      const idPattern = /\d{5}/; // Regular expression pattern for 5 digits in a row (Lego set ID)
      const foundLegoId = title.match(idPattern);
      const legoId = foundLegoId === null ? "" : foundLegoId[0];

      /** Get the price infos */
      const price = content.price;

      const nextBestPrice = content.nextBestPrice;

      const discount =
        nextBestPrice !== 0
          ? Number(Number((1 - price / nextBestPrice) * 100).toFixed(0))
          : NaN;

      const comments = content.commentCount; // the thread ID, I cannot find real data...

      const temperature = content.temperature; // the thread ID, I cannot find real data...

      /* Get the date */
      // Add the current year if omitted in the string
      const publication = content.publishedAt;

      return {
        // content,
        imgUrl,
        title,
        legoId,
        price,
        nextBestPrice,
        discount,
        link,
        comments,
        temperature,
        publication,
      };
    })
    .get();
};

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

/** Scrape a given url page
 *
 * @param {String} url - url to parse
 * @returns
 */
module.exports.scrape = async (baseUrl, maxPages = 12) => {
  let currentPage = 1;
  let allDeals = [];
  let hasMorePages = true;

  while (hasMorePages && currentPage <= maxPages) {
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
