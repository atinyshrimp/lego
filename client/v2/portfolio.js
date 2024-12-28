// Invoking strict mode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#invoking_strict_mode
"use strict";

/** Description of the available API

GET https://bricked-up-api.vercel.app/v1/deals/search

Search for specific deals based on various filters.

This endpoint accepts the following optional query string parameters:

- `page` - page of deals to return (default: 1)
- `limit` - number of deals to return per page (default: 12)
- `legoId` - lego set id to filter deals
- `price` - price range to filter deals (e.g., 10-50)
- `date` - date range to filter deals (e.g., 2024-01-01,2024-12-31)
- `sortBy` - sorting order for deals (e.g., price-asc, price-desc, date-asc, date-desc)
- `filterBy` - special filter to apply (e.g., best-discount-30, most-commented-20, hot-deals-100)

GET https://bricked-up-api.vercel.app/v1/deals/unique

Get unique LEGO set IDs from the database.

GET https://bricked-up-api.vercel.app/v1/deals/:id

Get details of a specific deal by its ID.

This endpoint accepts the following URL parameters:

- `id` - the unique identifier of the deal to retrieve

GET https://bricked-up-api.vercel.app/v1/sales/search

Search for current Vinted sales for a given LEGO set ID

This endpoint accepts the following optional query string parameters:

- `page` - page of sales to return (default: 1)
- `limit` - number of sales to return per page (default: 12)
- `legoSetId` - LEGO set ID to filter sales

POST https://bricked-up-api.vercel.app/v1/users/register

Register a new user account.

POST https://bricked-up-api.vercel.app/v1/users/login

Login to an existing user account.

GET https://bricked-up-api.vercel.app/v1/users/profile

Get the profile information of the currently logged-in user.

This endpoint requires a valid JWT token to be sent in the `Authorization` header.

GET https://bricked-up-api.vercel.app/v1/users/favorites

Get the list of favorite deals for the currently logged-in user.

This endpoint requires a valid JWT token to be sent in the `Authorization` header.

POST https://bricked-up-api.vercel.app/v1/users/favorites

Add a deal to the list of favorite deals for the currently logged-in user.

This endpoint requires a valid JWT token to be sent in the `Authorization` header.

DELETE https://bricked-up-api.vercel.app/v1/users/favorites/

Remove a deal from the list of favorite deals for the currently logged-in user.

This endpoint requires a valid JWT token to be sent in the `Authorization` header.
*/

/** ================== Global Variables ================== */

/** Deals and Sales Data */
let currentDeals = [];
let unfilteredDeals = [];
let currentSales = [];

/** Pagination States */
let originalPagination;
let currentPagination = {};
let currentParams = {};
let isListFiltered = false;
let dealsPagination = {};
let favoritesPagination = {};

/** ================== Selectors ================== */

/** Dark Mode */
const darkModeToggle = document.getElementById("darkModeToggle");
const savedDarkMode = localStorage.getItem("darkMode");

/** Dropdowns and Inputs */
const selectShow = document.querySelector("#show-select");
const selectPage = document.querySelector("#page-select");
const selectLegoSetIds = document.querySelector("#lego-set-id-select");
const legoSetIdSearch = document.querySelector("#lego-set-id-search");
const selectSort = document.querySelector("#sort-select");

/** Sections */
const paginationContainer = document.querySelector(".pagination");
const paginationInfo = document.querySelector("#pagination-info");
const sectionDeals = document.querySelector("#nav-deals");
const sectionFavorites = document.querySelector("#nav-favorites");
const sectionIndicators = document.getElementById("indicators");
const sectionOptions = document.getElementById("options");
const filters = document.querySelector("#filters");

/** Indicator Elements */
const spanAvgPrice = document.querySelector("#averagePrice");
const spanP95Price = document.querySelector("#p95Price");
const spanP25Price = document.querySelector("#p25Price");
const spanP50Price = document.querySelector("#p50Price");
const spanLifetime = document.querySelector("#lifetimeValue");

/** Constants */
const API_URL = "https://bricked-up-api.vercel.app/v1";
const MINIMUM_COMMENTS = 20;
const MINIMUM_DISCOUNT = 30;
const MINIMUM_TEMPERATURE = 100;

/** ================== Functions ================== */

/** Fetch deals from API
 *
 * @param  {Number}  [page=1] - current page to fetch
 * @param  {Number}  [limit=6] - size of the page
 * @return {Object}
 */
