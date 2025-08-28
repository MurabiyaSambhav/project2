console.log("article.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  const csrfToken = window.getCSRFToken();
  window.searchResults = null;

  // ---------------- Render Articles ----------------
  function renderArticles(articles, container) {
    if (!container) return;
    container.innerHTML = "";
    if (!articles.length) {
      container.innerHTML = "<li>No articles found.</li>";
      return;
    }

    articles.forEach(article => {
      const li = document.createElement("li");
      li.style = `
        margin-bottom: 20px; 
        padding: 15px; 
        border: 1px solid #ccc; 
        border-radius: 8px; 
        background: white; 
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      `;

      // Render existing comments if any
      const commentsHTML = article.comments && article.comments.length
        ? article.comments.map(c => `<p><b>${c.user}</b>: ${c.content}</p>`).join("")
        : "";
      // Article inner HTML
      // Using template literals for better readability
      // in serching context, paggination , like, comments 
      li.innerHTML = `
        <h3>Author: ${article.author_name || "Unknown"}</h3>
        <h2>Title: ${article.title}</h2>
        <p>${article.content}</p>
        ${article.tag_list && article.tag_list.length ? `
          <div style="margin-bottom: 10px;">
            <strong>Tags:</strong>
            ${article.tag_list.map(tag => `<a href="/tags/${tag}" class="tag-link">${tag}</a>`).join(" ")}
          </div>` : ""
        }
        <div style="margin-top: 10px; display: flex; align-items: center; gap: 15px;">
          <div style="display: flex; align-items: center; gap: 5px;">
            <button class="like-btn button" data-article-id="${article.id}">${article.liked ? "Liked" : "Like"}</button>
            <span id="like-count-${article.id}">${article.likes || 0}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 5px;">
            <button class="comment-btn button" data-article-id="${article.id}">Comments</button>
            <span id="comment-count-${article.id}">${article.comment_count || 0}</span>
          </div>
        </div>
        <div id="comment-box-${article.id}" class="hidden" style="margin-top:10px;">
          <textarea id="comment-input-${article.id}" placeholder="Write a comment..." rows="2" style="width:100%;"></textarea>
          <button class="add-comment-btn button" data-article-id="${article.id}">Add Comment</button>
          <div id="comment-list-${article.id}" style="margin-top:10px;">
            ${commentsHTML}
          </div>
        </div>
      `;

      container.appendChild(li);
    });
  }

  // ---------------- Pagination Helpers ----------------
  function updatePaginationFromHTML(newDoc) {
    const paginationWrapper = document.querySelector(".pagination-wrapper");
    const newPagination = newDoc.querySelector(".pagination-wrapper");
    if (paginationWrapper && newPagination) {
      paginationWrapper.innerHTML = newPagination.innerHTML;
    }
  }

  function updateArticlesFromHTML(newDoc) {
    const container = document.getElementById("articles-container") || document.getElementById("article-list");
    const newArticles = newDoc.querySelector("#articles-container") || newDoc.querySelector("#article-list");
    if (container && newArticles) {
      container.innerHTML = newArticles.innerHTML;
    }
  }

  // ---------------- Search Form ----------------
  function initSearchForm() {
    const searchForm = document.getElementById("search-form");
    if (!searchForm) return;

    searchForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const query = searchForm.search.value.trim();
      const container = document.getElementById("articles-container") || document.getElementById("article-list");
      if (!container) return;

      const url = `/api/articles/search/?search=${encodeURIComponent(query)}`;
      try {
        const res = await fetch(url, {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            "Accept": "application/json"
          }
        });
        if (!res.ok) return;

        const data = await res.json();
        const articles = Array.isArray(data) ? data : (data.articles || data.results || []);
        window.searchResults = articles;
        renderArticles(articles, container);

        const paginationWrapper = document.querySelector(".pagination-wrapper");
        if (paginationWrapper) paginationWrapper.innerHTML = "";
      } catch (err) {
        console.error("Search error:", err);
      }
    });
  }

  // ---------------- Global Click Handler ----------------
  document.body.addEventListener("click", async (e) => {
    const target = e.target;

    // ---------------- Like Button ----------------
    if (target.classList.contains("like-btn")) {
      const articleId = target.dataset.articleId;
      if (!articleId) return;
      try {
        const res = await fetch(`/article/${articleId}/like/`, {
          method: "POST",
          headers: {
            "X-CSRFToken": csrfToken,
            "X-Requested-With": "XMLHttpRequest",
          },
        });
        const data = await res.json();
        if (data.success) {
          target.textContent = data.liked ? "Liked" : "Like";
          const likeCount = document.getElementById(`like-count-${articleId}`);
          if (likeCount) likeCount.textContent = data.likes;
        }
      } catch (err) {
        console.error("Like error:", err);
      }
    }

    // ---------------- Comment Toggle ----------------
    if (target.classList.contains("comment-btn")) {
      const articleId = target.dataset.articleId;
      const box = document.getElementById(`comment-box-${articleId}`);
      if (box) box.classList.toggle("hidden");
    }

    // ---------------- Add Comment ----------------
    if (target.classList.contains("add-comment-btn")) {
      const articleId = target.dataset.articleId;
      const textarea = document.querySelector(`#comment-input-${articleId}`);
      if (!textarea) return;
      const content = textarea.value.trim();
      if (!content) return;

      if (!csrfToken) {
        alert("CSRF token missing. Please reload the page.");
        return;
      }

      try {
        const res = await fetch(`/article/${articleId}/comment/`, {
          method: "POST",
          headers: {
            "X-CSRFToken": csrfToken,
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        });

        if (!res.ok) {
          console.error("HTTP error:", res.status);
          return;
        }

        const data = await res.json();

        if (data.success) {
          const list = document.querySelector(`#comment-list-${articleId}`);
          const commentCount = document.getElementById(`comment-count-${articleId}`);
          if (list) {
            const newComment = document.createElement("p");
            newComment.innerHTML = `<b>${data.username}</b>: ${data.comment}`;
            list.prepend(newComment);
          }
          if (commentCount) commentCount.textContent = data.comment_count || (parseInt(commentCount.textContent) + 1);

          textarea.value = "";
          const box = document.getElementById(`comment-box-${articleId}`);
          if (box && box.classList.contains("hidden")) box.classList.remove("hidden");
        } else {
          alert(data.message || "Failed to add comment.");
        }
      } catch (err) {
        console.error("Add comment error:", err);
      }
    }

    // ---------------- Pagination ----------------
    if (target.classList.contains("ajax-page")) {
      e.preventDefault();
      let url = target.getAttribute("href");
      if (!url.includes("format=json")) url += (url.includes("?") ? "&" : "?") + "format=json";

      try {
        const res = await fetch(url, { headers: { "X-Requested-With": "XMLHttpRequest" } });
        if (!res.ok) return;

        const data = await res.json();
        if (data.html) {
          const parser = new DOMParser();
          const newDoc = parser.parseFromString(data.html, "text/html");
          updateArticlesFromHTML(newDoc);
          updatePaginationFromHTML(newDoc);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch (err) {
        console.error("Pagination error:", err);
      }
    }
  });

  window.initSearchForm = initSearchForm;
  initSearchForm();
});
