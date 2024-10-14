const fetch = require("node-fetch");
const cheerio = require("cheerio");

/**
 * Parse webpage data response
 * @param  {String} data - html response
 * @return {Object} deal
 */
const parse = (data) => {
	const $ = cheerio.load(data, { xmlMode: true });

	return $("article.thread div.threadGrid")
		.map((_, element) => {
			// const price = parseFloat($(element).find("span.prodl-prix span").text());

			// const discount = Math.abs(
			// 	parseInt($(element).find("span.prodl-reduc").text())
			// );

			const imgUrl = $(element)
				.find("div.threadGrid-image div span.imgFrame img")
				.attr("src");
			const title = $(element)
				.find("div.threadGrid-title strong.thread-title a")
				.attr("title");
			const IDPattern = /d{5}/;
			const legoId = title.match(IDPattern); // Regular expression for Lego IDs
			const price = $(element)
				.find(
					"div.threadGrid-title span.overflow--fade span.overflow--wrap-off span.vAlign--all-tt span"
				)
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
			const link = $(element)
				.find("div.threadGrid-title strong.thread-title a")
				.attr("href");

			const comments = parseInt(
				$(element)
					.find("div.threadGrid-footerMeta div span.footerMeta-actionSlot a ")
					.text()
			);

			const temperature = parseInt(
				$(element)
					.find("div.threadGrid-headerMeta div div.flex div span")
					.text()
			);

			const publication = $(element)
				.find("div.threadGrid-headerMeta div div.boxAlign-jc--all-fe span span")
				.text();
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
	// TO DO: create header to be accepted by Dealabs.com
	const opts = {
		method: "GET",
		headers: {
			Cookie:
				"f_v=%224710f224-79a9-11ef-85d1-0242ac110003%22; dont-track=1; f_c=0; g_p=0; cookie_policy_agreement=3; cf_clearance=aek1rTh3vBxwKshdBkUv0473jmcp3QKGxV3_I1v0MhM-1727883620-1.2.1.1-Cp0vMMdxUdV.Cb9f_LT0Fu1t0bNkdTXp2_tnSuxTi8s10JHQ03yc7FBdZIF3LHcM7nOB0fxZm5_vZ6TFrR8BPyspjfiMKvcHEuU5oj_._Je7BGwMkNullPuwcDnY_zTnvndnw89waHAW5NB4chZACHIrlpVSRaHz0JalCDEJu_lR0wko2LPBjLVkEAK2Jn4MlcN8TzSnwrrGLgQ4fw18c0VRYuhWEENzqnpK6tN4VAWCKb4fkIDQy7DWIHLf1QMJM7D_rpag9OMKTNewQzvsrT8WbAb3_HI7ZQTUWxpu.pgsP_r__ErMvScd5nq.61H0BaxCj9NyHgfVO6XwzC.BVdZAAE.U9r5QbwjewxZeJlyEWJ1wBnoriyHqgWXD0xhu; pepper_session=%22dH0Lt6OyTpGJQFYB0d6i7uiV4LyE8b7gRkQtoXGm%22; xsrf_t=%22qBSUtvGSzHF6YytY2pBhICDyNh9Uxna9wa1fd5VW%22; navi=%5B%5D; browser_push_permission_requested=1728910486; u_l=0; __cf_bm=REMayOotZ3uP83W3K2Bcj85NswNIWS42NS7xp2xcIQw-1728914268-1.0.1.1-CYmkClonqT3sHZ_5lAyVZDJB7yxnB.Y_nfowold3r3M.uue7OLijzKkTLglc11qn3gb64fXTVBbyVcBDFRgLRA0",
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
