// Smooth scrolling for links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
    });
});

// Add click animation to buttons
const linkBtns = document.querySelectorAll('.link-btn');
linkBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
        // Remove existing ripple
        const ripple = this.querySelector('.ripple');
        if (ripple) ripple.remove();

        // Create ripple effect
        const rippleEl = document.createElement('span');
        rippleEl.classList.add('ripple');
        this.appendChild(rippleEl);

        // Remove ripple after animation
        setTimeout(() => rippleEl.remove(), 600);
    });
});

// Optional: Add loading animation
window.addEventListener('load', () => {
    document.body.style.opacity = '1';
});
