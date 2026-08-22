/**
 * UIT TIMETABLE MASTER - CORE APPLICATION ENGINE
 * High-performance course scheduler with conflict detection, practice hierarchy,
 * accurate credit calculation, and dedicated searchable filters for Subjects & Lecturers.
 */

// ==============================================================================
// 1. CONSTANTS & PERIOD DEFINITIONS
// ==============================================================================
const PERIOD_TIMES = {
  1:  { name: 'Tiết 1',  time: '07:30 - 08:15', shift: 'morning' },
  2:  { name: 'Tiết 2',  time: '08:15 - 09:00', shift: 'morning' },
  3:  { name: 'Tiết 3',  time: '09:00 - 09:45', shift: 'morning' },
  4:  { name: 'Tiết 4',  time: '10:00 - 10:45', shift: 'morning' },
  5:  { name: 'Tiết 5',  time: '10:45 - 11:30', shift: 'morning' },
  6:  { name: 'Tiết 6',  time: '13:00 - 13:45', shift: 'afternoon' },
  7:  { name: 'Tiết 7',  time: '13:45 - 14:30', shift: 'afternoon' },
  8:  { name: 'Tiết 8',  time: '14:30 - 15:15', shift: 'afternoon' },
  9:  { name: 'Tiết 9',  time: '15:30 - 16:15', shift: 'afternoon' },
  10: { name: 'Tiết 10', time: '16:15 - 17:00', shift: 'afternoon' },
  11: { name: 'Tiết 11', time: '17:45 - 18:30', shift: 'evening' },
  12: { name: 'Tiết 12', time: '18:30 - 19:15', shift: 'evening' },
  13: { name: 'Tiết 13', time: '19:15 - 20:00', shift: 'evening' },
  14: { name: 'Tiết 14', time: '20:00 - 20:45', shift: 'evening' }
};

const COLOR_PALETTE = [
  { bg: 'linear-gradient(145deg, #1e1b4b 0%, #0f172a 100%)', border: '#818cf8', accent: '#a5b4fc' }, // Indigo Deep
  { bg: 'linear-gradient(145deg, #064e3b 0%, #022c22 100%)', border: '#10b981', accent: '#34d399' }, // Emerald Deep
  { bg: 'linear-gradient(145deg, #7c2d12 0%, #431407 100%)', border: '#f97316', accent: '#fb923c' }, // Orange Deep
  { bg: 'linear-gradient(145deg, #581c87 0%, #3b0764 100%)', border: '#a855f7', accent: '#c084fc' }, // Purple Deep
  { bg: 'linear-gradient(145deg, #1e3a8a 0%, #172554 100%)', border: '#3b82f6', accent: '#60a5fa' }, // Blue Deep
  { bg: 'linear-gradient(145deg, #164e63 0%, #083344 100%)', border: '#06b6d4', accent: '#22d3ee' }, // Cyan Deep
  { bg: 'linear-gradient(145deg, #78350f 0%, #451a03 100%)', border: '#f59e0b', accent: '#fbbf24' }, // Amber Deep
  { bg: 'linear-gradient(145deg, #831843 0%, #500724 100%)', border: '#f43f5e', accent: '#fb7185' }, // Rose Deep
  { bg: 'linear-gradient(145deg, #134e4a 0%, #042f2e 100%)', border: '#14b8a6', accent: '#2dd4bf' }, // Teal Deep
  { bg: 'linear-gradient(145deg, #701a75 0%, #4a044e 100%)', border: '#d946ef', accent: '#e879f9' }  // Fuchsia Deep
];

const MAX_EXCEL_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_JSON_IMPORT_BYTES = 1024 * 1024;
const MAX_PLAN_COUNT = 30;
const MAX_SELECTED_PER_PLAN = 200;
const MAX_DATASET_COURSES = 5000;
const MAX_TOTAL_PRACTICES = 10000;

// ==============================================================================
// 2. STATE MANAGEMENT
// ==============================================================================
let allCourses = [];
let courseMap = new Map(); // id -> course
let plans = {};
let currentPlanId = 'plan_1';

let uniqueSubjectsList = []; // Array of { maMH, tenMH, count }
let uniqueTeachersList = []; // Array of { name, count }

let savedExcluded = [];
try {
  const raw = localStorage.getItem('dkhp_excluded_teachers');
  if (raw) savedExcluded = JSON.parse(raw);
} catch (e) {}

let currentWeekView = 'all'; // 'all' | 'theory_only' | 'practice_only'

let currentFilters = {
  selectedSubject: 'all',
  selectedTeacher: 'all',
  excludedTeachers: Array.isArray(savedExcluded) ? savedExcluded : [],
  faculty: 'all',
  day: 'all',
  shift: 'all',
  hideConflict: false,
  onlySelected: false
};

function saveExcludedTeachersToStorage() {
  safeLocalStorageSet('dkhp_excluded_teachers', JSON.stringify(currentFilters.excludedTeachers || []));
}

function addExcludedTeacher(name) {
  if (!name || typeof name !== 'string') return;
  const cleanName = name.trim();
  if (!cleanName || cleanName.includes('Chưa phân công')) return;
  if (!currentFilters.excludedTeachers) currentFilters.excludedTeachers = [];
  if (!currentFilters.excludedTeachers.includes(cleanName)) {
    currentFilters.excludedTeachers.push(cleanName);
    saveExcludedTeachersToStorage();
    renderExcludedTeachersChips();
    renderAll();
    showAppToast(`🚫 Đã thêm "${cleanName}" vào danh sách loại trừ`);
  }
}

function removeExcludedTeacher(name) {
  if (!currentFilters.excludedTeachers) return;
  currentFilters.excludedTeachers = currentFilters.excludedTeachers.filter(t => t !== name);
  saveExcludedTeachersToStorage();
  renderExcludedTeachersChips();
  renderAll();
  showAppToast(`✅ Đã bỏ loại trừ: "${name}"`);
}

function clearAllExcludedTeachers() {
  currentFilters.excludedTeachers = [];
  saveExcludedTeachersToStorage();
  renderExcludedTeachersChips();
  renderAll();
  showAppToast('✅ Đã xóa toàn bộ danh sách GV loại trừ');
}

function renderExcludedTeachersChips() {
  const container = document.getElementById('excludedTeachersChipsBar');
  const autoSchedContainer = document.getElementById('autoSchedExcludedChipsList');
  const autoSchedCountBadge = document.getElementById('autoSchedExcludedCountBadge');
  const clearBtn = document.getElementById('excludeTeacherClearBtn');

  const teachers = currentFilters.excludedTeachers || [];

  const autoSchedClearBtn = document.getElementById('autoSchedExcludeTeacherClearBtn');
  if (clearBtn) {
    clearBtn.style.display = teachers.length > 0 ? 'flex' : 'none';
  }
  if (autoSchedClearBtn) {
    autoSchedClearBtn.style.display = teachers.length > 0 ? 'flex' : 'none';
  }

  if (autoSchedCountBadge) {
    autoSchedCountBadge.textContent = `${teachers.length} GV`;
  }

  // Render on Sidebar
  if (container) {
    if (teachers.length === 0) {
      container.innerHTML = '';
      container.style.display = 'none';
    } else {
      const chipsHtml = teachers.map(t => `
        <span class="excluded-teacher-chip">
          <i class="fa-solid fa-user-slash" style="font-size: 10px;"></i>
          <span>${escapeHtml(t)}</span>
          <button type="button" data-remove-excluded-teacher="${escapeHtml(t)}" title="Bỏ loại trừ GV này">&times;</button>
        </span>
      `).join('');

      container.innerHTML = chipsHtml + `
        <button type="button" class="btn btn-secondary" style="padding: 1px 7px; font-size: 11px; border-radius: 9999px; color: #ef4444;" data-clear-all-excluded="true" title="Xóa tất cả GV loại trừ">
          <i class="fa-solid fa-trash-can" style="font-size: 9px;"></i> Xóa hết (${teachers.length})
        </button>
      `;
      container.style.display = 'flex';
    }
  }

  // Render in Auto-Scheduler modal
  if (autoSchedContainer) {
    if (teachers.length === 0) {
      autoSchedContainer.innerHTML = `<span style="font-size: 11px; color: var(--text-muted);">(Chưa loại trừ GV nào - Tìm kiếm ở trên hoặc bấm né nhanh)</span>`;
    } else {
      const chipsHtml = teachers.map(t => `
        <span class="excluded-teacher-chip">
          <i class="fa-solid fa-user-slash" style="font-size: 10px;"></i>
          <span>${escapeHtml(t)}</span>
          <button type="button" data-remove-excluded-teacher="${escapeHtml(t)}" title="Bỏ loại trừ">&times;</button>
        </span>
      `).join('');

      autoSchedContainer.innerHTML = chipsHtml + `
        <button type="button" class="btn btn-secondary" style="padding: 1px 7px; font-size: 11px; border-radius: 9999px; color: #ef4444;" data-clear-all-excluded="true" title="Xóa tất cả GV loại trừ">
          <i class="fa-solid fa-trash-can" style="font-size: 9px;"></i> Xóa hết (${teachers.length})
        </button>
      `;
    }
  }
}
// Helper for strict XSS / HTML Injection Defense
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function clearElementChildren(element) {
  if (!element) return;
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

function appendTextNode(element, text) {
  element.appendChild(document.createTextNode(text));
}

function safeLocalStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.error(`[STORAGE] Failed to save key "${key}"`, err);
    if (typeof showAppToast === 'function') {
      showAppToast('⚠️ Không thể lưu dữ liệu cục bộ. Trình duyệt có thể đã đầy bộ nhớ.');
    }
    return false;
  }
}

function getPeriodsArray(item) {
  return Array.isArray(item?.tiet)
    ? item.tiet.filter(period => Number.isInteger(period) && period >= 1 && period <= 14)
    : [];
}

function isSafeCourseRecord(item, isPractice = false) {
  if (!item || typeof item !== 'object') return false;
  if (typeof item.id !== 'string' || !item.id.trim()) return false;
  if (typeof item.maLop !== 'string' || !item.maLop.trim()) return false;
  if (typeof item.maMH !== 'string' || !item.maMH.trim()) return false;
  if (typeof item.tenMH !== 'string') return false;
  if (typeof item.tenGV !== 'string') return false;
  if (typeof item.soTC !== 'number' || !Number.isFinite(item.soTC) || item.soTC < 0 || item.soTC > 12) return false;
  if (!Array.isArray(item.tiet)) return false;
  if (getPeriodsArray(item).length !== item.tiet.length) return false;
  if (!(typeof item.thu === 'number' || item.thu === '*')) return false;
  if (typeof item.thu === 'number' && (item.thu < 2 || item.thu > 7)) return false;
  if (!isPractice && !Array.isArray(item.practices)) return false;
  return true;
}

function sanitizeImportedDataset(data) {
  if (!Array.isArray(data) || data.length === 0 || data.length > MAX_DATASET_COURSES) {
    throw new Error('DATASET_SIZE_INVALID');
  }

  let totalPractices = 0;
  const courseIds = new Set();
  data.forEach(course => {
    if (!isSafeCourseRecord(course, false)) {
      throw new Error('DATASET_SCHEMA_INVALID');
    }
    if (courseIds.has(course.id)) {
      throw new Error('DATASET_DUPLICATE_ID');
    }
    courseIds.add(course.id);

    totalPractices += course.practices.length;
    if (totalPractices > MAX_TOTAL_PRACTICES) {
      throw new Error('DATASET_PRACTICE_LIMIT_EXCEEDED');
    }

    const practiceIds = new Set();
    course.practices.forEach(practice => {
      if (!isSafeCourseRecord(practice, true)) {
        throw new Error('DATASET_PRACTICE_SCHEMA_INVALID');
      }
      if (practiceIds.has(practice.id) || courseIds.has(practice.id)) {
        throw new Error('DATASET_DUPLICATE_ID');
      }
      practiceIds.add(practice.id);
      courseIds.add(practice.id);
    });
  });

  return data;
}

function sanitizeImportedPlans(rawPlans) {
  if (!rawPlans || typeof rawPlans !== 'object' || Array.isArray(rawPlans)) {
    throw new Error('PLANS_SCHEMA_INVALID');
  }

  const entries = Object.entries(rawPlans);
  if (entries.length === 0 || entries.length > MAX_PLAN_COUNT) {
    throw new Error('PLAN_COUNT_INVALID');
  }

  const sanitized = {};
  for (const [planId, plan] of entries) {
    if (typeof planId !== 'string' || !planId.trim()) {
      throw new Error('PLAN_ID_INVALID');
    }
    if (!plan || typeof plan !== 'object') {
      throw new Error('PLAN_SCHEMA_INVALID');
    }
    const name = typeof plan.name === 'string' && plan.name.trim() ? plan.name.trim().slice(0, 120) : 'Kế hoạch';
    const selected = Array.isArray(plan.selected)
      ? plan.selected.filter(id => typeof id === 'string').slice(0, MAX_SELECTED_PER_PLAN)
      : [];
    const practiceChoices = {};
    if (plan.practiceChoices && typeof plan.practiceChoices === 'object' && !Array.isArray(plan.practiceChoices)) {
      Object.entries(plan.practiceChoices).forEach(([theoryId, practiceId]) => {
        if (typeof theoryId === 'string' && typeof practiceId === 'string') {
          practiceChoices[theoryId] = practiceId;
        }
      });
    }
    sanitized[planId] = { name, selected, practiceChoices };
  }

  return sanitized;
}

function getActivePracticeChoices() {
  if (!plans || !plans[currentPlanId]) return {};
  if (!plans[currentPlanId].practiceChoices) {
    plans[currentPlanId].practiceChoices = {};
  }
  return plans[currentPlanId].practiceChoices;
}

// ==============================================================================
// 3. INITIALIZATION
// ==============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadInitialDataset();
  loadPlansFromStorage();
  buildUniqueMetaLists();
  initSearchableComboboxes();
  initMobileViewSwitcher();
  bindEvents();
  renderAll();
});

function initMobileViewSwitcher() {
  const switcher = document.getElementById('mobileViewSwitcher');
  const appContainer = document.querySelector('.app-container');
  if (!switcher || !appContainer) return;

  switcher.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-mobile-view]');
    if (!btn) return;

    const view = btn.getAttribute('data-mobile-view');
    switcher.querySelectorAll('.mobile-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    appContainer.setAttribute('data-mobile-view', view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  const btnMobileSelected = document.getElementById('btnMobileSelectedList');
  if (btnMobileSelected) {
    btnMobileSelected.addEventListener('click', () => {
      renderSelectedTable();
      openModal('modalSelectedCourses');
    });
  }
}

function loadInitialDataset() {
  const customData = localStorage.getItem('tkb_custom_dataset');
  if (customData) {
    try {
      allCourses = sanitizeImportedDataset(JSON.parse(customData));
    } catch (e) {
      console.warn('[SECURITY] Invalid custom dataset detected, reverting to bundled dataset.', e);
      localStorage.removeItem('tkb_custom_dataset');
      allCourses = (typeof DEFAULT_TIMETABLE_DATA !== 'undefined') ? DEFAULT_TIMETABLE_DATA : [];
    }
  } else {
    allCourses = (typeof DEFAULT_TIMETABLE_DATA !== 'undefined') ? DEFAULT_TIMETABLE_DATA : [];
  }
  buildCourseMap();
}

function buildCourseMap() {
  courseMap.clear();
  allCourses.forEach(c => {
    courseMap.set(c.id, c);
    if (c.practices && c.practices.length > 0) {
      c.practices.forEach(p => courseMap.set(p.id, p));
    }
  });
}

function getDefaultPlans() {
  return {
    'plan_1': {
      name: 'Kế hoạch 1 (Chính)',
      selected: ['SS007.R13', 'IT007.R17', 'NT105.R11', 'MA005.R14', 'IT004.R118', 'NT106.R13'],
      practiceChoices: {
        'IT007.R17': 'IT007.R17.1',
        'NT105.R11': 'NT105.R11.1',
        'IT004.R118': 'IT004.R118.1',
        'NT106.R13': 'NT106.R13.1'
      }
    },
    'plan_2': { name: 'Kế hoạch 2 (Dự phòng)', selected: [], practiceChoices: {} },
    'plan_3': { name: 'Kế hoạch 3', selected: [], practiceChoices: {} }
  };
}

function loadPlansFromStorage() {
  const savedPlans = localStorage.getItem('tkb_plans');

  if (savedPlans) {
    try {
      const parsed = JSON.parse(savedPlans);
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        plans = sanitizeImportedPlans(parsed);
      } else {
        plans = getDefaultPlans();
      }
    } catch (e) {
      console.warn('Error parsing saved plans, falling back to defaults:', e);
      plans = getDefaultPlans();
    }
  } else {
    plans = getDefaultPlans();
  }

  // If plans exist but all plans are empty, load default plan_1 courses
  const allEmpty = Object.values(plans).every(p => !p.selected || p.selected.length === 0);
  if (allEmpty && plans['plan_1']) {
    plans['plan_1'].selected = ['SS007.R13', 'IT007.R17', 'NT105.R11', 'MA005.R14', 'IT004.R118', 'NT106.R13'];
    plans['plan_1'].practiceChoices = {
      'IT007.R17': 'IT007.R17.1',
      'NT105.R11': 'NT105.R11.1',
      'IT004.R118': 'IT004.R118.1',
      'NT106.R13': 'NT106.R13.1'
    };
  }

  // Ensure each plan has practiceChoices dictionary
  Object.keys(plans).forEach(pid => {
    if (!plans[pid].practiceChoices) {
      plans[pid].practiceChoices = {};
    }
  });

  const savedActivePlan = localStorage.getItem('tkb_active_plan');
  if (savedActivePlan && plans[savedActivePlan]) {
    currentPlanId = savedActivePlan;
  } else {
    currentPlanId = Object.keys(plans)[0] || 'plan_1';
  }

  const DEFAULT_COURSE_SELECTION = ['SS007.R13', 'IT007.R17', 'NT105.R11', 'MA005.R14', 'IT004.R118', 'NT106.R13'];
  const DEFAULT_PRACTICE_CHOICES = {
    'IT007.R17': 'IT007.R17.1',
    'NT105.R11': 'NT105.R11.1',
    'IT004.R118': 'IT004.R118.1',
    'NT106.R13': 'NT106.R13.1'
  };

  // If the active plan is empty, switch to any plan with courses or auto-populate default courses
  if (plans[currentPlanId] && (!plans[currentPlanId].selected || plans[currentPlanId].selected.length === 0)) {
    const planWithCourses = Object.keys(plans).find(pid => plans[pid].selected && plans[pid].selected.length > 0);
    if (planWithCourses) {
      currentPlanId = planWithCourses;
    } else {
      plans[currentPlanId].selected = [...DEFAULT_COURSE_SELECTION];
      plans[currentPlanId].practiceChoices = { ...DEFAULT_PRACTICE_CHOICES };
      savePlansToStorage();
    }
  }
}

