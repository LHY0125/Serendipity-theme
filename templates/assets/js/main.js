/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-07-10 21:19:16
 * Fingerprint: 2ca1ec7af50e27a3
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

// 页面过渡效果
function initPageTransition() {
  const transition = document.getElementById('page-transition');
  if (!transition) return;
  
  // 点击链接时显示过渡遮罩（仅对跳转到 /console 或外部登录页面）
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href*="/console"], a[href*="/login"]');
    if (!link) return;
    
    const href = link.getAttribute('href');
    // 排除新标签页打开的链接
    if (link.target === '_blank') return;
    
    e.preventDefault();
    transition.classList.add('active');
    
    setTimeout(() => {
      window.location.href = href;
    }, 300);
  });
}

// 清理生活回想描述中的HTML标签
function cleanLifeDescriptions() {
  document.querySelectorAll('.life-desc').forEach(el => {
    const text = el.textContent || el.innerText;
    const cleaned = text.trim().substring(0, 30);
    el.textContent = cleaned + (text.length > 30 ? '...' : '');
  });
}

function initThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;
  
  toggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    transitionTheme(() => {
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('color-scheme', newTheme);
    });
  });
}

function transitionTheme(updateCb) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    updateCb();
    return;
  }
  
  if (document.startViewTransition) {
    document.startViewTransition(updateCb);
  } else {
    document.documentElement.classList.add('theme-transitioning');
    updateCb();
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 500);
  }
}

function toggleMenu() {
  const navLeft = document.querySelector('.nav-left');
  const navRight = document.querySelector('.nav-right');
  if (navLeft) navLeft.classList.toggle('active');
  if (navRight) navRight.classList.toggle('active');
}

function initHeaderScroll() {
  const header = document.querySelector('.header');
  if (!header) return;
  
  let ticking = false;
  let lastScroll = 0;
  
  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (currentScroll > lastScroll && currentScroll > 100) {
          header.classList.add('header-hidden');
        } else if (currentScroll < lastScroll) {
          header.classList.remove('header-hidden');
        }
        
        if (currentScroll > 50) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

function initMenuClose() {
  document.addEventListener('click', (e) => {
    const navLeft = document.querySelector('.nav-left');
    const navRight = document.querySelector('.nav-right');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (navLeft && navLeft.classList.contains('active')) {
      if (!navLeft.contains(e.target) && !navRight.contains(e.target) && !menuToggle.contains(e.target)) {
        navLeft.classList.remove('active');
        navRight.classList.remove('active');
      }
    }
  });
}

function initMemoSlider() {
  const slider = document.getElementById('memo-slider');
  const track = document.querySelector('.memo-track');
  const prevBtn = document.getElementById('memo-prev');
  const nextBtn = document.getElementById('memo-next');
  
  if (!track || !prevBtn || !nextBtn || !slider) return;
  
  const cards = track.querySelectorAll('.memo-card');
  if (cards.length === 0) return;
  
  let scrollPos = 0;
  const scrollStep = 300;
  
  function updateButtons() {
    const maxScroll = track.scrollWidth - slider.clientWidth;
    prevBtn.disabled = scrollPos <= 0;
    nextBtn.disabled = scrollPos >= maxScroll;
    
    // 如果内容没有溢出，隐藏按钮
    if (track.scrollWidth <= slider.clientWidth) {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    } else {
      prevBtn.style.display = '';
      nextBtn.style.display = '';
    }
  }
  
  function slide(direction) {
    const maxScroll = track.scrollWidth - slider.clientWidth;
    scrollPos += direction * scrollStep;
    scrollPos = Math.max(0, Math.min(scrollPos, maxScroll));
    track.style.transform = `translateX(-${scrollPos}px)`;
    updateButtons();
  }
  
  prevBtn.addEventListener('click', () => slide(-1));
  nextBtn.addEventListener('click', () => slide(1));
  
  // 初始化按钮状态
  updateButtons();
  
  // 只有内容溢出时才自动滑动
  let autoSlideInterval = null;
  if (track.scrollWidth > slider.clientWidth) {
    autoSlideInterval = setInterval(() => {
      const maxScroll = track.scrollWidth - slider.clientWidth;
      if (scrollPos >= maxScroll) {
        scrollPos = 0;
      } else {
        scrollPos += scrollStep;
        scrollPos = Math.min(scrollPos, maxScroll);
      }
      track.style.transform = `translateX(-${scrollPos}px)`;
      updateButtons();
    }, 5000);
  }
  
  // 鼠标悬停时暂停自动滑动
  slider.addEventListener('mouseenter', () => {
    if (autoSlideInterval) clearInterval(autoSlideInterval);
  });
  
  slider.addEventListener('mouseleave', () => {
    if (track.scrollWidth > slider.clientWidth) {
      autoSlideInterval = setInterval(() => {
        const maxScroll = track.scrollWidth - slider.clientWidth;
        if (scrollPos >= maxScroll) {
          scrollPos = 0;
        } else {
          scrollPos += scrollStep;
          scrollPos = Math.min(scrollPos, maxScroll);
        }
        track.style.transform = `translateX(-${scrollPos}px)`;
        updateButtons();
      }, 5000);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initHeaderScroll();
  initSmoothScroll();
  initMenuClose();
  initMemoSlider();
  initHeroBackground();
  initBackToTop();
  initTypewriter();
  initDragScroll();
  cleanLifeDescriptions();
  sortStreamFeed();
  initPageTransition();
  
  // AOS 动画库初始化
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: true,
      offset: 50,
      delay: 0,
      anchorPlacement: 'top-bottom'
    });
  }
});

