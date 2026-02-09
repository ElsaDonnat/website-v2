const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Client } = require('@notionhq/client');
const fs = require('fs');

// Initialize Notion Client
const notion = new Client({ auth: process.env.NOTION_KEY });

const DATABASE_ID_PROJECTS = process.env.NOTION_DB_PROJECTS;
const DATABASE_ID_UPDATES = process.env.NOTION_DB_UPDATES;

// --- HELPERS ---

// Helper to safely get text from rich_text property
const getText = (prop) => prop && prop.rich_text && prop.rich_text.length > 0 ? prop.rich_text[0].plain_text : "";
const getTitle = (prop) => prop && prop.title && prop.title.length > 0 ? prop.title[0].plain_text : "Untitled";
const getSelect = (prop) => prop && prop.select ? prop.select.name : "";
const getMultiSelect = (prop) => prop && prop.multi_select ? prop.multi_select.map(item => item.name) : [];
const getUrl = (prop) => prop && prop.url ? prop.url : "#";
const getDate = (prop) => prop && prop.date ? prop.date.start : "";

// Helper for Files
const getFiles = (prop) => {
    if (!prop || !prop.files || prop.files.length === 0) return [];
    return prop.files.map(f => ({
        name: f.name,
        url: f.file ? f.file.url : (f.external ? f.external.url : null)
    })).filter(f => f.url);
};

// Helper to get first image from files property
const getImage = (prop) => {
    const files = getFiles(prop);
    return files.length > 0 ? files[0].url : null;
};

// Helper to get ALL images from files property (for gallery)
const getImages = (prop) => {
    const files = getFiles(prop);
    return files.map(f => f.url);
};

// Helper for Documents (PDFs)
const getDocs = (prop) => {
    const files = getFiles(prop);
    return files.map(f => ({
        title: f.name,
        type: f.name.endsWith('.pdf') ? 'pdf' : 'doc',
        link: f.url
    }));
};

// Convert Notion rich_text to HTML
function richTextToHtml(richTextArray) {
    if (!richTextArray || richTextArray.length === 0) return '';

    return richTextArray.map(rt => {
        let text = rt.plain_text;

        // Apply annotations
        if (rt.annotations.bold) text = `<strong>${text}</strong>`;
        if (rt.annotations.italic) text = `<em>${text}</em>`;
        if (rt.annotations.strikethrough) text = `<s>${text}</s>`;
        if (rt.annotations.underline) text = `<u>${text}</u>`;
        if (rt.annotations.code) text = `<code>${text}</code>`;

        // Handle links
        if (rt.href) {
            text = `<a href="${rt.href}" target="_blank">${text}</a>`;
        }

        return text;
    }).join('');
}

// Convert Notion blocks to HTML
function blocksToHtml(blocks) {
    if (!blocks || blocks.length === 0) return '';

    let html = '';
    let inList = false;
    let listType = '';

    for (const block of blocks) {
        // Close list if we're leaving a list context
        if (inList && !['bulleted_list_item', 'numbered_list_item'].includes(block.type)) {
            html += listType === 'bulleted' ? '</ul>' : '</ol>';
            inList = false;
        }

        switch (block.type) {
            case 'paragraph':
                const pText = richTextToHtml(block.paragraph.rich_text);
                if (pText) html += `<p>${pText}</p>`;
                break;

            case 'heading_1':
                html += `<h2>${richTextToHtml(block.heading_1.rich_text)}</h2>`;
                break;

            case 'heading_2':
                html += `<h3>${richTextToHtml(block.heading_2.rich_text)}</h3>`;
                break;

            case 'heading_3':
                html += `<h4>${richTextToHtml(block.heading_3.rich_text)}</h4>`;
                break;

            case 'bulleted_list_item':
                if (!inList || listType !== 'bulleted') {
                    if (inList) html += listType === 'bulleted' ? '</ul>' : '</ol>';
                    html += '<ul>';
                    inList = true;
                    listType = 'bulleted';
                }
                html += `<li>${richTextToHtml(block.bulleted_list_item.rich_text)}</li>`;
                break;

            case 'numbered_list_item':
                if (!inList || listType !== 'numbered') {
                    if (inList) html += listType === 'bulleted' ? '</ul>' : '</ol>';
                    html += '<ol>';
                    inList = true;
                    listType = 'numbered';
                }
                html += `<li>${richTextToHtml(block.numbered_list_item.rich_text)}</li>`;
                break;

            case 'quote':
                html += `<blockquote>${richTextToHtml(block.quote.rich_text)}</blockquote>`;
                break;

            case 'divider':
                html += '<hr>';
                break;

            case 'image':
                const imgUrl = block.image.file ? block.image.file.url : (block.image.external ? block.image.external.url : null);
                if (imgUrl) {
                    const caption = block.image.caption && block.image.caption.length > 0
                        ? richTextToHtml(block.image.caption)
                        : '';
                    html += `<figure><img src="${imgUrl}" alt="${caption}"><figcaption>${caption}</figcaption></figure>`;
                }
                break;

            default:
                // Skip unsupported block types
                break;
        }
    }

    // Close any open list
    if (inList) {
        html += listType === 'bulleted' ? '</ul>' : '</ol>';
    }

    return html;
}

