// register.js
function initRegisterPage() {
  const registerForm = document.getElementById("registerForm");
  if (!registerForm) return;

  registerForm.onsubmit = e => {
    e.preventDefault();
    const formData = new FormData(registerForm);

    fetch(registerForm.action, { 
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
        showAlert(data.message || "Registration successful!", "success", true);
        // Redirect to login page after successful registration
        fetch("/login/?format=html", { headers: { "X-Requested-With": "XMLHttpRequest" } })
          .then(r => r.text())
          .then(html => replaceMainContent(html, "/login/"))
          .catch(err => console.error("Redirect to Login Error:", err));
      } else {
        showAlert(data.message || "Registration failed", "error");
      }
    })
    .catch(err => console.error("Register AJAX Error:", err));
  };
}