function savePlansToStorage() {
  const plansJson = JSON.stringify(plans);
  if (!safeLocalStorageSet('tkb_plans', plansJson)) return;
  safeLocalStorageSet('tkb_active_plan', currentPlanId);
  if (window.DKHP_SECURITY) {
    safeLocalStorageSet('tkb_plans_fast_hash', DKHP_SECURITY.fastHash(plansJson));
  }

  if (window.DKHP_SECURITY) {
    DKHP_SECURITY.sha256(plansJson).then(hash => {
      safeLocalStorageSet('tkb_plans_sha256', hash);
    }).catch(err => console.error(err));
  }
}

// ==============================================================================
// 4. THEME MANAGEMENT
// ==============================================================================
function initTheme() {
  const savedTheme = localStorage.getItem('tkb_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('tkb_theme', next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('themeIcon');
  if (icon) {
    icon.className = theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  }
}

// ==============================================================================
// 5. SEARCHABLE COMBOBOXES (SUBJECTS & TEACHERS)
// ==============================================================================
function buildUniqueMetaLists() {
  const sMap = new Map();
  const tMap = new Map();

  allCourses.forEach(c => {
    if (c.maMH) {
      if (!sMap.has(c.maMH)) {
        sMap.set(c.maMH, { maMH: c.maMH, tenMH: c.tenMH, count: 1 });
      } else {
        sMap.get(c.maMH).count += 1;
      }
    }

    if (c.tenGV && c.tenGV.trim()) {
      const t = c.tenGV.trim();
      tMap.set(t, (tMap.get(t) || 0) + 1);
    }

    if (c.practices) {
      c.practices.forEach(p => {
        if (p.tenGV && p.tenGV.trim()) {
          const pt = p.tenGV.trim();
          tMap.set(pt, (tMap.get(pt) || 0) + 1);
        }
      });
    }
  });

  uniqueSubjectsList = Array.from(sMap.values()).sort((a, b) => a.maMH.localeCompare(b.maMH));
  uniqueTeachersList = Array.from(tMap.entries()).map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

function removeDiacritics(str) {
  return str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '';
}

function initSearchableComboboxes() {
  const subjectInput = document.getElementById('subjectSearchInput');
  const subjectDropdown = document.getElementById('subjectDropdownList');
  const subjectClear = document.getElementById('subjectClearBtn');

  const teacherInput = document.getElementById('teacherSearchInput');
  const teacherDropdown = document.getElementById('teacherDropdownList');
  const teacherClear = document.getElementById('teacherClearBtn');

  // --- Subject Combobox ---
  function renderSubjectDropdown(filterText = '') {
    const q = removeDiacritics(filterText.trim());
    const matched = uniqueSubjectsList.filter(s => 
      !q || removeDiacritics(s.maMH).includes(q) || removeDiacritics(s.tenMH).includes(q)
    );

    if (matched.length === 0) {
      subjectDropdown.innerHTML = `<div style="padding: 8px; font-size: 11.5px; color: var(--text-muted); text-align: center;">Không tìm thấy môn học</div>`;
      return;
    }

    subjectDropdown.innerHTML = '';
    matched.slice(0, 50).forEach(s => {
      const opt = document.createElement('div');
      opt.className = `combobox-option ${currentFilters.selectedSubject === s.maMH ? 'active' : ''}`;
      opt.innerHTML = `
        <span><strong>${s.maMH}</strong> - ${s.tenMH}</span>
        <span class="combobox-count-badge">${s.count} lớp</span>
      `;
      opt.addEventListener('click', () => {
        currentFilters.selectedSubject = s.maMH;
        subjectInput.value = `${s.maMH} - ${s.tenMH}`;
        subjectClear.style.display = 'flex';
        subjectDropdown.classList.remove('open');
        renderAll();
      });
      subjectDropdown.appendChild(opt);
    });
  }

  subjectInput.addEventListener('focus', () => {
    renderSubjectDropdown(subjectInput.value);
    subjectDropdown.classList.add('open');
    teacherDropdown.classList.remove('open');
  });

  subjectInput.addEventListener('input', (e) => {
    subjectClear.style.display = e.target.value ? 'flex' : 'none';
    renderSubjectDropdown(e.target.value);
    subjectDropdown.classList.add('open');
    // If text changed, update query filter
    currentFilters.selectedSubject = 'all';
    renderAll();
  });

  subjectClear.addEventListener('click', () => {
    subjectInput.value = '';
    currentFilters.selectedSubject = 'all';
    subjectClear.style.display = 'none';
    subjectDropdown.classList.remove('open');
    renderAll();
  });

  // --- Teacher Combobox ---
  function renderTeacherDropdown(filterText = '') {
    const q = removeDiacritics(filterText.trim());
    const matched = uniqueTeachersList.filter(t => 
      !q || removeDiacritics(t.name).includes(q)
    );

    if (matched.length === 0) {
      teacherDropdown.innerHTML = `<div style="padding: 8px; font-size: 11.5px; color: var(--text-muted); text-align: center;">Không tìm thấy giảng viên</div>`;
      return;
    }

    teacherDropdown.innerHTML = '';
    matched.slice(0, 50).forEach(t => {
      const opt = document.createElement('div');
      opt.className = `combobox-option ${currentFilters.selectedTeacher === t.name ? 'active' : ''}`;
      opt.innerHTML = `
        <span><strong>${t.name}</strong></span>
        <span class="combobox-count-badge">${t.count} lớp</span>
      `;
      opt.addEventListener('click', () => {
        currentFilters.selectedTeacher = t.name;
        teacherInput.value = t.name;
        teacherClear.style.display = 'flex';
        teacherDropdown.classList.remove('open');
        renderAll();
      });
      teacherDropdown.appendChild(opt);
    });
  }

  teacherInput.addEventListener('focus', () => {
    renderTeacherDropdown(teacherInput.value);
    teacherDropdown.classList.add('open');
    subjectDropdown.classList.remove('open');
  });

  teacherInput.addEventListener('input', (e) => {
    teacherClear.style.display = e.target.value ? 'flex' : 'none';
    renderTeacherDropdown(e.target.value);
    teacherDropdown.classList.add('open');
    currentFilters.selectedTeacher = 'all';
    renderAll();
  });

  teacherClear.addEventListener('click', () => {
    teacherInput.value = '';
    currentFilters.selectedTeacher = 'all';
    teacherClear.style.display = 'none';
    teacherDropdown.classList.remove('open');
    renderAll();
  });

  // --- Exclude Teacher Combobox (Multi-selection) ---
  const excludeInput = document.getElementById('excludeTeacherSearchInput');
  const excludeDropdown = document.getElementById('excludeTeacherDropdownList');
  const excludeClear = document.getElementById('excludeTeacherClearBtn');

  function renderExcludeTeacherDropdown(filterText = '') {
    if (!excludeDropdown) return;
    const q = removeDiacritics(filterText.trim());
    const matched = uniqueTeachersList.filter(t => 
      !q || removeDiacritics(t.name).includes(q)
    );

    if (matched.length === 0) {
      excludeDropdown.innerHTML = `<div style="padding: 8px; font-size: 11.5px; color: var(--text-muted); text-align: center;">Không tìm thấy giảng viên</div>`;
      return;
    }

    excludeDropdown.innerHTML = '';
    matched.slice(0, 60).forEach(t => {
      const isExcluded = (currentFilters.excludedTeachers || []).includes(t.name);
      const opt = document.createElement('div');
      opt.className = `combobox-option ${isExcluded ? 'is-excluded active' : ''}`;
      opt.innerHTML = `
        <div style="display: flex; align-items: center; gap: 7px;">
          <i class="fa-solid ${isExcluded ? 'fa-square-check' : 'fa-square'}" style="color: ${isExcluded ? '#ef4444' : 'var(--text-muted)'}; font-size: 13px;"></i>
          <span><strong>${escapeHtml(t.name)}</strong></span>
        </div>
        <span class="combobox-count-badge" style="${isExcluded ? 'color: #ef4444; border-color: rgba(239,68,68,0.35); background: rgba(239,68,68,0.1);' : ''}">
          ${isExcluded ? 'Đã loại trừ' : `${t.count} lớp`}
        </span>
      `;
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isExcluded) {
          removeExcludedTeacher(t.name);
        } else {
          addExcludedTeacher(t.name);
        }
        renderExcludeTeacherDropdown(excludeInput ? excludeInput.value : '');
      });
      excludeDropdown.appendChild(opt);
    });
  }

  if (excludeInput && excludeDropdown) {
    excludeInput.addEventListener('focus', () => {
      renderExcludeTeacherDropdown(excludeInput.value);
      excludeDropdown.classList.add('open');
      if (subjectDropdown) subjectDropdown.classList.remove('open');
      if (teacherDropdown) teacherDropdown.classList.remove('open');
    });

    excludeInput.addEventListener('input', (e) => {
      renderExcludeTeacherDropdown(e.target.value);
      excludeDropdown.classList.add('open');
    });

    if (excludeClear) {
      excludeClear.addEventListener('click', () => {
        clearAllExcludedTeachers();
        if (excludeInput) excludeInput.value = '';
        excludeDropdown.classList.remove('open');
      });
    }
  }

  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-combobox')) {
      if (subjectDropdown) subjectDropdown.classList.remove('open');
      if (teacherDropdown) teacherDropdown.classList.remove('open');
      if (excludeDropdown) excludeDropdown.classList.remove('open');
    }
  });
}

// ==============================================================================
// 6. CONFLICT DETECTION ENGINE
// ==============================================================================
function checkTwoItemsOverlap(itemA, itemB) {
  if (!itemA || !itemB || itemA.id === itemB.id) return false;
  if (itemA.thu === '*' || itemB.thu === '*' || !itemA.thu || !itemB.thu) return false;
  if (String(itemA.thu) !== String(itemB.thu)) return false;

  const periodsA = itemA.tiet || [];
  const periodsB = itemB.tiet || [];
  const overlap = periodsA.some(p => periodsB.includes(p));
  if (!overlap) return false;

  const cA = itemA.cachTuan || 1;
  const cB = itemB.cachTuan || 1;
  if (cA === 2 && cB === 2 && itemA.tuanChanLe && itemB.tuanChanLe && itemA.tuanChanLe !== itemB.tuanChanLe) {
    return false;
  }

  return true;
}

function getSelectedFlatItems() {
  const currentSelectedIds = plans[currentPlanId]?.selected || [];
  const pChoices = getActivePracticeChoices();
  const result = [];
  currentSelectedIds.forEach(id => {
    const item = courseMap.get(id);
    if (item) {
      result.push(item);
      if (!item.isTH && pChoices[id]) {
        const pItem = courseMap.get(pChoices[id]);
        if (pItem) result.push(pItem);
      }
    }
  });
  return result;
}

function detectAllConflicts() {
  const flatItems = getSelectedFlatItems();
  const conflicts = [];
  const conflictIds = new Set();

  for (let i = 0; i < flatItems.length; i++) {
    for (let j = i + 1; j < flatItems.length; j++) {
      const a = flatItems[i];
      const b = flatItems[j];
      if (checkTwoItemsOverlap(a, b)) {
        conflicts.push({ itemA: a, itemB: b });
        conflictIds.add(a.id);
        conflictIds.add(b.id);
      }
    }
  }
  return { conflicts, conflictIds };
}

function checkItemConflictWithCurrent(targetItem) {
  if (!targetItem || targetItem.thu === '*') return { hasConflict: false };
  const flatItems = getSelectedFlatItems();
  for (const item of flatItems) {
    if (item.id === targetItem.id) continue;
    if (checkTwoItemsOverlap(targetItem, item)) {
      return {
        hasConflict: true,
        conflictingWith: item
      };
    }
  }
  return { hasConflict: false };
}

// ==============================================================================
// 7. UI RENDERERS
// ==============================================================================
function renderAll() {
  try { renderPlanSelect(); } catch (e) { console.error('renderPlanSelect error:', e); }
  try { renderExcludedTeachersChips(); } catch (e) { console.error('renderExcludedTeachersChips error:', e); }
  try { renderActiveFilterBadges(); } catch (e) { console.error('renderActiveFilterBadges error:', e); }
  try { renderTimetableMatrix(); } catch (e) { console.error('renderTimetableMatrix error:', e); }
  try { renderCourseResults(); } catch (e) { console.error('renderCourseResults error:', e); }
  try { renderStats(); } catch (e) { console.error('renderStats error:', e); }
  try { renderSelectedTable(); } catch (e) { console.error('renderSelectedTable error:', e); }
}

function renderPlanSelect() {
  const sel = document.getElementById('planSelect');
  if (!sel) return;
  sel.innerHTML = '';
  Object.keys(plans).forEach(pid => {
    const opt = document.createElement('option');
    opt.value = pid;
    opt.textContent = plans[pid].name;
    if (pid === currentPlanId) opt.selected = true;
    sel.appendChild(opt);
  });
}

function renderActiveFilterBadges() {
  const bar = document.getElementById('activeFilterTagsBar');
  if (!bar) return;

  const chips = [];

  if (currentFilters.selectedSubject !== 'all') {
    chips.push(`
      <span class="active-tag-chip">
        <span>📚 Môn: ${escapeHtml(currentFilters.selectedSubject)}</span>
        <button data-clear-filter="subject" title="Bỏ lọc môn">&times;</button>
      </span>
    `);
  }

  if (currentFilters.selectedTeacher !== 'all') {
    chips.push(`
      <span class="active-tag-chip">
        <span>👨‍🏫 GV: ${escapeHtml(currentFilters.selectedTeacher)}</span>
        <button data-clear-filter="teacher" title="Bỏ lọc giảng viên">&times;</button>
      </span>
    `);
  }

  if (currentFilters.faculty !== 'all') {
    chips.push(`
      <span class="active-tag-chip">
        <span>🏛️ Khoa: ${escapeHtml(currentFilters.faculty)}</span>
        <button data-clear-filter="faculty" title="Bỏ lọc khoa">&times;</button>
      </span>
    `);
  }

  if (currentFilters.excludedTeachers && currentFilters.excludedTeachers.length > 0) {
    chips.push(`
      <span class="active-tag-chip" style="background-color: rgba(239, 68, 68, 0.15); color: #ef4444; border-color: rgba(239, 68, 68, 0.35);">
        <span>🚫 Né ${currentFilters.excludedTeachers.length} GV</span>
        <button data-clear-filter="excludedTeachers" title="Xóa tất cả GV loại trừ" style="color: #ef4444;">&times;</button>
      </span>
    `);
  }

  if (chips.length > 0) {
    bar.innerHTML = chips.join('') + `
      <button class="btn btn-secondary" style="padding: 1px 6px; font-size: 11px; border-radius: 9999px;" data-clear-all-filters="true">
        Xóa hết lọc
      </button>
    `;
    bar.style.display = 'flex';
  } else {
    bar.innerHTML = '';
    bar.style.display = 'none';
  }
}

window.clearSpecificFilter = function(type) {
  if (type === 'subject') {
    currentFilters.selectedSubject = 'all';
    const sInput = document.getElementById('subjectSearchInput');
    const sClear = document.getElementById('subjectClearBtn');
    if (sInput) sInput.value = '';
    if (sClear) sClear.style.display = 'none';
  } else if (type === 'teacher') {
    currentFilters.selectedTeacher = 'all';
    const tInput = document.getElementById('teacherSearchInput');
    const tClear = document.getElementById('teacherClearBtn');
    if (tInput) tInput.value = '';
    if (tClear) tClear.style.display = 'none';
  } else if (type === 'faculty') {
    currentFilters.faculty = 'all';
    document.querySelectorAll('#facultyFilterRow .filter-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.val === 'all');
    });
  } else if (type === 'excludedTeachers') {
    clearAllExcludedTeachers();
    return;
  }
  renderAll();
};

window.clearAllTagFilters = function() {
  currentFilters.selectedSubject = 'all';
  currentFilters.selectedTeacher = 'all';
  currentFilters.faculty = 'all';
  currentFilters.excludedTeachers = [];
  saveExcludedTeachersToStorage();
  const sInput = document.getElementById('subjectSearchInput');
  const tInput = document.getElementById('teacherSearchInput');
  const eInput = document.getElementById('excludeTeacherSearchInput');
  const sClear = document.getElementById('subjectClearBtn');
  const tClear = document.getElementById('teacherClearBtn');
  const eClear = document.getElementById('excludeTeacherClearBtn');
  if (sInput) sInput.value = '';
  if (tInput) tInput.value = '';
  if (eInput) eInput.value = '';
  if (sClear) sClear.style.display = 'none';
  if (tClear) tClear.style.display = 'none';
  if (eClear) eClear.style.display = 'none';
  document.querySelectorAll('#facultyFilterRow .filter-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.val === 'all');
  });
  renderExcludedTeachersChips();
  renderAll();
};

