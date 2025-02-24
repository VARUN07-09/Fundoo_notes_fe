document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("fundoo-login-form");
  
    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();
  
      const email = document.getElementById("floatingInput").value.trim();
      const password = document.getElementById("floatingPassword").value.trim();
  
      if (!email || !password) {
        alert("Please enter both email and password.");
        return;
      }
  
      // 1. Attempt login
      fetch("http://localhost:3000/api/v1/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })
        .then((response) => response.json())
        .then((data) => {
          // 2. Check for token
          if (data.token) {
            localStorage.setItem("jwtToken", data.token);
            alert("Login successful!");
            // 3. Redirect to dashboard
            window.location.href = "fundooDashboard.html";
          } else {
            alert("Login failed: " + (data.error || "Invalid credentials"));
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("Something went wrong. Please try again.");
        });
    });
  });
  