/**
 * Theme: serendipity
 * Author: Serendipity
 * Copyright (c) 2026 Serendipity. All rights reserved.
 */

/**
 * Serendipity 文章发布热力图（GitHub Contribution Graph 风格）
 * - 数据：Halo 公开 Content API 分页拉取，按 spec.publishTime 本地时区统计每日发布数
 * - 渲染：CSS Grid div 网格，tooltip 用纯 CSS ::after，无鼠标事件 → PJAX 天然安全
 * - 组件：init 幂等、配置从 container.dataset 读取、bindPageEvent 仅在异步回调中调用
 */
(function () {
  'use strict';

  var API = '/apis/api.content.halo.run/v1alpha1/posts';
  var PAGE_SIZE = 100;
  var MAX_PAGES = 20;
  var WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // 同页访问缓存（PJAX 每次重执行脚本会重置 → 每次导航重拉，数据新鲜）
  var cachedPosts = null;

  function pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  // 必须用本地时区 getFullYear/getMonth/getDate 拼 key，
  // 不可用 toISOString().slice(0,10)（会退回 UTC，UTC+8 晚 8 点后发布会记错一天）
  function dateKey(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function escapeAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  function levelOf(count) {
    if (count <= 0) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count <= 4) return 3;
    return 4;
  }

  function tooltipText(d, count) {
    var s = d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
    return s + ' · ' + (count > 0 ? count + ' 篇文章' : '无文章');
  }

  // 分页拉取全部已发布公开文章；失败降级返回空数组（渲染空态）
  function fetchAllPosts() {
    if (cachedPosts) return Promise.resolve(cachedPosts);
    var all = [];
    var page = 1;
    function loop() {
      return fetch(API + '?page=' + page + '&size=' + PAGE_SIZE + '&sort=spec.publishTime,asc')
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          if (!data || !data.items || data.items.length === 0) return all;
          all = all.concat(data.items);
          var total = data.total;
          if (typeof total !== 'number' || total <= 0) {
            console.warn('[heatmap] Content API 未返回有效 total，文章数可能统计不全');
            return all;
          }
          if (all.length >= total) return all;
          if (page >= MAX_PAGES) {
            console.warn('[heatmap] 文章数超过上限（' + (MAX_PAGES * PAGE_SIZE) + ' 篇），仅统计前 ' + all.length + ' 篇');
            return all;
          }
          page += 1;
          return loop();
        })
        .catch(function () { return all; });
    }
    return loop().then(function (posts) { cachedPosts = posts; return posts; });
  }

  function cellHtml(d, count, clickable) {
    var level = levelOf(count);
    var tip = tooltipText(d, count);
    var key = dateKey(d);
    var attrs = 'data-level="' + level + '" data-date="' + key + '" data-tooltip="' + escapeAttr(tip) + '"';
    if (clickable) {
      // Halo 归档路由 month 正则 \d{2}，必须两位（/archives/2026/1 会 404）
      return '<a class="heatmap-cell" ' + attrs + ' href="/archives/' + d.getFullYear() + '/' + pad(d.getMonth() + 1) + '"></a>';
    }
    return '<span class="heatmap-cell" ' + attrs + '></span>';
  }

  function render(root, mode) {
    if (!document.contains(root)) return;
    var posts = cachedPosts || [];

    var title = root.dataset.title || '写作热力图';
    var clickable = root.dataset.clickable === 'true';
    var showStats = root.dataset.showStats !== 'false';

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    // More: 往前 364 天（含今天 365 天）→ 对齐周一后恒为 53 列
    // Less: 往前 181 天（182 天）→ 对齐周一后为 26 或 27 列
    var start = new Date(today);
    start.setDate(start.getDate() - (mode === 'less' ? 181 : 364));
    var startKey = dateKey(start);
    var endKey = dateKey(today);

    // 起始对齐到最近周一（含 start 所在周）
    start.setDate(start.getDate() - (start.getDay() + 6) % 7);

    var totalDays = Math.round((today - start) / 86400000) + 1;
    var weeks = Math.ceil(totalDays / 7);

    // 统计范围内每日发布数（本地时区）
    var stats = {};
    var countInRange = 0;
    posts.forEach(function (p) {
      var t = p.spec && p.spec.publishTime;
      if (!t) return;
      var d = new Date(t);
      if (isNaN(d.getTime())) return;
      var k = dateKey(d);
      if (k >= startKey && k <= endKey) {
        stats[k] = (stats[k] || 0) + 1;
        countInRange += 1;
      }
    });

    // 列优先生成：每周一列、列内自上而下 7 行（与 grid-auto-flow: column 一致）
    var cells = [];
    var months = [];
    var cursor = new Date(start);
    var lastLabel = null;
    for (var w = 0; w < weeks; w++) {
      var firstDay = new Date(cursor);
      var m = firstDay.getMonth();
      var y = firstDay.getFullYear();
      if (!lastLabel || lastLabel.month !== m || lastLabel.year !== y) {
        // 该列年份与上一标签列不同时显示 "Jan 2026" 形式（跨年避免歧义）
        var label = MONTHS[m] + (lastLabel && lastLabel.year !== y ? ' ' + y : '');
        months.push('<div class="heatmap-month"><span class="heatmap-month-label">' + label + '</span></div>');
        lastLabel = { month: m, year: y };
      } else {
        months.push('<div class="heatmap-month"></div>');
      }
      for (var i = 0; i < 7; i++) {
        var key = dateKey(cursor);
        if (key >= startKey && key <= endKey) {
          cells.push(cellHtml(cursor, stats[key] || 0, clickable));
        } else {
          cells.push('<span class="heatmap-cell is-empty"></span>');
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    // 星期标签：仅第 1/3/5 行（Mon/Wed/Fri）
    var weekdaysHtml = '';
    for (var r = 0; r < 7; r++) {
      var label = (r === 0 || r === 2 || r === 4) ? WEEK_DAYS[r] : '';
      weekdaysHtml += '<span class="heatmap-weekday">' + label + '</span>';
    }

    var emptyHtml = posts.length === 0 ? '<div class="heatmap-empty">暂无文章</div>' : '';

    var html =
      '<div class="heatmap-title">' + escapeAttr(title) + '</div>' +
      emptyHtml +
      '<div class="heatmap-scroll">' +
        '<div class="heatmap-main">' +
          '<div class="heatmap-weekdays">' + weekdaysHtml + '</div>' +
          '<div class="heatmap-content">' +
            '<div class="heatmap-months">' + months.join('') + '</div>' +
            '<div class="heatmap-grid">' + cells.join('') + '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    if (showStats) {
      var totalText = (mode === 'more' ? '年度文章' : '半年文章') + ' · ' + countInRange + ' 篇';
      var btnLess = '<button type="button" class="heatmap-range-btn' + (mode === 'less' ? ' active' : '') + '" data-heatmap-range="less">Less</button>';
      var btnMore = '<button type="button" class="heatmap-range-btn' + (mode === 'more' ? ' active' : '') + '" data-heatmap-range="more">More</button>';
      html += '<div class="heatmap-stats">' +
        '<span class="heatmap-total">' + totalText + '</span>' +
        '<div class="heatmap-range">' + btnLess + btnMore + '</div>' +
      '</div>';
    }

    var body = root.querySelector('.heatmap-body');
    if (body) {
      body.innerHTML = html;
    } else {
      root.innerHTML = html;
    }
  }

  // Less/More 事件委托一次绑定：render 只替换 body 的 innerHTML，root 常驻，
  // 事件不重复叠加；点击后更新 dataset.range 再重渲染
  function bindRangeToggle(root) {
    if (typeof bindPageEvent !== 'function') return;
    bindPageEvent(root, 'click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('[data-heatmap-range]') : null;
      if (!btn) return;
      var mode = btn.getAttribute('data-heatmap-range');
      if (mode !== 'less' && mode !== 'more') return;
      root.dataset.range = mode;
      render(root, mode);
    });
  }

  function init(root) {
    if (!root || root.dataset.initialized) return;
    root.dataset.initialized = 'true';

    // bindPageEvent 只在异步回调中调用：首载 content 脚本先于 layout 底部 main.js 执行，
    // 同步调用会 ReferenceError；此时 main.js 必已执行
    fetchAllPosts().then(function () {
      if (!document.contains(root)) return; // PJAX 快速切走时丢弃
      render(root, root.dataset.range === 'less' ? 'less' : 'more');
      bindRangeToggle(root);
    });
  }

  window.SerendipityHeatmap = { init: init, fetchAllPosts: fetchAllPosts };

  // defer 脚本执行时 DOM 已就绪，自动初始化页面上所有容器
  document.querySelectorAll('[data-heatmap]').forEach(init);
})();
