// article.js
// SPA navigation for article links, pagination, and tags

function initArticlePage(url) {
  // SPA navigation for links
  document.querySelectorAll("a.ajax-page, a.tag-link").forEach(link => {
    if (link.dataset.bound === "true") return;
    link.dataset.bound = "true";

    link.onclick = async e => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#")) return;

      e.preventDefault();
      const targetUrl = href.startsWith("/") ? href : window.location.pathname + href;

      try {
        const res = await fetch(targetUrl + (targetUrl.includes("?") ? "&format=html" : "?format=html"), {
          headers: { "X-Requested-With": "XMLHttpRequest" }
        });

        const contentType = res.headers.get("Content-Type") || "";

        // JSON alert
        if (contentType.includes("application/json")) {
          const data = await res.json();
          showAlert(data.message || "No content", data.alert_type || "info", true);
          return;
        }

        // Login redirect
        if (res.status === 401 || res.url.includes("/login")) {
          const html = await fetch("/login/?format=html", {
            headers: { "X-Requested-With": "XMLHttpRequest" }
          }).then(r => r.text());
          replaceMainContent(html, "/login/");
          return;
        }

        const html = await res.text();
        if (html) replaceMainContent(html, targetUrl);

      } catch (err) {
        console.error("SPA Navigation Error:", err);
      }
    };
  });

  // Any other page-specific JS for articles can go here
}

document.getElementById('search-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const query = this.search.value;
    const url = `/article/?search=${encodeURIComponent(query)}&format=html`;

    fetch(url, { headers: { "X-Requested-With": "XMLHttpRequest" } })
        .then(res => res.text())
        .then(html => {
            replaceMainContent(html, `/article/?search=${encodeURIComponent(query)}`);
        })
        .catch(err => console.error("Search Error:", err));
});

// Handle browser back/forward buttons
window.onpopstate = () => {
  fetch(window.location.pathname + "?format=html", { headers: { "X-Requested-With": "XMLHttpRequest" } })
    .then(r => r.text())
    .then(html => replaceMainContent(html, window.location.pathname))
    .catch(err => console.error("SPA Popstate Error:", err));
};