function getCourseColor(maMH) {
  let hash = 0;
  for (let i = 0; i < maMH.length; i++) {
    hash = maMH.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
}

function renderCourseResults() {
  const container = document.getElementById('courseResultsList');
  const countBadge = document.getElementById('resultsCountBadge');
  if (!container) return;

  const selectedIds = new Set(plans[currentPlanId]?.selected || []);
  const sInputVal = removeDiacritics(document.getElementById('subjectSearchInput')?.value.trim() || '');
  const tInputVal = removeDiacritics(document.getElementById('teacherSearchInput')?.value.trim() || '');

  const filtered = allCourses.filter(c => {
    // 1. Subject Filter (Exact selection or query in subject input)
    if (currentFilters.selectedSubject !== 'all') {
      if (c.maMH !== currentFilters.selectedSubject) return false;
    } else if (sInputVal) {
      const matchMH = removeDiacritics(c.maMH).includes(sInputVal);
      const matchTen = removeDiacritics(c.tenMH).includes(sInputVal);
      const matchLop = removeDiacritics(c.maLop).includes(sInputVal);
      if (!matchMH && !matchTen && !matchLop) return false;
    }

    // 2. Teacher Filter (Exact selection or query in teacher input)
    if (currentFilters.selectedTeacher !== 'all') {
      const matchGV = c.tenGV && c.tenGV.trim() === currentFilters.selectedTeacher;
      const matchTHGV = c.practices && c.practices.some(p => p.tenGV && p.tenGV.trim() === currentFilters.selectedTeacher);
      if (!matchGV && !matchTHGV) return false;
    } else if (tInputVal) {
      const matchGV = removeDiacritics(c.tenGV).includes(tInputVal);
      const matchTHGV = c.practices && c.practices.some(p => removeDiacritics(p.tenGV).includes(tInputVal));
      if (!matchGV && !matchTHGV) return false;
    }

    // 2b. Exclude Teachers Filter (Blacklist)
    if (currentFilters.excludedTeachers && currentFilters.excludedTeachers.length > 0) {
      const isExcludedTheory = c.tenGV && currentFilters.excludedTeachers.includes(c.tenGV.trim());
      if (isExcludedTheory) return false;

      // If course has practices, check if all practices are taught by excluded teachers
      if (c.practices && c.practices.length > 0) {
        const availablePractices = c.practices.filter(p => !p.tenGV || !currentFilters.excludedTeachers.includes(p.tenGV.trim()));
        if (availablePractices.length === 0) return false;
      }
    }

    // 3. Faculty Filter
    if (currentFilters.faculty !== 'all') {
      const prefix = c.maMH.replace(/[0-9]/g, '').toUpperCase();
      if (prefix !== currentFilters.faculty) return false;
    }

    // 4. Day Filter
    if (currentFilters.day !== 'all') {
      const targetDay = parseInt(currentFilters.day);
      const dayMatch = c.thu === targetDay || (c.practices && c.practices.some(p => p.thu === targetDay));
      if (!dayMatch) return false;
    }

    // 5. Shift Filter
    if (currentFilters.shift !== 'all') {
      const periods = c.tiet || [];
      const isMorning = periods.some(p => p >= 1 && p <= 5);
      const isAfternoon = periods.some(p => p >= 6 && p <= 10);
      const isEvening = periods.some(p => p >= 11);

      if (currentFilters.shift === 'morning' && !isMorning) return false;
      if (currentFilters.shift === 'afternoon' && !isAfternoon) return false;
      if (currentFilters.shift === 'evening' && !isEvening) return false;
    }

    // 6. Checkboxes
    const isSelected = selectedIds.has(c.id);
    if (currentFilters.onlySelected && !isSelected) return false;

    if (currentFilters.hideConflict && !isSelected) {
      const conflictRes = checkItemConflictWithCurrent(c);
      if (conflictRes.hasConflict) return false;
    }

    return true;
  });

  if (countBadge) countBadge.textContent = `${filtered.length} lớp`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 36px 16px; color: var(--text-muted);">
        <i class="fa-solid fa-box-open" style="font-size: 32px; margin-bottom: 10px; opacity: 0.6;"></i>
        <p style="font-weight: 700; font-size: 13.5px;">Không tìm thấy lớp học nào</p>
        <p style="font-size: 11.5px; margin-top: 2px;">Thử nhập lại tên Môn học hoặc Giảng viên</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  const fragment = document.createDocumentFragment();
  const pChoices = getActivePracticeChoices();

  filtered.slice(0, 120).forEach(course => {
    const isSelected = selectedIds.has(course.id);
    const card = document.createElement('div');
    card.className = `course-card ${isSelected ? 'is-selected' : ''}`;

    const theoryConflict = !isSelected ? checkItemConflictWithCurrent(course) : { hasConflict: false };

    const thuStr = course.thu === '*' ? 'Chưa xếp' : `Thứ ${course.thu}`;
    const tietStr = (course.tiet && course.tiet.length) ? `Tiết ${course.tiet.join(',')}` : (course.tietRaw || 'N/A');
    const gvStr = course.tenGV || 'Chưa phân công';
    const phongStr = course.phong || 'Chưa xếp';

    // Calculate total subject credits (LT + TH)
    const practiceTC = (course.practices && course.practices.length > 0) ? (course.practices[0].soTC || 0) : 0;
    const totalCourseTC = (course.soTC || 0) + practiceTC;
    const creditsLabel = practiceTC > 0 ? `${totalCourseTC} TC` : `${course.soTC || 0} TC`;

    // Compact Practice Pills HTML
    let practiceHTML = '';
    if (course.practices && course.practices.length > 0) {
      const selectedPracticeId = pChoices[course.id] || course.practices[0].id;
      
      const pills = course.practices.map(p => {
        const isPSelected = selectedPracticeId === p.id;
        const pConflict = checkItemConflictWithCurrent(p);
        const pThu = p.thu === '*' ? '?' : `T${p.thu}`;
        const pTiet = (p.tiet && p.tiet.length) ? `${p.tiet[0]}-${p.tiet[p.tiet.length-1]}` : (p.tietRaw || 'N/A');
        const groupSuffix = p.maLop.replace(course.maLop, '');

        return `
          <button type="button" class="practice-pill-btn ${isPSelected ? 'selected' : ''} ${pConflict.hasConflict ? 'conflict' : ''}"
                  title="Nhóm ${escapeHtml(groupSuffix)}: ${escapeHtml(pThu)} (Tiết ${escapeHtml(pTiet)}) Phòng ${escapeHtml(p.phong || 'N/A')}"
                  data-select-practice-theory="${escapeHtml(course.id)}"
                  data-select-practice-id="${escapeHtml(p.id)}">
            <strong>${escapeHtml(groupSuffix || p.maLop)}</strong>: ${escapeHtml(pThu)} (${escapeHtml(pTiet)})
          </button>
        `;
      }).join('');

      practiceHTML = `
        <div class="practice-pills-container">
          <span class="practice-pills-label">Chọn nhóm Thực hành:</span>
          <div class="practice-pills-row">
            ${pills}
          </div>
        </div>
      `;
    }

      const etBadge = renderEverytimeBadge(course.tenGV);

      card.innerHTML = `
      <div class="course-card-top">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span class="course-code-badge">${escapeHtml(course.maMH)}</span>
          <span class="course-class-code">${escapeHtml(course.maLop)}</span>
        </div>
        <span class="course-credits-badge">
          <i class="fa-solid fa-graduation-cap" style="font-size: 10px;"></i>
          <span>${escapeHtml(creditsLabel)}</span>
        </span>
      </div>

      <div class="course-title">${escapeHtml(course.tenMH)}</div>

      <div class="course-meta-row">
        <span class="meta-chip" title="Lịch học lý thuyết"><i class="fa-regular fa-calendar-days" style="color: var(--primary);"></i> ${escapeHtml(thuStr)}</span>
        <span class="meta-chip" title="Tiết học"><i class="fa-regular fa-clock" style="color: var(--accent-amber);"></i> ${escapeHtml(tietStr)}</span>
        <span class="meta-chip" title="Phòng học"><i class="fa-solid fa-location-dot" style="color: var(--accent-emerald);"></i> ${escapeHtml(phongStr)}</span>
        <span class="meta-chip meta-chip-teacher" data-open-et="${escapeHtml(course.tenGV || '')}" title="Bấm để xem đánh giá Everytime của ${escapeHtml(gvStr)}">
          <i class="fa-solid fa-user-tie" style="color: #f43f5e;"></i>
          <span>${escapeHtml(gvStr)}</span>
          ${etBadge}
        </span>
      </div>

      ${practiceHTML}

      <div class="course-card-actions">
        ${theoryConflict.hasConflict ? `
          <span class="card-conflict-pill" title="Môn này bị trùng lịch học với ${escapeHtml(theoryConflict.conflictingWith.maLop)} trong TKB hiện tại">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>Trùng: <strong>${escapeHtml(theoryConflict.conflictingWith.maLop)}</strong></span>
          </span>
        ` : '<span></span>'}
        
        <button class="btn ${isSelected ? 'btn-danger' : 'btn-primary'}" data-toggle-select="${escapeHtml(course.id)}" style="padding: 5px 12px; font-size: 12px; border-radius: 8px; font-weight: 700;">
          <i class="fa-solid ${isSelected ? 'fa-check' : 'fa-plus'}"></i>
          <span>${isSelected ? 'Đã chọn (Bỏ)' : 'Thêm vào TKB'}</span>
        </button>
      </div>
    `;

    fragment.appendChild(card);
  });

  container.appendChild(fragment);
}

window.selectPracticeGroup = function(theoryId, practiceId, e) {
  if (e) e.stopPropagation();
  const pChoices = getActivePracticeChoices();
  pChoices[theoryId] = practiceId;
  savePlansToStorage();
  renderAll();
};

window.toggleCourseSelect = function(courseId) {
  const currentPlan = plans[currentPlanId];
  if (!currentPlan) return;

  const idx = currentPlan.selected.indexOf(courseId);
  if (idx >= 0) {
    currentPlan.selected.splice(idx, 1);
  } else {
    currentPlan.selected.push(courseId);
    const course = courseMap.get(courseId);
    const pChoices = getActivePracticeChoices();
    if (course && course.practices && course.practices.length > 0 && !pChoices[courseId]) {
      pChoices[courseId] = course.practices[0].id;
    }
  }
  savePlansToStorage();
  renderAll();
};

function renderWeekViewStatusIndicator() {
  const indicator = document.getElementById('weekViewStatusIndicator');
  if (!indicator) return;

  if (currentWeekView === 'theory_only') {
    indicator.innerHTML = `<span class="status-pill status-theory"><i class="fa-solid fa-book-open"></i> Đang xem: Tuần KHÔNG có Thực hành (Chỉ Lý thuyết)</span>`;
  } else {
    indicator.innerHTML = `<span class="status-pill status-practice"><i class="fa-solid fa-flask"></i> Đang xem: Tuần CÓ Thực hành (LT + TH)</span>`;
  }
}

// ==============================================================================
// 8. TIMETABLE MATRIX RENDERER
// ==============================================================================
function renderTimetableMatrix() {
  const grid = document.getElementById('timetableGrid');
  if (!grid) return;

  renderWeekViewStatusIndicator();

  while (grid.children.length > 7) {
    grid.removeChild(grid.lastChild);
  }

  let flatItems = getSelectedFlatItems();

  // Filter based on Week View mode (Tuần có TH vs Tuần không có TH)
  if (currentWeekView === 'theory_only') {
    flatItems = flatItems.filter(item => !item.isTH);
  }

  const maxPeriodInUse = flatItems.reduce((max, item) => {
    const itemMax = (item.tiet || []).reduce((m, p) => Math.max(m, p), 0);
    return Math.max(max, itemMax);
  }, 10);

  const totalPeriods = Math.max(10, maxPeriodInUse);
  const { conflictIds } = detectAllConflicts();

  for (let period = 1; period <= totalPeriods; period++) {
    if (period === 6) {
      const sep = document.createElement('div');
      sep.className = 'shift-separator-row';
      sep.innerHTML = '<i class="fa-solid fa-sun" style="margin-right: 6px;"></i> Buổi Chiều (Tiết 6 - 10)';
      grid.appendChild(sep);
    }
    if (period === 11) {
      const sep = document.createElement('div');
      sep.className = 'shift-separator-row';
      sep.innerHTML = '<i class="fa-solid fa-moon" style="margin-right: 6px;"></i> Buổi Tối (Tiết 11 - 14)';
      grid.appendChild(sep);
    }

    const periodInfo = PERIOD_TIMES[period] || { name: `Tiết ${period}`, time: '' };
    const pCell = document.createElement('div');
    pCell.className = 'grid-period-cell';
    pCell.innerHTML = `
      <span class="period-name">${periodInfo.name}</span>
      <span class="period-time">${periodInfo.time}</span>
    `;
    grid.appendChild(pCell);

    for (let day = 2; day <= 7; day++) {
      const slot = document.createElement('div');
      slot.className = 'grid-slot-cell';
      slot.dataset.day = day;
      slot.dataset.period = period;
      grid.appendChild(slot);
    }
  }

  flatItems.forEach(item => {
    if (!item.thu || item.thu === '*' || !item.tiet || item.tiet.length === 0) return;
    const day = parseInt(item.thu);
    if (day < 2 || day > 7) return;

    const startPeriod = Math.min(...item.tiet);
    const endPeriod = Math.max(...item.tiet);
    const duration = (endPeriod - startPeriod) + 1;

    const cell = grid.querySelector(`.grid-slot-cell[data-day="${day}"][data-period="${startPeriod}"]`);
    if (!cell) return;

    const isConflict = conflictIds.has(item.id);
    const color = getCourseColor(item.maMH);

    const block = document.createElement('div');
    block.className = `matrix-course-block ${isConflict ? 'conflict-block' : ''} ${duration <= 2 ? 'short-block' : ''}`;
    if (!isConflict) {
      block.style.background = color.bg;
      block.style.borderColor = color.border;
    }

    const blockHeight = (duration * 50) + ((duration - 1) * 1) - 4;
    block.style.height = `${blockHeight}px`;

    const etBadge = renderEverytimeBadge(item.tenGV, true);

    block.innerHTML = `
      <div class="matrix-card-header">
        <div class="matrix-header-left">
          <span class="matrix-type-tag ${item.isTH ? 'th' : 'lt'}">${item.isTH ? 'TH' : 'LT'}</span>
          <span class="matrix-code-tag">${escapeHtml(item.maLop)}</span>
        </div>
        <div class="matrix-header-right">
          <span class="matrix-tc-tag">${item.soTC || 0} TC</span>
          <button class="matrix-delete-btn" title="Xóa môn này khỏi TKB" data-remove-matrix="${escapeHtml(item.id)}">&times;</button>
        </div>
      </div>

      <div class="matrix-card-title" title="${escapeHtml(item.tenMH)}">${escapeHtml(item.tenMH)}</div>

      <div class="matrix-card-info">
        <div class="matrix-info-row">
          <i class="fa-solid fa-location-dot matrix-info-icon" style="color: ${color.accent || '#38bdf8'};"></i>
          <span class="matrix-info-text">${escapeHtml(item.phong ? item.phong : 'Chưa xếp phòng')}</span>
        </div>
        <div class="matrix-info-row matrix-teacher-row" data-open-et="${escapeHtml(item.tenGV || '')}" title="Bấm xem đánh giá của ${escapeHtml(item.tenGV || '')}">
          <i class="fa-solid fa-user-tie matrix-info-icon" style="color: #fda4af;"></i>
          <span class="matrix-info-text">${escapeHtml(item.tenGV || 'Chưa phân công')}</span>
          ${etBadge}
        </div>
      </div>
    `;

    cell.appendChild(block);
  });
}

window.removeCourseFromMatrix = function(itemId) {
  const currentPlan = plans[currentPlanId];
  if (!currentPlan) return;

  const pChoices = getActivePracticeChoices();
  let targetIdToRemove = itemId;
  for (const theoryId of currentPlan.selected) {
    if (pChoices[theoryId] === itemId) {
      targetIdToRemove = theoryId;
      break;
    }
  }

  const idx = currentPlan.selected.indexOf(targetIdToRemove);
  if (idx >= 0) {
    currentPlan.selected.splice(idx, 1);
    savePlansToStorage();
    renderAll();
  }
};

// ==============================================================================
// 9. STATS & ACCURATE CREDIT CALCULATION
// ==============================================================================
function renderStats() {
  const currentSelectedIds = plans[currentPlanId]?.selected || [];
  const pChoices = getActivePracticeChoices();
  let totalTC = 0;
  const daysSet = new Set();

  currentSelectedIds.forEach(id => {
    const item = courseMap.get(id);
    if (item) {
      totalTC += (item.soTC || 0);
      if (item.thu && item.thu !== '*') daysSet.add(item.thu);
      
      // Add practice credits accurately
      if (pChoices[id]) {
        const pItem = courseMap.get(pChoices[id]);
        if (pItem) {
          totalTC += (pItem.soTC || 0);
          if (pItem.thu && pItem.thu !== '*') daysSet.add(pItem.thu);
        }
      }
    }
  });

  const { conflicts } = detectAllConflicts();

  document.getElementById('statTotalCredits').innerHTML = `${totalTC} <span>TC</span>`;
  document.getElementById('statClassCount').innerHTML = `${currentSelectedIds.length} <span>môn</span>`;
  document.getElementById('statDaysCount').innerHTML = `${daysSet.size} <span>ngày</span>`;
  document.getElementById('selectedBadgeNum').textContent = currentSelectedIds.length;
  const mobBadge = document.getElementById('mobileSelectedCount');
  if (mobBadge) mobBadge.textContent = currentSelectedIds.length;

  const statusEl = document.getElementById('statConflictStatus');
  const alertBanner = document.getElementById('conflictAlertBanner');
  const alertText = document.getElementById('conflictAlertText');

  if (conflicts.length > 0) {
    statusEl.style.color = 'var(--danger)';
    statusEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Trùng ${conflicts.length} lịch`;

    const conflictDescriptions = conflicts.map(c => 
      `<strong>${escapeHtml(c.itemA.maLop)}</strong> (${escapeHtml(c.itemA.tenMH)}) trùng với <strong>${escapeHtml(c.itemB.maLop)}</strong> (${escapeHtml(c.itemB.tenMH)}) vào Thứ ${escapeHtml(c.itemA.thu)}`
    ).join(' | ');

    alertText.innerHTML = `⚠️ Phát hiện trùng lịch: ${conflictDescriptions}`;
    alertBanner.style.display = 'flex';
  } else {
    statusEl.style.color = 'var(--accent-emerald)';
    statusEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> Không trùng lịch`;
    alertBanner.style.display = 'none';
  }
}

function renderSelectedTable() {
  const tbody = document.getElementById('selectedCoursesTableBody');
  const summaryEl = document.getElementById('modalSelectedSummary');
  if (!tbody) return;

  const currentSelectedIds = plans[currentPlanId]?.selected || [];
  const pChoices = getActivePracticeChoices();
  let totalTC = 0;

  if (currentSelectedIds.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 24px; color: var(--text-muted);">
          Chưa chọn môn học nào trong kế hoạch này.
        </td>
      </tr>
    `;
    if (summaryEl) summaryEl.textContent = 'Tổng: 0 TC';
    return;
  }

  tbody.innerHTML = '';
  currentSelectedIds.forEach(id => {
    const course = courseMap.get(id);
    if (!course) return;

    totalTC += (course.soTC || 0);
    const thuStr = course.thu === '*' ? 'Chưa xếp' : `Thứ ${course.thu}`;
    const tietStr = (course.tiet && course.tiet.length) ? `Tiết ${course.tiet.join(',')}` : (course.tietRaw || 'N/A');

    const etBadge = renderEverytimeBadge(course.tenGV);

    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid var(--border-color)';
    tr.innerHTML = `
      <td style="padding: 8px; font-family: var(--font-mono); font-weight: 700; color: var(--primary);">${escapeHtml(course.maLop)}</td>
      <td style="padding: 8px; font-weight: 600;">
        ${escapeHtml(course.tenMH)}
        <div style="font-size: 11.5px; color: var(--text-muted); font-weight: 400; margin-top: 2px;">
          <i class="fa-solid fa-user-tie"></i> ${escapeHtml(course.tenGV || 'Chưa phân công')} ${etBadge}
        </div>
      </td>
      <td style="padding: 8px; font-weight: 700; color: var(--accent-emerald);">${course.soTC || 0} TC</td>
      <td style="padding: 8px;">${escapeHtml(thuStr)} (${escapeHtml(tietStr)})</td>
      <td style="padding: 8px;">${escapeHtml(course.phong || 'N/A')}</td>
      <td style="padding: 8px; text-align: right;">
        <button class="btn btn-danger" style="padding: 3px 8px; font-size: 11px;" data-toggle-select="${escapeHtml(course.id)}">
          <i class="fa-solid fa-trash-can"></i> Xóa
        </button>
      </td>
    `;
    tbody.appendChild(tr);

    if (pChoices[id]) {
      const p = courseMap.get(pChoices[id]);
      if (p) {
        totalTC += (p.soTC || 0);
        const pThu = p.thu === '*' ? 'Chưa xếp' : `Thứ ${p.thu}`;
        const pTiet = (p.tiet && p.tiet.length) ? `Tiết ${p.tiet.join(',')}` : (p.tietRaw || 'N/A');
        const pEtBadge = renderEverytimeBadge(p.tenGV);

        const pTr = document.createElement('tr');
        pTr.style.borderBottom = '1px solid var(--border-color)';
        pTr.style.backgroundColor = 'var(--bg-surface-elevated)';
        pTr.innerHTML = `
          <td style="padding: 5px 8px 5px 20px; font-family: var(--font-mono); font-size: 11.5px; color: var(--accent-purple);">↳ ${escapeHtml(p.maLop)} (TH)</td>
          <td style="padding: 5px 8px; font-size: 11.5px; color: var(--text-secondary);">
            ${escapeHtml(p.tenMH)} (Thực hành)
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 1px;">
              <i class="fa-solid fa-user-tie"></i> ${escapeHtml(p.tenGV || 'Chưa phân công')} ${pEtBadge}
            </div>
          </td>
          <td style="padding: 5px 8px; font-size: 11.5px; font-weight: 700; color: var(--accent-emerald);">${p.soTC || 0} TC</td>
          <td style="padding: 5px 8px; font-size: 11.5px;">${escapeHtml(pThu)} (${escapeHtml(pTiet)})</td>
          <td style="padding: 5px 8px; font-size: 11.5px;">${escapeHtml(p.phong || 'N/A')}</td>
          <td style="padding: 5px 8px; text-align: right; font-size: 11px; color: var(--text-muted);">Đi kèm LT</td>
        `;
        tbody.appendChild(pTr);
      }
    }
  });

  if (summaryEl) summaryEl.textContent = `Tổng cộng: ${totalTC} Tín chỉ (${currentSelectedIds.length} môn học)`;
}

// ==============================================================================
// 10. EXCEL PARSER (FOR FUTURE SEMESTERS)
// ==============================================================================
function handleExcelUpload(file) {
  if (!file) return;
  if (file.size > MAX_EXCEL_UPLOAD_BYTES) {
    alert(`File Excel vượt quá giới hạn ${Math.round(MAX_EXCEL_UPLOAD_BYTES / (1024 * 1024))}MB.`);
    return;
  }

  const progressEl = document.getElementById('uploadProgress');
  if (progressEl) progressEl.style.display = 'block';

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      
      const parsedData = sanitizeImportedDataset(parseWorkbookToCourses(workbook));
      if (parsedData.length > 0) {
        allCourses = parsedData;
        buildCourseMap();
        buildUniqueMetaLists();
        initSearchableComboboxes();
        safeLocalStorageSet('tkb_custom_dataset', JSON.stringify(allCourses));
        closeModal('modalUpload');
        renderAll();
        alert(`Tải file thành công! Đã nạp ${allCourses.length} lớp học phần vào hệ thống.`);
      } else {
        alert('Không tìm thấy dữ liệu hợp lệ trong file Excel. Vui lòng kiểm tra lại định dạng sheet TKB.');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi đọc file Excel: ' + err.message);
    } finally {
      if (progressEl) progressEl.style.display = 'none';
    }
  };
  reader.readAsArrayBuffer(file);
}

function parseWorkbookToCourses(workbook) {
  const lut_tiet = {
    '12': [1, 2], '123': [1, 2, 3], '1234': [1, 2, 3, 4], '12345': [1, 2, 3, 4, 5],
    '23': [2, 3], '234': [2, 3, 4], '2345': [2, 3, 4, 5], '34': [3, 4], '345': [3, 4, 5],
    '45': [4, 5], '67': [6, 7], '678': [6, 7, 8], '6789': [6, 7, 8, 9], '678910': [6, 7, 8, 9, 10],
    '78': [7, 8], '78910': [7, 8, 9, 10], '8910': [8, 9, 10], '910': [9, 10],
    '1011': [10, 11], '101112': [10, 11, 12], '1112': [11, 12], '1213': [12, 13], '121314': [12, 13, 14]
  };

  const theoryMap = {};
  const standalone = [];

  const s1Name = workbook.SheetNames.find(n => n.toUpperCase().includes('LT')) || workbook.SheetNames[0];
  const s1 = workbook.Sheets[s1Name];
  if (s1) {
    const rows = XLSX.utils.sheet_to_json(s1, { header: 1 });
    let hIdx = rows.findIndex(r => r && r.some(c => String(c).includes('MÃ MH') || String(c).includes('MÃ LỚP')));
    if (hIdx === -1) hIdx = 7;

    for (let r = hIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row[1] || !row[2]) continue;

      const mamh = String(row[1]).trim();
      const malop = String(row[2]).trim();
      const tenmh = String(row[3] || '').trim();
      const magv = String(row[4] || '').trim();
      const tengv = String(row[5] || '').trim();
      const siso = parseInt(row[6]) || 0;
      const sotc = parseFloat(row[7]) || 0;
      const htgd = String(row[9] || 'LT').trim();
      const thu = String(row[10] || '').trim();
      const tietRaw = String(row[11] || '').trim();
      const cachtuan = parseInt(row[12]) || 1;
      const phong = String(row[13] || '').trim();
      const khoa = String(row[14] || '').trim();

      const tietArr = lut_tiet[tietRaw] || (tietRaw.length === 1 && !isNaN(tietRaw) ? [parseInt(tietRaw)] : []);

      theoryMap[malop] = {
        id: malop,
        maMH: mamh,
        maLop: malop,
        tenMH: tenmh,
        maGV: magv,
        tenGV: tengv,
        siSo: siso,
        soTC: sotc,
        htgd: htgd,
        isTH: false,
        thu: !isNaN(thu) ? parseInt(thu) : (thu || '*'),
        tiet: tietArr,
        tietRaw: tietRaw,
        cachTuan: cachtuan,
        phong: phong,
        khoa: khoa,
        practices: []
      };
    }
  }

  const s2Name = workbook.SheetNames.find(n => n.toUpperCase().includes('TH') || n.toUpperCase().includes('ĐA'));
  if (s2Name && workbook.Sheets[s2Name]) {
    const s2 = workbook.Sheets[s2Name];
    const rows = XLSX.utils.sheet_to_json(s2, { header: 1 });
    let hIdx = rows.findIndex(r => r && r.some(c => String(c).includes('MÃ MH') || String(c).includes('MÃ LỚP')));
    if (hIdx === -1) hIdx = 7;

    for (let r = hIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row[1] || !row[2]) continue;

      const mamh = String(row[1]).trim();
      const malop = String(row[2]).trim();
      const tenmh = String(row[3] || '').trim();
      const magv = String(row[4] || '').trim();
      const tengv = String(row[5] || '').trim();
      const siso = parseInt(row[6]) || 0;
      const sotc = parseFloat(row[7]) || 0;
      const htgd = String(row[9] || 'TH').trim();
      const thu = String(row[10] || '').trim();
      const tietRaw = String(row[11] || '').trim();
      const cachtuan = parseInt(row[12]) || 1;
      const phong = String(row[13] || '').trim();
      const khoa = String(row[14] || '').trim();

      const tietArr = lut_tiet[tietRaw] || (tietRaw.length === 1 && !isNaN(tietRaw) ? [parseInt(tietRaw)] : []);

      const pItem = {
        id: malop,
        maMH: mamh,
        maLop: malop,
        tenMH: tenmh,
        maGV: magv,
        tenGV: tengv,
        siSo: siso,
        soTC: sotc,
        htgd: htgd,
        isTH: true,
        thu: !isNaN(thu) ? parseInt(thu) : (thu || '*'),
        tiet: tietArr,
        tietRaw: tietRaw,
        cachTuan: cachtuan,
        phong: phong,
        khoa: khoa
      };

      let parentFound = false;
      for (const tMaLop in theoryMap) {
        if (malop.startsWith(tMaLop + '.')) {
          theoryMap[tMaLop].practices.push(pItem);
          parentFound = true;
          break;
        }
      }
      if (!parentFound) standalone.push(pItem);
    }
  }

  return [...Object.values(theoryMap), ...standalone];
}

// ==============================================================================
// 11. EXPORT PNG IMAGE (TIGHT CROP)
// ==============================================================================
async function exportTimetableImage() {
  const element = document.querySelector('.timetable-matrix-card');
  if (!element) return;

  const btn = document.getElementById('btnExportImage');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Đang tạo ảnh...</span>';

  try {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const canvas = await html2canvas(element, {
      scale: 2.5,
      useCORS: true,
      backgroundColor: isDark ? '#111827' : '#ffffff',
      logging: false
    });

    const link = document.createElement('a');
    link.download = `ThoiKhoaBieu_${plans[currentPlanId]?.name || 'HK1'}_2026.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (err) {
    console.error(err);
    alert('Lỗi xuất ảnh: ' + err.message);
  } finally {
    btn.innerHTML = originalText;
  }
}

// ==============================================================================
// 12. EVENT LISTENERS & MODALS
// ==============================================================================
function bindEvents() {
  document.getElementById('btnThemeToggle').addEventListener('click', toggleTheme);

  // Faculty Filter Pills
  document.querySelectorAll('#facultyFilterRow .filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#facultyFilterRow .filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilters.faculty = pill.dataset.val;
      renderAll();
    });
  });

  // Filter Pills (Day)
  document.querySelectorAll('#dayFilterRow .filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#dayFilterRow .filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilters.day = pill.dataset.val;
      renderCourseResults();
    });
  });

  // Filter Pills (Shift)
  document.querySelectorAll('#shiftFilterRow .filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#shiftFilterRow .filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilters.shift = pill.dataset.val;
      renderCourseResults();
    });
  });

  // Checkboxes
  document.getElementById('chkHideConflict').addEventListener('change', (e) => {
    currentFilters.hideConflict = e.target.checked;
    renderCourseResults();
  });

  document.getElementById('chkOnlySelected').addEventListener('change', (e) => {
    currentFilters.onlySelected = e.target.checked;
    renderCourseResults();
  });

  // Plan Select
  document.getElementById('planSelect').addEventListener('change', (e) => {
    currentPlanId = e.target.value;
    savePlansToStorage();
    renderAll();
  });

  // Export Image
  document.getElementById('btnExportImage').addEventListener('click', exportTimetableImage);

  // Clear All
  document.getElementById('btnClearAll').addEventListener('click', () => {
    if (confirm(`Bạn có chắc muốn xóa toàn bộ môn trong "${plans[currentPlanId]?.name}"?`)) {
      plans[currentPlanId].selected = [];
      savePlansToStorage();
      renderAll();
    }
  });

  // Modals Open / Close
  document.getElementById('btnUploadModal').addEventListener('click', () => openModal('modalUpload'));
  document.getElementById('btnToggleSelectedList').addEventListener('click', () => openModal('modalSelectedList'));
  document.getElementById('btnManagePlans').addEventListener('click', () => {
    renderPlansListModal();
    openModal('modalPlans');
  });

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  });

  // Dropzone File Upload
  const dropzone = document.getElementById('dropzoneExcel');
  const fileInput = document.getElementById('fileInputExcel');

  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleExcelUpload(e.target.files[0]);
  });

  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) handleExcelUpload(e.dataTransfer.files[0]);
  });

  // Restore Default Dataset
  document.getElementById('btnRestoreDefault').addEventListener('click', () => {
    if (confirm('Khôi phục danh sách môn học về file gốc mặc định?')) {
      localStorage.removeItem('tkb_custom_dataset');
      loadInitialDataset();
      buildUniqueMetaLists();
      initSearchableComboboxes();
      closeModal('modalUpload');
      renderAll();
      alert('Đã khôi phục dữ liệu gốc thành công!');
    }
  });

  // JSON Backup / Export & Import Handlers
  const btnExportJson = document.getElementById('btnExportJson');
  if (btnExportJson) {
    btnExportJson.addEventListener('click', () => {
      openModal('modalBackupJson');
    });
  }

  const btnDoExportJson = document.getElementById('btnDoExportJson');
  if (btnDoExportJson) {
    btnDoExportJson.addEventListener('click', () => {
      const backupPayload = {
        version: "2.0",
        exportDate: new Date().toISOString(),
        plans: plans,
        activePlan: currentPlanId
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
      const dl = document.createElement('a');
      dl.setAttribute("href", dataStr);
      dl.setAttribute("download", `DKHP_UIT_Backup_${new Date().toISOString().slice(0,10)}.json`);
      dl.click();
      closeModal('modalBackupJson');
      if (typeof showAppToast === 'function') {
        showAppToast('📤 Đã tải xuống file sao lưu TKB thành công!');
      }
    });
  }

  const btnTriggerImportJson = document.getElementById('btnTriggerImportJson');
  const jsonBackupFileInput = document.getElementById('jsonBackupFileInput');
  if (btnTriggerImportJson && jsonBackupFileInput) {
    btnTriggerImportJson.addEventListener('click', () => {
      jsonBackupFileInput.click();
    });

    jsonBackupFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > MAX_JSON_IMPORT_BYTES) {
        alert(`File JSON vượt quá giới hạn ${Math.round(MAX_JSON_IMPORT_BYTES / 1024)}KB.`);
        jsonBackupFileInput.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          let validPlans = null;

          if (imported && imported.plans && typeof imported.plans === 'object') {
            validPlans = imported.plans;
          } else if (imported && typeof imported === 'object' && Object.keys(imported).some(k => imported[k]?.name && Array.isArray(imported[k]?.selected))) {
            validPlans = imported;
          }

          if (validPlans && Object.keys(validPlans).length > 0) {
            plans = sanitizeImportedPlans(validPlans);
            currentPlanId = (imported.activePlan && plans[imported.activePlan]) ? imported.activePlan : Object.keys(plans)[0];
            savePlansToStorage();
            renderAll();
            closeModal('modalBackupJson');
            if (typeof showAppToast === 'function') {
              showAppToast('📥 Đã khôi phục toàn bộ Kế hoạch TKB từ file JSON thành công!');
            }
          } else {
            alert('File JSON không đúng định dạng sao lưu Thời khóa biểu UIT!');
          }
        } catch (err) {
          alert('Lỗi đọc file JSON: ' + err.message);
        }
        jsonBackupFileInput.value = '';
      };
      reader.readAsText(file);
    });
  }

  // Create New Plan
  document.getElementById('btnCreateNewPlan').addEventListener('click', () => {
    const input = document.getElementById('newPlanNameInput');
    const name = input.value.trim();
    if (!name) return;

    const newId = 'plan_' + Date.now();
    plans[newId] = { name: name, selected: [], practiceChoices: {} };
    currentPlanId = newId;
    input.value = '';
    savePlansToStorage();
    renderPlansListModal();
    renderAll();
  });

  // Global Delegated Click Handler for all Dynamic Actions (100% immune to inline JS/HTML injection)
  document.addEventListener('click', (e) => {
    const clearFilterBtn = e.target.closest('[data-clear-filter]');
    if (clearFilterBtn) {
      const type = clearFilterBtn.getAttribute('data-clear-filter');
      if (type) clearSpecificFilter(type);
      return;
    }

    const clearAllFiltersBtn = e.target.closest('[data-clear-all-filters]');
    if (clearAllFiltersBtn) {
      clearAllTagFilters();
      return;
    }

    const removeExcludedBtn = e.target.closest('[data-remove-excluded-teacher]');
    if (removeExcludedBtn) {
      e.stopPropagation();
      const teacherName = removeExcludedBtn.getAttribute('data-remove-excluded-teacher');
      if (teacherName) removeExcludedTeacher(teacherName);
      return;
    }

    const clearAllExcludedBtn = e.target.closest('[data-clear-all-excluded]');
    if (clearAllExcludedBtn) {
      e.stopPropagation();
      clearAllExcludedTeachers();
      return;
    }

    const toggleExcludeBtn = e.target.closest('[data-toggle-exclude-teacher]');
    if (toggleExcludeBtn) {
      e.stopPropagation();
      const teacherName = toggleExcludeBtn.getAttribute('data-toggle-exclude-teacher');
      if (teacherName) {
        const isCurrentlyExcluded = (currentFilters.excludedTeachers || []).includes(teacherName.trim());
        if (isCurrentlyExcluded) {
          removeExcludedTeacher(teacherName.trim());
        } else {
          addExcludedTeacher(teacherName.trim());
        }
        openEverytimeModal(teacherName); // Refresh modal view
      }
      return;
    }

    // 1. Open Everytime Lecturer Modal
    const etEl = e.target.closest('[data-open-et]');
    if (etEl) {
      e.stopPropagation();
      const teacher = etEl.getAttribute('data-open-et');
      if (teacher) openEverytimeModal(teacher);
      return;
    }

    // 2. Toggle Course Selection (Add / Remove)
    const toggleEl = e.target.closest('[data-toggle-select]');
    if (toggleEl) {
      e.stopPropagation();
      const cid = toggleEl.getAttribute('data-toggle-select');
      if (cid) toggleCourseSelect(cid);
      return;
    }

    // 3. Select Practice Group
    const pracEl = e.target.closest('[data-select-practice-theory]');
    if (pracEl) {
      e.stopPropagation();
      const tid = pracEl.getAttribute('data-select-practice-theory');
      const pid = pracEl.getAttribute('data-select-practice-id');
      if (tid && pid) selectPracticeGroup(tid, pid, e);
      return;
    }

    // 4. Remove Course from Timetable Matrix
    const remMatrixEl = e.target.closest('[data-remove-matrix]');
    if (remMatrixEl) {
      e.stopPropagation();
      const mid = remMatrixEl.getAttribute('data-remove-matrix');
      if (mid) removeCourseFromMatrix(mid);
      return;
    }

    // 5. Remove Subject Chip from Auto-Scheduler
    const remAutoEl = e.target.closest('[data-remove-autosched]');
    if (remAutoEl) {
      e.stopPropagation();
      const maMH = remAutoEl.getAttribute('data-remove-autosched');
      if (maMH) removeAutoSchedSubject(maMH);
      return;
    }

    // 6. Plan Management Actions
    const renameEl = e.target.closest('[data-rename-plan]');
    if (renameEl) {
      e.stopPropagation();
      const pid = renameEl.getAttribute('data-rename-plan');
      if (pid) renamePlan(pid);
      return;
    }

    const dupEl = e.target.closest('[data-duplicate-plan]');
    if (dupEl) {
      e.stopPropagation();
      const pid = dupEl.getAttribute('data-duplicate-plan');
      if (pid) duplicatePlan(pid);
      return;
    }

    const delEl = e.target.closest('[data-delete-plan]');
    if (delEl) {
      e.stopPropagation();
      const pid = delEl.getAttribute('data-delete-plan');
      if (pid) deletePlan(pid);
      return;
    }

    // 7. Auto-Scheduler Solutions Actions
    const applySolEl = e.target.closest('[data-apply-sol]');
    if (applySolEl) {
      e.stopPropagation();
      const sidx = parseInt(applySolEl.getAttribute('data-apply-sol'), 10);
      if (!isNaN(sidx)) applySolutionToCurrentPlan(sidx);
      return;
    }

    const saveSolEl = e.target.closest('[data-save-sol]');
    if (saveSolEl) {
      e.stopPropagation();
      const sidx = parseInt(saveSolEl.getAttribute('data-save-sol'), 10);
      if (!isNaN(sidx)) saveSolutionAsNewPlan(sidx);
      return;
    }
  });
}

