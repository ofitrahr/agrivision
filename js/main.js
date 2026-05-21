/* ============================================
   AGRIVISION - main.js
   Global JavaScript
   ============================================ */

// --- ACTIVITY SLIDER ---
let currentSlide = 0;

function slideActivities(direction) {
  const slider = document.getElementById('activitySlider');
  if (!slider) return;

  const totalSlides = slider.children.length;
  currentSlide += direction;

  if (currentSlide < 0) currentSlide = totalSlides - 1;
  if (currentSlide >= totalSlides) currentSlide = 0;

  const slideWidth = slider.children[0].offsetWidth + 28; // 28 = gap
  slider.style.transform = `translateX(-${currentSlide * slideWidth}px)`;
}

// Auto-slide every 4 seconds
setInterval(() => slideActivities(1), 4000);

// --- NAVBAR SCROLL EFFECT ---
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  if (window.scrollY > 50) {
    navbar.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)';
  } else {
    navbar.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
  }
});

// --- LOGIN PAGE INTERACTIONS ---
const passwordToggle = document.querySelector('.password-toggle');
const passwordInput = document.getElementById('password');
const emailInput = document.getElementById('email');
const submitButton = document.getElementById('submitButton');
const loginForm = document.getElementById('loginForm');

if (passwordToggle && passwordInput) {
  passwordToggle.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    passwordToggle.textContent = isPassword ? 'Hide' : 'Show';
  });
}

const toggleSubmitState = () => {
  if (!submitButton) return;
  const isValid = emailInput?.value.trim() && passwordInput?.value.trim();
  submitButton.disabled = !isValid;
};

if (emailInput && passwordInput) {
  emailInput.addEventListener('input', toggleSubmitState);
  passwordInput.addEventListener('input', toggleSubmitState);
}

if (loginForm) {
  loginForm.addEventListener('submit', (event) => {
    if (!emailInput.value || !passwordInput.value) {
      event.preventDefault();
      toggleSubmitState();
    }
  });
}
