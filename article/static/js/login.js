// login.js
function initLoginPage() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  loginForm.onsubmit = e => {
    e.preventDefault();
    const formData = new FormData(loginForm);

    fetch(loginForm.action, { 
      method: "POST", 
      body: formData, 
      headers: { 
        "X-Requested-With": "XMLHttpRequest", 
        "X-CSRFToken": csrfToken 
      } 
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showAlert(data.message || "Login successful!", "success", true);
        // Redirect to article page
        fetch("/article/?format=html", { headers: { "X-Requested-With": "XMLHttpRequest" } })
          .then(r => r.text())
          .then(html => replaceMainContent(html, "/article/"))
          .catch(err => console.error("Redirect to Article Error:", err));
      } else {
        showAlert(data.message || "Login failed", "error");
      }
    })
    .catch(err => console.error("Login AJAX Error:", err));
  };
}

