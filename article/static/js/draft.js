console.log("Draft JS loaded");

// ----------------- "My Drafts" link handler -----------------
function initDraftsLink() {
  // Delegate click event to body, capture phase ensures this runs first
  document.body.addEventListener(
    "click",
    (e) => {
      const draftsLink = e.target.closest("#draftsLink");
      if (!draftsLink) return;

      const hasDrafts = draftsLink.dataset.hasDrafts === "true";
      if (!hasDrafts) {
        e.preventDefault();           // stop normal navigation
        e.stopImmediatePropagation(); // stop SPA click handler
        alert("No drafts available"); // native alert
      }
    },
    true // capture phase
  );
}

// ----------------- Article page init (pagination, delete) -----------------
function initArticlePage() {
  const mainContent = document.getElementById("main-content");
  if (!mainContent) return;

  // Pagination links
  mainContent.querySelectorAll(".pagination a").forEach(link => {
    link.addEventListener("click", async (e) => {
      e.preventDefault();
      await window.loadPage(link.href, { article_list: initArticlePage });
    });
  });

  // Delete buttons
  mainContent.querySelectorAll("button[data-action='delete']").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const formData = new FormData();
      formData.append("action", "delete");

      try {
        const res = await fetch(btn.dataset.url || window.location.href, {
          method: "POST",
          body: formData,
          headers: {
            "X-CSRFToken": window.getCSRFToken(),
            "X-Requested-With": "XMLHttpRequest"
          }
        });
        const data = await res.json();
        if (data.success) {
          alert(data.message || "Deleted successfully!");
          if (data.redirect) await window.loadPage(data.redirect, { article_list: initArticlePage });
        }
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Failed to delete");
      }
    });
  });
}




// ----------------- DOM Load -----------------
document.addEventListener("DOMContentLoaded", () => {
  initDraftsLink();  // attach drafts link alert
  if (document.body.dataset.page === "article_list") initArticlePage();
});

// ----------------- Browser Back/Forward -----------------
window.onpopstate = () => {
  initDraftsLink();
  if (document.body.dataset.page === "article_list") initArticlePage();
};
