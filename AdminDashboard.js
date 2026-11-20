 
const reportTable = document.getElementById("reportTable");
const emptyMessage = document.getElementById("emptyMessage");

// Load reports from browser storage
function loadReports() {

    const reports = JSON.parse(
        localStorage.getItem("streetSignalReports") || "[]"
    );

    // Update statistics
    document.getElementById("totalReports").textContent =
        reports.length;

    document.getElementById("pendingReports").textContent =
        reports.filter(r => r.status === "Pending").length;

    document.getElementById("progressReports").textContent =
        reports.filter(r => r.status === "In Progress").length;

    document.getElementById("resolvedReports").textContent =
        reports.filter(r => r.status === "Resolved").length;

    reportTable.innerHTML = "";

    if (reports.length === 0) {
        emptyMessage.style.display = "block";
        return;
    }

    emptyMessage.style.display = "none";

    reports.forEach((report, index) => {

        const row = document.createElement("tr");

        const status = report.status || "Pending";

        row.innerHTML = `
            <td>${escapeHTML(report.id || "N/A")}</td>
            <td>${escapeHTML(report.title || "Untitled")}</td>
            <td>${escapeHTML(report.category || "N/A")}</td>
            <td>${escapeHTML(report.location || "N/A")}</td>
            <td>${escapeHTML(report.date || "N/A")}</td>

            <td>
                <span class="status ${status.replace(" ", "-")}">
                    ${escapeHTML(status)}
                </span>
            </td>

            <td>
                <select class="status-select"
                    data-index="${index}"
                    aria-label="Update report status">

                    <option value="Pending"
                        ${status === "Pending" ? "selected" : ""}>
                        Pending
                    </option>

                    <option value="In Progress"
                        ${status === "In Progress" ? "selected" : ""}>
                        In Progress
                    </option>

                    <option value="Resolved"
                        ${status === "Resolved" ? "selected" : ""}>
                        Resolved
                    </option>

                </select>
            </td>
        `;

        reportTable.appendChild(row);
    });
}

// Prevent report text from being interpreted as HTML
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Update report status
reportTable.addEventListener("change", function(event) {

    if (!event.target.classList.contains("status-select")) {
        return;
    }

    const index = Number(event.target.dataset.index);

    const reports = JSON.parse(
        localStorage.getItem("streetSignalReports") || "[]"
    );

    if (!reports[index]) return;

    reports[index].status = event.target.value;

    localStorage.setItem(
        "streetSignalReports",
        JSON.stringify(reports)
    );

    loadReports();

    alert("Report status updated successfully!");
});

// Automatically load reports
loadReports();
