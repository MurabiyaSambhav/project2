// add.js
function initAddArticlePage() {
  const articleForm = document.getElementById("addArticleForm");
  if (!articleForm) return;

  articleForm.querySelectorAll("button").forEach(btn => {
    btn.onclick = e => {
      e.preventDefault();
      const action = btn.dataset.action || "cancel";

      // Handle cancel button
      if (action === "cancel") {
        const redirectUrl = btn.dataset.redirect;
        fetch(redirectUrl + "?format=html", { headers: { "X-Requested-With": "XMLHttpRequest" } })
          .then(r => r.text())
          .then(html => replaceMainContent(html, redirectUrl))
          .catch(err => console.error("Cancel Redirect Error:", err));
        return;
      }

      // Validate form
      if (!articleForm.checkValidity()) {
        articleForm.reportValidity();
        return;
      }

      // Prepare form data
      const formData = new FormData(articleForm);
      formData.append("action", action);

      // Submit via AJAX
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
            fetch(redirectUrl + "?format=html", { headers: { "X-Requested-With": "XMLHttpRequest" } })
              .then(r => r.text())
              .then(html => replaceMainContent(html, redirectUrl))
              .catch(err => console.error("Redirect After Submit Error:", err));
          } else {
            showAlert(data.message || "Error occurred", "error");
          }
        })
        .catch(err => console.error("Article Form Error:", err));
    };
  });
}