function openModal(id) {
  const m = document.getElementById(id);
  if (m) {
    m.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) {
    m.classList.remove('open');
    if (!document.querySelector('.modal-backdrop.open, .modal-overlay.open')) {
      document.body.style.overflow = '';
    }
  }
}

// Global modal close handlers (Backdrop click and Escape key)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-backdrop.open, .modal-overlay.open').forEach(m => {
      m.classList.remove('open');
    });
    document.body.style.overflow = '';
  }
});

document.addEventListener('click', (e) => {
  if (e.target.classList && (e.target.classList.contains('modal-backdrop') || e.target.classList.contains('modal-overlay'))) {
    e.target.classList.remove('open');
    if (!document.querySelector('.modal-backdrop.open, .modal-overlay.open')) {
      document.body.style.overflow = '';
    }
  }
});

function renderPlansListModal() {
  const container = document.getElementById('plansListContainer');
  if (!container) return;
  container.innerHTML = '';

  Object.keys(plans).forEach(pid => {
    const plan = plans[pid];
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.justifyContent = 'space-between';
    row.style.padding = '8px 12px';
    row.style.backgroundColor = 'var(--bg-surface-elevated)';
    row.style.borderRadius = 'var(--radius-md)';
    row.style.border = pid === currentPlanId ? '1.5px solid var(--primary)' : '1px solid var(--border-color)';

    row.innerHTML = `
      <div>
        <strong>${escapeHtml(plan.name)}</strong>
        <span style="font-size: 11px; color: var(--text-muted); margin-left: 6px;">(${(plan.selected || []).length} môn)</span>
      </div>
      <div style="display: flex; gap: 6px;">
        <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" data-rename-plan="${escapeHtml(pid)}">
          <i class="fa-solid fa-pen"></i> Đổi tên
        </button>
        <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" data-duplicate-plan="${escapeHtml(pid)}">
          <i class="fa-solid fa-copy"></i> Nhân bản
        </button>
        ${Object.keys(plans).length > 1 ? `
          <button class="btn btn-danger" style="padding: 4px 8px; font-size: 11px;" data-delete-plan="${escapeHtml(pid)}">
            <i class="fa-solid fa-trash"></i>
          </button>
        ` : ''}
      </div>
    `;
    container.appendChild(row);
  });
}

