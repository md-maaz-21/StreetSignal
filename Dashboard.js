
document.addEventListener("DOMContentLoaded", function () {

    // STREET SIGNAL 

    const STORAGE = {
        reports: "streetSignalReports",
        suggestions: "streetSignalSuggestions",
        notifications: "streetSignalNotifications",
        email: "streetSignalEmail",
        visitors: "streetSignalVisitors"
    };

    const getData = (key) => {
        try {
            const data = JSON.parse(localStorage.getItem(key) || "[]");
            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    };

    const saveData = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    };

    const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);

    const currentEmail = localStorage.getItem(STORAGE.email) || "citizen@example.com";

    const userName = currentEmail.split("@")[0]
        .replace(/[._-]/g, " ")
        .replace(/\b\w/g, letter => letter.toUpperCase());

    const initial = userName.charAt(0).toUpperCase() || "U";

    // =====================================
    // USER INFORMATION
    // =====================================

    document.getElementById("top-name").textContent = userName;
    document.getElementById("top-avatar").textContent = initial;
    document.getElementById("profile-name").textContent = userName;
    document.getElementById("profile-email").textContent = currentEmail;
    document.getElementById("profile-avatar").textContent = initial;

    // =====================================
    // VISITOR COUNTER
    // =====================================

    if (!sessionStorage.getItem("streetSignalVisited")) {
        let visitors = Number(localStorage.getItem(STORAGE.visitors) || 0);
        visitors++;
        localStorage.setItem(STORAGE.visitors, visitors);
        sessionStorage.setItem("streetSignalVisited", "true");
    }

    function updateVisitorCount() {
        document.getElementById("visitor-count").textContent =
            Number(localStorage.getItem(STORAGE.visitors) || 0).toLocaleString("en-IN");
    }

    // =====================================
    // PAGE NAVIGATION
    // =====================================

    const pages = document.querySelectorAll(".page");
    const navItems = document.querySelectorAll(".nav-item");
    const pageHeading = document.getElementById("page-heading");
    const sidebar = document.getElementById("sidebar");

    const headings = {
        dashboard: "Dashboard",
        report: "Report an Issue",
        reports: "My Reports",
        suggestions: "Suggestions",
        notifications: "Notifications",
        profile: "My Profile"
    };

    function openPage(pageName) {
        const selectedPage = document.getElementById(pageName + "-page");

        if (!selectedPage) return;

        pages.forEach(page => page.classList.remove("active"));
        selectedPage.classList.add("active");

        navItems.forEach(item => {
            item.classList.toggle("active", item.dataset.page === pageName);
        });

        pageHeading.textContent = headings[pageName] || "Dashboard";

        sidebar.classList.remove("open");

        if (pageName === "dashboard") updateDashboard();
        if (pageName === "reports") renderReports();
        if (pageName === "suggestions") renderSuggestions();
        if (pageName === "notifications") renderNotifications();
        if (pageName === "profile") updateProfile();
    }

    document.querySelectorAll("[data-page]").forEach(button => {
        button.addEventListener("click", function () {
            openPage(this.dataset.page);
        });
    });

    document.getElementById("menu-toggle").addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });

    // =====================================
    // REPORT SUBMISSION
    // =====================================

    const reportForm = document.getElementById("report-form");
    const imageInput = document.getElementById("issue-image");
    const imagePreview = document.getElementById("image-preview");

    imageInput.addEventListener("change", function () {
        imagePreview.innerHTML = "";

        const file = this.files[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please choose a valid image.");
            this.value = "";
            return;
        }

        if (file.size > 1.5 * 1024 * 1024) {
            alert("Image size must be below 1.5 MB.");
            this.value = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = function () {
            const image = document.createElement("img");
            image.src = reader.result;
            image.alt = "Selected issue photograph";
            imagePreview.appendChild(image);
        };

        reader.readAsDataURL(file);
    });

    reportForm.addEventListener("reset", () => {
        imagePreview.innerHTML = "";
        document.getElementById("report-message").textContent = "";
    });

    reportForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const title = document.getElementById("issue-title").value.trim();
        const category = document.getElementById("issue-category").value;
        const location = document.getElementById("issue-location").value.trim();
        const description = document.getElementById("issue-description").value.trim();
        const file = imageInput.files[0];
        const message = document.getElementById("report-message");

        if (!title || !category || !location || !description) {
            message.textContent = "Please complete all required fields.";
            message.className = "form-message error";
            return;
        }

        function saveReport(imageData = "") {
            const reports = getData(STORAGE.reports);

            const report = {
                id: "SS" + Date.now().toString().slice(-8),
                title,
                category,
                location,
                description,
                image: imageData,
                status: "Pending",
                date: new Date().toLocaleDateString("en-IN"),
                timestamp: Date.now()
            };

            reports.unshift(report);
            saveData(STORAGE.reports, reports);

            addNotification(
                "Report Submitted",
                "Your report '" + title + "' was submitted successfully."
            );

            message.textContent = "Report submitted successfully! Your Report ID is " + report.id;
            message.className = "form-message success";

            reportForm.reset();

            updateDashboard();
            updateNotificationCount();

            setTimeout(() => {
                openPage("reports");
            }, 1500);
        }

        if (file) {
            if (!file.type.startsWith("image/") || file.size > 1.5 * 1024 * 1024) {
                message.textContent = "Please choose a valid image under 1.5 MB.";
                message.className = "form-message error";
                return;
            }

            const reader = new FileReader();

            reader.onload = () => saveReport(reader.result);

            reader.onerror = () => {
                message.textContent = "Unable to read the image.";
                message.className = "form-message error";
            };

            reader.readAsDataURL(file);
        } else {
            saveReport();
        }
    });

    // =====================================
    // MY REPORTS
    // =====================================

    function getStatusClass(status) {
        if (status === "Resolved") return "status-resolved";
        if (status === "In Progress") return "status-progress";
        return "status-pending";
    }

    function renderReports() {
        const reports = getData(STORAGE.reports);
        const container = document.getElementById("reports-container");

        const search = document.getElementById("report-search").value.toLowerCase();
        const filter = document.getElementById("status-filter").value;

        const filtered = reports.filter(report => {
            const matchesSearch = [
                report.id,
                report.title,
                report.category,
                report.location
            ].some(value => String(value || "").toLowerCase().includes(search));

            const matchesStatus = filter === "All" || report.status === filter;

            return matchesSearch && matchesStatus;
        });

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div>📋</div>
                    <h3>No Matching Reports</h3>
                    <p>Try changing your search or submit a new report.</p>
                    <button class="primary-btn" data-page="report">Report an Issue</button>
                </div>
            `;

            container.querySelector("[data-page='report']")?.addEventListener("click", () => openPage("report"));
            return;
        }

        container.innerHTML = filtered.map(report => `
            <article class="report-card">
                <div class="report-card-top">
                    <span class="report-id">${escapeHTML(report.id)}</span>
                    <span class="status ${getStatusClass(report.status)}">${escapeHTML(report.status)}</span>
                </div>

                <h3>${escapeHTML(report.title)}</h3>

                <p><strong>Category:</strong> ${escapeHTML(report.category)}</p>
                <p><strong>Location:</strong> ${escapeHTML(report.location)}</p>
                <p>${escapeHTML(report.description)}</p>

                ${report.image ? `<img class="report-photo" src="${report.image}" alt="Issue photograph">` : ""}

                <div class="report-meta">
                    <span>📅 ${escapeHTML(report.date)}</span>
                    <span>Report ID: ${escapeHTML(report.id)}</span>
                </div>
            </article>
        `).join("");
    }

    document.getElementById("report-search").addEventListener("input", renderReports);
    document.getElementById("status-filter").addEventListener("change", renderReports);

    // =====================================
    // SUGGESTIONS
    // =====================================

    const suggestionForm = document.getElementById("suggestion-form");

    suggestionForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const title = document.getElementById("suggestion-title").value.trim();
        const category = document.getElementById("suggestion-category").value;
        const description = document.getElementById("suggestion-description").value.trim();
        const message = document.getElementById("suggestion-message");

        if (!title || !category || !description) {
            message.textContent = "Please fill in all fields.";
            message.className = "form-message error";
            return;
        }

        const suggestions = getData(STORAGE.suggestions);

        suggestions.unshift({
            id: "SG" + Date.now().toString().slice(-8),
            title,
            category,
            description,
            date: new Date().toLocaleDateString("en-IN")
        });

        saveData(STORAGE.suggestions, suggestions);

        addNotification("Suggestion Submitted", "Thank you for sharing your idea: " + title);

        message.textContent = "Your suggestion has been submitted successfully!";
        message.className = "form-message success";

        suggestionForm.reset();

        renderSuggestions();
        updateProfile();
        updateNotificationCount();
    });

    function renderSuggestions() {
        const suggestions = getData(STORAGE.suggestions);
        const container = document.getElementById("suggestions-container");

        if (suggestions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div>💡</div>
                    <h3>No Suggestions Yet</h3>
                    <p>Your ideas will appear here after submission.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = suggestions.map(item => `
            <article class="suggestion-card">
                <h3>${escapeHTML(item.title)}</h3>
                <p><strong>Category:</strong> ${escapeHTML(item.category)}</p>
                <p>${escapeHTML(item.description)}</p>
                <small>Submitted on ${escapeHTML(item.date)}</small>
            </article>
        `).join("");
    }

    // =====================================
    // NOTIFICATIONS
    // =====================================

    function addNotification(title, description) {
        const notifications = getData(STORAGE.notifications);

        notifications.unshift({
            title,
            description,
            date: new Date().toLocaleString("en-IN")
        });

        saveData(STORAGE.notifications, notifications);
    }

    function renderNotifications() {
        const notifications = getData(STORAGE.notifications);
        const container = document.getElementById("notifications-container");

        if (notifications.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div>🔔</div>
                    <h3>No Notifications</h3>
                    <p>Updates about your activity will appear here.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = notifications.map(item => `
            <article class="notification-card">
                <div class="notification-icon">🔔</div>
                <div>
                    <h3>${escapeHTML(item.title)}</h3>
                    <p>${escapeHTML(item.description)}</p>
                    <small>${escapeHTML(item.date)}</small>
                </div>
            </article>
        `).join("");
    }

    function updateNotificationCount() {
        const notifications = getData(STORAGE.notifications);
        document.getElementById("notification-count").textContent = notifications.length;
    }

    // =====================================
    // DASHBOARD STATISTICS
    // =====================================

    function updateDashboard() {
        const reports = getData(STORAGE.reports);

        const pending = reports.filter(report => report.status === "Pending").length;
        const progress = reports.filter(report => report.status === "In Progress").length;
        const resolved = reports.filter(report => report.status === "Resolved").length;

        document.getElementById("total-reports").textContent = reports.length;
        document.getElementById("pending-reports").textContent = pending;
        document.getElementById("progress-reports").textContent = progress;
        document.getElementById("resolved-reports").textContent = resolved;

        const recent = document.getElementById("recent-reports");

        if (reports.length === 0) {
            recent.innerHTML = `
                <tr><td colspan="5" class="empty-cell">No reports submitted yet.</td></tr>
            `;
        } else {
            recent.innerHTML = reports.slice(0, 5).map(report => `
                <tr>
                    <td>${escapeHTML(report.id)}</td>
                    <td>${escapeHTML(report.title)}</td>
                    <td>${escapeHTML(report.category)}</td>
                    <td>${escapeHTML(report.date)}</td>
                    <td><span class="status ${getStatusClass(report.status)}">${escapeHTML(report.status)}</span></td>
                </tr>
            `).join("");
        }
    }

    // =====================================
    // PROFILE
    // =====================================

    function updateProfile() {
        document.getElementById("profile-report-count").textContent =
            getData(STORAGE.reports).length;

        document.getElementById("profile-suggestion-count").textContent =
            getData(STORAGE.suggestions).length;
    }

    // =====================================
    // LOGOUT
    // =====================================

    document.getElementById("logout-btn").addEventListener("click", function () {
        const confirmed = confirm("Are you sure you want to logout?");

        if (confirmed) {
            localStorage.removeItem(STORAGE.email);
            window.location.href = "StreetSignal.html";
        }
    });

    // =====================================
    // INITIALIZE
    // =====================================

    updateVisitorCount();
    updateDashboard();
    renderReports();
    renderSuggestions();
    renderNotifications();
    updateNotificationCount();
    updateProfile();

});