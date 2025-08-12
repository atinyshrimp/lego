# 🧱 Bricked Up: Predictability of a LEGO Set Deal

## 🚀 Project Overview

**Bricked Up** is a full-stack web app that aggregates and analyzes **LEGO deals** 🧩 scraped from public sources. Users can browse deals, filter and sort listings, save favorites, and gain insights with interactive price indicators.

🌐 **Live Demo**: [**Visit Bricked Up**](https://bricked-up.vercel.app)

---

## 💡 Why This Project?

**Bricked Up** solves the challenge of finding the best LEGO deals in a **user-friendly**, **responsive**, and automated way. By leveraging scraping, APIs, and automation, it ensures LEGO enthusiasts never miss out on a great deal. 🧱✨

---

## ✨ Features

- 🛒 **View Deals**: Browse through aggregated LEGO offers.
- 📊 **Relevance Score**:
  - Each deal is scored based on its popularity, discount, freshness, and resalability metrics.
  - Relevance helps users prioritize the best deals.
- 🔍 **Interactive Filters**:
  - 🏆 _Best Discount_
  - 🔥 _Hot Deals_
  - 📈 _Popular Deals_
  - _Relevance-based sorting_
- 📊 **Deal Insights**:
  - Average and percentile price indicators.
  - Expiration countdown for time-sensitive offers.
- ❤️ **Save Favorites**: Mark and revisit your favorite deals.
- 🌗 **Dark Mode**: Toggle between light and dark themes.
- 🔄 **Automated Refresh**: Deals update **daily** at 5 AM and 6 PM UTC+2.
- 📱 **Responsive Design**: Works seamlessly on all devices, with optimized modals and layouts.
- 🛠️ **How It Works Accordion**: Guides users on searching, sorting, and understanding the scores.

---

## 🛠️ Technologies Used

- **Frontend**: HTML, CSS (Bootstrap 5) 🎨, JavaScript ⚡
- **Backend**: Node.js with Express.js 🚀
- **Database**: MongoDB Atlas 🗄️
- **Web Scraping**: Puppeteer 🕷️, Cheerio 🌿
- **Deployment**: Vercel 🛠️
- **Automation**: GitHub Actions 🕒

---

## 📸 Screenshots

![Home Page](./assets/screenshots/homepage.png)  
_A clean, interactive homepage for LEGO enthusiasts._

![Dark Mode](./assets/screenshots/darkmode.png)  
![Dark Mode](./assets/screenshots/darkmode.gif)
\
_Seamless switch to dark mode._

![Deal Insights](./assets/screenshots/insights.png)  
![Deal Insights](./assets/screenshots/insights.gif)
\
_Key price insights with visual indicators._

---

## 📖 Understanding the Relevance Score

The **Relevance Score** is a calculated metric that helps users identify the best deals. It evaluates:

- **Discount**: The percentage off the original price.
- **Popularity**: Based on the number of comments and likes.
- **Freshness**: How recently the deal was published.
- **Resalability**: Resale potential based on average resale prices and listing activity.
- **Temperature**: A deal’s popularity among community users.
- **Expiry**: Whether the deal is expiring soon.
  The score ranges from **0% (low relevance)** to **100% (high relevance)**.

### 📊 Relevance Score Explained

The **Relevance Score** is a metric (ranging from **0 to 1**) used to rank LEGO deals based on their value and appeal. It evaluates multiple factors with assigned weights to provide a comprehensive score.

#### Relevance Score Formula

$$
\text{Relevance Score} = W_d \cdot S_d + W_p \cdot S_p + W_f \cdot S_f + W_e \cdot S_e + W_h \cdot S_h + W_r \cdot S_r
$$

Where:

- $W$: Weight assigned to each factor
- $S$: Scaled score of each factor
- Subscripts:
  - $d$: Discount
  - $p$: Popularity
  - $f$: Freshness
  - $e$: Expiry
  - $h$: Heat
  - $r$: Resalability

#### Factors Breakdown

- **Discount Score ($S_d$):** Percentage discount ( $S_d = \min(\frac{\text{Discount}}{100}, 1)$ ).
- **Popularity Score ($S_p$):** Community engagement ( $S_p = \min(\frac{\text{Comments}}{\text{MAX COMMENTS}}, 1)$ ).
- **Freshness Score ($S_f$):** Time since publication ( $S_f = \max(1 - \frac{\text{Days}}{\text{MAX AGE DAYS}}, 0)$  ).
- **Expiry Score ($S_e$):** Penalizes deals expiring soon (  $S_e = 0.5$ if expiring soon, $S_e = 1$ otherwise).
- **Heat Score ($S_h$):** Based on temperature ( $S_h = \min(\frac{\text{Temperature}}{\text{MAX TEMPERATURE}}, 1)$ ).
- **Resalability Score ($S_r$):** Combines:
  - **Profitability**: ( $\max(\frac{\text{Resale Price} - \text{Price}}{\text{Price}}, 0)$ ),
  - **Demand**: ( $\min(\frac{\text{Resale Listings}}{\text{MAX LISTINGS}}, 1)$ ),
  - **Velocity**: ( $\min(\frac{\text{Weekly Resales}}{\text{MAX WEEKLY SALES}}, 1)$ ).

#### Weight Distribution

- **Discount:** 20%
- **Popularity:** 20%
- **Freshness:** 15%
- **Expiry:** 5%
- **Heat:** 10%
- **Resalability:** 30%
  - _Profitability_: 50%
  - _Demand_: 30%
  - _Velocity_: 20%

The **Relevance Score** provides a quick, data-driven insight into the best LEGO deals available.

---

## ⚙️ How It Works

1. **Data Collection**: 🕷️ Deals are scraped from public sources like **Dealabs** and **Vinted**.
2. **Backend API**: 📡 Data is stored in **MongoDB Atlas** and served through an Express.js API.
3. **Scheduled Updates**: ⏰ **GitHub Actions** refresh the data automatically twice a day.
4. **Client Rendering**: 🌟 The deals are displayed interactively with filtering, sorting, and responsive design.

---

## 🌐 Live Updates: Automation

The data refreshes **automatically**:  
⏰ **Daily at 5 AM and 6 PM UTC+2**  
Using **GitHub Actions** to ensure users always get the latest deals.

---

## 🗂️ Project Structure

```
bricked-up/
├── client/
│   └── v2/
│       ├── index.html       # Main client HTML file
│       ├── styles.css       # Custom CSS styles
│       ├── portfolio.js     # Client-side logic
│       ├── assets/          # Images and other assets
│       └── utils.js         # Utility functions
│
├── server/
│   ├── api.js               # Main server file (Express routes)
│   ├── refresh_database.js  # Script to refresh MongoDB
│   ├── dealabs.js           # Scraping script for Dealabs
│   ├── vinted.js            # Scraping script for Vinted
│   └── node_modules/        # Installed dependencies
│
├── .github/
│   └── workflows/
│       └── database-refresh.yml  # GitHub Actions for scheduled scraping
│
├── vercel.json              # Vercel deployment configuration
├── package.json             # Dependencies for server and client
└── README.md                # Project documentation
```

---

## 👑 Acknowledgments

- Public data sources: **Dealabs** and **Vinted**
- Frameworks & Tools: Bootstrap, Puppeteer, Node.js, MongoDB
- Icons: [Flaticon](https://flaticon.com/)

---

## 📬 Contact

**Developed by**: [Joyce Lapilus](https://github.com/atinyshrimp)  
**Project Repository**: [GitHub](https://github.com/atinyshrimp/lego)

For inquiries, feel free to contact via [**joyce.lapilus@gmail.com**](mailto:joyce.lapilus@gmail.com).

---

## ⚠️ Disclaimer

This website aggregates publicly available data for **educational and informational purposes only**.  
🔒 **No malicious intent** is associated with data scraping. For any concerns, feel free to contact me.

---

🎉 **Thank you for visiting Bricked Up!** 🧱✨
