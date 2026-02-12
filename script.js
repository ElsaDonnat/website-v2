/*
 * WEBSITE LOGIC
 * Handles rendering content from data.js and user interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
    try {
        renderCommonElements();

        // Page-specific rendering
        // Support both clean URLs (/about) and regular URLs (/about.html)
        const path = window.location.pathname;

        if (path.match(/\/about(\.html)?$/)) {
            renderAboutPage();
        } else if (path.match(/\/project(\.html)?$/) && !path.match(/\/projects(\.html)?$/)) {
            // Single project detail page
            renderProjectDetailPage();
        } else if (path.match(/\/projects(\.html)?$/)) {
            renderProjectsPage();
        } else if (path.match(/\/update(\.html)?$/) && !path.match(/\/updates(\.html)?$/)) {
            // Single update detail page
            renderUpdateDetailPage();
        } else if (path.match(/\/updates(\.html)?$/)) {
            renderUpdatesPage();
        } else if (path.match(/\/contact(\.html)?$/)) {
            renderContactPage();
        } else {
            // Default to Home Page (handles /, /index.html, /website-v2/, etc.)
            renderHomePage();
        }
    } catch (error) {
        console.error("Script Error:", error);
        alert("Website Error: " + error.message);
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
    const linkCv = document.getElementById('link-cv');
    if (linkCv) linkCv.href = data.links.cv;
    document.getElementById('link-linkedin').href = data.links.linkedin;
    const linkGithub = document.getElementById('link-github');
    if (linkGithub) linkGithub.href = data.links.github;
    document.getElementById('link-substack').href = data.links.substack;
    document.getElementById('link-feedback').href = data.links.feedback;

    // Render Highlights Section (Current Project + Recent Updates)
    renderHighlights();
}

function renderHighlights() {
    const currentProjectContainer = document.getElementById('current-project-card');
    const highlightsContainer = document.getElementById('highlights-list');

    if (!currentProjectContainer || !highlightsContainer) return;

    // 1. Render Selected Projects (Top 3 Pinned, fallback to Ongoing)
    let selectedProjects = data.projects ? data.projects.filter(p => p.pinned).slice(0, 3) : [];
    if (selectedProjects.length === 0) {
        selectedProjects = data.projects ? data.projects.filter(p => p.status === 'ongoing').slice(0, 3) : [];
    }

    if (selectedProjects.length > 0) {
        currentProjectContainer.innerHTML = '';
        selectedProjects.forEach(project => {
            const projectDiv = document.createElement('div');
            projectDiv.className = 'project-card-mini';
            const tagDisplay = project.tags && project.tags.length > 0 ? project.tags[0] : '';
            projectDiv.innerHTML = `
                <div class="meta" style="color: var(--accent-color); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.3rem;">${tagDisplay}</div>
                <h3 style="font-size: 1.1rem; margin-bottom: 0.3rem;"><a href="project.html?id=${project.id}" style="color: var(--text-color);">${project.title}</a></h3>
            `;
            currentProjectContainer.appendChild(projectDiv);
        });
    } else {
        currentProjectContainer.innerHTML = '<p>No selected projects.</p>';
    }

    // 2. Render Recent Updates (5 most recent)
    const recentUpdates = data.updates ? data.updates.slice(0, 5) : [];

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
                <div class="meta" style="font-size: 0.75rem; color: var(--text-light); margin-bottom: 0.3rem;">${formatDate(item.date)} • ${item.type}</div>
                <h4 style="font-size: 1.1rem; margin-bottom: 0.5rem;">${isNewItem ? '<span class="home-new-dot"></span>' : ''}<a href="update.html?id=${item.id}">${item.title}</a></h4>
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
            card.style.cursor = 'pointer';

            const tagsHtml = p.tags ? p.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : '';

            // Use summary for card display, fallback to description
            const displayText = p.summary || p.description || '';

            // Format project date
            const dateHtml = p.date ? formatProjectDate(p.date) : '';

            card.innerHTML = `
                <h3>${p.title}</h3>
                <div class="project-meta">
                    <span class="status-badge ${p.status}">${statusLabel(p.status)}</span>
                    ${dateHtml ? `<span class="project-date">${dateHtml}</span>` : ''}
                </div>
                <p>${displayText}</p>
                <div class="tags">${tagsHtml}</div>
                <a href="project.html?id=${p.id}" class="project-link" style="display: inline-block; margin-top: 1rem;">View Details &rarr;</a>
            `;

            // Make the whole card clickable
            card.addEventListener('click', (e) => {
                if (e.target.tagName !== 'A') {
                    window.location.href = `project.html?id=${p.id}`;
                }
            });

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

function renderProjectDetailPage() {
    const container = document.getElementById('project-detail');
    if (!container) return;

    // Get ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    if (!projectId) {
        container.innerHTML = '<p class="error-message">No project specified. <a href="projects.html">View all projects</a></p>';
        return;
    }

    // Find the project
    const project = data.projects.find(p => p.id === projectId);

    if (!project) {
        container.innerHTML = '<p class="error-message">Project not found. <a href="projects.html">View all projects</a></p>';
        return;
    }

    // Update page title
    document.title = `${project.title} | Elsa Donnat`;

    // Build tags HTML
    const tagsHtml = project.tags ? project.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : '';

    // Format project date
    const dateHtml = project.date ? formatProjectDate(project.date) : '';

    // Build documents HTML
    let docsHtml = '';
    if (project.documents && project.documents.length > 0) {
        docsHtml = `
            <div class="project-docs" style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
                <strong style="font-size: 0.9rem; display: block; margin-bottom: 0.75rem;">Documents:</strong>
                <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                    ${project.documents.map(doc => `
                        <a href="${doc.link}" class="doc-link" target="_blank" style="font-size: 0.85rem; padding: 0.5rem 1rem; background: #f4f6f8; border-radius: 4px; color: var(--text-color); text-decoration: none; display: inline-flex; align-items: center; gap: 0.4rem;">
                            ${doc.type === 'pdf' ? '📄' : '📝'} ${doc.title}
                        </a>
                    `).join('')}
                </div>
            </div>`;
    }

    // Determine content to display
    const contentHtml = project.fullContent || `<p>No detailed description available.</p>`;

    container.innerHTML = `
        <div class="detail-header">
            <h1>${project.title}</h1>
            <div class="project-meta">
                <span class="status-badge ${project.status}">${statusLabel(project.status)}</span>
                ${dateHtml ? `<span class="project-date">${dateHtml}</span>` : ''}
            </div>
        </div>
        <div class="tags" style="margin-bottom: 1.5rem;">${tagsHtml}</div>
        <div class="rich-content">
            ${contentHtml}
        </div>
        ${docsHtml}
        ${project.link && project.link !== '#' ? `<a href="${project.link}" class="btn btn-outline" target="_blank" style="margin-top: 2rem; margin-left: 0; display: inline-block;">Visit Project Link &rarr;</a>` : ''}
    `;
}

function renderUpdatesPage() {
    const container = document.getElementById('updates-list');

    data.updates.forEach(u => {
        const item = document.createElement('div');
        item.className = 'update-item';
        item.style.cursor = 'pointer';

        // Use summary for list display, fallback to content
        const displayText = u.summary || u.content || '';

        // Image HTML (right-aligned) - uses listImage with fallback
        let imageHtml = '';
        if (u.listImage) {
            imageHtml = `
                <div class="update-thumbnail">
                    <img src="${u.listImage}" alt="${u.title}">
                </div>
            `;
        }

        item.innerHTML = `
            <div class="update-date">${formatDate(u.date)}</div>
            <div class="update-content-wrapper">
                <div class="update-text">
                    <span class="update-type">${u.type}</span>
                    <h3><a href="update.html?id=${u.id}">${u.title}</a> ${isNew(u.date) ? '<span class="new-badge" title="New Update"></span>' : ''}</h3>
                    <p>${displayText}</p>
                    <a href="update.html?id=${u.id}" class="read-more-link">Read more &rarr;</a>
                </div>
                ${imageHtml}
            </div>
        `;

        // Make the whole item clickable
        item.addEventListener('click', (e) => {
            if (e.target.tagName !== 'A') {
                window.location.href = `update.html?id=${u.id}`;
            }
        });

        container.appendChild(item);
    });
}

function renderUpdateDetailPage() {
    const container = document.getElementById('update-detail');
    if (!container) return;

    // Get ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const updateId = urlParams.get('id');

    if (!updateId) {
        container.innerHTML = '<p class="error-message">No update specified. <a href="updates.html">View all updates</a></p>';
        return;
    }

    // Find the update
    const update = data.updates.find(u => u.id === updateId);

    if (!update) {
        container.innerHTML = '<p class="error-message">Update not found. <a href="updates.html">View all updates</a></p>';
        return;
    }

    // Update page title
    document.title = `${update.title} | Elsa Donnat`;

    // Build Banner HTML (full-width at top)
    let bannerHtml = '';
    if (update.banner) {
        bannerHtml = `<div class="update-banner"><img src="${update.banner}" alt="${update.title}"></div>`;
    }

    // Build Cover HTML (for newspaper-style wrap)
    let coverHtml = '';
    if (update.cover) {
        coverHtml = `<img src="${update.cover}" alt="${update.title}" class="cover-wrap">`;
    }

    // Build Gallery HTML (grid at bottom)
    let galleryHtml = '';
    if (update.gallery && update.gallery.length > 0) {
        const galleryItems = update.gallery.map(img => `<img src="${img}" alt="Gallery image">`).join('');
        galleryHtml = `<div class="update-gallery">${galleryItems}</div>`;
    }

    // Determine content to display
    const contentHtml = update.fullContent || `<p>${update.content || 'No detailed content available.'}</p>`;

    container.innerHTML = `
        ${bannerHtml}
        <div class="detail-header">
            <div class="update-meta">
                <span class="update-date">${formatDate(update.date)}</span>
                <span class="update-type">${update.type}</span>
            </div>
            <h1>${update.title}</h1>
        </div>
        <div class="rich-content content-with-wrap">
            ${coverHtml}
            ${contentHtml}
        </div>
        ${update.link && update.link !== '#' ? `<a href="${update.link}" class="btn btn-outline" target="_blank" style="margin-top: 2rem; margin-left: 0; display: inline-block;">Visit Link &rarr;</a>` : ''}
        ${galleryHtml}
    `;

    // Initialize lightbox for gallery images
    initLightbox();
}

function initLightbox() {
    const gallery = document.querySelector('.update-gallery');
    if (!gallery) return;

    const images = gallery.querySelectorAll('img');

    // Create lightbox element if it doesn't exist
    let lightbox = document.getElementById('lightbox');
    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.id = 'lightbox';
        lightbox.innerHTML = `
            <div class="lightbox-content">
                <img id="lightbox-img" src="" alt="Enlarged image">
                <button class="lightbox-close" aria-label="Close lightbox">&times;</button>
            </div>
        `;
        document.body.appendChild(lightbox);

        // Close on click outside or close button
        lightbox.addEventListener('click', (e) => {
            if (e.target.id === 'lightbox' || e.target.classList.contains('lightbox-close')) {
                lightbox.classList.remove('active');
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('active')) {
                lightbox.classList.remove('active');
            }
        });
    }

    const lightboxImg = document.getElementById('lightbox-img');

    images.forEach(img => {
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => {
            lightboxImg.src = img.src;
            lightbox.classList.add('active');
        });
    });
}

function renderContactPage() {
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

// Format a project date object { start, end } as "Month Year" or "Month Year – Month Year"
function formatProjectDate(dateObj) {
    if (!dateObj || !dateObj.start) return '';

    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    function toMonthYear(dateStr) {
        const d = new Date(dateStr + 'T00:00:00');
        return `${months[d.getMonth()]} ${d.getFullYear()}`;
    }

    const startFormatted = toMonthYear(dateObj.start);

    if (dateObj.end) {
        const endFormatted = toMonthYear(dateObj.end);
        // Only show range if different
        if (endFormatted !== startFormatted) {
            return `${startFormatted} – ${endFormatted}`;
        }
    }

    return startFormatted;
}

// Map status value to display label
function statusLabel(status) {
    const labels = { 'ideas': 'IDEA' };
    return labels[status] || status;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
}

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
    const diffTime = now - updateDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
}
