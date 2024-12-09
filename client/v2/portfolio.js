// Invoking strict mode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#invoking_strict_mode
"use strict";

// const { get } = require("https");

/**
Description of the available api
GET https://lego-api-blue.vercel.app/deals

Search for specific deals

This endpoint accepts the following optional query string parameters:

- `page` - page of deals to return
- `size` - number of deals to return

GET https://lego-api-blue.vercel.app/sales

Search for current Vinted sales for a given lego set id

This endpoint accepts the following optional query string parameters:

- `id` - lego set id to return
*/

/** Global variables and selectors
 *
 */
let currentDeals = [];
let unfilteredDeals = [];
let currentSales = [];
let currentPagination = {};
let currentParams = {};
let isListFiltered = false;

// Selectors
const darkModeToggle = document.getElementById("darkModeToggle");
const savedDarkMode = localStorage.getItem("darkMode");
const selectShow = document.querySelector("#show-select");
const selectPage = document.querySelector("#page-select");
const selectLegoSetIds = document.querySelector("#lego-set-id-select");
const paginationInfo = document.querySelector("#pagination-info");
const sectionDeals = document.querySelector("#nav-deals");
const sectionFavorites = document.querySelector("#nav-favorites");
const sectionIndicators = document.getElementById("indicators");
const sectionOptions = document.getElementById("options");
const filters = document.querySelector("#filters");
const selectSort = document.querySelector("#sort-select");

// Indicator elements
const spanAvgPrice = document.querySelector("#averagePrice");
const spanP95Price = document.querySelector("#p95Price");
const spanP25Price = document.querySelector("#p25Price");
const spanP50Price = document.querySelector("#p50Price");
const spanLifetime = document.querySelector("#lifetimeValue");

