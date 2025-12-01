/*
 * WEBSITE LOGIC
 * Handles rendering content from data.js and user interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
    renderCommonElements();

    // Page-specific rendering
    const path = window.location.pathname;
    if (path.includes('index.html') || path === '/' || path.endsWith('/website/')) {
        renderHomePage();
    } else if (path.includes('about.html')) {
        renderAboutPage();
    } else if (path.includes('projects.html')) {
        renderProjectsPage();
    } else if (path.includes('updates.html')) {
        renderUpdatesPage();
    }

    if (document.getElementById('contact-email')) {
        console.log("Contact page detected, rendering...");
        renderContactPage();
    }
});

// --- RENDERERS ---

function renderCommonElements() {
    // Update Footer Year
    const yearSpan = document.querySelector('#year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();
}

function renderHomePage() {
    // Hero Content
    document.getElementById('hero-name').textContent = data.name;
    document.getElementById('hero-role').textContent = data.role;
    document.getElementById('hero-bio').textContent = data.bio.short;

    const heroImg = document.getElementById('hero-image');
    if (heroImg && data.bio.image) {
        heroImg.src = data.bio.image;
        heroImg.onload = () => heroImg.style.display = 'inline-block';
        heroImg.onerror = () => heroImg.style.display = 'none';
    }

    // Links
    document.getElementById('link-cv').href = data.links.cv;
    document.getElementById('link-linkedin').href = data.links.linkedin;
    document.getElementById('link-github').href = data.links.github;
    document.getElementById('link-substack').href = data.links.substack;
    document.getElementById('link-feedback').href = data.links.feedback;

    // Render Highlights Section (Current Project + Recent Updates)
    renderHighlights();
}

function renderHighlights() {
    const currentProjectContainer = document.getElementById('current-project-card');
    const highlightsContainer = document.getElementById('highlights-list');

    if (!currentProjectContainer || !highlightsContainer) return;

    // 1. Render Selected Projects (Top 2 Ongoing)
    const selectedProjects = data.projects ? data.projects.filter(p => p.status === 'ongoing').slice(0, 2) : [];

    if (selectedProjects.length > 0) {
        currentProjectContainer.innerHTML = '';
        selectedProjects.forEach(project => {
            const projectDiv = document.createElement('div');
            projectDiv.className = 'project-card-mini';
            projectDiv.innerHTML = `
                <div class="meta" style="color: var(--accent-color); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.5rem;">${project.tags[0]}</div>
                <h3 style="font-size: 1.4rem; margin-bottom: 0.5rem;"><a href="projects.html" style="color: var(--text-color);">${project.title}</a></h3>
            `;
            currentProjectContainer.appendChild(projectDiv);
        });
    } else {
        currentProjectContainer.innerHTML = '<p>No selected projects.</p>';
    }

    // 2. Render Recent Updates (Highlights)
    const recentUpdates = data.updates ? data.updates.slice(0, 3) : [];

    if (recentUpdates.length > 0) {
        highlightsContainer.innerHTML = '';
        recentUpdates.forEach(item => {
            const article = document.createElement('article');
            article.className = 'highlight-item';
            article.style.marginBottom = '1.5rem';
            article.style.borderBottom = '1px solid var(--border-color)';
            article.style.paddingBottom = '1rem';

            // Check for new badge
            const isNewItem = isNew(item.date);
            const badgeHtml = isNewItem ? '<span class="new-badge" title="New Update"></span>' : '';

            article.innerHTML = `
                <div class="meta" style="font-size: 0.75rem; color: var(--text-light); margin-bottom: 0.3rem;">${item.date} • ${item.type}</div>
                <h4 style="font-size: 1.1rem; margin-bottom: 0.5rem;"><a href="updates.html">${item.title}</a> ${badgeHtml}</h4>
            `;
            highlightsContainer.appendChild(article);
        });
    } else {
        highlightsContainer.innerHTML = '<p>No recent updates.</p>';
    }
}

function renderAboutPage() {
    const bioContainer = document.getElementById('about-content');
    if (bioContainer) {
        bioContainer.innerHTML = data.bio.long;
    }
    const aboutImg = document.getElementById('about-image');
    if (aboutImg && data.bio.image) {
        aboutImg.src = data.bio.image;
        aboutImg.onload = () => aboutImg.style.display = 'block';
        aboutImg.onerror = () => aboutImg.style.display = 'none';
    }

    document.getElementById('link-cv-download').href = data.links.cv;
}

function renderProjectsPage() {
    const container = document.getElementById('projects-list');
    const filterBtns = document.querySelectorAll('.filter-btn');

    function displayProjects(filter) {
        container.innerHTML = '';
        const filtered = filter === 'all'
            ? data.projects
            : data.projects.filter(p => p.status === filter);

        filtered.forEach(p => {
            const card = document.createElement('div');
            card.className = 'project-card';

            const tagsHtml = p.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

            // Render Documents if available
            let docsHtml = '';
            if (p.documents && p.documents.length > 0) {
                docsHtml = `<div class="project-docs" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                    <strong style="font-size: 0.85rem; display: block; margin-bottom: 0.5rem;">Documents:</strong>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        ${p.documents.map(doc => `
                            <a href="${doc.link}" class="doc-link" target="_blank" style="font-size: 0.8rem; padding: 0.3rem 0.6rem; background: #f4f6f8; border-radius: 4px; color: var(--text-color); text-decoration: none; display: inline-flex; align-items: center; gap: 0.3rem;">
                                ${doc.type === 'pdf' ? '📄' : '📝'} ${doc.title}
                            </a>
                        `).join('')}
                    </div>
                </div>`;
            }

            card.innerHTML = `
                <div class="project-header">
                    <h3>${p.title}</h3>
                    <span class="status-badge ${p.status}">${p.status}</span>
                </div>
                <p>${p.description}</p>
                <div class="tags">${tagsHtml}</div>
                ${docsHtml}
                <a href="${p.link}" class="project-link" style="display: inline-block; margin-top: 1rem;">View Details &rarr;</a>
            `;
            container.appendChild(card);
        });
    }

    // Initial render
    displayProjects('all');

    // Filter Logic
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add to clicked
            btn.classList.add('active');
            // Filter
            displayProjects(btn.dataset.filter);
        });
    });
}

function renderUpdatesPage() {
    const container = document.getElementById('updates-list');

    data.updates.forEach(u => {
        const item = document.createElement('div');
        item.className = 'update-item';

        // Render Image if available
        let imageHtml = '';
        if (u.image) {
            imageHtml = `<img src="${u.image}" alt="${u.title}" style="width: 100%; max-width: 600px; height: auto; border-radius: 4px; margin-top: 1rem; border: 1px solid var(--border-color);">`;
        }

        item.innerHTML = `
            <div class="update-date">${u.date}</div>
            <div class="update-content">
                <span class="update-type">${u.type}</span>
                <h3>${u.title} ${isNew(u.date) ? '<span class="new-badge" title="New Update"></span>' : ''}</h3>
                <p>${u.content}</p>
                ${imageHtml}
            </div>
        `;
        container.appendChild(item);
    });
}

function renderContactPage() {
    console.log("Executing renderContactPage");
    console.log("Data object:", data);
    // Email
    const emailLink = document.getElementById('contact-email');
    if (emailLink) {
        emailLink.href = `mailto:${data.email}`;
        emailLink.textContent = data.email;
    }

    // Socials
    const linkedin = document.getElementById('contact-linkedin');
    if (linkedin) linkedin.href = data.links.linkedin;

    const github = document.getElementById('contact-github');
    if (github) {
        github.href = data.links.github;
    }

    const substack = document.getElementById('contact-substack');
    if (substack) {
        substack.href = data.links.substack;
    }
}

// --- UTILS ---

function copyEmail() {
    const email = data.email;
    navigator.clipboard.writeText(email).then(() => {
        showToast("Email copied to clipboard!");
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

function isNew(dateString) {
    if (!dateString) return false;
    const updateDate = new Date(dateString);
    const now = new Date();
    // Reset times to compare just dates if desired, or keep precise.
    // Let's keep it simple: difference in milliseconds
    const diffTime = now - updateDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 3;
}