function sortStreamFeed() {
  const feed = document.getElementById('stream-feed');
  if (!feed) return;
  
  const rows = Array.from(feed.querySelectorAll('.stream-row[data-time]'));
  if (rows.length === 0) return;
  
  rows.sort((a, b) => {
    const timeA = a.getAttribute('data-time') || '';
    const timeB = b.getAttribute('data-time') || '';
    return timeB.localeCompare(timeA);
  });
  
  rows.forEach(row => feed.appendChild(row));
}

function initHeroBackground() {
  const heroBackground = document.querySelector('.hero-background');
  if (!heroBackground) return;
  
  const heroBackgroundImg = heroBackground.querySelector('.hero-background-img');
  if (!heroBackgroundImg) return;
  
  // 立即根据当前滚动位置设置状态（防止刷新时闪烁）
  function updateBackground() {
    const scrollY = window.pageYOffset;
    const windowHeight = window.innerHeight;
    const scrollProgress = Math.min(scrollY / windowHeight, 1);
    const blurAmount = scrollProgress * 20;
    const opacity = 1 - scrollProgress;
    
    heroBackgroundImg.style.filter = `blur(${blurAmount}px)`;
    heroBackground.style.opacity = opacity;
  }
  
  // 立即执行一次
  updateBackground();
  
  let ticking = false;
  
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateBackground();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });
  
  btn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

function initTypewriter() {
  const textElement = document.querySelector('.typewriter-text');
  if (!textElement) return;
  
  const text = textElement.getAttribute('data-text') || textElement.textContent;
  textElement.textContent = '';
  
  let charIndex = 0;
  const typingSpeed = 150;
  
  function type() {
    if (charIndex < text.length) {
      textElement.textContent += text.charAt(charIndex);
      charIndex++;
      setTimeout(type, typingSpeed);
    }
  }
  
  setTimeout(type, 500);
}

function initDragScroll() {
  const slider = document.getElementById('life-slider');
  if (!slider) return;
  
  let isDown = false;
  let startX;
  let scrollLeft;
  
  slider.addEventListener('mousedown', (e) => {
    isDown = true;
    slider.classList.add('dragging');
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
  });
  
  document.addEventListener('mouseup', () => {
    if (isDown) {
      isDown = false;
      slider.classList.remove('dragging');
    }
  });
  
  slider.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 2;
    slider.scrollLeft = scrollLeft - walk;
  });
}