const API_URL = "https://bricked-up-api.vercel.app";
const MINIMUM_COMMENTS = 20;
const MINIMUM_DISCOUNT = 30;
const MINIMUM_TEMPERATURE = 100;

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
        const url = `${API_URL}/v1/deals/search?${params.toString()}`;
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
        const response = await fetch(
            `${API_URL}/v1/sales/search?legoSetId=${id}`
        );
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
const createDealTemplate = (deal) => {
    const isFavorite = isFavoriteDeal(deal._id);

    return `
        <div class="col-12 col-sm-6 col-md-4">
            <div class="card mb-4" id=${deal._id}>
                <div class="card-body">
                    <!-- Title and LEGO ID -->
                    <div class="d-flex align-items-center mb-3">
                        <img
                            class="img-fluid img-thumbnail"
                            src="${deal.imgUrl}"
                            alt="Lego set image"
                        />
                        <div class="ms-3">
                            <a
                                href="#"
                                class="deal-title"
                                data-bs-toggle="modal"
                                data-bs-target="#dealModal"
                                data-uuid="${deal._id}"
                                data-id="${deal.legoId}"
                            >
                                <h5 class="card-title clamp-2-lines">${
                                    deal.title
                                }</h5>
                            </a>
                            <h6 class="card-subtitle text-muted">${
                                deal.legoId
                            }</h6>
                        </div>
                    </div>
                    <!-- Details -->
                    <div class="d-flex justify-content-between align-items-center">
                        <!-- Comments and Publication -->
                        <div>
                            <p class="badge bg-danger">${deal.temperature}°</p>
                            <p class="m-0">
                                <i class="fi fi-rr-comment-dots"></i> ${
                                    deal.comments
                                }
                            </p>
                            <p class="text-muted">${timeAgo(
                                deal.publication
                            )}</p>
                        </div>
                        <!-- Like button -->
                        <button
                            class="btn favorite-btn"
                            data-id="${deal._id}"
                        >
                            ${isFavorite ? DEL_FAV_ICON : ADD_FAV_ICON}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
};

/**
 * Initialize tooltips for deals with expiration dates
 */
const initializeExpirationTooltips = () => {
    currentDeals.forEach((deal) => {
        if (deal.expirationDate) {
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
const renderDeals = (deals) => {
    if (!Array.isArray(deals)) {
        console.error("Invalid deals array:", deals);
        deals = [];
    }

    sectionDeals.innerHTML = ""; // Clear existing content

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

    const template = deals.map((deal) => createDealTemplate(deal)).join("");
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

/** Render list of Vinted sales
 *
 * @param {Array} sales
 */
const renderSales = async (sales) => {
    sectionFavorites.innerHTML = "";

    const fragment = document.createDocumentFragment();
    const div = document.createElement("div");

    const favorites = sales.filter((deal) => isFavoriteDeal(deal._id));

    let template;
    if (favorites.length > 0) {
        template = favorites
            .reverse()
            .map((fav) => createDealTemplate(fav))
            .join("");
    } else {
        template = `
      <div class="alert alert-warning" role="alert">
        Click on the heart on a Deal to see it here!
      </div>
      `;
    }

    div.classList.add("row");
    div.classList.add("items");
    div.classList.add("overflow-auto");
    div.innerHTML = template;
    fragment.appendChild(div);
    sectionFavorites.appendChild(fragment);
    renderPagination(currentPagination);
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
    const paginationContainer = document.querySelector(".pagination");
    const maxVisiblePages = 5; // Number of visible pages
    const halfVisible = Math.floor(maxVisiblePages / 2);

    paginationContainer.innerHTML = ""; // Clear previous pagination

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

    // Calculate the visible range
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

    // Attach click event handlers to pagination links
    document.querySelectorAll(".page-link").forEach((link) => {
        link.addEventListener("click", async (event) => {
            event.preventDefault();
            const page = parseInt(event.target.getAttribute("data-page"));
            if (!isNaN(page)) {
                try {
                    // Fetch deals with current filters and sorting
                    const { results, meta } = await fetchDeals(
                        page, // New page number
                        currentPagination.pageSize, // Page size
                        currentParams.legoId, // Current LEGO ID filter
                        currentParams.price, // Current price filter
                        currentParams.date, // Current date filter
                        currentParams.sortBy, // Current sorting
                        currentParams.filterBy // Current filter
                    );

                    setCurrentDeals({ results, meta });
                    renderDeals(currentDeals);
                    renderPagination(currentPagination);
                } catch (error) {
                    console.error("Error fetching new page:", error);
                }
            }
        });
    });
};

/** Fetch favorite deals by their IDs
 *
 * @returns {Promise<Array>} Array of favorite deals
 */
const fetchFavoriteDeals = async () => {
    const favoriteIds = getFavoriteDeals();
    const favoriteDeals = [];

    for (const dealId of favoriteIds) {
        try {
            const url = `${API_URL}/v1/deals/${dealId}`;
            const res = await fetch(url);
            const deal = await res.json();
            if (deal) favoriteDeals.push(deal);
        } catch (error) {
            console.error(`Error fetching favorite deal ${dealId}:`, error);
        }
    }

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
        return;
    }

    // Create fragment for performance
    const fragment = document.createDocumentFragment();
    const div = document.createElement("div");
    div.classList.add("row", "items", "overflow-auto");

    // Create deal templates
    const template = paginatedFavorites
        .map((deal) => createDealTemplate(deal))
        .join("");

    div.innerHTML = template;
    fragment.appendChild(div);
    sectionFavorites.appendChild(fragment);

    // Render pagination
    renderPagination(currentPagination);
};

const renderFavoritePagination = (favoriteIds) => {
    const paginationContainer = document.querySelector(".pagination");
    const itemsPerPage = parseInt(selectShow.value) || 6; // Default to 6 items per page
    const totalFavorites = favoriteIds.length;
    const pageCount = Math.ceil(totalFavorites / itemsPerPage);
    const currentPage = currentPagination.currentPage || 1;

    paginationContainer.innerHTML = ""; // Clear previous pagination

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
    } else {
        paginationContainer.innerHTML += `
            <li class="page-item disabled">
                <a class="page-link" href="#" aria-label="Previous">
                    &laquo;
                </a>
            </li>`;
    }

    // Add visible page numbers
    for (let page = 1; page <= pageCount; page++) {
        paginationContainer.innerHTML += `
            <li class="page-item ${page === currentPage ? "active" : ""}">
                <a class="page-link" href="#" data-page="${page}">${page}</a>
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
    } else {
        paginationContainer.innerHTML += `
            <li class="page-item disabled">
                <a class="page-link" href="#" aria-label="Next">
                    &raquo;
                </a>
            </li>`;
    }

    // Attach click handlers to pagination buttons
    document.querySelectorAll(".page-link").forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            const page = parseInt(event.target.getAttribute("data-page"));
            if (!isNaN(page)) {
                renderPaginatedFavorites(favoriteIds, page, itemsPerPage);
            }
        });
    });
};

