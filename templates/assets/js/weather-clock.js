/**
 * Theme: theme-Serenity
 * Author: Serenity
 * Build: 2026-07-10 21:20:49
 * Fingerprint: 821f517d56c40c00
 * Copyright (c) 2026 Serenity. All rights reserved.
 */

/**
 * 首页半圆天气时钟组件
 * 显示时间、城市、天气、温度
 */
(function() {
  const CACHE_KEY = 'serenity_weather_cache';
  const CACHE_DURATION = 60 * 60 * 1000; // 1小时缓存

  // 更新时间
  function updateTime() {
    const timeEl = document.getElementById('heroTime');
    if (!timeEl) return;
    
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    timeEl.textContent = `${hours}:${minutes}`;
  }

  // 获取缓存的天气数据
  function getCachedWeather() {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
      }
    } catch (e) {}
    return null;
  }

  // 缓存天气数据
  function cacheWeather(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (e) {}
  }

  // 根据天气代码获取对应的 QWeather 图标类名
  function getWeatherIcon(code) {
    const codeNum = parseInt(code);
    // 心知天气代码 -> QWeather 图标代码映射
    const iconMap = {
      // 晴
      0: '100', 1: '150', 2: '100', 3: '150',
      // 多云
      4: '101', 5: '151', 6: '102', 7: '152', 8: '103', 9: '104',
      // 阴
      10: '104',
      // 阵雨
      11: '300', 12: '301', 13: '302',
      // 雷阵雨
      14: '302', 15: '303', 16: '304', 17: '303', 18: '304',
      // 雨
      19: '305', 20: '306', 21: '307', 22: '308', 23: '309', 24: '310', 25: '311',
      // 雪
      26: '400', 27: '401', 28: '402', 29: '403', 30: '404', 31: '405', 32: '406',
      // 雨夹雪
      33: '404', 34: '405', 35: '406',
      // 雾霾
      36: '500', 37: '501', 38: '502',
      // 风
      39: '503'
    };
    const qCode = iconMap[codeNum] || '999';
    return `qi-${qCode}`;
  }

  // 更新天气显示
  function updateWeatherDisplay(data) {
    const cityEl = document.getElementById('heroCity');
    const weatherEl = document.getElementById('heroWeather');
    const tempEl = document.getElementById('heroTemp');

    if (cityEl && data.city) {
      cityEl.textContent = data.city;
    }
    if (weatherEl && data.text) {
      const iconClass = getWeatherIcon(data.code);
      weatherEl.innerHTML = `<i class="${iconClass}"></i> ${data.text}`;
    }
    if (tempEl && data.temperature) {
      tempEl.textContent = `${data.temperature}°C`;
    }
  }

  // 获取天气数据
  async function fetchWeather() {
    const config = window.WEATHER_CONFIG;
    if (!config || !config.apiKey) {
      console.log('Weather: No API key configured');
      return;
    }

    // 先检查缓存
    const cached = getCachedWeather();
    if (cached) {
      updateWeatherDisplay(cached);
      return;
    }

    try {
      // 使用 ipify.cn 获取 IP 地址（与 theme-clarity 相同的方式）
      const ipResponse = await fetch('https://api.ipify.cn/?format=json');
      const ipData = await ipResponse.json();
      
      if (!ipData.ip) {
        throw new Error('IP Error');
      }

      // 调用心知天气 API，直接使用 IP 地址定位
      const weatherResponse = await fetch(
        `https://api.seniverse.com/v3/weather/now.json?key=${config.apiKey}&location=${ipData.ip}&language=zh-Hans&unit=c`
      );
      const weatherData = await weatherResponse.json();

      if (!weatherData.results || !weatherData.results[0]) {
        throw new Error('Weather API Error');
      }

      const result = weatherData.results[0];
      const data = {
        temperature: result.now.temperature,
        text: result.now.text,
        code: result.now.code,
        city: result.location.name
      };

      // 缓存并显示
      cacheWeather(data);
      updateWeatherDisplay(data);

    } catch (error) {
      console.log('Weather fetch error:', error.message);
      // 显示默认值
      const cityEl = document.getElementById('heroCity');
      if (cityEl) cityEl.textContent = '--';
    }
  }

  // 初始化
  function init() {
    const config = window.WEATHER_CONFIG;
    if (!config) return;

    // 立即更新时间
    if (config.showTime) {
      updateTime();
      // 每分钟更新时间
      setInterval(updateTime, 60000);
    }

    // 获取天气
    if (config.showWeather || config.showTemperature || config.showCity) {
      fetchWeather();
    }
  }

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
