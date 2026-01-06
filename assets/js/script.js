document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // --- Dark Mode Toggle ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    
    const setTheme = (isDark) => {
        root.classList.toggle('dark-mode', isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    };
    
    const applySavedTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        setTheme(savedTheme === 'dark' || (!savedTheme && prefersDark.matches));
    };
    
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            setTheme(!root.classList.contains('dark-mode'));
        });
        
        // Listen for system theme changes
        prefersDark.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                setTheme(e.matches);
            }
        });
    }
    
    applySavedTheme();

    // --- Mobile Navigation ---
    const hamburgerBtn = document.getElementById('hamburger');
    const navLinksContainer = document.querySelector('.nav-links');
    
    if (hamburgerBtn && navLinksContainer) {
        const handleMobileNav = (isOpen) => {
            navLinksContainer.classList.toggle('active', isOpen);
            hamburgerBtn.setAttribute('aria-expanded', String(isOpen));
            
            // Prevent body scroll when menu is open
            document.body.style.overflow = isOpen ? 'hidden' : '';
        };
        
        hamburgerBtn.addEventListener('click', () => {
            const willBeOpen = !navLinksContainer.classList.contains('active');
            handleMobileNav(willBeOpen);
        });
        
        // Close menu when clicking a link or outside
        document.addEventListener('click', (event) => {
            const isLink = event.target.closest('.nav-links a');
            const isOutside = !event.target.closest('.header-actions') && 
                            !event.target.closest('.nav-links');
            
            if ((isLink || isOutside) && navLinksContainer.classList.contains('active')) {
                handleMobileNav(false);
            }
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && navLinksContainer.classList.contains('active')) {
                handleMobileNav(false);
            }
        });
    }

    // --- Active Navbar Link Highlighter ---
    const currentPagePath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        const linkPath = new URL(link.href).pathname;
        if (currentPagePath.startsWith(linkPath) && linkPath !== '/') {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });
    
    // --- Performance Optimization ---
    // Lazy load images
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    if ('loading' in HTMLImageElement.prototype) {
        lazyImages.forEach(img => {
            img.src = img.dataset.src;
        });
    } else {
        // Fallback for browsers that don't support lazy loading
        const lazyLoadScript = document.createElement('script');
        lazyLoadScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
        document.body.appendChild(lazyLoadScript);
    }
});