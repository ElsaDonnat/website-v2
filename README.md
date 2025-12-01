# Elsa Donnat - Portfolio Website

This is a **static portfolio website** that automatically updates from **Notion**.
It is built with HTML, CSS, and Vanilla JavaScript, and uses **GitHub Actions** to fetch content.

## 🚀 How to Update Content
**You do not need to touch the code.**
1.  Go to your **Notion Workspace**.
2.  Add a new Project or Update in your databases.
3.  **Wait**: The website updates automatically every 6 hours.
4.  **Force Update**: Go to the "Actions" tab in GitHub, select "Sync Notion Content", and click "Run workflow".

## 🛠️ Setup Guide

### 1. Notion Setup
-   Create an Integration in [Notion Developers](https://www.notion.so/my-integrations).
-   Share your "Projects" and "Updates" databases with this integration.
-   Copy the **Internal Integration Token** (`secret_...`).
-   Copy the **Database IDs** from the URL of your databases.

### 2. GitHub Secrets
To let the "Robot" (GitHub Action) access Notion, add these secrets in **Settings > Secrets and variables > Actions**:
-   `NOTION_KEY`: Your integration token.
-   `NOTION_DB_PROJECTS`: ID of the Projects database.
-   `NOTION_DB_UPDATES`: ID of the Updates database.

### 3. GitHub Pages
-   Go to **Settings > Pages**.
-   Source: `Deploy from a branch`.
-   Branch: `main` / `/ (root)`.
-   Your site will be live at `https://yourusername.github.io/repo-name`.

---

## 🏗️ Architecture & Extensibility

### How it Works
1.  **Source**: Content lives in Notion.
2.  **Sync**: A script (`cms/sync.js`) fetches data from Notion and saves it to `data.js`.
3.  **Build**: GitHub Actions runs this script automatically.
4.  **Render**: The website (`index.html`, `script.js`) reads `data.js` to display content.

### 🔧 How to Add a New Feature (e.g., "Reading List")
If you want to add a new section (like a Book List) in the future:

1.  **Notion**: Create a new Database for "Books". Share it with your integration.
2.  **Secrets**: Add `NOTION_DB_BOOKS` to GitHub Secrets (and `cms/.env` for local testing).
3.  **Backend (`cms/sync.js`)**:
    -   Add the new ID: `const DATABASE_ID_BOOKS = process.env.NOTION_DB_BOOKS;`
    -   Write a function `getBooks()` similar to `getProjects()`.
    -   Add the result to the `data` object in `main()`.
4.  **Frontend (`script.js`)**:
    -   Create a new function `renderReadingList()`.
    -   Read from `data.books` and generate HTML.
