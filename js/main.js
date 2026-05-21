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
