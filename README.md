# Elsa Donnat - Portfolio Website
This is a static portfolio website built with HTML, CSS, and Vanilla JavaScript.

## 🚀 How to Update Content
All the content for the website is stored in a single file: `data.js`. You do **not** need to edit the HTML files to change text, add projects, or post updates.

### 1. Open `data.js`
Open the `data.js` file in any text editor (Notepad, VS Code, etc.).

### 2. Adding a New Project
Find the `projects: [...]` section. Copy and paste the block below into the list:

```javascript
{
    title: "Project Title Here",
    status: "ongoing", // or "past"
    description: "Brief description of the project.",
    tags: ["Tag 1", "Tag 2"],
    link: "#", // Link to external site or PDF
    documents: [ // Optional: Add PDFs or Docs
        { title: "Project Proposal", type: "pdf", link: "assets/my-proposal.pdf" },
        { title: "Draft", type: "doc", link: "https://docs.google.com/..." }
    ]
},
```

### 3. Adding a New Update
Find the `updates: [...]` section. Copy and paste the block below to the **top** of the list:

```javascript
{
    date: "2025-11-28", // YYYY-MM-DD format
    title: "Title of the Update",
    type: "news", // or "talk", "publication"
    content: "The main text of your update goes here.",
    image: "assets/photo.jpg" // Optional: Path to an image
},
```

### 4. Updating Bio & Links
- **Bio**: Edit the `bio.short` (for homepage) or `bio.long` (for About page) fields.
- **Links**: Update the URLs in the `links: { ... }` section.

## 📂 Managing Files (PDFs & Images)
1.  Place your PDF files and images in the `assets/` folder.
2.  Reference them in `data.js` using the path `assets/filename.ext`.

### 💡 Using Google Drive for Images
If you want to use an image directly from Google Drive instead of the `assets` folder:
1.  Get the **Shareable Link** from Drive (e.g., `https://drive.google.com/file/d/FILE_ID/view...`).
2.  You **cannot** use this link directly because it opens the Google Drive website.
3.  You must convert it to a **Direct Link**.
    *   **Format**: `https://drive.google.com/uc?export=view&id=FILE_ID`
    *   **Tip**: Use a free tool like [Drive Link Converter](https://www.wonderplugin.com/online-tools/google-drive-direct-link-generator/) to get the correct link.

## ✨ Features
-   **"New" Badge**: Automatically appears on updates less than 3 days old.
-   **Auto-Year**: The footer year updates automatically.
-   **Responsive**: Works on mobile and desktop.
