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

  // 3.1 Load and Merge User-Submitted Custom Reviews from LocalStorage
  loadAndApplyCustomReviews(allTeachers);

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

      const reviewCount = (t.topReviews && t.topReviews.length) ? t.topReviews.length : (t.reviewsCount || 0);

      card.innerHTML = `
        <div class="teacher-card-top">
          <div class="teacher-avatar-circle ${tierClass}">${initial}</div>
          <div class="teacher-info-meta">
            <div class="teacher-name-row">
              <span class="teacher-name">${escapeHtml(t.name)}</span>
              <span class="teacher-rating-display">
                <i class="fa-solid fa-star"></i> ${t.rating.toFixed(1)} <span style="font-size: 11px; color: var(--text-muted);">(${reviewCount} review)</span>
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

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  // Modal Close Handlers
  const modalEl = document.getElementById('teacherReviewDetailModal');
  const btnCloseModal = document.getElementById('btnCloseReviewModal');
  const btnCloseBottom = document.getElementById('btnModalCloseBottom');
  const btnSchedule = document.getElementById('btnScheduleWithTeacher');

  function closeModal() {
    if (modalEl) {
      modalEl.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
  if (btnCloseBottom) btnCloseBottom.addEventListener('click', closeModal);
  if (modalEl) {
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });

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

  // 10. Initialize Submit Review Modal Controller
  initSubmitReviewModal(allTeachers, () => {
    updateStatCounters(allTeachers);
    filterAndRender();
  });

  // 11. Connect & Sync Reviews from Supabase Cloud Database
  syncSupabaseReviews(allTeachers, () => {
    updateStatCounters(allTeachers);
    filterAndRender();
  });

  // Initial Run
  filterAndRender();
});

// Helper: Get Supabase Client instance if configured
function getSupabaseClient() {
  const cfg = window.DKHP_SUPABASE_CONFIG;
  if (!cfg || !cfg.url || !cfg.anonKey || cfg.url.includes('abcdefgh') || typeof window.supabase === 'undefined' || !window.supabase.createClient) {
    return null;
  }
  try {
    if (!window._dkhp_supabase_instance) {
      window._dkhp_supabase_instance = window.supabase.createClient(cfg.url, cfg.anonKey);
    }
    return window._dkhp_supabase_instance;
  } catch (e) {
    console.warn('Supabase initialization warning:', e);
    return null;
  }
}

// Helper: Fetch and Sync Reviews from Supabase Cloud DB
async function syncSupabaseReviews(allTeachers, onUpdated) {
  const cfg = window.DKHP_SUPABASE_CONFIG;
  if (!cfg || !cfg.url || !cfg.anonKey) return;

  try {
    const res = await fetch(`${cfg.url}/rest/v1/uit_teacher_reviews?select=*&order=created_at.desc`, {
      headers: {
        'apikey': cfg.anonKey,
        'Authorization': `Bearer ${cfg.anonKey}`
      }
    });

    if (!res.ok) {
      console.warn('Supabase REST fetch status:', res.status);
      return;
    }

    const data = await res.json();

    if (Array.isArray(data) && data.length > 0) {
      data.forEach(item => {
        if (!item.teacher_name || !item.review_text) return;
        const normKey = window.normalizeTeacherKey ? window.normalizeTeacherKey(item.teacher_name) : item.teacher_name.toLowerCase();
        let teacher = allTeachers.find(t => t.normKey === normKey || t.name.toLowerCase() === item.teacher_name.toLowerCase());

        const newReviewObj = {
          rating: item.rating || 5,
          courseName: item.course_name || 'Môn học',
          semesterName: item.semester_name || 'Học kỳ gần đây',
          text: item.review_text,
          posvotes: item.posvotes || 1
        };

        if (teacher) {
          if (!teacher.topReviews) teacher.topReviews = [];
          if (!teacher.topReviews.some(r => r.text === newReviewObj.text && r.courseName === newReviewObj.courseName)) {
            teacher.topReviews.unshift(newReviewObj);
            teacher.reviewsCount = (teacher.reviewsCount || 0) + 1;
            if (item.tags && Array.isArray(item.tags)) {
              teacher.tags = Array.from(new Set([...(teacher.tags || []), ...item.tags]));
            }
          }
        } else {
          teacher = {
            name: item.teacher_name,
            normKey: normKey,
            tier: item.rating >= 4.5 ? 'S' : (item.rating >= 3.8 ? 'A' : (item.rating >= 3.0 ? 'B' : 'C')),
            rating: item.rating || 5,
            reviewsCount: 1,
            recommendPercent: item.rating >= 4 ? 100 : 70,
            grading: item.grading || 'Rộng rãi (Thoáng)',
            attendance: item.attendance || 'Không điểm danh / Dễ',
            workload: item.workload || 'Vừa sức',
            tags: item.tags || ['#Phật sống UIT'],
            topReviews: [newReviewObj],
            courses: [{ maMH: item.course_name, tenMH: item.course_name }]
          };
          allTeachers.push(teacher);
        }
      });

      if (typeof onUpdated === 'function') {
        onUpdated();
      }
    }

    // Subscribe to Realtime Inserts
    const client = getSupabaseClient();
    if (client) {
      client
        .channel('uit_reviews_realtime_channel')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'uit_teacher_reviews' }, payload => {
          if (payload && payload.new) {
            const item = payload.new;
            const normKey = window.normalizeTeacherKey ? window.normalizeTeacherKey(item.teacher_name) : item.teacher_name.toLowerCase();
            let teacher = allTeachers.find(t => t.normKey === normKey || t.name.toLowerCase() === item.teacher_name.toLowerCase());

            const newReviewObj = {
              rating: item.rating || 5,
              courseName: item.course_name || 'Môn học',
              semesterName: item.semester_name || 'Học kỳ gần đây',
              text: item.review_text,
              posvotes: item.posvotes || 1
            };

            if (teacher) {
              if (!teacher.topReviews) teacher.topReviews = [];
              if (!teacher.topReviews.some(r => r.text === newReviewObj.text)) {
                teacher.topReviews.unshift(newReviewObj);
                teacher.reviewsCount = (teacher.reviewsCount || 0) + 1;
              }
            }
            if (typeof onUpdated === 'function') {
              onUpdated();
            }
            showReviewToast(`🌟 Có sinh viên vừa đóng góp đánh giá mới cho GV ${item.teacher_name}!`);
          }
        })
        .subscribe();
    }
  } catch (e) {
    console.warn('Supabase sync exception:', e);
  }
}

// Helper: Load and Apply User Submitted Custom Reviews from LocalStorage
function loadAndApplyCustomReviews(allTeachers) {
  try {
    const raw = localStorage.getItem('dkhp_custom_reviews');
    if (!raw) return;
    const customList = JSON.parse(raw);
    if (!Array.isArray(customList)) return;

    customList.forEach(item => {
      if (!item.teacherName || !item.reviewText) return;
      const normKey = window.normalizeTeacherKey ? window.normalizeTeacherKey(item.teacherName) : item.teacherName.toLowerCase();
      let teacher = allTeachers.find(t => t.normKey === normKey || t.name.toLowerCase() === item.teacherName.toLowerCase());

      const newReviewObj = {
        rating: item.rating || 5,
        courseName: item.courseName || 'Môn học',
        semesterName: item.semesterName || 'Học kỳ gần đây',
        text: item.reviewText,
        posvotes: item.posvotes || 1
      };

      if (teacher) {
        if (!teacher.topReviews) teacher.topReviews = [];
        // Avoid duplicate insertion
        if (!teacher.topReviews.some(r => r.text === newReviewObj.text && r.courseName === newReviewObj.courseName)) {
          teacher.topReviews.unshift(newReviewObj);
          teacher.reviewsCount = (teacher.reviewsCount || 0) + 1;
          if (item.tags && Array.isArray(item.tags)) {
            teacher.tags = Array.from(new Set([...(teacher.tags || []), ...item.tags]));
          }
        }
      } else {
        // Create new teacher profile
        teacher = {
          name: item.teacherName,
          normKey: normKey,
          tier: item.rating >= 4.5 ? 'S' : (item.rating >= 3.8 ? 'A' : (item.rating >= 3.0 ? 'B' : 'C')),
          rating: item.rating || 5,
          reviewsCount: 1,
          recommendPercent: item.rating >= 4 ? 100 : 70,
          grading: item.grading || 'Rộng rãi (Thoáng)',
          attendance: item.attendance || 'Không điểm danh / Dễ',
          workload: item.workload || 'Vừa sức',
          tags: item.tags || ['#Phật sống UIT'],
          topReviews: [newReviewObj],
          courses: [{ maMH: item.courseName, tenMH: item.courseName }]
        };
        allTeachers.push(teacher);
      }
    });
  } catch (e) {
    console.error('Error parsing custom reviews:', e);
  }
}

// Controller: Submit New Review Modal
function initSubmitReviewModal(allTeachers, onReviewAdded) {
  const modal = document.getElementById('modalSubmitReview');
  const btnOpen = document.getElementById('btnOpenSubmitReviewModal');
  const btnClose = document.getElementById('btnCloseSubmitModal');
  const btnCancel = document.getElementById('btnCancelSubmitReview');
  const form = document.getElementById('formSubmitReview');

  const teacherInput = document.getElementById('submitTeacherInput');
  const teacherDropdown = document.getElementById('submitTeacherDropdown');
  const courseInput = document.getElementById('submitCourseInput');
  const courseDropdown = document.getElementById('submitCourseDropdown');
  const starPicker = document.getElementById('starRatingPicker');
  const ratingValueInput = document.getElementById('submitRatingValue');
  const ratingLabel = document.getElementById('starRatingLabel');
  const tagsSelector = document.getElementById('submitTagsSelector');

  // Build unique courses list from timetable data
  const allCoursesList = [];
  const seenCourseCodes = new Set();
  (window.DEFAULT_TIMETABLE_DATA || []).forEach(item => {
    if (item.maMH && !seenCourseCodes.has(item.maMH)) {
      seenCourseCodes.add(item.maMH);
      allCoursesList.push({
        maMH: item.maMH,
        tenMH: item.tenMH || item.maMH,
        soTC: item.soTC || 0,
        label: `${item.maMH} - ${item.tenMH}`
      });
    }
  });

  if (!modal) return;

  function openSubmitModal(prefillTeacher = '') {
    if (prefillTeacher && teacherInput) {
      teacherInput.value = prefillTeacher;
    }
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (teacherInput) {
      setTimeout(() => teacherInput.focus(), 150);
    }
  }

  function closeSubmitModal() {
    modal.classList.remove('open');
    if (!document.querySelector('.modal-backdrop.open, .modal-overlay.open')) {
      document.body.style.overflow = '';
    }
    if (teacherDropdown) teacherDropdown.style.display = 'none';
    if (courseDropdown) courseDropdown.style.display = 'none';
  }

  if (btnOpen) btnOpen.addEventListener('click', () => openSubmitModal());
  if (btnClose) btnClose.addEventListener('click', closeSubmitModal);
  if (btnCancel) btnCancel.addEventListener('click', closeSubmitModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeSubmitModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeSubmitModal();
    }
  });

  // Star Rating Interaction
  const starLabels = {
    5: '5/5 Sao (Xuất sắc / Phật sống)',
    4: '4/5 Sao (Dạy tốt / Nhiệt tình)',
    3: '3/5 Sao (Bình thường / Chuẩn chỉ)',
    2: '2/5 Sao (Hơi khó / Chấm chặt)',
    1: '1/5 Sao (Cảnh báo / Rất gắt)'
  };

  if (starPicker) {
    const starItems = starPicker.querySelectorAll('.star-item');
    starItems.forEach(star => {
      star.addEventListener('click', () => {
        const val = parseInt(star.dataset.val);
        if (ratingValueInput) ratingValueInput.value = val;
        if (ratingLabel) ratingLabel.textContent = starLabels[val] || `${val}/5 Sao`;

        starItems.forEach(s => {
          const sVal = parseInt(s.dataset.val);
          s.classList.toggle('active', sVal <= val);
        });
      });
    });
  }

  // Tags Toggle Interaction
  if (tagsSelector) {
    tagsSelector.addEventListener('click', (e) => {
      const pill = e.target.closest('.submit-tag-pill');
      if (pill) {
        pill.classList.toggle('active');
      }
    });
  }

  // Teacher Autocomplete Suggestions
  if (teacherInput && teacherDropdown) {
    teacherInput.addEventListener('input', () => {
      const q = teacherInput.value.trim().toLowerCase();
      if (!q) {
        teacherDropdown.style.display = 'none';
        return;
      }

      const matches = allTeachers.filter(t => t.name.toLowerCase().includes(q) || (normalizeStr(t.name)).includes(normalizeStr(q))).slice(0, 8);
      if (matches.length === 0) {
        teacherDropdown.style.display = 'none';
        return;
      }

      teacherDropdown.innerHTML = matches.map(t => `
        <div class="submit-combobox-item" data-teacher-name="${escapeHtml(t.name)}">
          <strong>${escapeHtml(t.name)}</strong>
          <span style="font-size: 11px; color: var(--text-muted); margin-left: 6px;">(${t.tier ? 'Tier ' + t.tier : 'GV'} • ⭐ ${t.rating})</span>
        </div>
      `).join('');
      teacherDropdown.style.display = 'block';
    });

    teacherDropdown.addEventListener('click', (e) => {
      const item = e.target.closest('.submit-combobox-item');
      if (item) {
        teacherInput.value = item.dataset.teacherName;
        teacherDropdown.style.display = 'none';
        if (courseInput) {
          setTimeout(() => courseInput.focus(), 100);
        }
      }
    });
  }

  // Course Autocomplete Suggestions
  if (courseInput && courseDropdown) {
    function renderCourseSuggestions() {
      const q = courseInput.value.trim().toLowerCase();
      const currentTeacherName = (teacherInput?.value || '').trim();
      let teacherCourses = [];

      if (currentTeacherName) {
        const normKey = window.normalizeTeacherKey ? window.normalizeTeacherKey(currentTeacherName) : currentTeacherName.toLowerCase();
        const foundT = allTeachers.find(t => t.normKey === normKey || t.name.toLowerCase() === currentTeacherName.toLowerCase());
        if (foundT && foundT.courses) {
          teacherCourses = foundT.courses;
        }
      }

      let matches = [];

      if (!q) {
        if (teacherCourses.length > 0) {
          matches = teacherCourses.map(c => ({
            maMH: c.maMH,
            tenMH: c.tenMH,
            soTC: 0,
            label: `${c.maMH} - ${c.tenMH}`,
            isTeacherCourse: true
          }));
        } else {
          matches = allCoursesList.slice(0, 10);
        }
      } else {
        const normQ = normalizeStr(q);
        matches = allCoursesList.filter(c => {
          return c.maMH.toLowerCase().includes(q) || 
                 c.tenMH.toLowerCase().includes(q) || 
                 normalizeStr(c.maMH).includes(normQ) || 
                 normalizeStr(c.tenMH).includes(normQ);
        }).slice(0, 10);
      }

      if (matches.length === 0) {
        courseDropdown.style.display = 'none';
        return;
      }

      courseDropdown.innerHTML = matches.map(c => `
        <div class="submit-combobox-item" data-course-label="${escapeHtml(c.label || (c.maMH + ' - ' + c.tenMH))}">
          <span style="font-family: var(--font-mono); font-weight: 700; color: var(--primary);">${escapeHtml(c.maMH)}</span>
          <span style="font-weight: 600; color: var(--text-primary); margin-left: 6px;">${escapeHtml(c.tenMH)}</span>
          ${c.isTeacherCourse ? '<span style="font-size: 10px; background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 1px 6px; border-radius: 4px; margin-left: 6px; font-weight: 700;">Môn của GV</span>' : (c.soTC ? `<span style="font-size: 11px; color: var(--text-muted); margin-left: 6px;">(${c.soTC} TC)</span>` : '')}
        </div>
      `).join('');
      courseDropdown.style.display = 'block';
    }

    courseInput.addEventListener('input', renderCourseSuggestions);
    courseInput.addEventListener('focus', renderCourseSuggestions);

    courseDropdown.addEventListener('click', (e) => {
      const item = e.target.closest('.submit-combobox-item');
      if (item) {
        courseInput.value = item.dataset.courseLabel;
        courseDropdown.style.display = 'none';
      }
    });
  }

  // Global click outside dropdowns
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.form-group')) {
      if (teacherDropdown) teacherDropdown.style.display = 'none';
      if (courseDropdown) courseDropdown.style.display = 'none';
    }
  });

  // Form Submit Handler
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // 1. Anti-Bot Honeypot Trap Check
      const honeypot = (document.getElementById('submitHoneypotField')?.value || '').trim();
      if (honeypot) {
        console.warn('[SECURITY] Automated bot submission dropped.');
        closeModal('modalSubmitReview');
        return;
      }

      // 2. Client-Side DoS / Spam Rate Limiter Guard
      if (window.DKHP_SECURITY && !DKHP_SECURITY.rateLimit('submit_teacher_review', 3, 15000)) {
        showReviewToast('⚠️ Bạn gửi đánh giá quá nhanh! Vui lòng đợi 15 giây trước khi gửi tiếp.');
        return;
      }

      const teacherName = (document.getElementById('submitTeacherInput')?.value || '').trim().slice(0, 120);
      const courseName = (document.getElementById('submitCourseInput')?.value || '').trim().slice(0, 120);
      const semesterName = document.getElementById('submitSemesterSelect')?.value || 'HK2 2025-2026';
      const rawRating = parseInt(document.getElementById('submitRatingValue')?.value || '5');
      const rating = Math.max(1, Math.min(5, isNaN(rawRating) ? 5 : rawRating));
      const grading = document.getElementById('submitGradingSelect')?.value || 'Rộng rãi (Thoáng)';
      const attendance = document.getElementById('submitAttendanceSelect')?.value || 'Không điểm danh / Dễ';
      const workload = document.getElementById('submitWorkloadSelect')?.value || 'Vừa sức';
      const reviewText = (document.getElementById('submitReviewText')?.value || '').trim().slice(0, 2500);

      const selectedTags = Array.from(document.querySelectorAll('#submitTagsSelector .submit-tag-pill.active')).map(el => el.dataset.tag.slice(0, 50));

      if (!teacherName || !courseName || !reviewText) {
        showReviewToast('⚠️ Vui lòng điền đầy đủ Tên Giảng Viên, Môn Học và Nội Dung Đánh Giá!');
        return;
      }

      if (reviewText.length < 5) {
        showReviewToast('⚠️ Nội dung nhận xét phải có ít nhất 5 ký tự!');
        return;
      }

      const reviewRecord = {
        id: 'rev_' + Date.now(),
        teacherName,
        courseName,
        semesterName,
        rating,
        grading,
        attendance,
        workload,
        tags: selectedTags,
        reviewText,
        createdAt: new Date().toISOString()
      };

      // Save to localStorage
      try {
        const stored = JSON.parse(localStorage.getItem('dkhp_custom_reviews') || '[]');
        stored.unshift(reviewRecord);
        localStorage.setItem('dkhp_custom_reviews', JSON.stringify(stored));
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
      }

      // Save to Supabase Cloud Database via Direct REST API
      const cfg = window.DKHP_SUPABASE_CONFIG;
      if (cfg && cfg.url && cfg.anonKey) {
        fetch(`${cfg.url}/rest/v1/uit_teacher_reviews`, {
          method: 'POST',
          headers: {
            'apikey': cfg.anonKey,
            'Authorization': `Bearer ${cfg.anonKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            teacher_name: teacherName,
            course_name: courseName,
            semester_name: semesterName,
            rating: rating,
            grading: grading,
            attendance: attendance,
            workload: workload,
            tags: selectedTags,
            review_text: reviewText,
            posvotes: 1
          })
        }).then(res => {
          if (!res.ok) {
            console.warn('Supabase REST Insert HTTP Error:', res.status);
          } else {
            console.log('✅ Đã lưu đánh giá trực tiếp lên Supabase Cloud DB thành công!');
          }
        }).catch(err => {
          console.error('Supabase direct insert exception:', err);
        });
      }

      // Apply review to in-memory teacher list
      loadAndApplyCustomReviews(allTeachers);

      // Close modal & reset
      closeSubmitModal();
      form.reset();
      if (ratingValueInput) ratingValueInput.value = '5';
      if (starPicker) {
        starPicker.querySelectorAll('.star-item').forEach(s => s.classList.add('active'));
      }
      if (ratingLabel) ratingLabel.textContent = '5/5 Sao (Xuất sắc / Phật sống)';

      // Trigger refresh of grid and statistics
      if (typeof onReviewAdded === 'function') {
        onReviewAdded();
      }

      showReviewToast(`🎉 Đã đăng đánh giá cho GV "${teacherName}" thành công! Cảm ơn đóng góp của bạn.`);
    });
  }
}