const fetchDeals = async (
	page = 1,
	limit = 6,
	legoId = undefined,
	price = undefined,
	date = undefined,
	sortBy = "price-asc",
	filterBy = undefined
) => {
	try {
		// Construct query parameters
		const params = new URLSearchParams({ page, limit, sortBy });
		if (legoId) params.append("legoId", legoId);
		if (price) params.append("price", price);
		if (date) params.append("date", date);
		if (filterBy) params.append("filterBy", filterBy);

		currentParams = { legoId, price, date, sortBy, filterBy }; // Update global params
		const url = `${API_URL}/deals/search?${params.toString()}`;
		console.log(url);

		const response = await fetch(url);
		const body = await response.json();

		if (!body.success) throw new Error("Failed to fetch deals");
		return { results: body.results, meta: body.meta };
	} catch (error) {
		console.error("Error in fetchDeals:", error);
		return {
			results: [],
			meta: { currentPage: 1, pageCount: 0, count: 0 },
		};
	}
};

/** Fetch sales from API for a given lego set ID
 *
 * @param {String} id - The ID of the lego set to look up
 * @returns A list of Vinted sales for the `id`
 */
const fetchSales = async (id) => {
	try {
		const response = await fetch(`${API_URL}/sales/search?legoSetId=${id}`);
		const body = await response.json();
		if (body.success !== true) throw new Error("Failed to fetch sales");
		return body.results;
	} catch (error) {
		console.error(error);
		return [];
	}
};

/** Create HTML template for each deal
 *
 * @param {*} deal
 * @returns
 */
const createDealTemplate = (deal, favorites) => {
	const isFavorite = favorites.some((fav) => fav._id === deal._id);

	return `
	  <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
		<div class="card" id=${deal._id}>
		  <div class="card-body d-block">
			<!-- First row: Title and LEGO ID -->
			<div class="row mb-2 justify-content-between">
			  <div class="img-container col-3 col-md-3">
				<img class="img-fluid img-thumbnail" src="${deal.imgUrl}">
			  </div>
			  <div class="col-7 col-md-7 pt-1 px-0">
				<a href="#" class="deal-title" data-bs-toggle="modal"  data-bs-target="#dealModal" data-uuid="${
					deal._id
				}" data-id="${deal.legoId}">
				  <h5 class="card-title clamp-2-lines">${deal.title}</h5>
				</a>
				<h6 class="card-subtitle mb-2 text-muted">${deal.legoId}</h6>
			  </div>
			  <div class="col-2 col-md-2 favorite-btn-container" style="width: 10%; flex: 0 0 auto;">
				<button class="btn favorite-btn" style="width: fit-content;" data-id="${
					deal._id
				}">
				  ${isFavorite ? DEL_FAV_ICON : ADD_FAV_ICON}
				</button>
			  </div>
			</div>

            <!-- Relevance Score -->
            <div class="row mb-2">
                <span class="relevance-badge badge bg-primary">Relevance: ${Math.round(
									deal.relevanceScore * 100
								)}%</span>
			</div>
 
			<!-- Second row: Temperature, Comments, and Publication Date -->
			<div class="row justify-content-between">
			  <div class="col-6 d-flex flex-column align-items-start">
				<p class="badge rounded-pill text-bg-danger mb-0">${deal.temperature}°</p>
				<div class="d-inline-flex align-items-center pt-1">
				  <i class="fi fi-rr-comment-dots"></i> &nbsp;
				  <p class="pb-1 m-0">${deal.comments} </p>
				</div>
				<div class="d-inline-flex align-items-center pt-1 ${
					isExpiringSoon(deal) ? "text-danger" : ""
				}">
				  <i class="fi fi-rr-pending"></i> &nbsp;
				  <p class="pb-1 m-0 ${isExpiringSoon(deal) ? "text-danger" : ""}" id="pub-${
		deal._id
	}" ${
		deal.expirationDate
			? `data-bs-toggle="tooltip" title="Expires: ${new Date(
					deal.expirationDate * 1000
			  ).toLocaleString()}"`
			: ""
	}>
					${timeAgo(deal.publication)}
				  </p>
				</div>
			  </div>
			  <!-- Right Column: Prices and CTA Button -->
			  <div class="col-6 d-flex flex-column align-items-end" style="width: fit-content;">
				<p class="card-text text-decoration-line-through text-muted mb-0 d-inline-block">${formatPrice(
					deal.nextBestPrice
				)}</p>
				<p class="card-text mb-0 d-inline-block">${formatPrice(deal.price)}</p>
				<a role="button" id="see-deal-btn" class="btn d-inline-flex align-items-center p-0 mt-2 deal-tab see-deal-btn" href="${
					deal.link
				}" target="_blank">
				  <span style="margin-bottom:.4rem;">See deal &nbsp;</span>
				  <i class="fi fi-rr-up-right-from-square"></i>
				</a>
			  </div>
			</div>
		  </div>
		</div>
	  </div>
	`;
};

/** Initialize tooltips for deals with expiration dates
 *
 */
const initializeExpirationTooltips = () => {
	currentDeals.forEach((deal) => {
		if (isExpiringSoon(deal)) {
			const tooltipElement = document.getElementById(`pub-${deal._id}`);
			if (tooltipElement) {
				new bootstrap.Tooltip(tooltipElement);
			}
		}
	});
};

/** Render list of deals
 *
 * @param  {Array} deals
 */
const renderDeals = async (deals) => {
	if (!Array.isArray(deals)) {
		console.error("Invalid deals array:", deals);
		deals = [];
	}

	sectionDeals.innerHTML = ""; // Clear existing content
	document.getElementById("options-column").style.display = "block";

	if (deals.length === 0) {
		sectionDeals.innerHTML = `
            <div class="alert alert-warning" role="alert">
                No deals found. Try adjusting your filters or sorting options.
            </div>`;
		return;
	}

	const fragment = document.createDocumentFragment();
	const div = document.createElement("div");
	div.classList.add("row", "items", "overflow-auto");

	const favorites = await getFavoriteDeals();
	const template = deals
		.map((deal) => createDealTemplate(deal, favorites))
		.join("");
	div.innerHTML = template;

	fragment.appendChild(div);
	sectionDeals.appendChild(fragment);

	// Attach listeners to favorite buttons
	document.querySelectorAll(".favorite-btn").forEach((button) => {
		button.addEventListener("click", toggleFavorite);
	});

	// Initialize tooltips for expiration dates
	initializeExpirationTooltips();
};

const createSaleTemplate = (
	sale,
	profitability,
	legoId = undefined,
	modal = false
) => {
	return `
    <div class="col-4">
      <div class="card mb-4" id=${sale._id}">
        <div class="card-body d-block">
          <div class="row justify-content-between">
            <div class="col" style="width: 37%; flex: 0 0 auto;">
              <img class="img-fluid img-thumbnail" src=${sale.imgUrl}>
            </div>
            <div class="col ${modal ? "px-0" : ""}">
              <a href="${sale.link}" target="_blank"">
                <h5 class="card-title clamp-2-lines" ${
									modal ? 'style= "height: 3rem !important;"' : ""
								}>${sale.title}</h5>
              </a>
              <h6 class="card-subtitle mb-2 text-muted" style="display: ${
								modal ? "none" : "block"
							};">${legoId}</h6>
              <p class="badge rounded-pill text-bg-info mb-0">${profitability}%</p>
              <p class="card-text mb-0" id="sale-price">${formatPrice(
								sale.price
							)}</p>
            </div>
            <div class="col px-0 ms-2" style="width: ${
							modal ? 9 : 7
						}%; flex: 0 0 auto;">
              <button class="btn favorite-btn mt-1" style="width: fit-content; display: none;" data-id="${
								sale._id
							}">
                ${ADD_FAV_ICON}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

