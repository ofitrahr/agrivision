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
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// ---- MOBILE MENU TOGGLE ----
function toggleMobileMenu() {
  const menu = document.getElementById('navMenu');
  if (menu) menu.classList.toggle('open');
}

// ---- STATS COUNTER ANIMATION ----
function animateCounters() {
  const counters = document.querySelectorAll('.stat-number');
  counters.forEach(counter => {
    const target = parseInt(counter.getAttribute('data-target'));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        counter.innerText = target.toLocaleString();
        clearInterval(timer);
      } else {
        counter.innerText = Math.floor(current).toLocaleString();
      }
    }, 16);
  });
}

// Trigger counter animation when stats section is visible
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounters();
      statsObserver.disconnect();
    }
  });
}, { threshold: 0.3 });

const statsSection = document.querySelector('.stats-section');
if (statsSection) statsObserver.observe(statsSection);

// ---- SMOOTH SCROLL ----
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Close mobile menu if open
      document.getElementById('navMenu')?.classList.remove('open');
    }
  });
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
