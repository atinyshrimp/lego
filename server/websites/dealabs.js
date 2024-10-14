const fetch = require("node-fetch");
const cheerio = require("cheerio");
const { text } = require("express");

/**
 * Parse webpage data response
 * @param  {String} data - html response
 * @return {Object} deal
 */
const parse = (data) => {
  const $ = cheerio.load(data, { xmlMode: true });
  console.log($);

  return $("article.thread div.threadGrid")
    .map((_, element) => {
      /** Get content from the header of the deal */
      const imgUrl = JSON.parse(
        $(element).find("div.threadGrid-image div.js-vue2").attr("data-vue2")
      )["props"]["threadImageUrl"];

      const title = $(element)
        .find("div.threadGrid-title strong.thread-title a")
        .attr("title");
      const link = $(element)
        .find("div.threadGrid-title strong.thread-title a")
        .attr("href");

      /** Get the Lego set ID from the title of the deal */
      const IDPattern = /\d{5}/;
      const match = title.match(IDPattern);
      const legoId = match === null ? "" : match[0]; // Regular expression for Lego IDs

      /** Get the price infos */
      const price = $(element)
        .find("div.threadGrid-title span.overflow--fade")
        .text();
      const nextBestPrice = $(element)
        .find(
          "div.threadGrid-title span.overflow--fade span.overflow--wrap-off span.mute--text"
        )
        .text();
      const discount = $(element)
        .find(
          "div.threadGrid-title span.overflow--fade span.overflow--wrap-off span.text--color-charcoal"
        )
        .text();

      const comments = JSON.parse(
        $(element)
          .find(
            "div.threadGrid-footerMeta div span.footerMeta-actionSlot div.js-vue2"
          )
          .last()
          .attr("data-vue2")
      ).props.threadId; // the thread ID, I cannot find real data...

      const temperature = $(element)
        .find("div.threadGrid-headerMeta div div.flex")
        .html();

      /* Get the date */
      // Retrieve date in raw text
      const textDate = JSON.parse(
        $(element)
          .find("div.threadGrid-headerMeta div div.js-vue2")
          .last()
          .attr("data-vue2")
      ).props.metaRibbons[0].longText;

      // Regex to check if the string contains the year
      const containsYear = textDate.match(/\d{4}/) !== null;

      // Add the current year if omitted in the string
      const publication = Date.parse(
        containsYear ? textDate : textDate + " 2024"
      );

      return {
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

/**
 * Scrape a given url page
 * @param {String} url - url to parse
 * @returns
 */
module.exports.scrape = async (url) => {
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

    return parse(body);
  }

  console.error(response);

  return null;
};