/** Create pagination button
 *
 * @param {*} page
 * @param {*} disabled
 * @param {*} icon
 * @param {*} ariaLabel
 * @returns
 */
const createPaginationButton = (
	page,
	disabled,
	icon,
	ariaLabel,
	newClass = "disabled"
) => `
  <li class="page-item ${disabled ? newClass : ""}">
    <a class="page-link" href="#" data-page="${page}" aria-label="${ariaLabel}">
      ${icon}
    </a>
  </li>
`;

/** Render pagination using Bootstrap
 *
 * @param  {Object} pagination
 */
const renderPagination = (pagination) => {
	const { currentPage, pageCount } = pagination;
	const maxVisiblePages = 5;
	const halfVisible = Math.floor(maxVisiblePages / 2);

	paginationContainer.innerHTML = "";

	// Add "Previous" button
	if (currentPage > 1) {
		paginationContainer.innerHTML += `
            <li class="page-item">
                <a class="page-link" href="#" data-page="${
									currentPage - 1
								}" aria-label="Previous">
                    &laquo;
                </a>
            </li>`;
	}

	// Calculate visible range
	let startPage = Math.max(1, currentPage - halfVisible);
	let endPage = Math.min(pageCount, currentPage + halfVisible);

	if (currentPage <= halfVisible) {
		endPage = Math.min(pageCount, maxVisiblePages);
	}
	if (currentPage + halfVisible >= pageCount) {
		startPage = Math.max(1, pageCount - maxVisiblePages + 1);
	}

	// Add "First" button if not in range
	if (startPage > 1) {
		paginationContainer.innerHTML += `
            <li class="page-item">
                <a class="page-link" href="#" data-page="1">1</a>
            </li>
            <li class="page-item disabled">
                <a class="page-link" href="#">...</a>
            </li>`;
	}

	// Add visible page numbers
	for (let page = startPage; page <= endPage; page++) {
		paginationContainer.innerHTML += `
            <li class="page-item ${page === currentPage ? "active" : ""}">
                <a class="page-link" href="#" data-page="${page}">${page}</a>
            </li>`;
	}

	// Add "Last" button if not in range
	if (endPage < pageCount) {
		paginationContainer.innerHTML += `
            <li class="page-item disabled">
                <a class="page-link" href="#">...</a>
            </li>
            <li class="page-item">
                <a class="page-link" href="#" data-page="${pageCount}">${pageCount}</a>
            </li>`;
	}

	// Add "Next" button
	if (currentPage < pageCount) {
		paginationContainer.innerHTML += `
            <li class="page-item">
                <a class="page-link" href="#" data-page="${
									currentPage + 1
								}" aria-label="Next">
                    &raquo;
                </a>
            </li>`;
	}

	const itemsPerPage = parseInt(selectShow.value);
	const rangeBeg = (pagination.currentPage - 1) * itemsPerPage + 1;
	const rangeEnd = pagination.currentPage * itemsPerPage;
	const nbDeals = pagination.count;

	if (isTabActive("nav-deals-tab")) {
		paginationInfo.style.display = "block";

		paginationInfo.innerHTML = `
			<div class="text-muted float-end">
			Showing ${rangeBeg} - ${
			rangeEnd > nbDeals ? nbDeals : rangeEnd
		} out of ${nbDeals} deal(s)
			</div>
			`;
	} else {
		paginationInfo.style.display = "none";
	}

	// Attach click handlers
	document.querySelectorAll(".page-link").forEach((link) => {
		link.addEventListener("click", async (event) => {
			event.preventDefault();
			const page = parseInt(event.target.getAttribute("data-page"));
			if (!isNaN(page)) {
				if (isTabActive("nav-deals-tab")) {
					await fetchAndRenderDeals(page, parseInt(selectShow.value));
				} else {
					await renderFavoriteDeals(page, favoritesPagination.pageSize);
				}
			}
		});
	});
};