// Fetch page content (blocks) and convert to HTML
async function getPageContent(pageId) {
    try {
        const response = await notion.blocks.children.list({
            block_id: pageId,
            page_size: 100,
        });
        return blocksToHtml(response.results);
    } catch (error) {
        console.error(`Error fetching content for page ${pageId}:`, error.message);
        return '';
    }
}

// --- MAIN FETCH FUNCTIONS ---

async function getProjects() {
    const response = await notion.databases.query({
        database_id: DATABASE_ID_PROJECTS,
    });

    const projects = [];

    for (const page of response.results) {
        const props = page.properties;

        // Fetch page content for full description
        const fullContent = await getPageContent(page.id);

        projects.push({
            id: page.id,
            title: getTitle(props.Name),
            status: getSelect(props.Status).toLowerCase() || 'ongoing',
            summary: getText(props.Summary) || getText(props.Description), // Use Summary if available, fallback to Description
            description: getText(props.Description), // Keep for backwards compatibility
            fullContent: fullContent, // Rich HTML from page body
            tags: getMultiSelect(props.Tags),
            link: getUrl(props.Link),
            documents: getDocs(props.Documents)
        });
    }

    return projects;
}

async function getUpdates() {
    const response = await notion.databases.query({
        database_id: DATABASE_ID_UPDATES,
        sorts: [
            {
                property: 'Date',
                direction: 'descending',
            },
        ],
    });

    const updates = [];

    for (const page of response.results) {
        const props = page.properties;

        // Fetch page content for full content
        const fullContent = await getPageContent(page.id);

        // Get image properties
        const cover = getImage(props.Cover);       // Single cover image
        const banner = getImage(props.Banner);     // Single banner image
        const gallery = getImages(props.Gallery);  // Array of gallery images

        // Fallback for list page thumbnail: Cover → first Gallery → Banner → null
        const listImage = cover || (gallery.length > 0 ? gallery[0] : null) || banner || null;

        updates.push({
            id: page.id,
            date: getDate(props.Date),
            title: getTitle(props.Name),
            type: getSelect(props.Type).toLowerCase() || 'news',
            summary: getText(props.Summary) || getText(props.Content),
            content: getText(props.Content),
            fullContent: fullContent,
            // Image properties
            listImage: listImage,   // The image to show on list page (right side)
            cover: cover,           // For wrap style on detail page
            banner: banner,         // Full-width at top of detail page
            gallery: gallery,       // Array of images for gallery grid
            // Backwards compatibility
            image: listImage
        });
    }

    return updates;
}

// --- SETTINGS DATABASE ---
// Fetches editable fields like CV link, social links, bio from a Notion Settings database

const DATABASE_ID_SETTINGS = process.env.NOTION_DB_SETTINGS;

async function getSettings() {
    if (!DATABASE_ID_SETTINGS) {
        console.log("ℹ️  NOTION_DB_SETTINGS not set, using fallback static values");
        return null;
    }

    try {
        const response = await notion.databases.query({
            database_id: DATABASE_ID_SETTINGS,
        });

        const settings = {};

        response.results.forEach(page => {
            const props = page.properties;

            // Get the Key (title field)
            const key = props.Key?.title?.[0]?.plain_text || '';

            // Get the Value (rich text field) - preserve formatting for bio fields
            const valueRichText = props.Value?.rich_text || [];
            const htmlValue = richTextToHtml(valueRichText);
            const plainValue = valueRichText.map(t => t.plain_text).join('');

            if (key) {
                settings[key] = {
                    html: htmlValue,
                    plain: plainValue
                };
            }
        });

        console.log(`✅ Loaded ${Object.keys(settings).length} settings from Notion`);
        return settings;

    } catch (error) {
        console.error("⚠️  Error fetching settings:", error.message);
        return null;
    }
}

// --- ABOUT ME PAGE ---
// Fetches long bio content from a separate Notion page with rich formatting

const PAGE_ID_ABOUT = process.env.NOTION_PAGE_ABOUT;

async function getAboutPageContent() {
    if (!PAGE_ID_ABOUT) {
        console.log("ℹ️  NOTION_PAGE_ABOUT not set, using fallback long bio");
        return null;
    }

    try {
        const response = await notion.blocks.children.list({
            block_id: PAGE_ID_ABOUT,
            page_size: 100,
        });

        const html = blocksToHtml(response.results);
        console.log(`✅ Loaded About page (${response.results.length} blocks)`);
        return html;

    } catch (error) {
        console.error("⚠️  Error fetching About page:", error.message);
        return null;
    }
}

