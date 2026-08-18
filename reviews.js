/**
 * EVERYTIME REVIEWS HUB CONTROLLER (UIT)
 * High-performance search, filtering, and review modal viewer
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Theme Management Sync
  initThemeToggle();

  // 2. Build Teacher Course Map from Timetable Data
  const teacherCoursesMap = buildTeacherCoursesMap();

  // 3. Collect and Enrich Teachers List
  const allTeachers = Object.values(window.EVERYTIME_REAL_DATABASE || {}).map(t => {
    const normKey = window.normalizeTeacherKey ? window.normalizeTeacherKey(t.name) : t.name.toLowerCase();
    const courses = teacherCoursesMap.get(normKey) || [];
    return {
      ...t,
      normKey,
      courses
    };
  });

  // 4. Update Header Stats Counters
  updateStatCounters(allTeachers);

  // 5. State
  let currentTier = 'all';
  let currentTag = 'all';
  let currentSearch = '';
  let currentSort = 'rating_desc';
  let activeTeacherForModal = null;

  // DOM Elements
  const searchInput = document.getElementById('reviewSearchInput');
  const sortSelect = document.getElementById('reviewSortSelect');
  const gridContainer = document.getElementById('reviewsGridContainer');
  const resultsCountBadge = document.getElementById('reviewsResultsCount');
  const tierTabs = document.querySelectorAll('#tierFilterTabs .review-filter-btn');
  const tagTabs = document.querySelectorAll('#tagFilterTabs .review-filter-btn');

  // Check URL query parameters (e.g. ?q=IT002 or ?teacher=dangvietdung)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('q')) {
    currentSearch = urlParams.get('q');
    if (searchInput) searchInput.value = currentSearch;
  }
  if (urlParams.has('tier')) {
    currentTier = urlParams.get('tier');
    tierTabs.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filterTier === currentTier);
    });
  }

  // 6. Filter & Render Function
  function filterAndRender() {
    let filtered = allTeachers.filter(t => {
      // Tier Filter
      if (currentTier !== 'all' && t.tier !== currentTier) return false;

      // Tag Filter
      if (currentTag !== 'all') {
        const hasTag = t.tags && t.tags.some(tag => tag.toLowerCase().includes(currentTag.toLowerCase()));
        const inGrading = t.grading && t.grading.toLowerCase().includes(currentTag.toLowerCase());
        const inAtt = t.attendance && t.attendance.toLowerCase().includes(currentTag.toLowerCase());
        if (!hasTag && !inGrading && !inAtt) return false;
      }

      // Search Query Filter
      if (currentSearch.trim()) {
        const q = normalizeStr(currentSearch.trim());
        const nameMatch = normalizeStr(t.name).includes(q);
        const tagMatch = t.tags && t.tags.some(tag => normalizeStr(tag).includes(q));
        const courseMatch = t.courses && t.courses.some(c => normalizeStr(c.maMH).includes(q) || normalizeStr(c.tenMH).includes(q));
        const reviewTextMatch = t.topReviews && t.topReviews.some(r => normalizeStr(r.text).includes(q) || normalizeStr(r.courseName || '').includes(q));
        if (!nameMatch && !tagMatch && !courseMatch && !reviewTextMatch) return false;
      }

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      if (currentSort === 'rating_desc') {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return (b.reviewsCount || 0) - (a.reviewsCount || 0);
      } else if (currentSort === 'reviews_desc') {
        if ((b.reviewsCount || 0) !== (a.reviewsCount || 0)) return (b.reviewsCount || 0) - (a.reviewsCount || 0);
        return b.rating - a.rating;
      } else if (currentSort === 'name_asc') {
        return a.name.localeCompare(b.name, 'vi');
      }
      return 0;
    });

    if (resultsCountBadge) {
      resultsCountBadge.textContent = `Đang hiển thị ${filtered.length} / ${allTeachers.length} giảng viên`;
    }

    renderTeachersGrid(filtered);
  }

  // 7. Render Grid Cards
  function renderTeachersGrid(teachers) {
    if (!gridContainer) return;
    gridContainer.innerHTML = '';

    if (teachers.length === 0) {
      gridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
          <i class="fa-solid fa-magnifying-glass" style="font-size: 40px; margin-bottom: 12px; opacity: 0.5;"></i>
          <div style="font-size: 16px; font-weight: 700; color: var(--text-primary);">Không tìm thấy giảng viên hoặc môn học phù hợp!</div>
          <div style="font-size: 13px; margin-top: 6px;">Hãy thử tìm kiếm với từ khóa khác hoặc bỏ chọn bộ lọc nhé.</div>
        </div>
      `;
      return;
    }

    teachers.forEach(t => {
      const card = document.createElement('div');
      card.className = 'teacher-card';

      // Tier Visuals
      const tierClass = t.tier === 'S' ? 'teacher-avatar-s' : (t.tier === 'A' ? 'teacher-avatar-a' : (t.tier === 'B' ? 'teacher-avatar-b' : 'teacher-avatar-c'));
      const tierBadgeClass = t.tier === 'S' ? 'tier-badge-s' : (t.tier === 'A' ? 'tier-badge-a' : (t.tier === 'B' ? 'tier-badge-b' : 'tier-badge-c'));
      const tierText = t.tier === 'S' ? '🌟 S-TIER • PHẬT SỐNG' : (t.tier === 'A' ? '💎 A-TIER • DẠY TỐT' : (t.tier === 'B' ? '📘 B-TIER • CHUẨN CHỈ' : '⚠️ C-TIER • CẢNH BÁO'));

      // Avatar Initial
      const initial = t.name.split(' ').pop().charAt(0).toUpperCase();

      // Top Quote
      const topQuote = (t.topReviews && t.topReviews.length > 0) ? t.topReviews[0].text : 'Chưa có trích đoạn nhận xét.';

      // Tags HTML
      const tagsHtml = (t.tags && t.tags.length > 0)
        ? t.tags.slice(0, 4).map(tag => `<span class="teacher-tag-item">#${escapeHtml(tag)}</span>`).join('')
        : '';

      // Courses HTML
      const coursesHtml = (t.courses && t.courses.length > 0)
        ? t.courses.slice(0, 3).map(c => `<span class="teacher-course-badge" title="${escapeHtml(c.tenMH)}">${escapeHtml(c.maMH)}</span>`).join('')
        : `<span style="font-size: 11px; color: var(--text-muted);">Dạy các môn chuyên ngành</span>`;

      card.innerHTML = `
        <div class="teacher-card-top">
          <div class="teacher-avatar-circle ${tierClass}">${initial}</div>
          <div class="teacher-info-meta">
            <div class="teacher-name-row">
              <span class="teacher-name">${escapeHtml(t.name)}</span>
              <span class="teacher-rating-display">
                <i class="fa-solid fa-star"></i> ${t.rating.toFixed(1)} <span style="font-size: 11px; color: var(--text-muted);">(${t.reviewsCount} review)</span>
              </span>
            </div>
            <div>
              <span class="teacher-tier-chip ${tierBadgeClass}">${tierText}</span>
            </div>
          </div>
        </div>

        <!-- Evaluation Grid -->
        <div class="teacher-eval-grid">
          <div class="teacher-eval-item">
            <span class="teacher-eval-label">📝 Chấm điểm</span>
            <span class="teacher-eval-val" title="${escapeHtml(t.grading || 'Chuẩn')}">${escapeHtml(t.grading || 'Chuẩn chỉ')}</span>
          </div>
          <div class="teacher-eval-item">
            <span class="teacher-eval-label">🕒 Điểm danh</span>
            <span class="teacher-eval-val" title="${escapeHtml(t.attendance || 'Bình thường')}">${escapeHtml(t.attendance || 'Bình thường')}</span>
          </div>
          <div class="teacher-eval-item">
            <span class="teacher-eval-label">📚 Khối lượng</span>
            <span class="teacher-eval-val" title="${escapeHtml(t.workload || 'Vừa sức')}">${escapeHtml(t.workload || 'Vừa sức')}</span>
          </div>
        </div>

        <!-- Tags -->
        <div class="teacher-tags-row">
          ${tagsHtml}
        </div>

        <!-- Courses -->
        <div class="teacher-courses-row">
          <i class="fa-solid fa-book-open" style="font-size: 11px; color: var(--primary);"></i>
          <span>Môn phụ trách:</span>
          ${coursesHtml}
        </div>

        <!-- Quoted Review -->
        <div class="teacher-quote-box" title="Bấm để đọc toàn bộ review">
          "${escapeHtml(topQuote)}"
        </div>

        <!-- Actions -->
        <div class="teacher-card-actions">
          <button class="btn btn-secondary btn-sm" data-open-teacher="${escapeHtml(t.name)}">
            <i class="fa-solid fa-comments"></i> Đọc ${t.reviewsCount} review
          </button>
          <a href="index.html?search=${encodeURIComponent(t.name)}" class="btn btn-primary btn-sm">
            <i class="fa-solid fa-calendar-plus"></i> Xếp TKB môn này
          </a>
        </div>
      `;

      // Click on card body to open modal
      card.addEventListener('click', (e) => {
        if (e.target.closest('a') || e.target.closest('button[data-schedule]')) return;
        openTeacherDetailModal(t);
      });

      gridContainer.appendChild(card);
    });
  }

  // 8. Open Teacher Detail Modal
  function openTeacherDetailModal(teacher) {
    activeTeacherForModal = teacher;
    const modal = document.getElementById('teacherReviewDetailModal');
    if (!modal) return;

    // Header
    const initial = teacher.name.split(' ').pop().charAt(0).toUpperCase();
    const avatarEl = document.getElementById('modalAvatar');
    avatarEl.textContent = initial;
    avatarEl.className = 'teacher-avatar-circle ' + (teacher.tier === 'S' ? 'teacher-avatar-s' : (teacher.tier === 'A' ? 'teacher-avatar-a' : (teacher.tier === 'B' ? 'teacher-avatar-b' : 'teacher-avatar-c')));

    document.getElementById('modalTeacherName').textContent = teacher.name;

    const tierBadgeClass = teacher.tier === 'S' ? 'tier-badge-s' : (teacher.tier === 'A' ? 'tier-badge-a' : (teacher.tier === 'B' ? 'tier-badge-b' : 'tier-badge-c'));
    const tierText = teacher.tier === 'S' ? '🌟 S-TIER • PHẬT SỐNG UIT' : (teacher.tier === 'A' ? '💎 A-TIER • DẠY TỐT CÓ TÂM' : (teacher.tier === 'B' ? '📘 B-TIER • CHUẨN CHỈ' : '⚠️ C-TIER • CẢNH BÁO NÉ'));
    document.getElementById('modalTeacherTierBadge').innerHTML = `
      <span class="teacher-tier-chip ${tierBadgeClass}">${tierText}</span>
      <span style="font-weight: 800; color: #f59e0b; font-size: 13px; margin-left: 8px;">⭐ ${teacher.rating.toFixed(1)} / 5.0 (${teacher.recommendPercent}% Đề xuất)</span>
    `;

    // Overview Box
    document.getElementById('modalOverviewBox').innerHTML = `
      <div class="teacher-eval-item">
        <span class="teacher-eval-label">📝 Phong cách chấm điểm</span>
        <span class="teacher-eval-val" style="color: #10b981; font-size: 13px;">${escapeHtml(teacher.grading || 'Chuẩn chỉ')}</span>
      </div>
      <div class="teacher-eval-item">
        <span class="teacher-eval-label">🕒 Yêu cầu điểm danh</span>
        <span class="teacher-eval-val" style="color: var(--primary); font-size: 13px;">${escapeHtml(teacher.attendance || 'Bình thường')}</span>
      </div>
      <div class="teacher-eval-item">
        <span class="teacher-eval-label">📚 Khối lượng bài tập</span>
        <span class="teacher-eval-val" style="color: #8b5cf6; font-size: 13px;">${escapeHtml(teacher.workload || 'Vừa sức')}</span>
      </div>
    `;

    // Tags
    const tagsBox = document.getElementById('modalTagsBox');
    if (teacher.tags && teacher.tags.length > 0) {
      tagsBox.innerHTML = teacher.tags.map(tag => `<span class="teacher-tag-item">#${escapeHtml(tag)}</span>`).join('');
      tagsBox.style.display = 'flex';
    } else {
      tagsBox.style.display = 'none';
    }

    // Red Flags
    const redFlagsBox = document.getElementById('modalRedFlagsBox');
    if (teacher.redFlags && teacher.redFlags.length > 0) {
      redFlagsBox.innerHTML = `
        <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-sm); padding: 10px 14px; color: #ef4444; font-size: 12.5px;">
          <div style="font-weight: 800; margin-bottom: 4px;"><i class="fa-solid fa-triangle-exclamation"></i> Lưu ý từ sinh viên:</div>
          <ul style="margin: 0; padding-left: 18px;">
            ${teacher.redFlags.map(rf => `<li>${escapeHtml(rf)}</li>`).join('')}
          </ul>
        </div>
      `;
      redFlagsBox.style.display = 'block';
    } else {
      redFlagsBox.style.display = 'none';
    }

    // Courses
    const coursesBox = document.getElementById('modalCoursesBox');
    if (teacher.courses && teacher.courses.length > 0) {
      coursesBox.innerHTML = `
        <div style="font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">📚 Các môn giảng dạy:</div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${teacher.courses.map(c => `
            <a href="index.html?search=${encodeURIComponent(c.maMH)}" class="teacher-course-badge" style="text-decoration: none; padding: 4px 8px; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;">
              <strong>${escapeHtml(c.maMH)}</strong>: ${escapeHtml(c.tenMH)}
            </a>
          `).join('')}
        </div>
      `;
      coursesBox.style.display = 'block';
    } else {
      coursesBox.style.display = 'none';
    }

    // Reviews List
    const reviewsList = document.getElementById('modalReviewsList');
    const countBadge = document.getElementById('modalReviewCountBadge');
    reviewsList.innerHTML = '';

    const reviews = teacher.topReviews || [];
    if (countBadge) countBadge.textContent = `${reviews.length} đánh giá`;

    if (reviews.length === 0) {
      reviewsList.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px;">Chưa có review chi tiết.</div>`;
    } else {
      reviews.forEach((r, idx) => {
        const rItem = document.createElement('div');
        rItem.style.cssText = `
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        `;

        const starsStr = '⭐'.repeat(r.rating || 5);

        rItem.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: var(--text-muted);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span>${starsStr}</span>
              <span style="font-weight: 700; color: var(--primary);">${escapeHtml(r.courseName || 'Môn học')}</span>
              ${r.semesterName ? `<span style="background: var(--bg-surface-elevated); padding: 1px 6px; border-radius: 4px; border: 1px solid var(--border-color); font-size: 11px;">${escapeHtml(r.semesterName)}</span>` : ''}
            </div>
            ${r.posvotes ? `<span style="color: #10b981; font-weight: 700;"><i class="fa-solid fa-thumbs-up"></i> ${r.posvotes}</span>` : ''}
          </div>
          <div style="font-size: 13px; line-height: 1.6; color: var(--text-primary); white-space: pre-line;">
            ${escapeHtml(r.text)}
          </div>
        `;
        reviewsList.appendChild(rItem);
      });
    }

    modal.style.display = 'flex';
  }

  // Modal Close Handlers
  const modalEl = document.getElementById('teacherReviewDetailModal');
  const btnCloseModal = document.getElementById('btnCloseReviewModal');
  const btnCloseBottom = document.getElementById('btnModalCloseBottom');
  const btnSchedule = document.getElementById('btnScheduleWithTeacher');

  function closeModal() {
    if (modalEl) modalEl.style.display = 'none';
  }

  if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
  if (btnCloseBottom) btnCloseBottom.addEventListener('click', closeModal);
  if (modalEl) {
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) closeModal();
    });
  }

  if (btnSchedule) {
    btnSchedule.addEventListener('click', () => {
      if (activeTeacherForModal) {
        window.location.href = `index.html?search=${encodeURIComponent(activeTeacherForModal.name)}`;
      }
    });
  }

  // 9. Event Listeners for Search & Filter
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value;
      filterAndRender();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      filterAndRender();
    });
  }

  tierTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tierTabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTier = btn.dataset.filterTier;
      filterAndRender();
    });
  });

  tagTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tagTabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTag = btn.dataset.filterTag;
      filterAndRender();
    });
  });

  // Initial Run
  filterAndRender();
});

// Helper: Build Map of Teacher Normalized Key -> Courses
function buildTeacherCoursesMap() {
  const map = new Map();
  const timetableData = window.DEFAULT_TIMETABLE_DATA || [];

  timetableData.forEach(c => {
    if (!c.tenGV || c.tenGV.includes('Chưa phân công')) return;
    const key = window.normalizeTeacherKey ? window.normalizeTeacherKey(c.tenGV) : c.tenGV.toLowerCase();
    if (!map.has(key)) map.set(key, []);

    const list = map.get(key);
    if (!list.some(item => item.maMH === c.maMH)) {
      list.push({
        maMH: c.maMH,
        tenMH: c.tenMH
      });
    }
  });

  return map;
}

// Helper: Update Stat Badges in Hero Section
function updateStatCounters(teachers) {
  const countAll = teachers.length;
  const countS = teachers.filter(t => t.tier === 'S').length;
  const countA = teachers.filter(t => t.tier === 'A').length;
  const countB = teachers.filter(t => t.tier === 'B').length;
  const countC = teachers.filter(t => t.tier === 'C').length;

  const elAll = document.getElementById('countTierAll');
  const elS = document.getElementById('countTierS');
  const elA = document.getElementById('countTierA');
  const elB = document.getElementById('countTierB');
  const elC = document.getElementById('countTierC');

  if (elAll) elAll.textContent = countAll;
  if (elS) elS.textContent = countS;
  if (elA) elA.textContent = countA;
  if (elB) elB.textContent = countB;
  if (elC) elC.textContent = countC;

  const statTeacherCount = document.getElementById('statTeacherCount');
  const statTierSCount = document.getElementById('statTierSCount');
  if (statTeacherCount) statTeacherCount.innerHTML = `<strong>${countAll}</strong> Giảng viên`;
  if (statTierSCount) statTierSCount.innerHTML = `<strong>${countS}</strong> Đại Phật Sống (Tier S)`;
}

// Helper: Vietnamese String Normalization
function normalizeStr(str) {
  if (!str) return '';
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase();
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function initThemeToggle() {
  const btn = document.getElementById('btnThemeToggle');
  const icon = document.getElementById('themeIcon');
  const currentTheme = localStorage.getItem('dkhp_theme') || 'dark';

  document.documentElement.setAttribute('data-theme', currentTheme);
  if (icon) {
    icon.className = currentTheme === 'light' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }

  if (btn) {
    btn.addEventListener('click', () => {
      const now = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', now);
      localStorage.setItem('dkhp_theme', now);
      if (icon) {
        icon.className = now === 'light' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
      }
    });
  }
}