window.renamePlan = function(pid) {
  const currentName = plans[pid]?.name || '';
  const newName = prompt('Nhập tên mới cho kế hoạch:', currentName);
  if (newName && newName.trim()) {
    plans[pid].name = newName.trim();
    savePlansToStorage();
    renderPlansListModal();
    renderAll();
  }
};

window.duplicatePlan = function(pid) {
  const newId = 'plan_' + Date.now();
  const src = plans[pid] || { name: 'Kế hoạch', selected: [], practiceChoices: {} };
  plans[newId] = {
    name: src.name + ' (Bản sao)',
    selected: [...(src.selected || [])],
    practiceChoices: { ...(src.practiceChoices || {}) }
  };
  currentPlanId = newId;
  savePlansToStorage();
  renderPlansListModal();
  renderAll();
};

window.deletePlan = function(pid) {
  const planName = plans[pid]?.name || '';
  if (confirm(`Xác nhận xóa kế hoạch "${planName}"?`)) {
    delete plans[pid];
    if (currentPlanId === pid) currentPlanId = Object.keys(plans)[0];
    savePlansToStorage();
    renderPlansListModal();
    renderAll();
  }
};

// ==============================================================================
// 13. AUTO REGISTRATION SCRIPT GENERATOR (UIT ĐKHP)
// ==============================================================================
function getSelectedClassCodes() {
  const currentPlan = plans[currentPlanId] || { selected: [] };
  const codes = [];

  currentPlan.selected.forEach(cid => {
    const course = courseMap.get(cid);
    if (!course) return;

    // 1. Add Theory Class Code
    if (course.maLop) {
      codes.push(course.maLop.trim());
    }

    // 2. Add Practice Class Code (if course has practices)
    if (course.practices && course.practices.length > 0) {
      const pChoices = getActivePracticeChoices();
      const chosenPracticeId = pChoices[cid] || course.practices[0].id;
      const practiceObj = courseMap.get(chosenPracticeId);
      if (practiceObj && practiceObj.maLop) {
        codes.push(practiceObj.maLop.trim());
      }
    }
  });

  return Array.from(new Set(codes)); // Deduplicate
}

function generateAutoRegistrationScript() {
  const classCodes = getSelectedClassCodes();
  const classCodesString = classCodes.length > 0 ? classCodes.join('\n') : '';

  return `// Chỉ cần thay mỗi môn trên một hàng cho biến monDangKy này là xong
// Lưu ý: Nếu sau này trường update website, các thẻ query không còn đúng nữa, thì bạn liên hệ messenger.com/t/loia5tqd001 để báo mình nhé

var monDangKy = \`
${classCodesString}
\`;

var successLog = (message) => console.log('%c' + message, 'font-weight:bold; color:green;');
var errorLog = (message) => console.log('%c' + message, 'font-weight:bold; color:red;');

DangKy(monDangKy);

function DangKy(monDangKyString) {
  try {
    var listMonDangKy = monDangKyString.trim().split('\\n').map((it) => it.trim()).filter(Boolean);
    
    var allRows = [...document.querySelectorAll('table tr')];

    var rowsToDangKy = allRows.filter((it) => listMonDangKy.includes(it.querySelector('td:nth-child(2)')?.textContent?.trim()));
    
    rowsToDangKy.forEach((it, index) => {
      var chk = it.querySelector('input[type="checkbox"]') || it.querySelector('td:first-child');
      if (chk) chk.click();
      var tenLop = it.querySelector('td:nth-child(2)')?.textContent?.trim();
      successLog(index + 1 + '.Đã chọn lớp ' + tenLop);
    });
  } catch {
    errorLog('Chọn lớp không thành công! Bạn tự chọn lớp đi nhé!');
  }
}`;
}

function openScriptModal() {
  const classCodes = getSelectedClassCodes();
  const scriptText = generateAutoRegistrationScript();

  const textarea = document.getElementById('scriptCodeTextarea');
  if (textarea) textarea.value = scriptText;

  const countBadge = document.getElementById('scriptClassCountBadge');
  if (countBadge) countBadge.textContent = `${classCodes.length} mã lớp`;

  const previewList = document.getElementById('scriptClassesPreviewList');
  if (previewList) {
    clearElementChildren(previewList);
    if (classCodes.length === 0) {
      const empty = document.createElement('span');
      empty.style.fontSize = '12px';
      empty.style.color = 'var(--text-muted)';
      empty.textContent = '(Chưa chọn môn nào)';
      previewList.appendChild(empty);
    } else {
      classCodes.forEach(code => {
        const pill = document.createElement('span');
        pill.className = 'script-class-pill';
        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-check';
        icon.style.fontSize = '9px';
        pill.appendChild(icon);
        appendTextNode(pill, ` ${code}`);
        previewList.appendChild(pill);
      });
    }
  }

  openModal('modalScript');
}

async function copyScriptToClipboard() {
  const scriptText = generateAutoRegistrationScript();
  try {
    await navigator.clipboard.writeText(scriptText);
    showAppToast('📋 Đã sao chép Script ĐKHP vào Clipboard!');
  } catch (err) {
    const textarea = document.getElementById('scriptCodeTextarea');
    if (textarea) {
      textarea.select();
      document.execCommand('copy');
      showAppToast('📋 Đã sao chép Script ĐKHP vào Clipboard!');
    } else {
      alert('Không thể tự động sao chép. Vui lòng copy thủ công trong ô mã nguồn.');
    }
  }
}

function downloadScriptFile() {
  const scriptText = generateAutoRegistrationScript();
  const planName = (plans[currentPlanId]?.name || 'TKB').replace(/\s+/g, '_');
  const blob = new Blob([scriptText], { type: 'text/javascript;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `auto_dkhp_${planName}.js`;
  link.click();
  URL.revokeObjectURL(url);
  showAppToast('💾 Đã tải file auto_dkhp.js về máy!');
}

function showAppToast(message) {
  let toast = document.getElementById('appToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'appToast';
    toast.className = 'app-toast';
    document.body.appendChild(toast);
  }
  clearElementChildren(toast);
  const icon = document.createElement('i');
  icon.className = 'fa-solid fa-circle-check';
  icon.style.color = 'var(--accent-emerald)';
  const text = document.createElement('span');
  text.textContent = message;
  toast.appendChild(icon);
  toast.appendChild(document.createTextNode(' '));
  toast.appendChild(text);
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

// ==============================================================================
// 14. IMPORT / EXPORT CLASS CODES (AUTO SCHEDULING VIA CODE LIST)
// ==============================================================================
let currentExportFormat = 'newline'; // 'newline' | 'space' | 'comma_space' | 'comma' | 'bookmarklet' | 'js_array'

function generateBookmarkletCode(codes) {
  if (!codes || codes.length === 0) return '';
  const codesStr = codes.map(c => `'${c}'`).join(',');
  return `javascript:(function(){var list=new Set([${codesStr}]);document.querySelectorAll('table tr').forEach(function(r){var t=r.querySelector('td:nth-child(2)')?.textContent?.trim().toUpperCase();if(t&&list.has(t)){var k=r.querySelector('input[type="checkbox"]')||r.querySelector('td:first-child');if(k){if(k.type==='checkbox'){if(!k.checked)k.click();}else{k.click();}}}});var count=0;var timer=setInterval(function(){count++;var btn=null;var all=document.querySelectorAll('button, div[role="button"], a');for(var i=0;i<all.length;i++){var txt=all[i].textContent||'';if(txt.includes('Đăng ký')&&(txt.includes('lớp')||txt.includes('tc'))){btn=all[i];break;}}if(!btn){var leaves=document.querySelectorAll('*');for(var j=leaves.length-1;j>=0;j--){if(leaves[j].children.length===0&&(leaves[j].textContent||'').includes('Đăng ký')){btn=leaves[j];break;}}}if(btn){btn.click();btn.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));clearInterval(timer);}if(count>=10)clearInterval(timer);},150);})();`;
}

function formatExportClassCodes(codes, format = currentExportFormat) {
  if (!codes || codes.length === 0) return '';
  switch (format) {
    case 'space':
      return codes.join(' ');
    case 'comma_space':
      return codes.join(', ');
    case 'comma':
      return codes.join(',');
    case 'bookmarklet':
      return generateBookmarkletCode(codes);
    case 'js_array':
      return "['" + codes.join("', '") + "']";
    case 'newline':
    default:
      return codes.join('\n');
  }
}

function updateExportCodesDisplay() {
  const currentCodes = getSelectedClassCodes();
  const exportArea = document.getElementById('exportCodesTextarea');
  const countBadge = document.getElementById('exportCodesCountBadge');
  const bmBanner = document.getElementById('bookmarkletHintBanner');
  
  if (exportArea) {
    exportArea.value = formatExportClassCodes(currentCodes, currentExportFormat);
  }
  if (countBadge) {
    const selectedCourseCount = plans[currentPlanId]?.selected?.length || 0;
    countBadge.textContent = `📋 ${currentCodes.length} mã lớp (${selectedCourseCount} môn học)`;
  }
  if (bmBanner) {
    bmBanner.style.display = (currentExportFormat === 'bookmarklet') ? 'block' : 'none';
  }
}

function downloadExportCodesAsTxt() {
  const exportArea = document.getElementById('exportCodesTextarea');
  if (!exportArea || !exportArea.value.trim()) {
    showAppToast('⚠️ Chưa có môn học nào trong TKB để tải về!');
    return;
  }
  const planName = (plans[currentPlanId]?.name || 'TKB_UIT').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9-]/g, '');
  const filename = `${planName}_MaLop.txt`;
  const blob = new Blob([exportArea.value.trim()], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showAppToast(`💾 Đã tải file danh sách mã lớp: ${filename}`);
}

function openImportExportCodesModal(defaultTab = 'import') {
  switchCodesModalTab(defaultTab);
  updateExportCodesDisplay();

  // Clear feedback
  const feedback = document.getElementById('importResultFeedback');
  if (feedback) feedback.style.display = 'none';

  openModal('modalImportExportCodes');
}

function switchCodesModalTab(tabName) {
  const tabImport = document.getElementById('tabBtnImportCodes');
  const tabExport = document.getElementById('tabBtnExportCodes');
  const contentImport = document.getElementById('tabContentImportCodes');
  const contentExport = document.getElementById('tabContentExportCodes');

  if (tabName === 'import') {
    tabImport?.classList.add('active');
    tabExport?.classList.remove('active');
    if (contentImport) contentImport.style.display = 'block';
    if (contentExport) contentExport.style.display = 'none';
  } else {
    tabExport?.classList.add('active');
    tabImport?.classList.remove('active');
    if (contentImport) contentImport.style.display = 'none';
    if (contentExport) contentExport.style.display = 'block';

    updateExportCodesDisplay();
  }
}

function extractClassCodesFromText(text) {
  if (!text || typeof text !== 'string') return [];
  // Match UIT class code patterns: e.g. IT004.R18, IT004.R18.2, NT105.R11, MA005.R14, CS106.O21, SS007.R13, etc.
  const regex = /\b[A-Z]{2,4}[0-9]{3}(?:\.[A-Za-z0-9_.-]+)?\b/gi;
  const matches = text.match(regex);
  if (matches && matches.length > 0) {
    return Array.from(new Set(matches.map(m => m.trim().toUpperCase())));
  }
  return text.split(/[\n,;\s]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
}

function parseAndApplyCodesToPlan(planId, rawText, clearBefore = true) {
  const codes = extractClassCodesFromText(rawText);
  if (codes.length === 0) {
    return { success: false, message: 'Không tìm thấy mã môn học nào!' };
  }

  const matchedTheories = new Set();
  const matchedPractices = {}; // theoryId -> practiceId
  const notFoundCodes = [];
  const foundClassNames = [];

  codes.forEach(code => {
    const cleanCode = code.toUpperCase();
    let found = false;

    // 1. Direct check in courseMap
    for (const [id, c] of courseMap.entries()) {
      if (id.toUpperCase() === cleanCode || (c.maLop && c.maLop.toUpperCase() === cleanCode)) {
        found = true;
        let isPracticeChild = false;
        for (const parent of allCourses) {
          if (parent.practices && parent.practices.some(p => p.id === c.id)) {
            matchedTheories.add(parent.id);
            matchedPractices[parent.id] = c.id;
            foundClassNames.push(`${c.maLop} (TH • ${parent.tenMH})`);
            isPracticeChild = true;
            break;
          }
        }

        if (!isPracticeChild) {
          matchedTheories.add(c.id);
          foundClassNames.push(`${c.maLop} (LT • ${c.tenMH})`);
        }
        break;
      }
    }

    if (!found) {
      notFoundCodes.push(code);
    }
  });

  if (matchedTheories.size === 0) {
    return {
      success: false,
      message: 'Không tìm thấy môn học nào khớp trong dữ liệu!',
      notFoundCodes
    };
  }

  if (!plans[planId]) {
    plans[planId] = { name: 'Kế hoạch mới', selected: [], practiceChoices: {} };
  }

  if (clearBefore) {
    plans[planId].selected = [];
    plans[planId].practiceChoices = {};
  }

  matchedTheories.forEach(tid => {
    if (!plans[planId].selected.includes(tid)) {
      plans[planId].selected.push(tid);
    }
  });

  if (!plans[planId].practiceChoices) plans[planId].practiceChoices = {};
  Object.keys(matchedPractices).forEach(tid => {
    plans[planId].practiceChoices[tid] = matchedPractices[tid];
  });

  return {
    success: true,
    theoryCount: matchedTheories.size,
    practiceCount: Object.keys(matchedPractices).length,
    totalCount: codes.length,
    foundClassNames,
    notFoundCodes
  };
}

function handleApplyImportCodes() {
  const inputArea = document.getElementById('importCodesTextarea');
  const feedback = document.getElementById('importResultFeedback');
  if (!inputArea || !feedback) return;

  function renderFeedback({ isError, iconClass, message, detail }) {
    feedback.style.display = 'block';
    feedback.style.backgroundColor = isError ? 'var(--danger-light)' : 'rgba(16, 185, 129, 0.15)';
    feedback.style.color = isError ? 'var(--danger)' : 'var(--accent-emerald)';
    feedback.style.border = isError
      ? '1px solid rgba(239, 68, 68, 0.3)'
      : '1px solid rgba(16, 185, 129, 0.3)';

    clearElementChildren(feedback);

    const icon = document.createElement('i');
    icon.className = iconClass;
    feedback.appendChild(icon);
    appendTextNode(feedback, ` ${message}`);

    if (detail) {
      const detailDiv = document.createElement('div');
      detailDiv.style.marginTop = '6px';
      detailDiv.style.fontSize = '12px';
      detailDiv.style.color = isError ? 'var(--danger)' : 'var(--accent-amber)';
      detailDiv.textContent = detail;
      feedback.appendChild(detailDiv);
    }
  }

  const raw = inputArea.value.trim();
  if (!raw) {
    renderFeedback({
      isError: true,
      iconClass: 'fa-solid fa-circle-exclamation',
      message: 'Vui lòng dán danh sách mã lớp hoặc mã Bookmarklet vào ô trước khi bấm áp dụng!'
    });
    return;
  }

  const isBookmarkletOrScript = raw.includes('javascript:') || raw.includes('Set(') || raw.includes('function(') || raw.includes('querySelectorAll');
  const chkClear = document.getElementById('chkClearBeforeImport');
  const clearBefore = chkClear ? chkClear.checked : true;

  const result = parseAndApplyCodesToPlan(currentPlanId, raw, clearBefore);

  if (!result.success) {
    renderFeedback({
      isError: true,
      iconClass: 'fa-solid fa-circle-xmark',
      message: result.message || 'Không tìm thấy môn học nào khớp!',
      detail: result.notFoundCodes ? `Mã không khớp: ${result.notFoundCodes.join(', ')}` : ''
    });
    return;
  }

  savePlansToStorage();
  renderAll();

  // Show Success Feedback
  const successMsg = isBookmarkletOrScript
    ? `🪄 Đã nhận diện mã Bookmarklet/Script! Tự động trích xuất ${result.totalCount} mã lớp & xếp thành công ${result.theoryCount} môn vào TKB!`
    : `Đã xếp thành công ${result.theoryCount} môn học phần vào Thời khóa biểu!`;

  renderFeedback({
    isError: false,
    iconClass: 'fa-solid fa-circle-check',
    message: successMsg,
    detail: result.notFoundCodes && result.notFoundCodes.length > 0 ? `Không tìm thấy ${result.notFoundCodes.length} mã: ${result.notFoundCodes.join(', ')}` : ''
  });
  showAppToast(isBookmarkletOrScript ? `🪄 Đã giải mã Bookmarklet & xếp ${result.theoryCount} môn vào TKB!` : `⚡ Đã xếp ${result.theoryCount} môn vào TKB!`);
}

function setupImportCodesFileDrop() {
  const dropzoneWrapper = document.getElementById('importDropzoneWrapper');
  const dropzoneOverlay = document.getElementById('dropzoneDragOverlay');
  const fileInput = document.getElementById('importTxtFileInput');
  const btnSelectFiles = document.getElementById('btnSelectTxtFiles');
  const inputArea = document.getElementById('importCodesTextarea');

  if (btnSelectFiles && fileInput) {
    btnSelectFiles.addEventListener('click', () => fileInput.click());
  }

  function handleFiles(files) {
    if (!files || files.length === 0) return;

    if (files.length === 1) {
      // Single file mode
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result || '';
        if (inputArea) inputArea.value = content;
        handleApplyImportCodes();
      };
      reader.readAsText(file);
    } else {
      // Multiple files mode -> Create separate plan for each file!
      let loadedCount = 0;
      const totalFiles = files.length;
      let firstPlanId = null;

      Array.from(files).forEach((file, idx) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result || '';
          const cleanName = file.name.replace(/\.[^/.]+$/, '').toUpperCase();
          const planKey = 'plan_' + Date.now() + '_' + idx;
          if (!firstPlanId) firstPlanId = planKey;

          plans[planKey] = {
            name: `Phương án: ${cleanName}`,
            selected: [],
            practiceChoices: {}
          };

          parseAndApplyCodesToPlan(planKey, content, true);
          loadedCount++;

          if (loadedCount === totalFiles) {
            if (firstPlanId) currentPlanId = firstPlanId;
            savePlansToStorage();
            renderAll();
            closeModal('modalImportExportCodes');
            showAppToast(`🎉 Đã tự động tạo ${totalFiles} Kế hoạch TKB từ ${totalFiles} file .txt!`);
          }
        };
        reader.readAsText(file);
      });
    }
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      handleFiles(e.target.files);
      fileInput.value = '';
    });
  }

  if (dropzoneWrapper) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzoneWrapper.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (dropzoneOverlay) dropzoneOverlay.style.display = 'flex';
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzoneWrapper.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (dropzoneOverlay) dropzoneOverlay.style.display = 'none';
      });
    });

    dropzoneWrapper.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (dropzoneOverlay) dropzoneOverlay.style.display = 'none';
      if (e.dataTransfer && e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files);
      }
    });
  }
}