async function main() {
    console.log("🔄 Syncing data from Notion...\n");

    try {
        // Fetch all data in parallel
        const [projects, updates, settings, aboutContent] = await Promise.all([
            getProjects(),
            getUpdates(),
            getSettings(),
            getAboutPageContent()
        ]);

        // Debug logging
        let debugLog = `✅ Found ${projects.length} projects:\n`;
        projects.forEach(p => debugLog += `   - ${p.title} (${p.status}) [${p.fullContent ? 'has content' : 'no content'}]\n`);
        debugLog += `✅ Found ${updates.length} updates:\n`;
        updates.forEach(u => debugLog += `   - ${u.title} (${u.date}) [${u.fullContent ? 'has content' : 'no content'}]\n`);
        debugLog += `✅ Settings: ${settings ? 'loaded from Notion' : 'using fallback'}\n`;
        debugLog += `✅ About page: ${aboutContent ? 'loaded from Notion' : 'using fallback'}\n`;

        fs.writeFileSync(path.join(__dirname, 'debug_log.txt'), debugLog);
        console.log(debugLog);

        // Fallback static data (used if Settings database not configured)
        const fallback = {
            name: "Elsa Donnat",
            role: "AI Policy Researcher | Governance & Legal Frameworks",
            email: "elsa.donnat@gmail.com",
            cv: "assets/CV_Elsa_Donnat.pdf",
            linkedin: "https://www.linkedin.com/in/elsa-donnat",
            github: "https://github.com/ElsaDonnat",
            substack: "#",
            feedback: "https://forms.gle/rD9csMiBr1dVE1RG9",
            shortBio: "I am an AI Policy Researcher at the Ada Lovelace Institute, bridging the gap between legal frameworks (Swiss, UK, EU) and the governance of autonomous AI agents. My work focuses on designing proactive architectures that ensure AI systems remain safe, legible, and aligned with human economic and legal structures.",
            longBio: `
            <p>I am a legal scholar and researcher specializing in the governance of artificial intelligence. With a background in Swiss, UK, and EU law, my work focuses on how legal frameworks must adapt to the challenges of agentic AI and autonomous systems.</p>
            <p>Currently, I am an <strong>AI Policy Researcher at the Ada Lovelace Institute</strong> in London, contributing to research on regulatory frameworks for frontier models. I am also a Mentor and Team Lead for the SPAR program, guiding research on AI agent behavior and mass manipulation.</p>
            <p>Previously, I was a Summer Fellow at the <strong>Center for the Governance of AI (GovAI)</strong> and taught at the Machine Learning for Good (ML4G) bootcamps. My goal is to design proactive governance architectures that ensure AI agents remain safe, legible, and aligned with human economic and legal systems.</p>
            `
        };

        // Helper to get setting value (plain text for links, HTML for bio)
        const get = (key, fallbackValue) => settings?.[key]?.plain || fallbackValue;
        const getHtml = (key, fallbackValue) => settings?.[key]?.html || fallbackValue;

        // Build the site data
        const siteData = {
            name: get('name', fallback.name),
            role: get('role', fallback.role),
            email: get('email', fallback.email),
            links: {
                cv: get('cv', fallback.cv),  // Can be a Google Drive URL!
                linkedin: get('linkedin', fallback.linkedin),
                github: get('github', fallback.github),
                substack: get('substack', fallback.substack),
                feedback: get('feedback', fallback.feedback)
            },
            bio: {
                image: "profile.jpg",  // Static - stored in repo
                short: getHtml('shortBio', fallback.shortBio),
                long: aboutContent || fallback.longBio  // Use About page if available!
            }
        };

        const fileContent = `/*
 * WEBSITE CONTENT CONFIGURATION
 * Synced from Notion: ${new Date().toISOString()}
 */

const data = {
    // --- BASIC INFO ---
    name: ${JSON.stringify(siteData.name)},
    role: ${JSON.stringify(siteData.role)},
    email: ${JSON.stringify(siteData.email)},

    // --- LINKS ---
    links: ${JSON.stringify(siteData.links, null, 4)},

    // --- BIO ---
    bio: {
        image: ${JSON.stringify(siteData.bio.image)},
        short: ${JSON.stringify(siteData.bio.short)},
        long: ${JSON.stringify(siteData.bio.long)}
    },

    // --- PROJECTS ---
    projects: ${JSON.stringify(projects, null, 4)},

    // --- UPDATES ---
    updates: ${JSON.stringify(updates, null, 4)}
};
`;

        fs.writeFileSync(path.join(__dirname, '../data.js'), fileContent);
        console.log("🎉 Successfully updated data.js!");

    } catch (error) {
        console.error("❌ Error syncing from Notion:", error);
        fs.writeFileSync(path.join(__dirname, 'error_log.txt'), JSON.stringify(error, null, 2));
    }
}

main();