/** Paginate and render favorites */
const renderPaginatedFavorites = (favorites, page = 1, itemsPerPage = 6) => {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    let paginatedFavorites = favorites.slice(start, end);
    console.table(paginatedFavorites);
    // paginatedFavorites = paginatedFavorites.map(
    // 	async (dealId) => await getDealFromId(dealId)
    // );
    // console.table(paginatedFavorites);

    // Update the pagination meta
    currentPagination = {
        currentPage: page,
        pageCount: Math.ceil(favorites.length / itemsPerPage),
        count: favorites.length,
    };

    // Render the favorites for the current page
    sectionFavorites.innerHTML = "";

    if (paginatedFavorites.length === 0) {
        sectionFavorites.innerHTML = `
            <div class="alert alert-warning" role="alert">
                No favorites to display. Add some deals to your favorites!
            </div>`;
        return;
    }

    const fragment = document.createDocumentFragment();
    const div = document.createElement("div");
    div.classList.add("row", "items", "overflow-auto");

    const template = paginatedFavorites
        .map((deal) => createDealTemplate(deal))
        .join("");

    div.innerHTML = template;
    fragment.appendChild(div);
    sectionFavorites.appendChild(fragment);

    // Update pagination
    renderFavoritePagination(favorites);
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
const renderLegoSetIds = async (deals) => {
    const legoSection = document.getElementById("lego");
    if (isTabActive("nav-favorites-tab")) {
        legoSection.style.display = "none";
        sectionOptions.style.display = "none";
        return;
    }

    legoSection.style.display = "block";
    sectionOptions.style.display = "block";

    const ids = await getIdsFromDeals();
    const placeholer = `<option selected>Lego set to filter by</option>`;
    const options = ids
        .filter((id) => id !== "")
        .sort((a, b) => a - b)
        .map((id) => `<option value="${id}">${id}</option>`)
        .join("");

    selectLegoSetIds.innerHTML = placeholer + options;
};

const render = (deals, pagination) => {
    renderDeals(deals); // Render the deals
    renderPagination(pagination); // Render the pagination for deals
    renderLegoSetIds(deals); // Optionally render LEGO IDs for filtering
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

/**
 * Calculate the next Monday at 2:00 AM UTC
 * @returns {Date} - Date object of the next scheduled refresh
 */
function getNextRefreshTime() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const timesInMs = refreshTimes.map(
        ({ hour, minute }) =>
            today.getTime() + hour * 3600 * 1000 + minute * 60000
    );

    // Find the next refresh time
    const nextRefresh = timesInMs.find((time) => time > now.getTime());
    if (nextRefresh) return new Date(nextRefresh);

    // If no upcoming refresh today, return the first time tomorrow
    return new Date(timesInMs[0] + 24 * 3600 * 1000);
}

/**
 * Update the countdown timer
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

/**
 * Declaration of all Listeners
 */

// Select the number of deals to display
selectShow.addEventListener("change", async (event) => {
    const newPageSize = parseInt(event.target.value);
    const maxPage =
        Math.trunc(currentDeals.length / currentPagination.pageSize) + 1;
    const newPage =
        currentPagination.currentPage <= maxPage
            ? currentPagination.currentPage
            : maxPage;

    const deals = await fetchDeals(newPage, newPageSize);
    console.table(deals);

    setCurrentDeals(deals);
    render(currentDeals, currentPagination);
});

/**
 * Handle filters
 */
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
            undefined, // LEGO ID
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

let originalPagination;

document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", async () => {
        if (isTabActive("nav-favorites-tab")) {
            // Render favorites with default pagination
            await renderFavoriteDeals(1, parseInt(selectShow.value));
        } else if (isTabActive("nav-deals-tab")) {
            if (originalPagination) {
                // Restore original deals pagination
                render(currentDeals, originalPagination);
            }
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
            .sort(
                (a, b) => getProfitability(deal, b) - getProfitability(deal, a)
            )
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
                                        text: `Average: ${formatPrice(
                                            average.toFixed(2)
                                        )}`,
                                        fillStyle: "orange",
                                        hidden: false,
                                    },
                                    {
                                        text: `25th Percentile: ${formatPrice(
                                            p25.toFixed(2)
                                        )}`,
                                        fillStyle: "red",
                                        hidden: false,
                                    },
                                    {
                                        text: `50th Percentile: ${formatPrice(
                                            p50.toFixed(2)
                                        )}`,
                                        fillStyle: "green",
                                        hidden: false,
                                    },
                                    {
                                        text: `95th Percentile: ${formatPrice(
                                            p95.toFixed(2)
                                        )}`,
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
    const deals = await fetchDeals();

    setCurrentDeals(deals);
    render(currentDeals, currentPagination);

    // Start the countdown
    updateCountdown();

    // Store the original pagination when the page first loads
    originalPagination = { ...currentPagination };
});
