// console.log("Script loaded for", window.location.pathname, "at", new Date().toLocaleTimeString());

// function getCookie(name) {
//   let cookieValue = null;
//   if (document.cookie && document.cookie !== '') {
//     const cookies = document.cookie.split(';');
//     for (let cookie of cookies) {
//       cookie = cookie.trim();
//       if (cookie.startsWith(name + '=')) {
//         cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
//         break;
//       }
//     }
//   }
//   return cookieValue;
// }
// const csrfToken = getCookie('csrftoken');

// function showAlert(message, type = "success", floating = false) {
//   const currentForm = document.querySelector("form#loginForm, form#registerForm, form#addArticleForm");
//   const messageBox = (!floating && currentForm) ? currentForm.querySelector(".form-messages") : null;
//   const alert = document.createElement("div");
//   alert.className = `custom-alert alert-${type}`;
//   alert.innerText = message;

//   if (messageBox) {
//     messageBox.innerHTML = "";
//     messageBox.appendChild(alert);
//     setTimeout(() => alert.remove(), 3500);
//   } else {
//     alert.style.position = "fixed";
//     alert.style.top = "20px";
//     alert.style.right = "20px";
//     alert.style.zIndex = "9999";
//     document.body.appendChild(alert);
//     setTimeout(() => alert.remove(), 3500);
//   }
// }

// function loadPageCSS(url) {
//   const cleanUrl = url.split("?")[0].replace(/\/+$/, "").toLowerCase();
//   let cssFile = null;
//   if (cleanUrl.startsWith("/login")) cssFile = "/static/css/lo.css";
//   else if (cleanUrl.startsWith("/register")) cssFile = "/static/css/re.css";
//   else if (cleanUrl.startsWith("/add_article") || cleanUrl.startsWith("/article_form")) cssFile = "/static/css/add.css";
//   else if (cleanUrl.startsWith("/draft_article")) cssFile = "/static/css/draft.css";
//   else if (cleanUrl.startsWith("/article") || cleanUrl.startsWith("/tags") || cleanUrl === "") cssFile = "/static/css/ar.css";

//   document.querySelectorAll("link[data-page-css]").forEach(el => el.remove());
//   if (!cssFile) return;
//   const newLink = document.createElement("link");
//   newLink.rel = "stylesheet";
//   newLink.href = cssFile + "?v=" + Date.now();
//   newLink.setAttribute("data-page-css", "true");
//   document.head.appendChild(newLink);
//   newLink.onload = () => console.log("CSS applied:", newLink.href);
// }

// function replaceMainContent(html, url) {
//   const mainContent = document.getElementById("main-content");
//   if (!mainContent) return;

//   const parser = new DOMParser();
//   const newDoc = parser.parseFromString(html, "text/html");

//   const newNavbar = newDoc.getElementById("navbar");
//   const currentNavbar = document.getElementById("navbar");
//   if (newNavbar && currentNavbar) currentNavbar.innerHTML = newNavbar.innerHTML;

//   const newContent = newDoc.getElementById("main-content");
//   if (!newContent) return;

//   mainContent.style.opacity = "0";
//   loadPageCSS(url);

//   setTimeout(() => {
//     mainContent.innerHTML = newContent.innerHTML;
//     window.history.pushState({}, "", url);
//     mainContent.style.opacity = "1";
//     initPage(url);
//     window.scrollTo({ top: 0, behavior: "smooth" });
//   }, 100);
// }

// function initPage(url) {
//   document.querySelectorAll("a[href='/logout/']").forEach(link => {
//     if (link.dataset.bound === "true") return;
//     link.dataset.bound = "true";
//     link.onclick = e => {
//       e.preventDefault();
//       fetch("/logout/", { method: "GET", headers: { "X-Requested-With": "XMLHttpRequest" }, cache: "no-store" })
//         .then(res => res.json())
//         .then(data => showAlert(data.message || "Logged out!", "error", true))
//         .then(() => fetch("/article/?format=html&v=" + Date.now(), { headers: { "X-Requested-With": "XMLHttpRequest", "Cache-Control": "no-store" }, cache: "no-store" }))
//         .then(r => r.text())
//         .then(html => replaceMainContent(html, "/article/"))
//         .catch(err => console.error("Logout Error:", err));
//     };
//   });

//   document.querySelectorAll("a.ajax-page, a.tag-link").forEach(link => {
//   // Prevent multiple bindings
//   if (link.dataset.bound === "true") return;
//   link.dataset.bound = "true";

//   link.onclick = e => {
//     const href = link.getAttribute("href");
//     if (!href || href.startsWith("http") || href.startsWith("#")) return;

//     e.preventDefault();
//     const targetUrl = href.startsWith("/") ? href : window.location.pathname + href;

//     fetch(targetUrl + (targetUrl.includes("?") ? "&format=html" : "?format=html"), {
//       headers: { "X-Requested-With": "XMLHttpRequest" }
//     })
//       .then(async res => {
//         const contentType = res.headers.get("Content-Type") || "";

//         // Handle JSON response
//         if (contentType.includes("application/json")) {
//           const data = await res.json();
//           showAlert(data.message || "No content", data.alert_type || "info", true);
//           return null;
//         }

//         // Handle login redirect
//         if (res.status === 401 || res.url.includes("/login")) {
//           const html = await fetch("/login/?format=html", {
//             headers: { "X-Requested-With": "XMLHttpRequest" }
//           }).then(r => r.text());
//           replaceMainContent(html, "/login/");
//           return null;
//         }