async function copyExportCodes() {
  const exportArea = document.getElementById('exportCodesTextarea');
  if (!exportArea || !exportArea.value.trim()) {
    showAppToast('⚠️ Chưa có môn học nào trong TKB để sao chép!');
    return;
  }

  try {
    await navigator.clipboard.writeText(exportArea.value.trim());
    showAppToast('📋 Đã sao chép danh sách mã lớp!');
  } catch (e) {
    exportArea.select();
    document.execCommand('copy');
    showAppToast('📋 Đã sao chép danh sách mã lớp!');
  }
}

// ==============================================================================
// 15. AI AUTO-SCHEDULER ENGINE (COMBINATORIAL CSP BACKTRACKING & SCORING)
// ==============================================================================
let autoSchedSelectedSubjects = []; // Array of maMH (e.g. ['IT004', 'IT007', 'MA005', 'NT106', 'SS007'])
let generatedSolutions = []; // Cache of generated solutions

function openAutoSchedulerModal() {
  if (autoSchedSelectedSubjects.length === 0) {
    // If empty, preset with sample 5 subjects or current selected courses' subjects
    const currentSubjectCodes = new Set();
    (plans[currentPlanId]?.selected || []).forEach(cid => {
      const c = courseMap.get(cid);
      if (c && c.maMH) currentSubjectCodes.add(c.maMH);
    });

    if (currentSubjectCodes.size >= 2) {
      autoSchedSelectedSubjects = Array.from(currentSubjectCodes);
    } else {
      autoSchedSelectedSubjects = ['IT004', 'IT007', 'MA005', 'NT106', 'SS007'];
    }
  }

  renderAutoSchedChips();
  initAutoSchedCombobox();
  initAutoSchedExcludeTeacherCombobox();
  renderExcludedTeachersChips();
  openModal('modalAutoScheduler');
}

function renderAutoSchedChips() {
  const container = document.getElementById('autoSchedChipsList');
  if (!container) return;
  container.innerHTML = '';

  if (autoSchedSelectedSubjects.length === 0) {
    container.innerHTML = `<span style="font-size: 12px; color: var(--text-muted); padding: 4px;">(Chưa chọn môn nào - Tìm kiếm hoặc bấm chọn 5 môn mẫu bên dưới)</span>`;
    return;
  }

  autoSchedSelectedSubjects.forEach(maMH => {
    const meta = uniqueSubjectsList.find(s => s.maMH === maMH) || { maMH, tenMH: maMH };
    const chip = document.createElement('span');
    chip.className = 'auto-sched-chip';
    chip.innerHTML = `
      <span><strong>${escapeHtml(meta.maMH)}</strong> - ${escapeHtml(meta.tenMH)}</span>
      <span class="auto-sched-chip-remove" data-remove-autosched="${escapeHtml(meta.maMH)}">&times;</span>
    `;
    container.appendChild(chip);
  });
}

window.removeAutoSchedSubject = function(maMH) {
  autoSchedSelectedSubjects = autoSchedSelectedSubjects.filter(m => m !== maMH);
  renderAutoSchedChips();
};

function initAutoSchedCombobox() {
  const input = document.getElementById('autoSchedSearchInput');
  const dropdown = document.getElementById('autoSchedDropdown');
  const clearBtn = document.getElementById('autoSchedClearInputBtn');
  if (!input || !dropdown) return;

  function renderDropdown(filterText = '') {
    const q = removeDiacritics(filterText.trim());
    const matched = uniqueSubjectsList.filter(s => 
      !autoSchedSelectedSubjects.includes(s.maMH) &&
      (!q || removeDiacritics(s.maMH).includes(q) || removeDiacritics(s.tenMH).includes(q))
    );

    if (matched.length === 0) {
      dropdown.innerHTML = `<div style="padding: 10px; font-size: 12px; color: var(--text-muted); text-align: center;">Không tìm thấy môn học</div>`;
      return;
    }

    dropdown.innerHTML = '';
    matched.slice(0, 50).forEach(s => {
      const opt = document.createElement('div');
      opt.className = 'combobox-option';
      opt.innerHTML = `
        <span class="combobox-opt-title"><strong>${s.maMH}</strong> • ${s.tenMH}</span>
        <span class="combobox-opt-badge">${s.count} lớp</span>
      `;
      opt.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Prevent input blur before click
        if (!autoSchedSelectedSubjects.includes(s.maMH)) {
          autoSchedSelectedSubjects.push(s.maMH);
          renderAutoSchedChips();
        }
        input.value = '';
        dropdown.classList.remove('open');
        dropdown.classList.remove('show');
      });
      dropdown.appendChild(opt);
    });
  }

  input.onfocus = () => {
    renderDropdown(input.value);
    dropdown.classList.add('open');
    dropdown.classList.add('show');
  };

  input.onclick = () => {
    renderDropdown(input.value);
    dropdown.classList.add('open');
    dropdown.classList.add('show');
  };

  input.oninput = () => {
    renderDropdown(input.value);
    dropdown.classList.add('open');
    dropdown.classList.add('show');
  };

  if (clearBtn) {
    clearBtn.onclick = () => {
      input.value = '';
      dropdown.classList.remove('open');
      dropdown.classList.remove('show');
    };
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#autoSchedSearchInput') && !e.target.closest('#autoSchedDropdown')) {
      dropdown.classList.remove('open');
      dropdown.classList.remove('show');
    }
  });
}

function initAutoSchedExcludeTeacherCombobox() {
  const input = document.getElementById('autoSchedExcludeTeacherInput');
  const dropdown = document.getElementById('autoSchedExcludeTeacherDropdown');
  const clearBtn = document.getElementById('autoSchedExcludeTeacherClearBtn');
  if (!input || !dropdown) return;

  function renderDropdown(filterText = '') {
    const q = removeDiacritics(filterText.trim());
    const matched = uniqueTeachersList.filter(t => 
      !q || removeDiacritics(t.name).includes(q)
    );

    if (matched.length === 0) {
      dropdown.innerHTML = `<div style="padding: 10px; font-size: 12px; color: var(--text-muted); text-align: center;">Không tìm thấy giảng viên</div>`;
      return;
    }

    dropdown.innerHTML = '';
    matched.slice(0, 60).forEach(t => {
      const isExcluded = (currentFilters.excludedTeachers || []).includes(t.name);
      const opt = document.createElement('div');
      opt.className = `combobox-option ${isExcluded ? 'is-excluded active' : ''}`;
      opt.innerHTML = `
        <div style="display: flex; align-items: center; gap: 7px;">
          <i class="fa-solid ${isExcluded ? 'fa-square-check' : 'fa-square'}" style="color: ${isExcluded ? '#ef4444' : 'var(--text-muted)'}; font-size: 13px;"></i>
          <span><strong>${escapeHtml(t.name)}</strong></span>
        </div>
        <span class="combobox-count-badge" style="${isExcluded ? 'color: #ef4444; border-color: rgba(239,68,68,0.35); background: rgba(239,68,68,0.1);' : ''}">
          ${isExcluded ? 'Đã loại trừ' : `${t.count} lớp`}
        </span>
      `;
      opt.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (isExcluded) {
          removeExcludedTeacher(t.name);
        } else {
          addExcludedTeacher(t.name);
        }
        renderDropdown(input.value);
      });
      dropdown.appendChild(opt);
    });
  }

  input.onfocus = () => {
    renderDropdown(input.value);
    dropdown.classList.add('open');
    dropdown.classList.add('show');
  };

  input.onclick = () => {
    renderDropdown(input.value);
    dropdown.classList.add('open');
    dropdown.classList.add('show');
  };

  input.oninput = () => {
    renderDropdown(input.value);
    dropdown.classList.add('open');
    dropdown.classList.add('show');
  };

  if (clearBtn) {
    clearBtn.onclick = () => {
      clearAllExcludedTeachers();
      input.value = '';
      dropdown.classList.remove('open');
      dropdown.classList.remove('show');
    };
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#autoSchedExcludeTeacherInput') && !e.target.closest('#autoSchedExcludeTeacherDropdown')) {
      dropdown.classList.remove('open');
      dropdown.classList.remove('show');
    }
  });
}

function checkTwoSlotsOverlap(s1, s2) {
  return checkTwoItemsOverlap(s1, s2);
}

// Fast Bitwise Slot Mask Generator for ultra-fast collision detection
function createSlotMask(slots) {
  const maskEven = new Int16Array(7);
  const maskOdd = new Int16Array(7);

  slots.forEach(s => {
    const d = parseInt(s.thu, 10);
    if (isNaN(d) || d < 2 || d > 8) return;
    const dayIdx = d - 2;
    let periodBits = 0;
    (s.tiet || []).forEach(p => {
      if (p >= 1 && p <= 10) periodBits |= (1 << (p - 1));
    });

    const cTuan = s.cachTuan || 1;
    const tChanLe = s.tuanChanLe || '';

    if (cTuan === 2) {
      if (tChanLe === 'chan') {
        maskEven[dayIdx] |= periodBits;
      } else if (tChanLe === 'le') {
        maskOdd[dayIdx] |= periodBits;
      } else {
        maskEven[dayIdx] |= periodBits;
        maskOdd[dayIdx] |= periodBits;
      }
    } else {
      maskEven[dayIdx] |= periodBits;
      maskOdd[dayIdx] |= periodBits;
    }
  });

  return { maskEven, maskOdd };
}

