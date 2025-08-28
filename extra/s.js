
console.log("---------------> Script loaded for", window.location.pathname, "at", new Date().toLocaleTimeString());

// ----------------------- CSRF Token ---------------------
function getCookie(name) {
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
}
const csrfToken = getCookie('csrftoken');

// ----------------------- relpace ---------------------

function replaceMainContent(html, url) {
  const mainContent = document.getElementById("main-content");
  if (!mainContent) return;

  mainContent.style.opacity = "0";
  setTimeout(() => {
    mainContent.innerHTML = html;
    window.history.pushState({}, "", url);
    mainContent.style.opacity = "1";
    initPage(url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 100);
}


// ----------------------- Alert System ---------------------
function showAlert(message, type = "success", floating = false) {
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
}

// ----------------------- Load Page-Specific CSS ---------------------
function loadPageCSS(url) {
  const cleanUrl = url.split("?")[0].replace(/\/+$/, "").toLowerCase();
  let cssFile = null;

  if (cleanUrl.startsWith("/login")) cssFile = "/static/css/lo.css";
  else if (cleanUrl.startsWith("/register")) cssFile = "/static/css/re.css";
  else if (cleanUrl.startsWith("/add_article") || cleanUrl.startsWith("/article_form")) cssFile = "/static/css/add.css";
  else if (cleanUrl.startsWith("/draft_article")) cssFile = "/static/css/draft.css";
  else if (cleanUrl.startsWith("/article") || cleanUrl.startsWith("/tags") || cleanUrl === "") cssFile = "/static/css/ar.css";

  document.querySelectorAll("link[data-page-css]").forEach(el => el.remove());
  console.log("Loading CSS for", cleanUrl, "->", cssFile);
  if (!cssFile) return;

  const newLink = document.createElement("link");
  newLink.rel = "stylesheet";
  newLink.href = cssFile + "?v=" + Date.now();
  newLink.setAttribute("data-page-css", "true");
  document.head.appendChild(newLink);
  newLink.onload = () => console.log("CSS -> applied:", newLink.href);
}

// ----------------------- Replace Main Content ---------------------
function replaceMainContent(html, url) {
  const mainContent = document.getElementById("main-content");
  if (!mainContent) return;

  const parser = new DOMParser();
  const newDoc = parser.parseFromString(html, "text/html");

  const newNavbar = newDoc.getElementById("navbar");
  const currentNavbar = document.getElementById("navbar");
  if (newNavbar && currentNavbar) {
    currentNavbar.innerHTML = newNavbar.innerHTML;
  }

  const newContent = newDoc.getElementById("main-content");
  if (!newContent) return;

  mainContent.style.opacity = "0";
  loadPageCSS(url);

  setTimeout(() => {
    console.log("Replacing main-content with", url, "at", new Date().toLocaleTimeString());
    mainContent.innerHTML = newContent.innerHTML;

    window.history.pushState({}, "", url);
    mainContent.style.opacity = "1";
    initPage(url);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 100);
}

// ---------------------- Initialize Page --------------------
function initPage(url) {
  console.log("---> Initializing Page at", url, "->", new Date().toLocaleTimeString());

  // ---------------------- 1. AJAX Logout ----------------------
  document.querySelectorAll("a[href='/logout/']").forEach(link => {
    if (link.dataset.bound === "true") return;
    link.dataset.bound = "true";

    link.onclick = e => {
      e.preventDefault();
      console.log("----> AJAX Logout triggered");

      fetch("/logout/", {
        method: "GET",
        headers: { "X-Requested-With": "XMLHttpRequest" },
        cache: "no-store"
      })
      .then(res => res.json())
      .then(data => {
        showAlert(data.message || "Logged out!", "error", true);
        return fetch("/article/", {
          headers: { "X-Requested-With": "XMLHttpRequest" },
          cache: "no-store"
        });
      })
      .then(res => res.json())
      .then(data => {
        if (data.html) replaceMainContent(data.html, "/article/");
      })
      .catch(err => console.error("Logout Error:", err));
    };
  });

  // ---------------------- 2. SPA Navigation ----------------------
  document.querySelectorAll("a.ajax-page, a.tag-link").forEach(link => {
    link.onclick = e => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#")) return;
      e.preventDefault();

      const targetUrl = href.startsWith("/") ? href : window.location.pathname + href;
      console.log("----> SPA Navigating to", targetUrl);

      fetch(targetUrl, { headers: { "X-Requested-With": "XMLHttpRequest" } })
        .then(res => res.json())
        .then(data => {
          if (data.redirect) {
            console.log("Redirecting to", data.redirect);
            return fetch("/" + data.redirect + "/", { headers: { "X-Requested-With": "XMLHttpRequest" } })
              .then(r => r.json());
          }
          return data;
        })
        .then(data => {
          if (!data) return;
          if (data.message) showAlert(data.message, data.success ? "success" : "error", true);
          if (data.html) replaceMainContent(data.html, targetUrl);
        })
        .catch(err => console.error("SPA Navigation Error:", err));
    };
  });

  // ---------------------- 3. Drafts Link Check ----------------------
  const draftsLink = document.getElementById("draftsLink");
  if (draftsLink) {
    draftsLink.onclick = e => {
      const hasDrafts = draftsLink.dataset.hasDrafts === "true";
      if (!hasDrafts) {
        e.preventDefault();
        showAlert("You have no drafts yet!", "warning", true);
        return;
      }
    };
  }

  // ---------------------- 4. Register Form AJAX ----------------------
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.onsubmit = e => {
      e.preventDefault();
      const formData = new FormData(registerForm);

      fetch(registerForm.action, {
        method: "POST",
        body: formData,
        headers: { "X-Requested-With": "XMLHttpRequest", "X-CSRFToken": csrfToken }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            showAlert(data.message || "Registration successful!", "success", true);
            fetch("/login/", { headers: { "X-Requested-With": "XMLHttpRequest" } })
              .then(r => r.json())
              .then(data => {
                if (data.html) replaceMainContent(data.html, "/login/");
              });
          } else {
            showAlert(data.message || "Registration failed", "error");
          }
        })
        .catch(err => console.error("Register AJAX Error:", err));
    };
  }

  // ---------------------- 5. Login Form AJAX ----------------------
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.onsubmit = e => {
      e.preventDefault();
      const formData = new FormData(loginForm);

      fetch(loginForm.action, {
        method: "POST",
        body: formData,
        headers: { "X-Requested-With": "XMLHttpRequest", "X-CSRFToken": csrfToken }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            showAlert(data.message || "Login successful!", "success", true);
            fetch("/article/", { headers: { "X-Requested-With": "XMLHttpRequest" } })
              .then(r => r.json())
              .then(data => {
                if (data.html) replaceMainContent(data.html, "/article/");
              });
          } else {
            showAlert(data.message || "Login failed", "error");
          }
        })
        .catch(err => console.error("Login AJAX Error:", err));
    };
  }

  // ---------------------- 6. Delete Article (AJAX) ----------------------
  document.querySelectorAll(".delete-article-btn").forEach(btn => {
    btn.onclick = e => {
      e.preventDefault();
      const deleteUrl = btn.dataset.url;
      if (!confirm("Are you sure you want to delete this article?")) return;

      fetch(deleteUrl, {
        method: "POST",
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRFToken": csrfToken
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showAlert(data.message || "Article deleted!", "success", true);
          fetch("/article/", { headers: { "X-Requested-With": "XMLHttpRequest" } })
            .then(res => res.json())
            .then(data => {
              if (data.html) replaceMainContent(data.html, "/article/");
            });
        } else {
          showAlert(data.message || "Delete failed", "error");
        }
      })
      .catch(err => console.error("Delete Error:", err));
    };
  });

  // ---------------------- 7. Add/Edit Article Form ----------------------
  const articleForm = document.getElementById("addArticleForm");
  if (articleForm) {
    articleForm.querySelectorAll("button").forEach(btn => {
      btn.onclick = e => {
        e.preventDefault();
        const action = btn.dataset.action || "cancel";

        if (action === "cancel") {
          const redirectUrl = btn.dataset.redirect;
          fetch(redirectUrl, { headers: { "X-Requested-With": "XMLHttpRequest" } })
            .then(r => r.json())
            .then(data => {
              if (data.html) replaceMainContent(data.html, redirectUrl);
            });
          return;
        }

        const formData = new FormData(articleForm);
        formData.append("action", action);

        fetch(articleForm.action, {
          method: "POST",
          body: formData,
          headers: { "X-Requested-With": "XMLHttpRequest", "X-CSRFToken": csrfToken }
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              showAlert(data.message, "success", true);
              const redirectUrl = data.redirect === "draft_article" ? "/draft_article/" : "/article/";
              fetch(redirectUrl, { headers: { "X-Requested-With": "XMLHttpRequest" } })
                .then(r => r.json())
                .then(data => {
                  if (data.html) replaceMainContent(data.html, redirectUrl);
                });
            } else {
              showAlert(data.message || "Error occurred", "error");
            }
          })
          .catch(err => console.error("Article Form Error:", err));
      };
    });
  }
}

// ---------------------- Initialize First Page --------------------
loadPageCSS(window.location.pathname);  
initPage(window.location.pathname);

//  SPA Back/Forward support
window.onpopstate = () => {
  fetch(window.location.pathname, { headers: { "X-Requested-With": "XMLHttpRequest" } })
    .then(r => r.json())
    .then(data => {
      if (data.html) replaceMainContent(data.html, window.location.pathname);
    });
};
