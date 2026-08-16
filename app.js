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
  { bg: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)', border: '#fb7185' }, // Rose Pink
  { bg: 'linear-gradient(135deg, #059669 0%, #047857 100%)', border: '#34d399' }, // Emerald
  { bg: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', border: '#fb923c' }, // Vivid Orange
  { bg: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', border: '#a78bfa' }, // Purple
  { bg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', border: '#60a5fa' }, // Blue
  { bg: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)', border: '#22d3ee' }, // Cyan
  { bg: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', border: '#fcd34d' }, // Amber
  { bg: 'linear-gradient(135deg, #db2777 0%, #9d174d 100%)', border: '#f472b6' }, // Magenta
  { bg: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', border: '#818cf8' }, // Indigo
  { bg: 'linear-gradient(135deg, #0d9488 0%, #115e59 100%)', border: '#2dd4bf' }  // Teal
];

// ==============================================================================
// 2. STATE MANAGEMENT
// ==============================================================================
let allCourses = [];
let courseMap = new Map(); // id -> course
let plans = {};
let currentPlanId = 'plan_1';

let uniqueSubjectsList = []; // Array of { maMH, tenMH, count }
let uniqueTeachersList = []; // Array of { name, count }

let currentFilters = {
  selectedSubject: 'all',
  selectedTeacher: 'all',
  faculty: 'all',
  day: 'all',
  shift: 'all',
  hideConflict: false,
  onlySelected: false
};
let selectedPracticeChoices = {}; // theoryMaLop -> selected practiceMaLop

// ==============================================================================
// 3. INITIALIZATION
// ==============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadPlansFromStorage();
  loadInitialDataset();
  buildUniqueMetaLists();
  initSearchableComboboxes();
  bindEvents();
  renderAll();
});

function loadInitialDataset() {
  const customData = localStorage.getItem('tkb_custom_dataset');
  if (customData) {
    try {
      allCourses = JSON.parse(customData);
    } catch (e) {
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
    'plan_1': { name: 'Kế hoạch 1 (Chính)', selected: [] },
    'plan_2': { name: 'Kế hoạch 2 (Dự phòng)', selected: [] },
    'plan_3': { name: 'Kế hoạch 3', selected: [] }
  };
}

function getDefaultPracticeChoices() {
  return {};
}

function loadPlansFromStorage() {
  const savedPlans = localStorage.getItem('tkb_plans');
  const savedHash = localStorage.getItem('tkb_plans_sha256');

  if (savedPlans) {
    try {
      if (window.DKHP_SECURITY && savedHash) {
        DKHP_SECURITY.sha256(savedPlans).then(calculated => {
          if (calculated !== savedHash) {
            console.warn('[SECURITY] LocalStorage data integrity mismatch detected!');
          }
        }).catch(err => console.error(err));
      }
      plans = JSON.parse(savedPlans);
    } catch (e) {
      plans = getDefaultPlans();
    }
  } else {
    plans = getDefaultPlans();
  }

  const savedActivePlan = localStorage.getItem('tkb_active_plan');
  if (savedActivePlan && plans[savedActivePlan]) {
    currentPlanId = savedActivePlan;
  } else {
    currentPlanId = Object.keys(plans)[0] || 'plan_1';
  }

  const savedChoices = localStorage.getItem('tkb_practice_choices');
  if (savedChoices) {
    try { 
      selectedPracticeChoices = JSON.parse(savedChoices) || {}; 
    } catch (e) {
      selectedPracticeChoices = {};
    }
  } else {
    selectedPracticeChoices = {};
  }
}

function savePlansToStorage() {
  const plansJson = JSON.stringify(plans);
  localStorage.setItem('tkb_plans', plansJson);
  localStorage.setItem('tkb_active_plan', currentPlanId);
  localStorage.setItem('tkb_practice_choices', JSON.stringify(selectedPracticeChoices));

  if (window.DKHP_SECURITY) {
    DKHP_SECURITY.sha256(plansJson).then(hash => {
      localStorage.setItem('tkb_plans_sha256', hash);
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

  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-combobox')) {
      subjectDropdown.classList.remove('open');
      teacherDropdown.classList.remove('open');
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
  const result = [];
  currentSelectedIds.forEach(id => {
    const item = courseMap.get(id);
    if (item) {
      result.push(item);
      if (!item.isTH && selectedPracticeChoices[id]) {
        const pItem = courseMap.get(selectedPracticeChoices[id]);
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
  renderPlanSelect();
  renderActiveFilterBadges();
  renderTimetableMatrix();
  renderCourseResults();
  renderStats();
  renderSelectedTable();
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
        <span>📚 Môn: ${currentFilters.selectedSubject}</span>
        <button onclick="clearSpecificFilter('subject')" title="Bỏ lọc môn">&times;</button>
      </span>
    `);
  }

  if (currentFilters.selectedTeacher !== 'all') {
    chips.push(`
      <span class="active-tag-chip">
        <span>👨‍🏫 GV: ${currentFilters.selectedTeacher}</span>
        <button onclick="clearSpecificFilter('teacher')" title="Bỏ lọc giảng viên">&times;</button>
      </span>
    `);
  }

  if (currentFilters.faculty !== 'all') {
    chips.push(`
      <span class="active-tag-chip">
        <span>🏛️ Khoa: ${currentFilters.faculty}</span>
        <button onclick="clearSpecificFilter('faculty')" title="Bỏ lọc khoa">&times;</button>
      </span>
    `);
  }

  if (chips.length > 0) {
    bar.innerHTML = chips.join('') + `
      <button class="btn btn-secondary" style="padding: 1px 6px; font-size: 11px; border-radius: 9999px;" onclick="clearAllTagFilters()">
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
  }
  renderAll();
};

window.clearAllTagFilters = function() {
  currentFilters.selectedSubject = 'all';
  currentFilters.selectedTeacher = 'all';
  currentFilters.faculty = 'all';
  const sInput = document.getElementById('subjectSearchInput');
  const tInput = document.getElementById('teacherSearchInput');
  const sClear = document.getElementById('subjectClearBtn');
  const tClear = document.getElementById('teacherClearBtn');
  if (sInput) sInput.value = '';
  if (tInput) tInput.value = '';
  if (sClear) sClear.style.display = 'none';
  if (tClear) tClear.style.display = 'none';
  document.querySelectorAll('#facultyFilterRow .filter-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.val === 'all');
  });
  renderAll();
};

function getCourseColor(maMH) {
  let hash = 0;
  for (let i = 0; i < maMH.length; i++) {
    hash = maMH.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[idx];
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

  filtered.slice(0, 120).forEach(course => {
    const isSelected = selectedIds.has(course.id);
    const card = document.createElement('div');
    card.className = `course-card ${isSelected ? 'is-selected' : ''}`;

    const theoryConflict = !isSelected ? checkItemConflictWithCurrent(course) : { hasConflict: false };

    const thuStr = course.thu === '*' ? 'Chưa xếp' : `Thứ ${course.thu}`;
    const tietStr = course.tiet.length ? `Tiết ${course.tiet.join(',')}` : (course.tietRaw || 'N/A');
    const gvStr = course.tenGV || 'Chưa phân công';
    const phongStr = course.phong || 'Chưa xếp';

    // Calculate total subject credits (LT + TH)
    const practiceTC = (course.practices && course.practices.length > 0) ? (course.practices[0].soTC || 0) : 0;
    const totalCourseTC = course.soTC + practiceTC;
    const creditsLabel = practiceTC > 0 ? `${totalCourseTC} TC` : `${course.soTC} TC`;

    // Compact Practice Pills HTML
    let practiceHTML = '';
    if (course.practices && course.practices.length > 0) {
      const selectedPracticeId = selectedPracticeChoices[course.id] || course.practices[0].id;
      
      const pills = course.practices.map(p => {
        const isPSelected = selectedPracticeId === p.id;
        const pConflict = checkItemConflictWithCurrent(p);
        const pThu = p.thu === '*' ? '?' : `T${p.thu}`;
        const pTiet = p.tiet.length ? `${p.tiet[0]}-${p.tiet[p.tiet.length-1]}` : p.tietRaw;
        const groupSuffix = p.maLop.replace(course.maLop, '');

        return `
          <button type="button" class="practice-pill-btn ${isPSelected ? 'selected' : ''} ${pConflict.hasConflict ? 'conflict' : ''}"
                  title="Nhóm ${groupSuffix}: ${pThu} (Tiết ${pTiet}) Phòng ${p.phong || 'N/A'}"
                  onclick="selectPracticeGroup('${course.id}', '${p.id}', event)">
            <strong>${groupSuffix || p.maLop}</strong>: ${pThu} (${pTiet})
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
        <div style="display: flex; align-items: center; gap: 5px;">
          <span class="course-code-badge">${course.maMH}</span>
          <span class="course-class-code">${course.maLop}</span>
        </div>
        <span class="course-credits-badge">${creditsLabel}</span>
      </div>

      <div class="course-title">${course.tenMH}</div>

      <div class="course-meta-row">
        <span class="meta-chip"><i class="fa-regular fa-calendar"></i> ${thuStr}</span>
        <span class="meta-chip"><i class="fa-regular fa-clock"></i> ${tietStr}</span>
        <span class="meta-chip"><i class="fa-solid fa-door-open"></i> ${phongStr}</span>
        <span class="meta-chip meta-chip-teacher" onclick="event.stopPropagation(); openEverytimeModal('${(course.tenGV || '').replace(/'/g, "\\'")}')" title="Bấm để xem đánh giá Everytime của ${gvStr}">
          <i class="fa-solid fa-user-tie" style="color: #e11d48;"></i>
          <span>${gvStr}</span>
          ${etBadge}
        </span>
      </div>

      ${practiceHTML}

      <div class="course-card-actions">
        ${theoryConflict.hasConflict ? `
          <span style="font-size: 10.5px; font-weight: 700; color: var(--danger);">
            <i class="fa-solid fa-triangle-exclamation"></i> Trùng với ${theoryConflict.conflictingWith.maLop}
          </span>
        ` : '<span></span>'}
        
        <button class="btn ${isSelected ? 'btn-danger' : 'btn-primary'}" onclick="toggleCourseSelect('${course.id}')" style="padding: 4px 10px; font-size: 12px;">
          <i class="fa-solid ${isSelected ? 'fa-xmark' : 'fa-plus'}"></i>
          <span>${isSelected ? 'Bỏ chọn' : 'Thêm vào TKB'}</span>
        </button>
      </div>
    `;

    fragment.appendChild(card);
  });

  container.appendChild(fragment);
}

window.selectPracticeGroup = function(theoryId, practiceId, e) {
  if (e) e.stopPropagation();
  selectedPracticeChoices[theoryId] = practiceId;
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
    if (course && course.practices && course.practices.length > 0 && !selectedPracticeChoices[courseId]) {
      selectedPracticeChoices[courseId] = course.practices[0].id;
    }
  }

  savePlansToStorage();
  renderAll();
};

// ==============================================================================
// 8. TIMETABLE MATRIX RENDERER
// ==============================================================================
function renderTimetableMatrix() {
  const grid = document.getElementById('timetableGrid');
  if (!grid) return;

  while (grid.children.length > 7) {
    grid.removeChild(grid.lastChild);
  }

  const flatItems = getSelectedFlatItems();
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

    const etBadge = renderEverytimeBadge(item.tenGV);

    block.innerHTML = `
      <div class="block-top-row">
        <span class="block-class-badge">${item.isTH ? 'TH' : 'LT'} • ${item.maLop}</span>
        <button class="block-delete-btn" title="Xóa môn này" onclick="event.stopPropagation(); removeCourseFromMatrix('${item.id}')">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="block-center-title">${item.tenMH}</div>

      <div class="block-bottom-row">
        <div class="block-meta-left">
          <div class="block-room-info"><i class="fa-solid fa-door-open"></i> ${item.phong || 'N/A'}</div>
          <div class="block-teacher-info block-teacher-clickable" onclick="event.stopPropagation(); openEverytimeModal('${(item.tenGV || '').replace(/'/g, "\\'")}')" title="Bấm xem đánh giá Everytime của ${item.tenGV || ''}">
            <i class="fa-solid fa-user-tie" style="color: #e11d48;"></i>
            <span>${item.tenGV || 'Chưa phân công'}</span>
            ${etBadge}
          </div>
        </div>
        <div class="block-meta-right">
          <span class="block-tc-badge">${item.soTC} TC</span>
        </div>
      </div>
    `;

    cell.appendChild(block);
  });
}

window.removeCourseFromMatrix = function(itemId) {
  const currentPlan = plans[currentPlanId];
  if (!currentPlan) return;

  let targetIdToRemove = itemId;
  for (const theoryId of currentPlan.selected) {
    if (selectedPracticeChoices[theoryId] === itemId) {
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
  let totalTC = 0;
  const daysSet = new Set();

  currentSelectedIds.forEach(id => {
    const item = courseMap.get(id);
    if (item) {
      totalTC += (item.soTC || 0);
      if (item.thu && item.thu !== '*') daysSet.add(item.thu);
      
      // Add practice credits accurately
      if (selectedPracticeChoices[id]) {
        const pItem = courseMap.get(selectedPracticeChoices[id]);
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

  const statusEl = document.getElementById('statConflictStatus');
  const alertBanner = document.getElementById('conflictAlertBanner');
  const alertText = document.getElementById('conflictAlertText');

  if (conflicts.length > 0) {
    statusEl.style.color = 'var(--danger)';
    statusEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Trùng ${conflicts.length} lịch`;

    const conflictDescriptions = conflicts.map(c => 
      `<strong>${c.itemA.maLop}</strong> (${c.itemA.tenMH}) trùng với <strong>${c.itemB.maLop}</strong> (${c.itemB.tenMH}) vào Thứ ${c.itemA.thu}`
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
    const tietStr = course.tiet.length ? `Tiết ${course.tiet.join(',')}` : course.tietRaw;

    const etRating = typeof getEverytimeRating === 'function' ? getEverytimeRating(course.tenGV) : null;
    const etBadge = etRating ? `
      <span class="everytime-badge" style="font-size: 10px; margin-left: 6px;" onclick="openEverytimeModal('${(course.tenGV || '').replace(/'/g, "\\'")}')" title="Xem review Everytime">
        ⭐ ${etRating.rating}
      </span>
    ` : '';

    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid var(--border-color)';
    tr.innerHTML = `
      <td style="padding: 8px; font-family: var(--font-mono); font-weight: 700; color: var(--primary);">${course.maLop}</td>
      <td style="padding: 8px; font-weight: 600;">
        ${course.tenMH}
        <div style="font-size: 11.5px; color: var(--text-muted); font-weight: 400; margin-top: 2px;">
          <i class="fa-solid fa-user-tie"></i> ${course.tenGV || 'Chưa phân công'} ${etBadge}
        </div>
      </td>
      <td style="padding: 8px; font-weight: 700; color: var(--accent-emerald);">${course.soTC} TC</td>
      <td style="padding: 8px;">${thuStr} (${tietStr})</td>
      <td style="padding: 8px;">${course.phong || 'N/A'}</td>
      <td style="padding: 8px; text-align: right;">
        <button class="btn btn-danger" style="padding: 3px 8px; font-size: 11px;" onclick="toggleCourseSelect('${course.id}')">
          <i class="fa-solid fa-trash-can"></i> Xóa
        </button>
      </td>
    `;
    tbody.appendChild(tr);

    if (selectedPracticeChoices[id]) {
      const p = courseMap.get(selectedPracticeChoices[id]);
      if (p) {
        totalTC += (p.soTC || 0);
        const pThu = p.thu === '*' ? 'Chưa xếp' : `Thứ ${p.thu}`;
        const pTiet = p.tiet.length ? `Tiết ${p.tiet.join(',')}` : p.tietRaw;
        const pEtRating = typeof getEverytimeRating === 'function' ? getEverytimeRating(p.tenGV) : null;
        const pEtBadge = pEtRating ? `
          <span class="everytime-badge" style="font-size: 10px; margin-left: 6px;" onclick="openEverytimeModal('${(p.tenGV || '').replace(/'/g, "\\'")}')" title="Xem review Everytime">
            ⭐ ${pEtRating.rating}
          </span>
        ` : '';

        const pTr = document.createElement('tr');
        pTr.style.borderBottom = '1px solid var(--border-color)';
        pTr.style.backgroundColor = 'var(--bg-surface-elevated)';
        pTr.innerHTML = `
          <td style="padding: 5px 8px 5px 20px; font-family: var(--font-mono); font-size: 11.5px; color: var(--accent-purple);">↳ ${p.maLop} (TH)</td>
          <td style="padding: 5px 8px; font-size: 11.5px; color: var(--text-secondary);">
            ${p.tenMH} (Thực hành)
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 1px;">
              <i class="fa-solid fa-user-tie"></i> ${p.tenGV || 'Chưa phân công'} ${pEtBadge}
            </div>
          </td>
          <td style="padding: 5px 8px; font-size: 11.5px; font-weight: 700; color: var(--accent-emerald);">${p.soTC} TC</td>
          <td style="padding: 5px 8px; font-size: 11.5px;">${pThu} (${pTiet})</td>
          <td style="padding: 5px 8px; font-size: 11.5px;">${p.phong || 'N/A'}</td>
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
  const progressEl = document.getElementById('uploadProgress');
  if (progressEl) progressEl.style.display = 'block';

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      
      const parsedData = parseWorkbookToCourses(workbook);
      if (parsedData.length > 0) {
        allCourses = parsedData;
        buildCourseMap();
        buildUniqueMetaLists();
        initSearchableComboboxes();
        localStorage.setItem('tkb_custom_dataset', JSON.stringify(allCourses));
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

  // Export JSON Backup
  document.getElementById('btnExportJson').addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(plans, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", `TKB_Backup_${new Date().toISOString().slice(0,10)}.json`);
    dl.click();
  });

  // Create New Plan
  document.getElementById('btnCreateNewPlan').addEventListener('click', () => {
    const input = document.getElementById('newPlanNameInput');
    const name = input.value.trim();
    if (!name) return;

    const newId = 'plan_' + Date.now();
    plans[newId] = { name: name, selected: [] };
    currentPlanId = newId;
    input.value = '';
    savePlansToStorage();
    renderPlansListModal();
    renderAll();
  });
}

function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('open');
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('open');
}

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
        <strong>${plan.name}</strong>
        <span style="font-size: 11px; color: var(--text-muted); margin-left: 6px;">(${plan.selected.length} môn)</span>
      </div>
      <div style="display: flex; gap: 6px;">
        <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="renamePlan('${pid}')">
          <i class="fa-solid fa-pen"></i> Đổi tên
        </button>
        <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="duplicatePlan('${pid}')">
          <i class="fa-solid fa-copy"></i> Nhân bản
        </button>
        ${Object.keys(plans).length > 1 ? `
          <button class="btn btn-danger" style="padding: 4px 8px; font-size: 11px;" onclick="deletePlan('${pid}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        ` : ''}
      </div>
    `;
    container.appendChild(row);
  });
}

window.renamePlan = function(pid) {
  const newName = prompt('Nhập tên mới cho kế hoạch:', plans[pid].name);
  if (newName && newName.trim()) {
    plans[pid].name = newName.trim();
    savePlansToStorage();
    renderPlansListModal();
    renderAll();
  }
};

window.duplicatePlan = function(pid) {
  const newId = 'plan_' + Date.now();
  plans[newId] = {
    name: plans[pid].name + ' (Bản sao)',
    selected: [...plans[pid].selected]
  };
  currentPlanId = newId;
  savePlansToStorage();
  renderPlansListModal();
  renderAll();
};

window.deletePlan = function(pid) {
  if (confirm(`Xác nhận xóa kế hoạch "${plans[pid].name}"?`)) {
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
      const chosenPracticeId = selectedPracticeChoices[cid] || course.practices[0].id;
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
  const classCodesString = classCodes.length > 0 ? classCodes.join('\n') : '// Chưa chọn môn học nào trong TKB';

  return `// ==============================================================================
// 🎓 SCRIPT AUTO ĐĂNG KÝ HỌC PHẦN UIT (dkhp.uit.edu.vn)
// 🚀 Xuất tự động từ: https://dkhpuit.vercel.app
// 👉 Hướng dẫn: Mở https://dkhp.uit.edu.vn -> F12 (Console) -> Dán mã này -> Enter
// ==============================================================================

var monDangKy = \`
${classCodesString}
\`;

var successLog = (message) => console.log('%c' + message, 'font-weight:bold; color:#10b981;');
var errorLog = (message) => console.log('%c' + message, 'font-weight:bold; color:#ef4444;');

DangKy(monDangKy);

function DangKy(monDangKyString) {
  try {
    var listMonDangKy = monDangKyString.trim().split('\\n').map((it) => it.trim()).filter(Boolean);
    var allRows = [...document.querySelectorAll('form table tr')];
    var rowsToDangKy = allRows.filter((it) => listMonDangKy.includes(it.querySelector('td:nth-child(2)')?.textContent?.trim()));
    
    if (rowsToDangKy.length === 0) {
      errorLog('⚠️ Không tìm thấy lớp học nào khớp! Hãy chắc chắn bạn đang ở đúng cổng đăng ký https://dkhp.uit.edu.vn');
      return;
    }

    rowsToDangKy.forEach((it, index) => {
      var chk = it.querySelector('td:first-child input[type="checkbox"]');
      if (chk && !chk.checked) chk.click();
      var tenLop = it.querySelector('td:nth-child(2)')?.textContent?.trim();
      successLog((index + 1) + '. ✅ Đã tích chọn lớp: ' + tenLop);
    });
    successLog('🎉 Đã hoàn tất chọn ' + rowsToDangKy.length + ' lớp học phần!');
  } catch (err) {
    errorLog('❌ Lỗi khi chọn lớp: ' + err.message);
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
    previewList.innerHTML = '';
    if (classCodes.length === 0) {
      previewList.innerHTML = `<span style="font-size: 12px; color: var(--text-muted);">(Chưa chọn môn nào)</span>`;
    } else {
      classCodes.forEach(code => {
        const pill = document.createElement('span');
        pill.className = 'script-class-pill';
        pill.innerHTML = `<i class="fa-solid fa-check" style="font-size: 9px;"></i> ${code}`;
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
  toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--accent-emerald);"></i> <span>${message}</span>`;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

// ==============================================================================
// 14. IMPORT / EXPORT CLASS CODES (AUTO SCHEDULING VIA CODE LIST)
// ==============================================================================
function openImportExportCodesModal(defaultTab = 'import') {
  switchCodesModalTab(defaultTab);
  
  // Populate export textarea
  const currentCodes = getSelectedClassCodes();
  const exportArea = document.getElementById('exportCodesTextarea');
  if (exportArea) {
    exportArea.value = currentCodes.length > 0 ? currentCodes.join('\n') : '';
  }

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

    const currentCodes = getSelectedClassCodes();
    const exportArea = document.getElementById('exportCodesTextarea');
    if (exportArea) exportArea.value = currentCodes.length > 0 ? currentCodes.join('\n') : '';
  }
}

function handleApplyImportCodes() {
  const inputArea = document.getElementById('importCodesTextarea');
  const feedback = document.getElementById('importResultFeedback');
  if (!inputArea || !feedback) return;

  const raw = inputArea.value.trim();
  if (!raw) {
    feedback.style.display = 'block';
    feedback.style.backgroundColor = 'var(--danger-light)';
    feedback.style.color = 'var(--danger)';
    feedback.style.border = '1px solid rgba(239, 68, 68, 0.3)';
    feedback.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Vui lòng dán danh sách mã lớp vào ô trước khi bấm áp dụng!';
    return;
  }

  const lines = raw.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
  const matchedTheories = new Set();
  const matchedPractices = {}; // theoryId -> practiceId
  const notFoundCodes = [];
  const foundClassNames = [];

  lines.forEach(code => {
    const cleanCode = code.toUpperCase();
    let found = false;

    // 1. Direct check in courseMap
    for (const [id, c] of courseMap.entries()) {
      if (id.toUpperCase() === cleanCode || (c.maLop && c.maLop.toUpperCase() === cleanCode)) {
        found = true;
        // Check if this course is a practice child of a theory course
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
    feedback.style.display = 'block';
    feedback.style.backgroundColor = 'var(--danger-light)';
    feedback.style.color = 'var(--danger)';
    feedback.style.border = '1px solid rgba(239, 68, 68, 0.3)';
    feedback.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Không tìm thấy môn học nào khớp với các mã: <strong>${lines.join(', ')}</strong> trong dữ liệu hiện tại!`;
    return;
  }

  // Clear existing if checked
  const chkClear = document.getElementById('chkClearBeforeImport');
  if (chkClear && chkClear.checked) {
    plans[currentPlanId].selected = [];
  }

  // Merge selected
  matchedTheories.forEach(tid => {
    if (!plans[currentPlanId].selected.includes(tid)) {
      plans[currentPlanId].selected.push(tid);
    }
  });

  // Assign practice choices
  Object.keys(matchedPractices).forEach(tid => {
    selectedPracticeChoices[tid] = matchedPractices[tid];
  });

  savePlansToStorage();
  renderAll();

  // Show Success Feedback
  feedback.style.display = 'block';
  feedback.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
  feedback.style.color = 'var(--accent-emerald)';
  feedback.style.border = '1px solid rgba(16, 185, 129, 0.3)';

  let msg = `<i class="fa-solid fa-circle-check"></i> <strong>Đã xếp thành công ${matchedTheories.size} môn học phần vào TKB!</strong>`;
  if (notFoundCodes.length > 0) {
    msg += `<div style="margin-top: 6px; font-size: 12px; color: var(--accent-amber);">⚠️ Không tìm thấy ${notFoundCodes.length} mã: ${notFoundCodes.join(', ')}</div>`;
  }
  feedback.innerHTML = msg;
  showAppToast(`⚡ Đã tự động xếp ${matchedTheories.size} môn học vào TKB!`);
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
      <span><strong>${meta.maMH}</strong> - ${meta.tenMH}</span>
      <span class="auto-sched-chip-remove" onclick="removeAutoSchedSubject('${meta.maMH}')">&times;</span>
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

function checkTwoSlotsOverlap(s1, s2) {
  if (!s1 || !s2) return false;
  if (parseInt(s1.thu, 10) !== parseInt(s2.thu, 10)) return false;
  const start1 = parseInt(s1.tietBatDau, 10);
  const end1 = parseInt(s1.tietKetThuc, 10);
  const start2 = parseInt(s2.tietBatDau, 10);
  const end2 = parseInt(s2.tietKetThuc, 10);
  return !(end1 < start2 || start1 > end2);
}

function runAutoSchedulerAlgorithm() {
  // DoS Defense & Client-side Rate Limiter
  if (window.DKHP_SECURITY && !DKHP_SECURITY.rateLimit('runAutoScheduler', 6, 3000)) {
    if (typeof showAppToast === 'function') {
      showAppToast('⚠️ Bạn đang thao tác quá nhanh! Vui lòng chờ 2 giây để bảo vệ hệ thống.');
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
        <div style="font-weight: 700; font-size: 14px;">Đang tính toán các tổ hợp tối ưu...</div>
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

  // 2. Build Candidate Units for each subject
  const subjectGroups = []; // Array of arrays of units
  autoSchedSelectedSubjects.forEach(maMH => {
    const theories = allCourses.filter(c => c.maMH === maMH);
    const units = [];

    theories.forEach(th => {
      if (th.practices && th.practices.length > 0) {
        th.practices.forEach(pr => {
          units.push({
            theory: th,
            practice: pr,
            slots: [th, pr]
          });
        });
      } else {
        units.push({
          theory: th,
          practice: null,
          slots: [th]
        });
      }
    });

    if (units.length > 0) {
      subjectGroups.push({ maMH, units });
    }
  });

  if (subjectGroups.length === 0) {
    if (listContainer) {
      listContainer.innerHTML = `<div class="auto-sched-empty-state"><div style="color: var(--danger); font-weight: 700;">Không tìm thấy lớp học phần nào cho các môn đã chọn!</div></div>`;
    }
    return;
  }

  // 3. Backtracking Search with CSP Pruning & Watchdog Circuit Breaker
  const validCombinations = [];
  const MAX_SOLUTIONS = 150;
  const watchdog = window.DKHP_SECURITY ? new DKHP_SECURITY.Watchdog(2500) : null;

  function backtrack(groupIndex, currentCombo, occupiedSlots) {
    if (watchdog) watchdog.check();
    if (validCombinations.length >= MAX_SOLUTIONS) return;

    if (groupIndex === subjectGroups.length) {
      validCombinations.push([...currentCombo]);
      return;
    }

    const currentGroup = subjectGroups[groupIndex];
    for (let i = 0; i < currentGroup.units.length; i++) {
      const candidateUnit = currentGroup.units[i];

      // Check collision between candidateUnit.slots and occupiedSlots
      let collision = false;
      for (const slot of candidateUnit.slots) {
        for (const occ of occupiedSlots) {
          if (checkTwoSlotsOverlap(slot, occ)) {
            collision = true;
            break;
          }
        }
        if (collision) break;
      }

      if (!collision) {
        currentCombo.push(candidateUnit);
        const nextOccupied = occupiedSlots.concat(candidateUnit.slots);
        backtrack(groupIndex + 1, currentCombo, nextOccupied);
        currentCombo.pop();
      }
    }
  }

  try {
    backtrack(0, [], []);
  } catch (err) {
    if (err.message === 'TIMEOUT_CIRCUIT_BREAKER_EXCEEDED') {
      console.warn('[SECURITY] Search halted by ExecutionWatchdog timeout.');
    } else {
      console.error(err);
    }
  }

  // 4. REFINED MULTI-OBJECTIVE MATHEMATICAL SCORING ALGORITHM
  const scoredSolutions = validCombinations.map(combo => {
    let score = 50.0; // Baseline neutral score
    let totalCredits = 0;
    const daysUsed = new Set();
    const allSlots = [];
    const daySlotsMap = {};
    const classCodes = [];

    combo.forEach(u => {
      totalCredits += (u.theory.soTinChi || 0);
      if (u.practice) totalCredits += (u.practice.soTinChi || 0);

      classCodes.push(u.theory.maLop);
      if (u.practice) classCodes.push(u.practice.maLop);

      u.slots.forEach(s => {
        allSlots.push(s);
        const day = parseInt(s.thu, 10);
        daysUsed.add(day);
        if (!daySlotsMap[day]) daySlotsMap[day] = [];
        daySlotsMap[day].push(s);
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
      score += (targetDaysOffSatisfied * 20.0);
      score -= (targetDaysOffViolated * 25.0);
    } else {
      score += ((6 - daysUsed.size) * 6.0);
    }

    // Score Component B: Shift Alignment (Morning / Afternoon)
    if (shiftPref === 'morning') {
      let morningCount = 0;
      let totalSlots = allSlots.length || 1;
      allSlots.forEach(s => {
        if (s.tietBatDau <= 5) morningCount++;
      });
      const ratio = morningCount / totalSlots;
      score += (ratio * 25.0) - ((1 - ratio) * 20.0);
    } else if (shiftPref === 'afternoon') {
      let afternoonCount = 0;
      let totalSlots = allSlots.length || 1;
      allSlots.forEach(s => {
        if (s.tietBatDau >= 6) afternoonCount++;
      });
      const ratio = afternoonCount / totalSlots;
      score += (ratio * 25.0) - ((1 - ratio) * 20.0);
    }

    // Score Component C: Avoid Idle Gaps between classes
    if (avoidGaps) {
      let totalGapPeriods = 0;
      Object.keys(daySlotsMap).forEach(d => {
        const slotsOnDay = daySlotsMap[d].sort((a, b) => a.tietBatDau - b.tietBatDau);
        for (let i = 0; i < slotsOnDay.length - 1; i++) {
          const gap = slotsOnDay[i+1].tietBatDau - slotsOnDay[i].tietKetThuc - 1;
          if (gap > 0) {
            totalGapPeriods += gap;
          }
        }
      });
      score -= (totalGapPeriods * 5.0);
    }

    // Score Component D: Everytime Elite Quality Index (Tier S, Tier A, Tier C)
    let hasWarnedTeacher = false;
    let tierSCount = 0;
    let tierACount = 0;
    let qualityBonus = 0;

    combo.forEach(u => {
      const gvName = u.theory.tenGV;
      if (gvName && typeof getEverytimeRating === 'function') {
        const rInfo = getEverytimeRating(gvName);
        if (rInfo) {
          if (rInfo.tier === 'C' || rInfo.isWarned) {
            hasWarnedTeacher = true;
            qualityBonus -= 80.0;
          } else if (rInfo.tier === 'S') {
            tierSCount++;
            qualityBonus += 30.0;
          } else if (rInfo.tier === 'A') {
            tierACount++;
            qualityBonus += 15.0;
          }

          if (prefTopRated && rInfo.rating >= 4.8) {
            qualityBonus += 8.0;
          }
          if (prefGenerous) {
            if (rInfo.grading && rInfo.grading.includes('Thoáng')) qualityBonus += 8.0;
            if (rInfo.attendance && (rInfo.attendance.includes('Không') || rInfo.attendance.includes('Dễ'))) qualityBonus += 6.0;
          }
        }
      }
    });

    score += qualityBonus;

    if (avoidWarned && hasWarnedTeacher) {
      score -= 500; // Sink warned combinations to bottom
    }

    return {
      combo,
      hasWarnedTeacher,
      score: Math.max(10, Math.min(100, score)),
      totalCredits,
      daysCount: daysUsed.size,
      actualDaysOff,
      classCodes
    };
  });

  // Sort by score descending
  scoredSolutions.sort((a, b) => b.score - a.score);
  generatedSolutions = scoredSolutions;

  const elapsed = Math.round(performance.now() - startTime);
  if (elapsedBadge) elapsedBadge.textContent = `Tính toán trong ${elapsed}ms`;

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

  if (countBadge) countBadge.textContent = `✨ Tìm thấy ${solutions.length} phương án TKB tối ưu`;

  solutions.slice(0, 30).forEach((sol, index) => {
    const card = document.createElement('div');
    card.className = 'solution-card';

    let scoreColor = sol.score >= 80 ? 'var(--accent-emerald)' : (sol.score >= 50 ? 'var(--accent-amber)' : 'var(--primary)');
    let scoreText = sol.score >= 85 ? 'Tối ưu vượt trội' : (sol.score >= 65 ? 'Rất tốt' : 'Hợp lý');

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
        return `<span class="sol-teacher-chip" onclick="openEverytimeModal('${t.name.replace(/'/g, "\\'")}')"><i class="fa-solid fa-user-tie"></i> ${t.name}</span>`;
      }
      const bHtml = renderEverytimeBadge(t.name);
      const topTag = (t.rInfo.tags && t.rInfo.tags.length > 0) ? `#${t.rInfo.tags[0]}` : '';
      return `
        <span class="sol-teacher-chip" onclick="openEverytimeModal('${t.name.replace(/'/g, "\\'")}')" title="Xem ${t.rInfo.reviewsCount} review Everytime">
          <i class="fa-solid fa-user-tie"></i>
          <span>${t.name}</span>
          ${bHtml}
          ${topTag ? `<span style="color: ${t.rInfo.isWarned ? '#dc2626' : 'var(--primary)'}; font-size: 10.5px; font-weight: 700;">${topTag}</span>` : ''}
        </span>
      `;
    }).join('');

    card.innerHTML = `
      <div class="solution-card-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-weight: 800; font-size: 14px; color: var(--text-primary);">Phương án #${index + 1}</span>
          <span class="solution-score-badge" style="color: ${scoreColor};">
            <i class="fa-solid fa-star"></i> ${sol.score}/100 • ${scoreText}
          </span>
        </div>
        <div style="font-size: 12px; font-weight: 700; color: var(--text-secondary);">
          ${sol.daysCount} ngày học/tuần • <span style="color: var(--primary); font-weight: 800;">${sol.totalCredits} TC</span>
        </div>
      </div>

      <div style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
        <i class="fa-solid fa-calendar-check" style="color: #10b981;"></i>
        <span>Nghỉ: <strong>${sol.actualDaysOff.length > 0 ? sol.actualDaysOff.join(', ') : 'Không có'}</strong></span>
      </div>

      <div class="solution-tags-row">
        ${sol.classCodes.map(code => `<span class="solution-class-tag">${code}</span>`).join('')}
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
        <button class="btn btn-secondary btn-sm" onclick="saveSolutionAsNewPlan(${index})">
          <i class="fa-solid fa-folder-plus"></i> Lưu thành kế hoạch mới
        </button>
        <button class="btn btn-primary btn-sm" onclick="applySolutionToCurrentPlan(${index})">
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
  sol.combo.forEach(u => {
    plans[currentPlanId].selected.push(u.theory.id);
    if (u.practice) {
      selectedPracticeChoices[u.theory.id] = u.practice.id;
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
  const planName = `Phương Án #${solutionIndex + 1} (Nghỉ ${sol.actualDaysOff.slice(0,2).join(', ')})`;
  plans[newId] = {
    name: planName,
    selected: []
  };

  sol.combo.forEach(u => {
    plans[newId].selected.push(u.theory.id);
    if (u.practice) {
      selectedPracticeChoices[u.theory.id] = u.practice.id;
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
function renderEverytimeBadge(gvName) {
  if (!gvName || typeof getEverytimeRating !== 'function') return '';
  const et = getEverytimeRating(gvName);
  if (!et) return '';

  let tierClass = '';
  let badgeLabel = `⭐ ${et.rating}`;

  if (et.tier === 'S') {
    tierClass = 'tier-s';
    badgeLabel = `🏆 Phật sống ⭐ ${et.rating}`;
  } else if (et.tier === 'C' || et.isWarned) {
    tierClass = 'tier-c';
    badgeLabel = `🛑 Cảnh báo né ⭐ ${et.rating}`;
  }

  return `
    <span class="everytime-badge ${tierClass}" onclick="event.stopPropagation(); openEverytimeModal('${gvName.replace(/'/g, "\\'")}')" title="Xem ${et.reviewsCount} review Everytime VN">
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
      bannerHtml = `
        <div class="everytime-alert-banner warn">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 22px;"></i>
          <div>
            <div style="font-size: 13px; font-weight: 800;">🛑 CẢNH BÁO TỪ CỘNG ĐỒNG SINH VIÊN:</div>
            <div style="font-size: 12px; font-weight: 500; margin-top: 2px;">
              ${(data.redFlags && data.redFlags.length > 0) ? data.redFlags.join(' • ') : 'Có nhiều phản hồi tiêu cực về cách chấm điểm / bài tập!'}
            </div>
          </div>
        </div>
      `;
    } else if (data.tier === 'S') {
      bannerHtml = `
        <div class="everytime-alert-banner phatsong">
          <i class="fa-solid fa-crown" style="font-size: 22px; color: #f59e0b;"></i>
          <div>
            <div style="font-size: 13px; font-weight: 800;">🏆 ĐẠI PHẬT SỐNG UIT (TOP 13% GIẢNG VIÊN TINH HOA):</div>
            <div style="font-size: 12px; font-weight: 500; margin-top: 2px;">
              ${data.recommendPercent}% Sinh viên đề xuất • Chấm điểm cực thoáng & Siêu nhiệt tình!
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
              Được ${data.recommendPercent}% sinh viên UIT khen ngợi và đề xuất theo học!
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
              <span style="color: var(--text-muted); font-size: 11px;">${r.semesterName || 'Học kỳ gần đây'} • ${r.courseName || ''}</span>
            </div>
            <div class="everytime-review-text" style="${isLow ? 'color: #dc2626; font-weight: 600;' : ''}">"${r.text}"</div>
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
          <div class="everytime-review-text">"${data.comment}"</div>
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
    `;
  }

  openModal('modalEverytimeReview');
};

const originalBindEvents = bindEvents;
bindEvents = function() {
  originalBindEvents();

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
};