function runAutoSchedulerAlgorithm() {
  // DoS Defense & Client-side Rate Limiter
  if (window.DKHP_SECURITY && !DKHP_SECURITY.rateLimit('runAutoScheduler', 8, 2000)) {
    if (typeof showAppToast === 'function') {
      showAppToast('⚠️ Bạn đang thao tác quá nhanh! Vui lòng chờ giây lát.');
    }
    return;
  }

  if (autoSchedSelectedSubjects.length === 0) {
    alert('Vui lòng chọn ít nhất 1 hoặc nhiều môn học để tự động tạo Thời khóa biểu!');
    return;
  }

  const startTime = performance.now();
  const listContainer = document.getElementById('autoSchedSolutionsList');
  const countBadge = document.getElementById('autoSchedResultsCount');
  const elapsedBadge = document.getElementById('autoSchedElapsedBadge');

  if (listContainer) {
    listContainer.innerHTML = `
      <div style="text-align: center; padding: 36px 12px; color: var(--primary);">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 28px; margin-bottom: 8px;"></i>
        <div style="font-weight: 700; font-size: 14px;">Đang tính toán toàn bộ không gian tổ hợp tối ưu...</div>
      </div>
    `;
  }

  // 1. Gather Preferences
  const targetDaysOff = Array.from(document.querySelectorAll('#autoSchedDaysOffGrid input:checked')).map(cb => parseInt(cb.value, 10));
  const shiftPref = document.querySelector('input[name="autoSchedShift"]:checked')?.value || 'all';
  const avoidGaps = document.getElementById('chkAutoSchedAvoidGaps')?.checked ?? true;
  const avoidWarned = document.getElementById('chkAutoSchedAvoidWarned')?.checked ?? true;
  const prefTopRated = document.getElementById('chkAutoSchedEverytimeTopRated')?.checked ?? true;
  const prefGenerous = document.getElementById('chkAutoSchedEverytimeGenerous')?.checked ?? true;

  // 2. Build and Deduplicate Candidate Units for each subject
  const subjectGroups = [];
  autoSchedSelectedSubjects.forEach(maMH => {
    const theories = allCourses.filter(c => c.maMH === maMH);
    const units = [];
    const seenUnitSignatures = new Set();

    theories.forEach(th => {
      // If teacher is in excluded teachers list, filter out completely
      if (currentFilters.excludedTeachers && currentFilters.excludedTeachers.length > 0) {
        if (th.tenGV && currentFilters.excludedTeachers.includes(th.tenGV.trim())) return;
      }

      // If warned teacher and user strictly requested to avoid warned, filter out early
      if (avoidWarned && typeof getEverytimeRating === 'function') {
        const r = getEverytimeRating(th.tenGV);
        if (r && (r.isWarned || r.tier === 'C')) return;
      }

      if (th.practices && th.practices.length > 0) {
        th.practices.forEach(pr => {
          // Check if practice teacher is excluded
          if (currentFilters.excludedTeachers && currentFilters.excludedTeachers.length > 0) {
            if (pr.tenGV && currentFilters.excludedTeachers.includes(pr.tenGV.trim())) return;
          }

          const uSig = `${th.id}#${pr.id}#${th.thu}_${(th.tiet||[]).join('')}#${pr.thu}_${(pr.tiet||[]).join('')}`;
          if (!seenUnitSignatures.has(uSig)) {
            seenUnitSignatures.add(uSig);
            const slots = [th, pr];
            units.push({
              theory: th,
              practice: pr,
              slots,
              mask: createSlotMask(slots),
              uKey: `${th.id}#${pr.id}`
            });
          }
        });
      } else {
        const uSig = `${th.id}##${th.thu}_${(th.tiet||[]).join('')}`;
        if (!seenUnitSignatures.has(uSig)) {
          seenUnitSignatures.add(uSig);
          const slots = [th];
          units.push({
            theory: th,
            practice: null,
            slots,
            mask: createSlotMask(slots),
            uKey: `${th.id}`
          });
        }
      }
    });

    if (units.length > 0) {
      // Heuristic Pre-Sorting: Order candidates from most desirable to least desirable
      units.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        [a, b].forEach((u, idx) => {
          let sVal = 0;
          if (typeof getEverytimeRating === 'function') {
            const r = getEverytimeRating(u.theory.tenGV);
            if (r) {
              if (r.tier === 'S') sVal += 35;
              else if (r.tier === 'A') sVal += 18;
              else if (r.tier === 'C' || r.isWarned) sVal -= 100;
              if (prefTopRated && r.rating >= 4.8) sVal += 10;
              if (prefGenerous && r.grading && r.grading.includes('Thoáng')) sVal += 10;
            }
          }

          u.slots.forEach(s => {
            const d = parseInt(s.thu, 10);
            if (targetDaysOff.includes(d)) sVal -= 30;

            const periods = s.tiet || [];
            if (shiftPref === 'morning') {
              if (periods.some(p => p <= 5)) sVal += 12;
              if (periods.some(p => p >= 6)) sVal -= 8;
            } else if (shiftPref === 'afternoon') {
              if (periods.some(p => p >= 6)) sVal += 12;
              if (periods.some(p => p <= 5)) sVal -= 8;
            }
          });

          if (idx === 0) scoreA = sVal; else scoreB = sVal;
        });

        return scoreB - scoreA;
      });

      subjectGroups.push({ maMH, units });
    }
  });

  if (subjectGroups.length < autoSchedSelectedSubjects.length) {
    if (listContainer) {
      const missing = autoSchedSelectedSubjects.filter(m => !subjectGroups.some(g => g.maMH === m));
      listContainer.innerHTML = `
        <div class="auto-sched-empty-state">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 32px; color: var(--danger); margin-bottom: 8px;"></i>
          <div style="font-weight: 700; font-size: 14px; color: var(--danger);">Không đủ lớp mở cho các môn: ${escapeHtml(missing.join(', '))}!</div>
          <div style="font-size: 12px; color: var(--text-muted); max-width: 320px; margin-top: 4px;">
            ${avoidWarned ? 'Có thể các lớp này bị loại do bộ lọc "Tránh giảng viên cảnh báo". Hãy thử bỏ tích mục này hoặc đổi môn khác nhé!' : 'Không tìm thấy lớp học phần nào tương ứng trong dữ liệu.'}
          </div>
        </div>
      `;
    }
    if (countBadge) countBadge.textContent = '❌ Không có phương án phù hợp';
    return;
  }

  // 3. Variable Ordering (MRV - Minimum Remaining Values)
  subjectGroups.sort((a, b) => a.units.length - b.units.length);

  // 4. Ultra-Fast Bitmask Backtracking Search with Global Deduplication
  const validCombinations = [];
  const seenClassSetKeys = new Set();
  const seenScheduleGridKeys = new Set();
  const occMask = { maskEven: new Int16Array(7), maskOdd: new Int16Array(7) };
  const MAX_SEARCH_SOLUTIONS = 3000;
  const watchdog = window.DKHP_SECURITY ? new DKHP_SECURITY.Watchdog(2000) : null;

  function backtrack(groupIndex, currentCombo) {
    if (watchdog) watchdog.check();
    if (validCombinations.length >= MAX_SEARCH_SOLUTIONS) return;

    if (groupIndex === subjectGroups.length) {
      // Deduplicate by class codes signature
      const classKey = currentCombo.map(u => u.uKey).sort().join('|');
      if (seenClassSetKeys.has(classKey)) return;
      seenClassSetKeys.add(classKey);

      // Deduplicate by visual schedule grid & teacher signature
      const schedKey = currentCombo.flatMap(u => u.slots).map(s => `${s.thu}:${(s.tiet||[]).join(',')}@${s.tenGV||''}`).sort().join('|');
      if (seenScheduleGridKeys.has(schedKey)) return;
      seenScheduleGridKeys.add(schedKey);

      validCombinations.push([...currentCombo]);
      return;
    }

    const currentGroup = subjectGroups[groupIndex];
    for (let i = 0; i < currentGroup.units.length; i++) {
      const candidate = currentGroup.units[i];
      const uM = candidate.mask;

      // Bitwise collision check
      let collision = false;
      for (let d = 0; d < 7; d++) {
        if ((occMask.maskEven[d] & uM.maskEven[d]) !== 0 || (occMask.maskOdd[d] & uM.maskOdd[d]) !== 0) {
          collision = true;
          break;
        }
      }

      if (!collision) {
        for (let d = 0; d < 7; d++) {
          occMask.maskEven[d] |= uM.maskEven[d];
          occMask.maskOdd[d] |= uM.maskOdd[d];
        }
        currentCombo.push(candidate);

        backtrack(groupIndex + 1, currentCombo);

        currentCombo.pop();
        for (let d = 0; d < 7; d++) {
          occMask.maskEven[d] &= ~uM.maskEven[d];
          occMask.maskOdd[d] &= ~uM.maskOdd[d];
        }
      }
    }
  }

  try {
    backtrack(0, []);
  } catch (err) {
    if (err.message === 'TIMEOUT_CIRCUIT_BREAKER_EXCEEDED') {
      console.warn('[SECURITY] Search halted by ExecutionWatchdog timeout.');
    } else {
      console.error(err);
    }
  }

  // 5. REFINED MULTI-OBJECTIVE MATHEMATICAL SCORING & HIGHLIGHT ENGINE
  const scoredSolutions = validCombinations.map(combo => {
    let score = 50.0;
    let totalCredits = 0;
    const daysUsed = new Set();
    const allSlots = [];
    const daySlotsMap = {};
    const classCodes = [];
    const highlightBadges = [];

    let tierSCount = 0;
    let tierACount = 0;
    let hasWarnedTeacher = false;
    let qualityBonus = 0;

    combo.forEach(u => {
      totalCredits += (u.theory.soTC || 0);
      if (u.practice) totalCredits += (u.practice.soTC || 0);

      const thCode = u.theory.maLop;
      const prCode = u.practice ? ` (TH: ${u.practice.maLop})` : '';
      classCodes.push(thCode + prCode);

      const gvName = u.theory.tenGV;
      if (gvName && typeof getEverytimeRating === 'function') {
        const rInfo = getEverytimeRating(gvName);
        if (rInfo) {
          if (rInfo.tier === 'C' || rInfo.isWarned) {
            hasWarnedTeacher = true;
            qualityBonus -= 100.0;
          } else if (rInfo.tier === 'S') {
            tierSCount++;
            qualityBonus += 30.0;
          } else if (rInfo.tier === 'A') {
            tierACount++;
            qualityBonus += 15.0;
          }

          if (prefTopRated && rInfo.rating >= 4.8) qualityBonus += 8.0;
          if (prefGenerous) {
            if (rInfo.grading && rInfo.grading.includes('Thoáng')) qualityBonus += 8.0;
            if (rInfo.attendance && (rInfo.attendance.includes('Không') || rInfo.attendance.includes('Dễ'))) qualityBonus += 6.0;
          }
        }
      }

      u.slots.forEach(s => {
        allSlots.push(s);
        const day = parseInt(s.thu, 10);
        if (!isNaN(day)) {
          daysUsed.add(day);
          if (!daySlotsMap[day]) daySlotsMap[day] = [];
          daySlotsMap[day].push(s);
        }
      });
    });

    // Score Component A: Target Days Off Optimization
    const actualDaysOff = [];
    let targetDaysOffSatisfied = 0;
    let targetDaysOffViolated = 0;

    [2, 3, 4, 5, 6, 7].forEach(d => {
      if (!daysUsed.has(d)) {
        actualDaysOff.push('Thứ ' + d);
        if (targetDaysOff.includes(d)) targetDaysOffSatisfied++;
      } else {
        if (targetDaysOff.includes(d)) targetDaysOffViolated++;
      }
    });

    if (targetDaysOff.length > 0) {
      score += (targetDaysOffSatisfied * 25.0);
      score -= (targetDaysOffViolated * 35.0);
      if (targetDaysOffViolated === 0 && targetDaysOffSatisfied === targetDaysOff.length) {
        score += 20.0; // Perfect Target Days Off Bonus
        highlightBadges.push(`🏖️ Nghỉ trọn vẹn ${targetDaysOff.map(d=>'T'+d).join(', ')}`);
      }
    } else {
      score += ((6 - daysUsed.size) * 8.0);
      if (daysUsed.size <= 3) {
        highlightBadges.push(`📅 Siêu gọn (${daysUsed.size} ngày/tuần)`);
      }
    }

    // Score Component B: Shift Alignment
    let morningSlots = 0;
    let afternoonSlots = 0;
    allSlots.forEach(s => {
      const periods = s.tiet || [];
      if (periods.some(p => p <= 5)) morningSlots++;
      if (periods.some(p => p >= 6)) afternoonSlots++;
    });

    if (shiftPref === 'morning') {
      const ratio = morningSlots / (allSlots.length || 1);
      score += (ratio * 25.0) - ((1 - ratio) * 20.0);
      if (afternoonSlots === 0) {
        score += 30.0; // 100% Morning Bonus
        highlightBadges.push('☀️ 100% Ca Sáng');
      }
    } else if (shiftPref === 'afternoon') {
      const ratio = afternoonSlots / (allSlots.length || 1);
      score += (ratio * 25.0) - ((1 - ratio) * 20.0);
      if (morningSlots === 0) {
        score += 30.0; // 100% Afternoon Bonus
        highlightBadges.push('🌙 100% Ca Chiều');
      }
    }

    // Anti-Fatigue Split Shift Penalty (Morning & Afternoon on same day)
    let splitShiftDays = 0;
    Object.keys(daySlotsMap).forEach(d => {
      const slots = daySlotsMap[d];
      let hasM = false, hasA = false;
      slots.forEach(s => {
        const p = s.tiet || [];
        if (p.some(x => x <= 5)) hasM = true;
        if (p.some(x => x >= 6)) hasA = true;
      });
      if (hasM && hasA) splitShiftDays++;
    });
    if (splitShiftDays > 0) {
      score -= (splitShiftDays * 15.0);
    }

    // Score Component C: Avoid Idle Gaps between classes in same day
    if (avoidGaps) {
      let totalGapPeriods = 0;
      Object.keys(daySlotsMap).forEach(d => {
        const slotsOnDay = daySlotsMap[d].sort((a, b) => {
          const aMin = (a.tiet && a.tiet.length > 0) ? Math.min(...a.tiet) : 0;
          const bMin = (b.tiet && b.tiet.length > 0) ? Math.min(...b.tiet) : 0;
          return aMin - bMin;
        });

        for (let i = 0; i < slotsOnDay.length - 1; i++) {
          const aMax = (slotsOnDay[i].tiet && slotsOnDay[i].tiet.length > 0) ? Math.max(...slotsOnDay[i].tiet) : 0;
          const bMin = (slotsOnDay[i+1].tiet && slotsOnDay[i+1].tiet.length > 0) ? Math.min(...slotsOnDay[i+1].tiet) : 0;
          const gap = bMin - aMax - 1;
          if (gap > 0) {
            totalGapPeriods += gap;
          }
        }
      });

      if (totalGapPeriods === 0) {
        score += 15.0; // Zero Gap Bonus
        highlightBadges.push('⚡ 0 Tiết Trống');
      } else {
        score -= (totalGapPeriods * 6.0);
      }
    }

    // Score Component D: Everytime Quality
    let totalTeacherStars = 0;
    const distinctTeacherMap = new Map();
    combo.forEach(u => {
      const gv = u.theory.tenGV;
      if (gv && !distinctTeacherMap.has(gv)) {
        const rInfo = (typeof getEverytimeRating === 'function') ? getEverytimeRating(gv) : null;
        const starVal = rInfo ? rInfo.rating : 4.0;
        distinctTeacherMap.set(gv, starVal);
      }
    });

    distinctTeacherMap.forEach(star => {
      totalTeacherStars += star;
    });

    const teacherCount = distinctTeacherMap.size || 1;
    const avgTeacherStars = Math.round((totalTeacherStars / teacherCount) * 10) / 10;

    score += qualityBonus;
    if (tierSCount >= 3) {
      highlightBadges.push(`🌟 ${tierSCount} GV Phật Sống`);
    } else if (tierSCount > 0) {
      highlightBadges.push(`✨ ${tierSCount} GV Phật Sống`);
    }

    if (avoidWarned && hasWarnedTeacher) {
      score -= 500.0;
    }

    const normalizedScore = Math.max(10, Math.min(100, Math.round(score)));

    return {
      combo,
      hasWarnedTeacher,
      tierSCount,
      tierACount,
      totalTeacherStars,
      avgTeacherStars,
      teacherCount,
      score: normalizedScore,
      totalCredits,
      daysCount: daysUsed.size,
      actualDaysOff,
      classCodes,
      highlightBadges
    };
  });

  // Sort by Total Teacher Stars Descending (Primary), then by overall score (Secondary)
  scoredSolutions.sort((a, b) => {
    if (Math.abs(b.totalTeacherStars - a.totalTeacherStars) >= 0.05) {
      return b.totalTeacherStars - a.totalTeacherStars;
    }
    return b.score - a.score;
  });
  generatedSolutions = scoredSolutions;

  const elapsed = Math.round(performance.now() - startTime);
  if (elapsedBadge) elapsedBadge.textContent = `Tính toán trong ${elapsed}ms (${scoredSolutions.length} phương án)`;

  renderAutoSchedSolutions(scoredSolutions);
}

