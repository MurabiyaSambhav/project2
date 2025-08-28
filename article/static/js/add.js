console.log("Add Article JS loaded");

function initAddArticlePage() {
  const form = document.getElementById("addArticleForm");
  if (!form) return;

  // Handle Publish / Draft submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitButton = e.submitter; // the button clicked
    const action = submitButton.dataset.action || "publish";

    // Use browser validation
    if (!form.checkValidity()) {
      form.reportValidity(); // shows native messages
      return;
    }

    const formData = new FormData(form);
    formData.append("action", action);

    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: formData,
        headers: {
          "X-CSRFToken": window.getCSRFToken(),
          "X-Requested-With": "XMLHttpRequest"
        }
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || "Success");
        if (data.redirect) window.location.href = data.redirect;
      } else {
        alert(data.message || "Error");
      }
    } catch (err) {
      console.error("Error submitting article:", err);
      alert("Failed to submit article");
    }
  });

  // Handle Cancel button separately
  form.querySelectorAll(".cancel-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const redirectUrl = btn.dataset.redirect || "/article/";
      window.location.href = redirectUrl;
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "add_article") initAddArticlePage();
});