// Helper: Show Floating Toast Notification
function showReviewToast(msg) {
  const toast = document.getElementById('reviewToastNotification');
  if (!toast) return;
  toast.innerHTML = `
    <div style="background: var(--bg-surface-elevated); color: var(--text-primary); border: 1.5px solid #10b981; border-radius: var(--radius-md); padding: 12px 18px; box-shadow: var(--shadow-xl); font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 10px; animation: modalPopCenter 0.2s ease;">
      <i class="fa-solid fa-circle-check" style="color: #10b981; font-size: 18px;"></i>
      <span>${escapeHtml(msg)}</span>
    </div>
  `;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 4000);
}

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
  const statReviewCount = document.getElementById('statReviewCount');
  if (statTeacherCount) statTeacherCount.innerHTML = `<strong>${countAll}</strong> Giảng viên`;
  if (statTierSCount) statTierSCount.innerHTML = `<strong>${countS}</strong> Đại Phật Sống (Tier S)`;
  const totalReviews = teachers.reduce((sum, t) => sum + ((t.topReviews && t.topReviews.length) ? t.topReviews.length : (t.reviewsCount || 0)), 0);
  if (statReviewCount) statReviewCount.innerHTML = `<strong>${totalReviews}+</strong> Đánh giá thực tế`;
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
