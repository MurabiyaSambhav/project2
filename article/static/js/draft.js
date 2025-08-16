// drafts.js
function initDraftsPage() {
  // Drafts link SPA navigation
  const draftsLink = document.getElementById("draftsLink");
  if (draftsLink) {
    draftsLink.onclick = e => {
      const hasDrafts = draftsLink.dataset.hasDrafts === "true";
      if (!hasDrafts) {
        e.preventDefault();
        showAlert("You have no drafts yet!", "warning", true);
        return;
      }
      e.preventDefault();
      const targetUrl = draftsLink.getAttribute("href");
      fetch(targetUrl + "?format=html", { headers: { "X-Requested-With": "XMLHttpRequest" } })
        .then(r => r.text())
        .then(html => replaceMainContent(html, targetUrl))
        .catch(err => console.error("Drafts SPA Error:", err));
    };
  }

  // Delete article buttons in drafts
  document.querySelectorAll(".delete-article-btn").forEach(btn => {
    btn.onclick = e => {
      e.preventDefault();
      const deleteUrl = btn.dataset.url;
      fetch(deleteUrl, { method: "POST", headers: { "X-Requested-With": "XMLHttpRequest", "X-CSRFToken": csrfToken } })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            showAlert(data.message || "Article deleted!", "error", true);
            fetch("/article/?format=html", { headers: { "X-Requested-With": "XMLHttpRequest" } })
              .then(res => res.text())
              .then(html => replaceMainContent(html, "/article/"));
          } else {
            showAlert(data.message || "Delete failed", "error");
          }
        })
        .catch(err => console.error("Delete Draft Error:", err));
    };
  });
}