function renderAutoSchedSolutions(solutions) {
  const container = document.getElementById('autoSchedSolutionsList');
  const countBadge = document.getElementById('autoSchedResultsCount');
  if (!container) return;
  container.innerHTML = '';

  if (solutions.length === 0) {
    if (countBadge) countBadge.textContent = '❌ Không có phương án phù hợp';
    container.innerHTML = `
      <div class="auto-sched-empty-state">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 32px; color: var(--danger); margin-bottom: 8px;"></i>
        <div style="font-weight: 700; font-size: 14px; color: var(--danger);">Không tìm thấy phương án nào 0% trùng lịch!</div>
        <div style="font-size: 12px; color: var(--text-muted); max-width: 320px; margin-top: 4px;">
          Các môn bạn chọn có giờ học bị trùng nhau ở tất cả các lớp. Hãy thử bỏ bớt 1 môn hoặc thay đổi tiêu chí nhé!
        </div>
      </div>
    `;
    return;
  }

  if (countBadge) countBadge.textContent = `✨ Tìm thấy ${solutions.length} phương án TKB (Ưu tiên ⭐ sao cao nhất)`;

  solutions.slice(0, 30).forEach((sol, index) => {
    const card = document.createElement('div');
    card.className = 'solution-card';

    let scoreColor = sol.avgTeacherStars >= 4.8 ? 'var(--accent-emerald)' : (sol.avgTeacherStars >= 4.0 ? 'var(--accent-amber)' : 'var(--primary)');
    let scoreText = sol.avgTeacherStars >= 4.8 ? 'Toàn Phật Sống' : (sol.avgTeacherStars >= 4.3 ? 'Dạy rất tốt' : 'Hợp lý');

    // Extract lecturers in this combination
    const teachersList = [];
    sol.combo.forEach(u => {
      const gv = u.theory.tenGV;
      if (gv && !teachersList.some(t => t.name === gv)) {
        const rInfo = typeof getEverytimeRating === 'function' ? getEverytimeRating(gv) : null;
        teachersList.push({
          name: gv,
          rInfo
        });
      }
    });

    const teachersHtml = teachersList.map(t => {
      if (!t.rInfo) {
        return `<span class="sol-teacher-chip" data-open-et="${escapeHtml(t.name)}"><i class="fa-solid fa-user-tie"></i> ${escapeHtml(t.name)}</span>`;
      }
      const bHtml = renderEverytimeBadge(t.name);
      const topTag = (t.rInfo.tags && t.rInfo.tags.length > 0) ? `#${escapeHtml(t.rInfo.tags[0])}` : '';
      return `
        <span class="sol-teacher-chip" data-open-et="${escapeHtml(t.name)}" title="Xem ${t.rInfo.reviewsCount} review Everytime">
          <i class="fa-solid fa-user-tie"></i>
          <span>${escapeHtml(t.name)}</span>
          ${bHtml}
          ${topTag ? `<span style="color: ${t.rInfo.isWarned ? '#dc2626' : 'var(--primary)'}; font-size: 10.5px; font-weight: 700;">${topTag}</span>` : ''}
        </span>
      `;
    }).join('');

    const badgesHtml = (sol.highlightBadges && sol.highlightBadges.length > 0)
      ? `<div class="solution-highlight-row">${sol.highlightBadges.map(b => `<span class="solution-highlight-pill">${escapeHtml(b)}</span>`).join('')}</div>`
      : '';

    card.innerHTML = `
      <div class="solution-card-header">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span style="font-weight: 800; font-size: 14px; color: var(--text-primary);">Phương án #${index + 1}</span>
          <span class="solution-score-badge" style="color: ${scoreColor};">
            <i class="fa-solid fa-star"></i> ${sol.totalTeacherStars.toFixed(1)}⭐ (${sol.avgTeacherStars.toFixed(1)}⭐ TB) • ${scoreText}
          </span>
        </div>
        <div style="font-size: 12px; font-weight: 700; color: var(--text-secondary);">
          ${sol.daysCount} ngày học/tuần • <span style="color: var(--primary); font-weight: 800;">${sol.totalCredits} TC</span>
        </div>
      </div>

      ${badgesHtml}

      <div style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
        <i class="fa-solid fa-calendar-check" style="color: #10b981;"></i>
        <span>Nghỉ: <strong>${sol.actualDaysOff.length > 0 ? sol.actualDaysOff.map(escapeHtml).join(', ') : 'Không có'}</strong></span>
      </div>

      <div class="solution-tags-row">
        ${sol.classCodes.map(code => `<span class="solution-class-tag">${escapeHtml(code)}</span>`).join('')}
      </div>

      <!-- Teachers in this Plan -->
      <div class="solution-teachers-box">
        <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 2px;">
          👨‍🏫 Giảng viên trong phương án này (Bấm vào để đọc toàn bộ review Everytime):
        </div>
        <div class="solution-teachers-row">
          ${teachersHtml}
        </div>
      </div>

      <div class="solution-card-actions">
        <button class="btn btn-secondary btn-sm" data-save-sol="${index}">
          <i class="fa-solid fa-folder-plus"></i> Lưu thành kế hoạch mới
        </button>
        <button class="btn btn-primary btn-sm" data-apply-sol="${index}">
          <i class="fa-solid fa-bolt"></i> Áp dụng vào TKB này
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}

window.applySolutionToCurrentPlan = function(solutionIndex) {
  const sol = generatedSolutions[solutionIndex];
  if (!sol) return;

  plans[currentPlanId].selected = [];
  if (!plans[currentPlanId].practiceChoices) {
    plans[currentPlanId].practiceChoices = {};
  }
  sol.combo.forEach(u => {
    plans[currentPlanId].selected.push(u.theory.id);
    if (u.practice) {
      plans[currentPlanId].practiceChoices[u.theory.id] = u.practice.id;
    }
  });

  savePlansToStorage();
  renderAll();
  closeModal('modalAutoScheduler');
  showAppToast(`🚀 Đã áp dụng Phương án #${solutionIndex + 1} (${sol.totalCredits} TC) thành công!`);
};

window.saveSolutionAsNewPlan = function(solutionIndex) {
  const sol = generatedSolutions[solutionIndex];
  if (!sol) return;

  const newId = 'plan_' + Date.now();
  const planName = `Phương Án #${solutionIndex + 1} (Nghỉ ${sol.actualDaysOff.slice(0,2).join(', ') || '0 ngày'})`;
  plans[newId] = {
    name: planName,
    selected: [],
    practiceChoices: {}
  };

  sol.combo.forEach(u => {
    plans[newId].selected.push(u.theory.id);
    if (u.practice) {
      plans[newId].practiceChoices[u.theory.id] = u.practice.id;
    }
  });

  currentPlanId = newId;
  savePlansToStorage();
  renderAll();
  closeModal('modalAutoScheduler');
  showAppToast(`💾 Đã tạo và chuyển sang kế hoạch mới: "${planName}"!`);
};

// Attach all auto-scheduler events inside bindEvents
// ==============================================================================
// 16. EVERYTIME VN REAL REVIEW MODAL & BADGE SYSTEM
// ==============================================================================
function renderEverytimeBadge(gvName, isCompact = false) {
  if (!gvName || typeof getEverytimeRating !== 'function') return '';
  const et = getEverytimeRating(gvName);
  if (!et) return '';

  let tierClass = '';
  let badgeLabel = `⭐ ${et.rating}`;

  if (et.tier === 'S') {
    tierClass = 'tier-s';
    badgeLabel = isCompact ? `🏆 ${et.rating}` : `🏆 Phật sống ⭐ ${et.rating}`;
  } else if (et.tier === 'C' || et.isWarned) {
    tierClass = 'tier-c';
    badgeLabel = isCompact ? `🛑 ${et.rating}` : `🛑 Cảnh báo né ⭐ ${et.rating}`;
  }

  return `
    <span class="everytime-badge ${tierClass} ${isCompact ? 'compact' : ''}" data-open-et="${escapeHtml(gvName)}" title="${et.reviewsCount} review Everytime: ${et.tier === 'S' ? 'Phật sống' : (et.isWarned ? 'Cảnh báo né' : 'Đánh giá')} (⭐ ${et.rating})">
      ${badgeLabel}
    </span>
  `;
}

window.openEverytimeModal = function(teacherName) {
  if (!teacherName || !teacherName.trim() || teacherName.includes('Chưa phân công')) {
    if (typeof showAppToast === 'function') {
      showAppToast('ℹ️ Lớp học này trường chưa công bố tên giảng viên cụ thể!');
    }
    return;
  }

  const data = typeof getEverytimeRating === 'function' ? getEverytimeRating(teacherName) : null;
  if (!data) {
    if (typeof showAppToast === 'function') {
      showAppToast(`ℹ️ Chưa có bài đánh giá nào cho giảng viên "${teacherName}"!`);
    }
    return;
  }

  const titleElem = document.getElementById('everytimeModalTeacherName');
  const bodyElem = document.getElementById('everytimeModalBody');
  if (titleElem) titleElem.textContent = `${data.name}`;

  if (bodyElem) {
    const starColor = data.rating >= 4.8 ? '#f59e0b' : (data.isWarned ? '#dc2626' : '#3b82f6');
    const starsHtml = '★'.repeat(Math.min(5, Math.round(data.rating))) + '☆'.repeat(Math.max(0, 5 - Math.round(data.rating)));

    let bannerHtml = '';
    if (data.tier === 'C' || data.isWarned) {
      const redFlagsEscaped = (data.redFlags && data.redFlags.length > 0) ? data.redFlags.map(f => escapeHtml(f)).join(' • ') : 'Có nhiều phản hồi tiêu cực về cách chấm điểm / bài tập!';
      bannerHtml = `
        <div class="everytime-alert-banner warn">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 22px;"></i>
          <div>
            <div style="font-size: 13px; font-weight: 800;">⚠️ CẢNH BÁO TỪ ĐÁNH GIÁ CỦA SINH VIÊN:</div>
            <div style="font-size: 12px; font-weight: 500; margin-top: 2px;">
              ${redFlagsEscaped}
            </div>
          </div>
        </div>
      `;
    } else if (data.tier === 'S') {
      bannerHtml = `
        <div class="everytime-alert-banner phatsong">
          <i class="fa-solid fa-crown" style="font-size: 22px; color: #f59e0b;"></i>
          <div>
            <div style="font-size: 13px; font-weight: 800;">🏆 PHẬT SỐNG UIT (GIẢNG VIÊN ĐƯỢC YÊU THÍCH):</div>
            <div style="font-size: 12px; font-weight: 500; margin-top: 2px;">
              ${data.recommendPercent}% Sinh viên đề xuất • Chấm điểm thoáng & Nhiệt tình hỗ trợ!
            </div>
          </div>
        </div>
      `;
    } else if (data.tier === 'A') {
      bannerHtml = `
        <div class="everytime-alert-banner" style="background: rgba(59, 130, 246, 0.1); color: #2563eb; border: 1px solid rgba(59, 130, 246, 0.3);">
          <i class="fa-solid fa-thumbs-up" style="font-size: 20px; color: #3b82f6;"></i>
          <div>
            <div style="font-size: 13px; font-weight: 800;">🌟 GIẢNG VIÊN DẠY TỐT & CÓ TÂM:</div>
            <div style="font-size: 12px; font-weight: 500; margin-top: 2px;">
              Được ${data.recommendPercent}% sinh viên UIT đề xuất theo học!
            </div>
          </div>
        </div>
      `;
    }

    let reviewsHtml = '';
    if (data.topReviews && data.topReviews.length > 0) {
      reviewsHtml = data.topReviews.map(r => {
        const isLow = r.rating <= 2;
        return `
          <div class="everytime-review-card" style="${isLow ? 'border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.04);' : ''}">
            <div class="everytime-review-header">
              <span style="color: ${isLow ? '#dc2626' : '#f59e0b'}; font-weight: 800;">${'★'.repeat(r.rating)} (${r.rating}/5)</span>
              <span style="color: var(--text-muted); font-size: 11px;">${escapeHtml(r.semesterName || 'Học kỳ gần đây')} • ${escapeHtml(r.courseName || '')}</span>
            </div>
            <div class="everytime-review-text" style="${isLow ? 'color: #dc2626; font-weight: 600;' : ''}">"${escapeHtml(r.text)}"</div>
            ${r.posvotes > 0 ? `<div style="font-size: 11px; color: var(--accent-emerald); font-weight: 700;"><i class="fa-solid fa-thumbs-up"></i> ${r.posvotes} sinh viên đồng tình</div>` : ''}
          </div>
        `;
      }).join('');
    } else if (data.comment) {
      reviewsHtml = `
        <div class="everytime-review-card">
          <div class="everytime-review-header">
            <span style="color: #f59e0b; font-weight: 800;">★★★★★ (5/5)</span>
            <span style="color: var(--text-muted); font-size: 11px;">Học kỳ gần đây</span>
          </div>
          <div class="everytime-review-text">"${escapeHtml(data.comment)}"</div>
        </div>
      `;
    }

    bodyElem.innerHTML = `
      ${bannerHtml}

      <div class="everytime-header-box">
        <div>
          <div style="font-size: 12px; font-weight: 700; color: #e11d48; text-transform: uppercase; letter-spacing: 0.5px;">Điểm đánh giá thực tế</div>
          <div class="everytime-big-score">
            <span class="everytime-score-val" style="color: ${data.isWarned ? '#dc2626' : '#e11d48'};">${data.rating}</span>
            <span style="font-size: 16px; color: var(--text-secondary); font-weight: 700;">/ 5.0</span>
            <span style="color: ${starColor}; font-size: 18px; margin-left: 6px;">${starsHtml}</span>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 13px; font-weight: 800; color: ${data.isWarned ? '#dc2626' : 'var(--accent-emerald)'};">
            ${data.isWarned ? '⚠️' : '🔥'} ${data.recommendPercent}% Sinh viên đề xuất
          </div>
          <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">Dựa trên <strong>${data.reviewsCount} bài đánh giá</strong></div>
        </div>
      </div>

      <div class="everytime-criteria-grid">
        <div class="everytime-criteria-card">
          <div class="everytime-criteria-label">🎁 Chấm điểm thi</div>
          <div class="everytime-criteria-val" style="color: ${data.isWarned ? '#dc2626' : 'var(--accent-emerald)'};">${data.grading}</div>
        </div>
        <div class="everytime-criteria-card">
          <div class="everytime-criteria-label">📋 Mức độ điểm danh</div>
          <div class="everytime-criteria-val" style="color: var(--primary);">${data.attendance}</div>
        </div>
        <div class="everytime-criteria-card">
          <div class="everytime-criteria-label">📚 Lượng bài tập</div>
          <div class="everytime-criteria-val" style="color: var(--accent-amber);">${data.workload}</div>
        </div>
      </div>

      <div style="margin-top: 14px;">
        <div style="font-size: 12px; font-weight: 700; color: var(--text-secondary);">🏷️ Tags đặc trưng của Giảng viên:</div>
        <div class="everytime-tags-container">
          ${(data.tags || []).map(t => `<span class="everytime-tag-pill" style="${data.isWarned ? 'background: rgba(239, 68, 68, 0.15); color: #dc2626; border-color: rgba(239,68,68,0.3);' : ''}">#${t}</span>`).join('')}
        </div>
      </div>

      <div style="margin-top: 16px;">
        <div style="font-size: 12.5px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px;">
          💬 Đánh giá thực tế từ sinh viên UIT (${data.reviewsCount}):
        </div>
        <div class="everytime-reviews-list">
          ${reviewsHtml}
        </div>
      </div>

      <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 11.5px; color: var(--text-muted);">
          <i class="fa-solid fa-filter"></i> Quản lý bộ lọc TKB & Xếp lịch tự động
        </span>
        <button type="button" class="btn ${((currentFilters.excludedTeachers || []).includes(data.name.trim())) ? 'btn-secondary' : 'btn-danger'} btn-sm" data-toggle-exclude-teacher="${escapeHtml(data.name)}" style="font-size: 12px; font-weight: 700;">
          <i class="fa-solid ${((currentFilters.excludedTeachers || []).includes(data.name.trim())) ? 'fa-check' : 'fa-user-slash'}"></i>
          <span>${((currentFilters.excludedTeachers || []).includes(data.name.trim())) ? '✅ Đang Trong Danh Sách Né (Bấm Để Hủy)' : '🚫 Thêm Vào Danh Sách Né GV Này'}</span>
        </button>
      </div>
    `;
  }

  openModal('modalEverytimeReview');
};

window.autoScheduleCurrentPlan = function() {
  const currentSelected = plans[currentPlanId]?.selected || [];
  const subjectsInPlan = Array.from(new Set(
    currentSelected.map(id => courseMap.get(id)?.maMH).filter(Boolean)
  ));

  if (subjectsInPlan.length === 0) {
    showAppToast('⚠️ Kế hoạch hiện tại chưa có môn nào. Vui lòng chọn ít nhất 1 môn vào TKB trước!');
    return;
  }

  autoSchedSelectedSubjects = [...subjectsInPlan];
  openAutoSchedulerModal();
  renderAutoSchedChips();
  renderExcludedTeachersChips();
  runAutoSchedulerAlgorithm();
  showAppToast(`⚡ Đang tự động xếp TKB tối ưu cho ${subjectsInPlan.length} môn trong khung hiện tại!`);
};

window.loadSubjectsFromCurrentPlan = function() {
  const currentSelected = plans[currentPlanId]?.selected || [];
  const subjectsInPlan = Array.from(new Set(
    currentSelected.map(id => courseMap.get(id)?.maMH).filter(Boolean)
  ));

  if (subjectsInPlan.length === 0) {
    showAppToast('⚠️ Kế hoạch hiện tại chưa có môn nào!');
    return;
  }

  autoSchedSelectedSubjects = [...subjectsInPlan];
  renderAutoSchedChips();
  showAppToast(`📥 Đã nạp ${subjectsInPlan.length} môn từ TKB hiện tại: ${subjectsInPlan.join(', ')}`);
};

const originalBindEvents = bindEvents;
bindEvents = function() {
  originalBindEvents();

  // Auto Schedule for Current Plan
  const btnAutoScheduleCurrentPlan = document.getElementById('btnAutoScheduleCurrentPlan');
  if (btnAutoScheduleCurrentPlan) btnAutoScheduleCurrentPlan.addEventListener('click', autoScheduleCurrentPlan);

  const btnAutoSchedFromCurrentPlan = document.getElementById('btnAutoSchedFromCurrentPlan');
  if (btnAutoSchedFromCurrentPlan) btnAutoSchedFromCurrentPlan.addEventListener('click', loadSubjectsFromCurrentPlan);

  // Setup Drag & Drop and File Picker for Import Codes Modal
  setupImportCodesFileDrop();

  // Timetable Week View Segmented Control (Đầy đủ vs Tuần không TH vs Tuần có TH)
  document.querySelectorAll('#weekViewSegmentedControl .seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#weekViewSegmentedControl .seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentWeekView = btn.dataset.weekView || 'all';
      renderTimetableMatrix();
    });
  });

  const btnOpenAutoScheduler = document.getElementById('btnOpenAutoScheduler');
  if (btnOpenAutoScheduler) btnOpenAutoScheduler.addEventListener('click', openAutoSchedulerModal);

  const btnAutoSchedPreset5 = document.getElementById('btnAutoSchedPreset5');
  if (btnAutoSchedPreset5) {
    btnAutoSchedPreset5.addEventListener('click', () => {
      autoSchedSelectedSubjects = ['IT004', 'IT007', 'MA005', 'NT106', 'SS007'];
      renderAutoSchedChips();
      showAppToast('⚡ Đã nạp 5 môn mẫu (17 TC)! Bấm "Tạo & Tìm Kiếm" nhé.');
    });
  }

  const btnAutoSchedClearSubjects = document.getElementById('btnAutoSchedClearSubjects');
  if (btnAutoSchedClearSubjects) {
    btnAutoSchedClearSubjects.addEventListener('click', () => {
      autoSchedSelectedSubjects = [];
      renderAutoSchedChips();
    });
  }

  const btnRunAutoScheduler = document.getElementById('btnRunAutoScheduler');
  if (btnRunAutoScheduler) btnRunAutoScheduler.addEventListener('click', runAutoSchedulerAlgorithm);

  const btnExportScript = document.getElementById('btnExportScript');
  if (btnExportScript) btnExportScript.addEventListener('click', openScriptModal);

  const btnImportExportCodes = document.getElementById('btnImportExportCodes');
  if (btnImportExportCodes) btnImportExportCodes.addEventListener('click', () => openImportExportCodesModal('import'));

  const tabBtnImportCodes = document.getElementById('tabBtnImportCodes');
  if (tabBtnImportCodes) tabBtnImportCodes.addEventListener('click', () => switchCodesModalTab('import'));

  const tabBtnExportCodes = document.getElementById('tabBtnExportCodes');
  if (tabBtnExportCodes) tabBtnExportCodes.addEventListener('click', () => switchCodesModalTab('export'));

  const btnApplyImportCodes = document.getElementById('btnApplyImportCodes');
  if (btnApplyImportCodes) btnApplyImportCodes.addEventListener('click', handleApplyImportCodes);

  const btnCopyExportCodes = document.getElementById('btnCopyExportCodes');
  if (btnCopyExportCodes) btnCopyExportCodes.addEventListener('click', copyExportCodes);

  const btnDownloadExportTxt = document.getElementById('btnDownloadExportTxt');
  if (btnDownloadExportTxt) btnDownloadExportTxt.addEventListener('click', downloadExportCodesAsTxt);

  // Export Format Segmented Control
  document.querySelectorAll('#exportFormatSegmentedControl .seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#exportFormatSegmentedControl .seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentExportFormat = btn.dataset.exportFormat || 'newline';
      updateExportCodesDisplay();
    });
  });

  const btnModalOpenScript = document.getElementById('btnModalOpenScript');
  if (btnModalOpenScript) {
    btnModalOpenScript.addEventListener('click', () => {
      closeModal('modalSelectedList');
      openScriptModal();
    });
  }

  const btnCopyScriptCode = document.getElementById('btnCopyScriptCode');
  if (btnCopyScriptCode) btnCopyScriptCode.addEventListener('click', copyScriptToClipboard);

  const btnCopyScriptModalFooter = document.getElementById('btnCopyScriptModalFooter');
  if (btnCopyScriptModalFooter) btnCopyScriptModalFooter.addEventListener('click', copyScriptToClipboard);

  const btnDownloadScriptFile = document.getElementById('btnDownloadScriptFile');
  if (btnDownloadScriptFile) btnDownloadScriptFile.addEventListener('click', downloadScriptFile);

  // Auto-search from URL query parameters (e.g. from reviews.html)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const searchVal = urlParams.get('search') || urlParams.get('q');
    if (searchVal) {
      const trimmed = searchVal.trim();
      const subjectInput = document.getElementById('subjectSearchInput');
      const teacherInput = document.getElementById('teacherSearchInput');
      if (trimmed.match(/^[A-Z]{2}[0-9]{3}/i)) {
        if (subjectInput) {
          subjectInput.value = trimmed;
          subjectInput.dispatchEvent(new Event('input'));
        }
      } else {
        if (teacherInput) {
          teacherInput.value = trimmed;
          teacherInput.dispatchEvent(new Event('input'));
        }
      }
    }
  } catch (err) {
    console.warn('URL search parameter error:', err);
  }
};

