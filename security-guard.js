/**
 * ==============================================================================
 * ENTERPRISE ANTI-INSPECTION & RUNTIME INTEGRITY GUARD (UIT DEFENSE LAYER)
 * ==============================================================================
 * - Disables DevTools Hotkeys (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U)
 * - Prevents Right-Click Context Menu Inspection
 * - Cloaks and Sanitizes Production Console Logs
 * - Real-Time Execution Timing & Anti-Tampering Watchdog
 */
(function() {
  'use strict';

  // 1. Production Console Cloaking & ASCII Shield Banner
  try {
    const isProduction = !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');
    if (isProduction && !window.location.search.includes('debug=true')) {
      const originalWarn = console.warn;
      const originalError = console.error;
      
      // Override standard loggers
      console.log = function() {};
      console.info = function() {};
      console.debug = function() {};
      console.dir = function() {};
      console.table = function() {};

      // Preserve clean stylized warning for curious students
      setTimeout(() => {
        originalWarn(
          '%c⚠️ DKHP UIT SECURITY SYSTEM%c\n\nĐây là khu vực dành cho nhà phát triển hệ thống. Việc can thiệp hoặc thay đổi mã nguồn tại Console có thể dẫn đến lỗi dữ liệu thời khóa biểu và bị từ chối truy cập!',
          'background: #1e1b4b; color: #818cf8; font-size: 16px; font-weight: 800; padding: 8px 14px; border-radius: 6px; border: 1px solid #6366f1;',
          'color: #94a3b8; font-size: 12px; font-weight: 500;'
        );
      }, 500);
    }
  } catch (e) {}

  // 2. Anti-DevTools Keyboard Shortcuts Interceptor
  document.addEventListener('keydown', function(e) {
    // Check if user is in input or textarea (allow normal typing)
    const activeEl = document.activeElement;
    const isEditing = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

    // F12 (DevTools)
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+Shift+I (Inspector) or Ctrl+Shift+J (Console) or Ctrl+Shift+C (Inspect Element)
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c' || e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+U (View Source)
    if (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.keyCode === 85)) {
      if (!isEditing) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }
  }, { capture: true });

  // 3. Right-Click Context Menu Guard (Disabled on non-input areas)
  document.addEventListener('contextmenu', function(e) {
    const target = e.target;
    // Allow context menu only inside inputs and textareas for copy/paste
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return true;
    }
    // Prevent context menu to deter Inspect Element
    e.preventDefault();
    return false;
  }, { capture: true });

  // 4. Lightweight Anti-Debugging Timing Watchdog
  let devToolsCheckCounter = 0;
  function startAntiDebugWatchdog() {
    const isProd = !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');
    if (!isProd || window.location.search.includes('debug=true')) return;

    setInterval(function() {
      const startTime = performance.now();
      // Probe debugger state
      (function() {
        return false;
      }['constructor']('debugger')());
      const duration = performance.now() - startTime;
      
      // If execution was halted by debugger breakpoint for > 150ms
      if (duration > 150) {
        devToolsCheckCounter++;
        if (devToolsCheckCounter > 2) {
          console.clear();
        }
      }
    }, 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startAntiDebugWatchdog);
  } else {
    startAntiDebugWatchdog();
  }
})();
