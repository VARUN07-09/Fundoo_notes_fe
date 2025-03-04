document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM fully loaded, initializing Fundoo Login");
  
  const loginForm = document.getElementById("fundoo-login-form");
  const forgotPasswordLink = document.getElementById("forgotPasswordLink");
  const otpModal = document.getElementById("otpModal");
  const resetPasswordModal = document.getElementById("resetPasswordModal");
  let currentEmail = "";

  // Verify DOM elements exist
  if (!loginForm || !forgotPasswordLink || !otpModal || !resetPasswordModal) {
      console.error("One or more DOM elements not found:", {
          loginForm: !!loginForm,
          forgotPasswordLink: !!forgotPasswordLink,
          otpModal: !!otpModal,
          resetPasswordModal: !!resetPasswordModal
      });
      alert("Error: Login page elements are missing. Check your HTML and file paths.");
      return;
  }

  // Login Form Submission
  loginForm.addEventListener("submit", function (event) {
      event.preventDefault();
      console.log("Login form submitted");

      const email = document.getElementById("floatingInput").value.trim();
      const password = document.getElementById("floatingPassword").value.trim();

      if (!email || !password) {
          alert("Please enter both email and password.");
          return;
      }

      console.log("Attempting login with:", { email, password });

      fetch("http://localhost:3000/api/v1/login", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
      })
      .then((response) => {
          if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
          }
          return response.json();
      })
      .then((data) => {
          console.log("Login response:", data);
          if (data.token) {
              localStorage.setItem("jwtToken", data.token);
              alert("Login successful!");
              window.location.href = "fundooDashboard.html";
          } else {
              alert("Login failed: " + (data.error || "Invalid credentials"));
          }
      })
      .catch((error) => {
          console.error("Error during login:", error);
          alert("Something went wrong. Please try again.");
      });
  });

  // Forgot Password Logic
  forgotPasswordLink.addEventListener("click", function (e) {
      e.preventDefault();
      console.log("Forgot password link clicked");

      currentEmail = document.getElementById("floatingInput").value.trim();
      
      if (!currentEmail) {
          alert("Please enter your email address first.");
          return;
      }

      console.log("Sending OTP for email:", currentEmail);

      fetch("http://localhost:3000/api/v1/forgot_password", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: currentEmail }),
      })
      .then((response) => {
          if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
          }
          return response.json();
      })
      .then((data) => {
          console.log("Forgot password response:", data);
          if (data.success) {
              alert("OTP sent to your email. Please check your inbox.");
              otpModal.style.display = "block";
          } else {
              alert("Error: " + (data.error || "Failed to send OTP."));
          }
      })
      .catch((error) => {
          console.error("Error sending OTP:", error);
          alert("Something went wrong. Please try again.");
      });
  });

  // Verify OTP
  document.getElementById("verifyOtpBtn").addEventListener("click", function () {
      const otp = document.getElementById("otpInput").value.trim();
      
      console.log("Verifying OTP for email:", currentEmail, "with OTP:", otp);

      if (!otp) {
          alert("Please enter the OTP.");
          return;
      }

      fetch("http://localhost:3000/api/v1/reset_password/verify", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: currentEmail, otp: otp }),
      })
      .then((response) => {
          if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
          }
          return response.json();
      })
      .then((data) => {
          console.log("Verify OTP response:", data);
          if (data.success) {
              otpModal.style.display = "none";
              resetPasswordModal.style.display = "block";
          } else {
              alert("Error: " + (data.error || "Invalid or expired OTP."));
          }
      })
      .catch((error) => {
          console.error("Error verifying OTP:", error);
          alert("Something went wrong. Please try again.");
      });
  });

  // Reset Password
  document.getElementById("resetPasswordBtn").addEventListener("click", function () {
      const newPassword = document.getElementById("newPassword").value.trim();
      const confirmPassword = document.getElementById("confirmPassword").value.trim();

      console.log("Resetting password for email:", currentEmail, "with new password:", newPassword);

      if (!newPassword || !confirmPassword) {
          alert("Please enter both new password and confirmation.");
          return;
      }

      if (newPassword !== confirmPassword) {
          alert("Passwords do not match.");
          return;
      }

      fetch("http://localhost:3000/api/v1/reset_password", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: currentEmail, new_password: newPassword }),
      })
      .then((response) => {
          if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
          }
          return response.json();
      })
      .then((data) => {
          console.log("Reset password response:", data);
          if (data.success) {
              alert("Password reset successfully. You can now log in with your new password.");
              resetPasswordModal.style.display = "none";
              loginForm.reset(); // Clear the form
          } else {
              alert("Error: " + (data.error || "Failed to reset password."));
          }
      })
      .catch((error) => {
          console.error("Error resetting password:", error);
          alert("Something went wrong. Please try again.");
      });
  });

  // Cancel Buttons
  document.getElementById("cancelOtpBtn").addEventListener("click", function () {
      otpModal.style.display = "none";
  });

  document.getElementById("cancelResetBtn").addEventListener("click", function () {
      resetPasswordModal.style.display = "none";
  });
});