// Function to fetch deals for a specific page and page size
const fetchAndRenderDeals = async (page, pageSize) => {
	try {
		const { results, meta } = await fetchDeals(
			page,
			pageSize,
			currentParams.legoId,
			currentParams.price,
			currentParams.date,
			currentParams.sortBy,
			currentParams.filterBy
		);

		// Update the current deals and pagination
		setCurrentDeals({ results, meta });
		renderDeals(currentDeals);
		dealsPagination = { ...meta };
		renderPagination(dealsPagination, "deals");
	} catch (error) {
		console.error("Error fetching deals:", error);
	}
};

/** Fetch favorite deals by their IDs
 *
 * @returns {Promise<Array>} Array of favorite deals
 */
const fetchFavoriteDeals = async () => {
	let favoriteDeals = [];
	// let favoriteIds = [];
	// const token = localStorage.getItem("token");
	favoriteDeals = getFavoriteDeals();

	// if (!token) {
	// } else {
	// 	try {
	// 		const response = await fetch(`${API_URL}/users/favorites`, {
	// 			method: "GET",
	// 			headers: {
	// 				"x-auth-token": token,
	// 			},
	// 		});

	// 		const data = await response.json();
	// 		console.log(data);
	// 		if (response.ok) {
	// 			favoriteDeals = data.favorites;
	// 		} else {
	// 			console.error("Error fetching favorite deals:", data.message);
	// 		}
	// 	} catch (error) {
	// 		console.error("Error fetching favorite deals:", error);
	// 	}
	// }

	return favoriteDeals;
};

/** Render favorites with pagination
 *
 * @param {Number} [page=1] - Current page number
 * @param {Number} [itemsPerPage=6] - Number of items per page
 */