//         return res.text();
//       })
//       .then(html => { 
//         if (html) replaceMainContent(html, targetUrl); 
//       })
//       .catch(err => console.error("SPA Navigation Error:", err));
//   };
// });


//   const draftsLink = document.getElementById("draftsLink");
//   if (draftsLink) {
//     draftsLink.onclick = e => {
//       const hasDrafts = draftsLink.dataset.hasDrafts === "true";
//       if (!hasDrafts) {
//         e.preventDefault();
//         showAlert("You have no drafts yet!", "warning", true);
//         return;
//       }
//       e.preventDefault();
//       const targetUrl = draftsLink.getAttribute("href");
//       fetch(targetUrl + "?format=html", { headers: { "X-Requested-With": "XMLHttpRequest" } })
//         .then(r => r.text())
//         .then(html => replaceMainContent(html, targetUrl))
//         .catch(err => console.error("Drafts SPA Error:", err));
//     };
//   }

//   const registerForm = document.getElementById("registerForm");
//   if (registerForm) {
//     registerForm.onsubmit = e => {
//       e.preventDefault();
//       const formData = new FormData(registerForm);
//       fetch(registerForm.action, { method: "POST", body: formData, headers: { "X-Requested-With": "XMLHttpRequest", "X-CSRFToken": csrfToken } })
//         .then(res => res.json())
//         .then(data => {
//           if (data.success) {
//             showAlert(data.message || "Registration successful!", "success", true);
//             fetch("/login/?format=html", { headers: { "X-Requested-With": "XMLHttpRequest" } })
//               .then(r => r.text())
//               .then(html => replaceMainContent(html, "/login/"));
//           } else {
//             showAlert(data.message || "Registration failed", "error");
//           }
//         })
//         .catch(err => console.error("Register AJAX Error:", err));
//     };
//   }

//   const loginForm = document.getElementById("loginForm");
//   if (loginForm) {
//     loginForm.onsubmit = e => {
//       e.preventDefault();
//       const formData = new FormData(loginForm);
//       fetch(loginForm.action, { method: "POST", body: formData, headers: { "X-Requested-With": "XMLHttpRequest", "X-CSRFToken": csrfToken } })
//         .then(res => res.json())
//         .then(data => {
//           if (data.success) {
//             showAlert(data.message || "Login successful!", "success", true);
//             fetch("/article/?format=html", { headers: { "X-Requested-With": "XMLHttpRequest" } })
//               .then(r => r.text())
//               .then(html => replaceMainContent(html, "/article/"));
//           } else {
//             showAlert(data.message || "Login failed", "error");
//           }
//         })
//         .catch(err => console.error("Login AJAX Error:", err));
//     };
//   }

//   document.querySelectorAll(".delete-article-btn").forEach(btn => {
//     btn.onclick = e => {
//       e.preventDefault();
//       const deleteUrl = btn.dataset.url;
//       fetch(deleteUrl, { method: "POST", headers: { "X-Requested-With": "XMLHttpRequest", "X-CSRFToken": csrfToken } })
//         .then(res => res.json())
//         .then(data => {
//           if (data.success) {
//             showAlert(data.message || "Article deleted!", "error", true);
//             fetch("/article/?format=html", { headers: { "X-Requested-With": "XMLHttpRequest" } })
//               .then(res => res.text())
//               .then(html => replaceMainContent(html, "/article/"));
//           } else {
//             showAlert(data.message || "Delete failed", "error");
//           }
//         });
//     };
//   });

//   const articleForm = document.getElementById("addArticleForm");
//   if (articleForm) {
//     articleForm.querySelectorAll("button").forEach(btn => {
//       btn.onclick = e => {
//         e.preventDefault();
//         const action = btn.dataset.action || "cancel";
//         if (action === "cancel") {
//           const redirectUrl = btn.dataset.redirect;
//           fetch(redirectUrl + "?format=html", { headers: { "X-Requested-With": "XMLHttpRequest" } })
//             .then(r => r.text())
//             .then(html => replaceMainContent(html, redirectUrl));
//           return;
//         }
//         if (!articleForm.checkValidity()) { articleForm.reportValidity(); return; }
//         const formData = new FormData(articleForm);
//         formData.append("action", action);
//         fetch(articleForm.action, { method: "POST", body: formData, headers: { "X-Requested-With": "XMLHttpRequest", "X-CSRFToken": csrfToken } })
//           .then(res => res.json())
//           .then(data => {
//             if (data.success) {
//               showAlert(data.message, "success", true);
//               const redirectUrl = data.redirect === "draft_article" ? "/draft_article/" : "/article/";
//               fetch(redirectUrl + "?format=html", { headers: { "X-Requested-With": "XMLHttpRequest" } })
//                 .then(r => r.text())
//                 .then(html => replaceMainContent(html, redirectUrl));
//             } else {
//               showAlert(data.message || "Error occurred", "error");
//             }
//           })
//           .catch(err => console.error("Article Form Error:", err));
//       };
//     });
//   }
// }

// loadPageCSS(window.location.pathname);
// initPage(window.location.pathname);

// window.onpopstate = () => {
//   fetch(window.location.pathname + "?format=html", { headers: { "X-Requested-With": "XMLHttpRequest" } })
//     .then(r => r.text())
//     .then(html => replaceMainContent(html, window.location.pathname));
// };
