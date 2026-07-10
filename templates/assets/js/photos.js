/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-07-10 21:19:16
 * Fingerprint: 2ca1ec7af50e27a3
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

// 图库页面 - 筛选和灯箱功能

// 分组筛选
document.addEventListener('DOMContentLoaded', function() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const photoItems = document.querySelectorAll('.photo-item');
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const group = this.dataset.group;
      
      // 更新按钮状态
      filterBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // 筛选图片
      photoItems.forEach(item => {
        if (group === 'all' || item.dataset.group === group) {
          item.classList.remove('hidden');
        } else {
          item.classList.add('hidden');
        }
      });
    });
  });
});

// 灯箱功能
function openLightbox(img) {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  
  lightboxImg.src = img.src;
  lightboxImg.alt = img.alt;
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox(event) {
  if (event && event.target !== event.currentTarget && event.target.id !== 'lightbox') {
    return;
  }
  const lightbox = document.getElementById('lightbox');
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
}

// ESC 关闭灯箱
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeLightbox();
  }
});
