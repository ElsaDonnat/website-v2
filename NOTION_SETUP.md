# Notion CMS Setup Guide

Follow these steps to connect your Notion workspace to your website.

## Phase 1: Create the Integration
1.  Go to [My Integrations](https://www.notion.so/my-integrations).
2.  Click **"New integration"**.
3.  Name it "Elsa Website CMS".
4.  Select the workspace where your content lives.
5.  Click **Submit**.
6.  **Copy the "Internal Integration Secret"**. You will need this later.

## Phase 2: Create the Databases
You need to create 2 databases. You can duplicate a template or create them manually.

### Database 1: "Website Projects"
Create a new **Table** database. Add these exact properties (case-sensitive):
*   `Name` (Title) - *The project title*
*   `Status` (Select) - *Options: "ongoing", "past"*
*   `Description` (Text) - *Short description*
*   `Tags` (Multi-select) - *e.g., "AI Safety", "Law"*
*   `Link` (URL) - *Link to the project page or PDF*
*   `Documents` (Files & Media) - *Upload PDFs here*

### Database 2: "Website Updates"
Create a new **Table** database. Add these exact properties:
*   `Name` (Title) - *The update title*
*   `Date` (Date) - *When it happened*
*   `Type` (Select) - *Options: "news", "talk", "publication"*
*   `Content` (Text) - *The main text*
*   `Image` (Files & Media) - *Upload an image here (optional)*

## Phase 3: Connect the Integration
1.  Open your "Website Projects" database.
2.  Click the **...** (three dots) at the top right.
3.  Click **Connect to** (or "Add connections").
4.  Search for "Elsa Website CMS" (the integration you created) and select it.
5.  **Repeat** this for the "Website Updates" database.

## Phase 4: Configure the Code
1.  Go to your website folder: `c:\Users\ElsaDonnat\website\cms`.
2.  Rename `.env.example` to `.env`.
3.  Open `.env` in a text editor.
4.  Paste your **Integration Secret** into `NOTION_KEY`.
5.  Get your **Database IDs**:
    *   Open the database in browser or click "Copy link to view".
    *   The ID is the 32-character code between the `/` and the `?`.
    *   Example: `https://notion.so/myworkspace/a8b9c0d1e2f3...` -> ID is `a8b9c0d1e2f3...`
6.  Paste the IDs into `NOTION_DB_PROJECTS` and `NOTION_DB_UPDATES`.

## Phase 5: Run the Sync
1.  Open your terminal (PowerShell) in `c:\Users\ElsaDonnat\website`.
2.  Run: `cd cms`
3.  Run: `./sync.ps1`

🎉 If successful, your `data.js` will be updated with the content from Notion!

> **Note**: If you get a "script is not signed" error, run this command first:
> `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`
