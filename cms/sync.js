require('dotenv').config();
const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

// Initialize Notion Client
const notion = new Client({ auth: process.env.NOTION_KEY });

const DATABASE_ID_PROJECTS = process.env.NOTION_DB_PROJECTS;
const DATABASE_ID_UPDATES = process.env.NOTION_DB_UPDATES;
// For Bio, we'll just use the existing static bio for now to keep it simple, 
// or we could add a Page ID later. Let's focus on the dynamic lists first.

async function getProjects() {
    const response = await notion.databases.query({
        database_id: DATABASE_ID_PROJECTS,
        filter: {
            property: 'Status',
            select: {
                is_not_empty: true
            }
        },
    });

    return response.results.map(page => {
        const props = page.properties;

        // Helper to safely get text
        const getText = (prop) => prop.rich_text && prop.rich_text.length > 0 ? prop.rich_text[0].plain_text : "";
        const getTitle = (prop) => prop.title && prop.title.length > 0 ? prop.title[0].plain_text : "Untitled";
        const getSelect = (prop) => prop.select ? prop.select.name : "";
        const getMultiSelect = (prop) => prop.multi_select ? prop.multi_select.map(item => item.name) : [];
        const getUrl = (prop) => prop.url || "#";

        // Helper for Documents (Files)
        const getDocs = (prop) => {
            if (!prop.files || prop.files.length === 0) return [];
            return prop.files.map(f => ({
                title: f.name,
                type: f.name.endsWith('.pdf') ? 'pdf' : 'doc',
                link: f.file ? f.file.url : f.external.url
            }));
        };

        return {
            title: getTitle(props.Name),
            status: getSelect(props.Status).toLowerCase(),
            description: getText(props.Description),
            tags: getMultiSelect(props.Tags),
            link: getUrl(props.Link),
            documents: getDocs(props.Documents)
        };
    });
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

    return response.results.map(page => {
        const props = page.properties;

        const getText = (prop) => prop.rich_text && prop.rich_text.length > 0 ? prop.rich_text[0].plain_text : "";
        const getTitle = (prop) => prop.title && prop.title.length > 0 ? prop.title[0].plain_text : "Untitled";
        const getSelect = (prop) => prop.select ? prop.select.name : "news";
        const getDate = (prop) => prop.date ? prop.date.start : "";

        // Helper for Image
        const getImage = (prop) => {
            if (!prop.files || prop.files.length === 0) return null;
            const f = prop.files[0];
            return f.file ? f.file.url : f.external.url;
        };

        return {
            date: getDate(props.Date),
            title: getTitle(props.Name),
            type: getSelect(props.Type).toLowerCase(),
            content: getText(props.Content),
            image: getImage(props.Image)
        };
    });
}

async function main() {
    console.log("🔄 Syncing data from Notion...");

    try {
        const projects = await getProjects();
        console.log(`✅ Found ${projects.length} projects.`);

        const updates = await getUpdates();
        console.log(`✅ Found ${updates.length} updates.`);

        // Read the existing data.js to preserve static info (Bio, Links)
        // Actually, parsing JS file is hard. 
        // Strategy: We will output a NEW data.js but we need the static parts.
        // For V1, let's hardcode the static parts in this script or read from a 'static_data.json'.
        // To make it easy for the user, let's just keep the static parts here in the script for now.

        const staticData = {
            name: "Elsa Donnat",
            role: "AI Policy Researcher | Governance & Legal Frameworks",
            email: "elsa.donnat@gmail.com",
            links: {
                cv: "assets/CV_Elsa_Donnat.pdf",
                linkedin: "https://www.linkedin.com/in/elsa-donnat",
                github: "https://github.com/ElsaDonnat",
                substack: "#",
                feedback: "https://forms.gle/rD9csMiBr1dVE1RG9"
            },
            bio: {
                image: "profile.jpg",
                short: "I am an AI Policy Researcher at the Ada Lovelace Institute, bridging the gap between legal frameworks (Swiss, UK, EU) and the governance of autonomous AI agents. My work focuses on designing proactive architectures that ensure AI systems remain safe, legible, and aligned with human economic and legal structures.",
                long: `
            <p>I am a legal scholar and researcher specializing in the governance of artificial intelligence. With a background in Swiss, UK, and EU law, my work focuses on how legal frameworks must adapt to the challenges of agentic AI and autonomous systems.</p>
            <p>Currently, I am an <strong>AI Policy Researcher at the Ada Lovelace Institute</strong> in London, contributing to research on regulatory frameworks for frontier models. I am also a Mentor and Team Lead for the SPAR program, guiding research on AI agent behavior and mass manipulation.</p>
            <p>Previously, I was a Summer Fellow at the <strong>Center for the Governance of AI (GovAI)</strong> and taught at the Machine Learning for Good (ML4G) bootcamps. My goal is to design proactive governance architectures that ensure AI agents remain safe, legible, and aligned with human economic and legal systems.</p>
                `
            }
        };

        const fileContent = `/*
 * WEBSITE CONTENT CONFIGURATION
 * Synced from Notion: ${new Date().toISOString()}
 */

const data = {
    // --- BASIC INFO ---
    name: "${staticData.name}",
    role: "${staticData.role}",
    email: "${staticData.email}",

    // --- LINKS ---
    links: ${JSON.stringify(staticData.links, null, 4)},

    // --- BIO ---
    bio: {
        image: "${staticData.bio.image}",
        short: ${JSON.stringify(staticData.bio.short)},
        long: \`${staticData.bio.long}\`
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
    }
}

main();
