# Website Migration Guide

Follow these steps to move your website project to your personal laptop.

## 1. Transfer Files
1.  Copy the entire `website` folder from this computer to your personal laptop.
    *   You can use a USB drive, Google Drive, or any file transfer method.
    *   Ensure you copy **all** files, including the hidden `.env` file inside the `cms` folder.

## 2. Setup on New Laptop
1.  Open your terminal (Command Prompt, PowerShell, or VS Code terminal).
2.  Navigate to the `cms` folder inside your website project:
    ```bash
    cd path/to/website/cms
    ```
3.  Install the necessary dependencies (this requires Node.js):
    ```bash
    npm install
    ```

## 3. Run the Sync Script
Now that you are on a machine with Node.js, you can run the sync script to fetch the latest data from Notion (this will fix the broken images):
```bash
node sync.js
```
*   You should see a success message: `🎉 Successfully updated data.js!`

## 4. Verify the Website
1.  Go back to the main website folder:
    ```bash
    cd ..
    ```
2.  Open `index.html` in your browser to see your site with the latest content.

---

## Prompt for AI Agent
Once you have the project on your new laptop, you can paste this prompt to Antigravity (or your AI assistant) to get started immediately:

> "I have migrated this website project from another laptop. It uses a Notion CMS sync script located in `cms/sync.js`. I have Node.js installed. Please help me run the sync script to update `data.js` with the latest content from Notion (which should fix expired image links), and then verify the site is working correctly."