const renderFavoriteDeals = async (page = 1, itemsPerPage = 6) => {
	const favoriteDeals = await fetchFavoriteDeals();
	const totalFavorites = favoriteDeals.length;
	const pageCount = Math.ceil(totalFavorites / itemsPerPage);
	const startIndex = (page - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;

	document.getElementById("options-column").style.display = "none";

	// Slice the deals for the current page
	const paginatedFavorites = favoriteDeals.slice(startIndex, endIndex);

	// Update pagination state
	currentPagination = {
		currentPage: page,
		pageCount: pageCount,
		pageSize: itemsPerPage,
		count: totalFavorites,
	};

	// Clear the favorites section
	sectionFavorites.innerHTML = "";

	// Handle empty state
	if (paginatedFavorites.length === 0) {
		sectionFavorites.innerHTML = `
            <div class="alert alert-warning" role="alert">
                No favorites to display. Add some deals to your favorites!
            </div>`;

		paginationContainer.style.display = "none";
		return;
	}

	// Create fragment for performance
	const fragment = document.createDocumentFragment();
	const div = document.createElement("div");
	div.classList.add("row", "items", "overflow-auto");

	// Create deal templates
	const template = paginatedFavorites
		.map((deal) => createDealTemplate(deal, favoriteDeals))
		.join("");

	div.innerHTML = template;
	fragment.appendChild(div);
	sectionFavorites.appendChild(fragment);

	// Attach listeners to favorite buttons
	document.querySelectorAll(".favorite-btn").forEach((button) => {
		button.addEventListener("click", toggleFavorite);
	});

	// Render pagination
	paginationContainer.style.display = "flex";
	renderPagination(currentPagination);
};

/** Set global deals and pagination data
 *
 * @param {Array} result - deals to display
 * @param {Object} meta - pagination meta info
 */
const setCurrentDeals = ({ results, meta }) => {
	if (!Array.isArray(results)) {
		console.error("Invalid results array:", results);
		results = [];
	}

	if (typeof meta !== "object" || !meta.currentPage || !meta.pageCount) {
		console.error("Invalid pagination meta:", meta);
		meta = { currentPage: 1, pageCount: 0, count: 0 };
	}

	currentDeals = results;
	currentPagination = meta;
};

/** Render lego set ids selector
 *
 * @param  {Array} lego set ids
 */
const renderLegoSetIds = async () => {
	const ids = await getIdsFromDeals();
	const placeholder = `<option selected>Lego set to filter by</option>`;
	const options = ids
		.filter((id) => id !== "")
		.sort((a, b) => a - b)
		.map((id) => `<option value="${id}">${id}</option>`)
		.join("");

	// selectLegoSetIds.innerHTML = placeholder + options;
	selectLegoSetIds.innerHTML = options;
};

const render = (deals, pagination) => {
	renderDeals(deals); // Render the deals
	renderPagination(pagination); // Render the pagination for deals
	renderLegoSetIds(); // Optionally render LEGO IDs for filtering
};

/** Utility function for rendering paginated deals
 *
 * @param {*} deals
 */
const renderPaginatedDeals = (deals) => {
	// Paginate the new deals before rendering
	const paginatedDeals = paginateDeals(
		deals,
		currentPagination.currentPage,
		selectShow.value
	);

	// Update pagination meta for new results
	const newPagination = {
		currentPage: 1,
		pageCount: Math.ceil(deals.length / parseInt(selectShow.value)),
		pageSize: parseInt(selectShow.value),
		count: deals.length,
	};

	setCurrentDeals({
		result: paginatedDeals,
		meta: newPagination,
	});

	render(currentDeals, currentPagination);
};

// Scheduled refresh times in UTC (converted from UTC+2)
const refreshTimes = [
	{ hour: 5, minute: 0 }, // 5:00 AM UTC+2
	{ hour: 18, minute: 0 }, // 6:00 PM UTC+2
];

/** Calculate the next Monday at 2:00 AM UTC
 *
 * @returns {Date} - Date object of the next scheduled refresh
 */
function getNextRefreshTime() {
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const timesInMs = refreshTimes.map(
		({ hour, minute }) => today.getTime() + hour * 3600 * 1000 + minute * 60000
	);

	// Find the next refresh time
	const nextRefresh = timesInMs.find((time) => time > now.getTime());
	if (nextRefresh) return new Date(nextRefresh);

	// If no upcoming refresh today, return the first time tomorrow
	return new Date(timesInMs[0] + 24 * 3600 * 1000);
}

/** Update the countdown timer
 *
 */
function updateCountdown() {
	const countdownElement = document.getElementById("countdown");
	const now = new Date();
	const nextRefresh = getNextRefreshTime();

	const timeDiff = nextRefresh - now;

	if (timeDiff <= 0) {
		countdownElement.textContent = "Refreshing now!";
		setTimeout(updateCountdown, 60000 * 5); // Check again after 1 second
		return;
	}

	// Calculate hours, minutes, and seconds remaining
	const hours = Math.floor(timeDiff / (1000 * 60 * 60));
	const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
	const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

	document.getElementById("hours").textContent = hours
		.toString()
		.padStart(2, "0");
	document.getElementById("minutes").textContent = minutes
		.toString()
		.padStart(2, "0");
	document.getElementById("seconds").textContent = seconds
		.toString()
		.padStart(2, "0");

	// Update every second
	setTimeout(updateCountdown, 1000);
}

const handleFilterClick = async (event) => {
	const filterOption = event.target;

	// Toggle active state of the clicked filter
	const isActive = filterOption.classList.contains("active");

	// Reset all buttons to inactive
	filters
		.querySelectorAll("span")
		.forEach((btn) => btn.classList.remove("active"));

	if (isActive) {
		// If the clicked filter is already active, remove the filter
		try {
			// Remove `filterBy` from currentParams while keeping other parameters intact
			const { legoId, price, date, sortBy } = currentParams;

			// Fetch deals with all other parameters except `filterBy`
			const { results, meta } = await fetchDeals(
				1, // Reset to page 1
				selectShow.value, // Use current page size
				legoId, // Preserve LEGO ID filter
				price, // Preserve price filter
				date, // Preserve date filter
				sortBy, // Preserve sorting
				undefined // Remove the filterBy parameter
			);

			// Reset global state and re-render
			currentParams.filterBy = undefined; // Explicitly clear filterBy in global params
			setCurrentDeals({ results, meta });
			renderDeals(currentDeals);
			renderPagination(currentPagination);
			isListFiltered = false; // No active filter now
		} catch (error) {
			console.error("Error removing filter:", error);
			renderDeals([]); // Clear deals on error
		}
		return;
	}

	// Set the clicked button as active
	filterOption.classList.add("active");

	// Determine the filter to apply based on the button's text
	let filterBy;
	switch (filterOption.innerHTML) {
		case "Best Discount":
			filterBy = `best-discount-${MINIMUM_DISCOUNT}`;
			break;
		case "Popular":
			filterBy = `most-commented-${MINIMUM_COMMENTS}`;
			break;
		case "Hot Deals":
			filterBy = `hot-deals-${MINIMUM_TEMPERATURE}`;
			break;
		default:
			filterBy = undefined;
	}

	try {
		// Fetch filtered deals from the API
		const { legoId, price, date, sortBy } = currentParams; // Preserve other parameters
		const { results, meta } = await fetchDeals(
			1, // Reset to page 1
			selectShow.value, // Use current page size
			legoId, // Preserve LEGO ID filter
			price, // Preserve price filter
			date, // Preserve date filter
			sortBy, // Preserve sorting
			filterBy // Apply selected filter
		);

		// Update global state and re-render
		currentParams.filterBy = filterBy; // Update global params with the new filter
		setCurrentDeals({ results, meta });
		renderDeals(currentDeals);
		renderPagination(currentPagination);
		isListFiltered = true; // Filter is now active
	} catch (error) {
		console.error("Error applying filter:", error);
		renderDeals([]); // Clear deals on error
	}
};

const populateThresholds = () => {
	// Populate the threshold values
	document.getElementById("discount-threshold").textContent = MINIMUM_DISCOUNT;
	document.getElementById("comments-threshold").textContent = MINIMUM_COMMENTS;
	document.getElementById("hot-deals-threshold").textContent =
		MINIMUM_TEMPERATURE;
};

/** ================== Event Listeners ================== */

// Listen for changes in the "Show" dropdown to update page size
selectShow.addEventListener("change", async (event) => {
	const newPageSize = parseInt(event.target.value);

	if (isTabActive("nav-deals-tab")) {
		// Fetch and render deals with the new page size
		await fetchAndRenderDeals(1, newPageSize);
	} else if (isTabActive("nav-favorites-tab")) {
		// Update favorites pagination and render
		favoritesPagination.pageSize = newPageSize;
		await renderFavoriteDeals(1, favoritesPagination.pageSize);
	}
});

/**
 * Handle filters
 */
// Handle change event for LEGO Set ID datalist
legoSetIdSearch.addEventListener("change", async (event) => {
	const selectedLegoId = event.target.value;
	console.log(selectedLegoId);

	// Check if the selected LEGO ID is valid
	if (!/^\d+$/.test(selectedLegoId)) {
		currentParams.legoId = undefined; // Clear LEGO ID filter
	} else {
		currentParams.legoId = selectedLegoId; // Update global params with the selected LEGO ID
	}

	// Fetch and render deals with the selected LEGO set ID
	await fetchAndRenderDeals(currentPagination.currentPage, selectShow.value);
});

filters.querySelectorAll("span").forEach((filterOption) => {
	filterOption.addEventListener("click", handleFilterClick);
});

/**
 * Handle sort change
 */
selectSort.addEventListener("change", async (event) => {
	const sortBy = event.target.value;

	try {
		const { results, meta } = await fetchDeals(
			currentPagination.currentPage,
			currentPagination.pageSize,
			currentParams.legoId, // LEGO ID
			undefined, // Price filter
			undefined, // Date filter
			sortBy // Sorting parameter
		);

		setCurrentDeals({ results, meta });
		renderDeals(currentDeals);
		renderPagination(currentPagination);
	} catch (error) {
		console.error("Error applying sort:", error);
	}
});

// Update tab click listeners to use separate states
document.querySelectorAll(".nav-link").forEach((link) => {
	link.addEventListener("click", async () => {
		if (isTabActive("nav-favorites-tab")) {
			// Render favorites with specific pagination
			favoritesPagination.pageSize = parseInt(selectShow.value);
			await renderFavoriteDeals(1, favoritesPagination.pageSize);
		} else if (isTabActive("nav-deals-tab")) {
			// Render deals with specific pagination
			paginationContainer.style.display = "flex";
			render(currentDeals, dealsPagination);
		}
	});
});

if (savedDarkMode === "enabled") {
	enableDarkMode(); // Apply dark mode
	darkModeToggle.checked = true; // Ensure the toggle is checked
}
darkModeToggle.addEventListener("change", () => {
	if (darkModeToggle.checked) {
		enableDarkMode(); // Enable dark mode
	} else {
		disableDarkMode(); // Disable dark mode
	}
});

// Add event listener to deal titles to open modal and populate with data
document.addEventListener("click", async (event) => {
	console.log(`Event target: ${event.target.outerHTML}`);
	if (event.target.parentElement.classList.contains("deal-title")) {
		const uuid = event.target.parentElement.getAttribute("data-uuid");

		// Find the deal information
		const deal = currentDeals.find((deal) => deal._id === uuid);

		// Configure "See Deal" button
		document
			.getElementsByClassName("modal-footer")[0]
			// .getElementsByTagName("button")[0]
			.getElementsByTagName("a")[0]
			.setAttribute("href", deal.merchantLink);

		// Configure "See Deal" button
		document
			.getElementsByClassName("modal-footer")[0]
			// .getElementsByTagName("button")[0]
			.getElementsByTagName("a")[1]
			.setAttribute("href", deal.link);

		// Populate deal info in the modal
		const modalDealInfo = document.getElementById("modalDealInfo");
		modalDealInfo.innerHTML = `
		<div class="row">
			<div class="col-md-3">
			<img class="rounded img-fluid" src=${deal.imgUrl} alt="${deal._id}-img"/>
			</div>
			<div class="col">
			<strong><h5>${deal.title}</h5></strong>
			<p>LEGO ID: ${deal.legoId}</p>
			<p>Temperature: ${deal.temperature}°</p>
			<p>Comments: ${deal.comments}</p>
			<p>Retail Price: ${formatPrice(deal.nextBestPrice)}</p>
			<p>Discounted Price: ${formatPrice(deal.price)}</p>
			<p>Publication Date: ${new Date(
				deal.publication * 1e3
			).toLocaleDateString()}</p>
			</div>
		</div>
		`;

		// Fetch sales information for the LEGO ID
		let sales = await fetchSales(deal.legoId);
		const { average, p25, p50, p95 } = calculateSalesIndicators(sales);

		// Generate histogram data
		const { labels, histogram } = generateHistogramData(sales);

		// Get top 5 most rentable sales
		sales = sales
			.sort((a, b) => getProfitability(deal, b) - getProfitability(deal, a))
			.slice(0, 5);

		// Populate sales info in the modal
		const modalSalesInfo = document.getElementById("modalSalesInfo");
		modalSalesInfo.innerHTML = sales
			.map((sale) =>
				createSaleTemplate(
					sale,
					getProfitability(deal, sale),
					deal.legoId,
					true
				)
			)
			.join("");

		// Destroy canvas if it already exists
		const chartStatus = Chart.getChart("salesDistributionChart");
		if (chartStatus !== undefined) {
			chartStatus.destroy();
		}

		// Get the canvas element
		const canvas = document.getElementById("salesDistributionChart");
		const ctx = canvas.getContext("2d");

		// Create the chart
		new Chart(ctx, {
			type: "bar",
			data: {
				labels: labels,
				datasets: [
					{
						label: "Number of sales",
						data: histogram,
						backgroundColor: "rgba(75, 192, 192, 0.5)",
						borderColor: "rgba(75, 192, 192, 1)",
						borderWidth: 1,
					},
				],
			},
			options: {
				scales: {
					x: {
						beginAtZero: true,
						title: { display: true, text: "Price Ranges" },
					},
					y: {
						beginAtZero: true,
						title: { display: true, text: "Frequency" },
					},
				},
				plugins: {
					annotation: {
						annotations: [
							{
								type: "line",
								mode: "vertical",
								scaleID: "x",
								value: average.toFixed(2),
								borderColor: "orange",
								borderWidth: 2,
								backgroundColor: "rgba(0, 0, 0, 0.2)",
								label: {
									enabled: true,
									content: "Average",
									coolor: "red",
								},
							},
							{
								type: "line",
								mode: "vertical",
								scaleID: "x",
								value: p25.toFixed(2),
								borderColor: "red",
								borderWidth: 2,
								label: {
									enabled: true,
									content: "25th Percentile",
								},
							},
							{
								type: "line",
								mode: "vertical",
								scaleID: "x",
								value: p50.toFixed(2),
								borderColor: "green",
								borderWidth: 2,
								label: {
									content: "50th Percentile",
									position: "center",
								},
							},
							{
								type: "line",
								mode: "vertical",
								scaleID: "x",
								value: p95.toFixed(2),
								borderColor: "blue",
								borderWidth: 2,
								label: {
									content: "95th Percentile",
									enabled: true,
									position: "top",
								},
							},
						],
					},
					legend: {
						display: true,
						labels: {
							color: "black",
							font: {
								size: 12,
							},
							generateLabels: function (chart) {
								return [
									{
										text: `Average: ${formatPrice(average.toFixed(2))}`,
										fillStyle: "orange",
										hidden: false,
									},
									{
										text: `25th Percentile: ${formatPrice(p25.toFixed(2))}`,
										fillStyle: "red",
										hidden: false,
									},
									{
										text: `50th Percentile: ${formatPrice(p50.toFixed(2))}`,
										fillStyle: "green",
										hidden: false,
									},
									{
										text: `95th Percentile: ${formatPrice(p95.toFixed(2))}`,
										fillStyle: "blue",
										hidden: false,
									},
								];
							},
						},
					},
					tooltip: {
						callbacks: {
							label: function (context) {
								return `Frequency: ${context.raw}`;
							},
						},
					},
				},
			},
		});
	}
});

/**
 * Handle page load and initial fetch
 */
document.addEventListener("DOMContentLoaded", async () => {
	// Check if user is logged in
	const checkAuth = async () => {
		const token = localStorage.getItem("token");
		if (token) {
			try {
				const response = await fetch(`${API_URL}/users/profile`, {
					method: "GET",
					headers: {
						"x-auth-token": token,
					},
				});

				const data = await response.json();
				if (response.ok) {
					showProfile(data);
				} else {
					localStorage.removeItem("token");
				}
			} catch (error) {
				console.error("Error fetching profile:", error);
			}
		}
	};

	checkAuth();

	const deals = await fetchDeals(1, parseInt(selectShow.value));

	setCurrentDeals(deals);
	dealsPagination = { ...currentPagination };
	render(currentDeals, dealsPagination);
	populateThresholds();

	// Initialize favorites pagination
	favoritesPagination = {
		currentPage: 1,
		pageSize: parseInt(selectShow.value),
		pageCount: 0,
		count: 0,
	};

	const registerForm = document.getElementById("register");
	const loginForm = document.getElementById("login");
	const welcomeMessage = document.getElementById("welcome-message");
	const authPrompt = document.getElementById("auth-prompt");
	const authModal = new bootstrap.Modal(document.getElementById("authModal"));

	// Register user
	registerForm.addEventListener("submit", async (event) => {
		event.preventDefault();

		const username = document.getElementById("register-username").value;
		const email = document.getElementById("register-email").value;
		const password = document.getElementById("register-password").value;

		try {
			const response = await fetch(`${API_URL}/users/register`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ username, email, password }),
			});

			const data = await response.json();
			if (response.ok) {
				localStorage.setItem("token", data.token);
				showProfile(data.user);
				authModal.hide();
				if (isTabActive("nav-favorites-tab")) {
					await renderFavoriteDeals(1, favoritesPagination.pageSize);
				} else {
					await render(currentDeals, dealsPagination);
				}
			} else {
				alert(data.message);
			}
		} catch (error) {
			console.error("Error registering user:", error);
		}
	});

	// Login user
	loginForm.addEventListener("submit", async (event) => {
		event.preventDefault();

		const email = document.getElementById("login-email").value;
		const password = document.getElementById("login-password").value;

		try {
			const response = await fetch(`${API_URL}/users/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, password }),
			});

			const data = await response.json();
			if (response.ok) {
				localStorage.setItem("token", data.token);
				showProfile(data.user);
				authModal.hide();
				if (isTabActive("nav-favorites-tab")) {
					await renderFavoriteDeals(1, favoritesPagination.pageSize);
				} else {
					await render(currentDeals, dealsPagination);
				}
			} else {
				alert(data.message);
			}
		} catch (error) {
			console.error("Error logging in user:", error);
		}
	});

	// Show profile
	const showProfile = (user) => {
		welcomeMessage.textContent = `Welcome, ${user.username}`;
		authPrompt.textContent = "Logout";
		authPrompt.removeAttribute("data-bs-toggle");
		authPrompt.removeAttribute("data-bs-target");
		authPrompt.addEventListener("click", logoutUser);
	};

	// Logout user
	const logoutUser = () => {
		localStorage.removeItem("token");
		welcomeMessage.textContent = "";
		authPrompt.textContent = "Login";
		authPrompt.setAttribute("data-bs-toggle", "modal");
		authPrompt.setAttribute("data-bs-target", "#authModal");
		authPrompt.removeEventListener("click", logoutUser);
		render(currentDeals, dealsPagination);
	};

	// Handle "Don't show this message again" checkbox
	document
		.getElementById("dontShowAgain")
		.addEventListener("change", (event) => {
			if (event.target.checked) {
				localStorage.setItem("dontShowLocalStorageWarning", "true");
			} else {
				localStorage.removeItem("dontShowLocalStorageWarning");
			}
		});

	// Start the countdown
	updateCountdown();
});
