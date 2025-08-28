console.log("Main Page ----------->", window.location.pathname, "at", new Date().toLocaleTimeString());
console.log("common.js loaded");

// ----------------- Cookie & CSRF -----------------
window.getCookie = function (name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
};

window.getCSRFToken = function () {
  return window.getCookie('csrftoken');
};

// ----------------- Alerts -----------------
window.showAlert = function (message, type = "success", floating = false) {
  const currentForm = document.querySelector("form#loginForm, form#registerForm, form#addArticleForm");
  const messageBox = (!floating && currentForm) ? currentForm.querySelector(".form-messages") : null;
  const alert = document.createElement("div");
  alert.className = `custom-alert alert-${type}`;
  alert.innerText = message;

  if (messageBox) {
    messageBox.innerHTML = "";
    messageBox.appendChild(alert);
    setTimeout(() => alert.remove(), 3500);
  } else {
    alert.style.position = "fixed";
    alert.style.top = "20px";
    alert.style.right = "20px";
    alert.style.zIndex = "9999";
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3500);
  }
};

// ----------------- SPA Page Loader -----------------
window.loadPage = async function (url, pageInitializers = {}) {
  try {
    const res = await fetch(url + "?format=html", {
      headers: { "X-Requested-With": "XMLHttpRequest" }
    });
    const html = await res.text();

    const parser = new DOMParser();
    const newDoc = parser.parseFromString(html, "text/html");

    const mainContent = document.getElementById("main-content");
    if (!mainContent) return;
    mainContent.innerHTML = newDoc.getElementById("main-content")?.innerHTML || "";

    const newNavbar = newDoc.getElementById("navbar");
    const currentNavbar = document.getElementById("navbar");
    if (newNavbar && currentNavbar) currentNavbar.innerHTML = newNavbar.innerHTML;

    const newBodyPage = newDoc.body.dataset.page || "";
    document.body.dataset.page = newBodyPage;

    if (pageInitializers[newBodyPage]) pageInitializers[newBodyPage]();

    window.history.pushState({}, "", url);
    window.scrollTo({ top: 0, behavior: "smooth" });

  } catch (err) {
    console.error("Error loading page:", err);
  }
};

// ----------------- Handle Browser Back/Forward -----------------
window.onpopstate = () => window.loadPage(window.location.pathname);

// ----------------- Search Results -----------------
window.loadSearchResults = function () {
  const query = new URLSearchParams(window.location.search).get('q');
  if (!query) return;

  fetch(`/api/articles/?search=${query}`)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('articles-container');
      if (!container) return;
      container.innerHTML = '';
      data.forEach(article => {
        const div = document.createElement('div');
        div.className = 'article';
        div.innerHTML = `<h2>${article.title}</h2><p>${article.content}</p>`;
        container.appendChild(div);
      });
    })
    .catch(err => console.error("Search Results Error:", err));
};

document.body.addEventListener("click", async (e) => {
  const link = e.target.closest(".ajax-page");
  if (!link) return;

  // ---- DRAFT LINK ALERT ----
  if (link.id === "draftsLink" && link.dataset.hasDrafts !== "true") {
    e.preventDefault(); // stop SPA navigation
    alert("No drafts available");
    return;
  }

  // ---- ONLY INTERCEPT ARTICLE-LIST LINKS ----
  const url = link.href;
  const isArticlePage = url.includes("/article/") || url.includes("/draft_article/");

  if (isArticlePage) {
    e.preventDefault(); // only prevent default for article pages

    try {
      await window.loadPage(url, {
        article_list: () => {
          if (typeof window.initArticlePage === "function") {
            window.initArticlePage();
          }
        },
      });
    } catch (err) {
      console.error("SPA Navigation Error:", err);
      // fallback: navigate normally if SPA fails
      window.location.href = url;
    }
  }
  // else: normal link navigation happens for Add/Edit Article buttons
});


