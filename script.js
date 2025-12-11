// Three.js Setup
let scene, camera, renderer;
let animationId;

function initThreeJS() {
  const canvas = document.getElementById('canvas');
  
  // Scene setup
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;
  
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x0f0f1e, 0.1);
  
  canvas.appendChild(renderer.domElement);
  
  // Create animated cube
  const geometry = new THREE.BoxGeometry(2, 2, 2);
  const material = new THREE.MeshPhongMaterial({ color: 0x64c8ff });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
  
  // Lighting
  const light = new THREE.DirectionalLight(0xffffff, 0.8);
  light.position.set(5, 5, 5);
  scene.add(light);
  
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  // Animation loop
  function animate() {
    animationId = requestAnimationFrame(animate);
    cube.rotation.x += 0.005;
    cube.rotation.y += 0.005;
    renderer.render(scene, camera);
  }
  
  animate();
  
  // Handle window resize
  window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Scroll animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.animation = 'slideUp 0.8s ease-out';
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.section-about, .section-skills, .section-projects, .section-contact').forEach(section => {
  observer.observe(section);
});

// Contact form handling
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(contactForm);
    
    // Simple feedback
    alert('Thank you for your message! I will get back to you soon.');
    contactForm.reset();
  });
}

// CTA Button functionality
const ctaButton = document.querySelector('.cta-button');
if (ctaButton) {
  ctaButton.addEventListener('click', () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
}

// Navbar scroll effect
let lastScrollTop = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  
  if (scrollTop > lastScrollTop) {
    // Scroll down - hide navbar
    navbar.style.transform = 'translateY(-100%)';
  } else {
    // Scroll up - show navbar
    navbar.style.transform = 'translateY(0)';
  }
  
  lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  try {
    initThreeJS();
  } catch (error) {
    console.log('Three.js not loaded or error initializing');
  }
});

// Analytics (optional)
if (typeof gtag !== 'undefined') {
  window.addEventListener('load', () => {
    gtag('event', 'page_view');
  });
}

console.log('Portfolio script loaded successfully!');
