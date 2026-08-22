/**
 * ==============================================================================
 * UIT HUB - CLIENT AUTHENTICATION, AVATAR CUSTOMIZER & DIALOG CONTROLLER
 * ==============================================================================
 * Hybrid Guest / Registered User System, Email OTP Verification,
 * Custom Profile & Avatar Editor, High-End Confirmation Modals.
 */

(function () {
  let currentUser = null;
  let authToken = localStorage.getItem('dkhp_auth_token') || '';
  let pendingRegisterEmail = '';
  let otpCountdownTimer = null;
  let resendCooldownTimer = null;

  const PRESET_AVATAR_EMOJIS = [
    '👨‍💻', '👩‍💻', '🤖', '🦊', '⚡', '🚀', '🎮', '☕', 
    '🏆', '🐱', '🎯', '🛡️', '🎓', '🔥', '🌟', '🦄'
  ];

  const PRESET_AVATAR_COLORS = [
    '#2563eb', '#7c3aed', '#059669', '#dc2626', 
    '#d97706', '#ec4899', '#0284c7', '#0d9488',
    '#4f46e5', '#9333ea', '#16a34a', '#ea580c'
  ];

  // ==============================================================================
  // 1. INITIALIZATION ON DOM READY
  // ==============================================================================
  async function initAuth() {
    renderAuthModalHTML();
    renderEditProfileModalHTML();
    renderConfirmDialogHTML();
    bindGlobalAuthEvents();

    if (authToken) {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await res.json();
        if (data && data.success && data.user) {
          currentUser = data.user;
          localStorage.setItem('dkhp_auth_user', JSON.stringify(currentUser));
          localStorage.setItem('dkhp_chat_uid', currentUser.id);
          localStorage.setItem('dkhp_chat_uname', currentUser.displayName);
        } else {
          logoutLocally();
        }
      } catch (err) {
        const cached = localStorage.getItem('dkhp_auth_user');
        if (cached) currentUser = JSON.parse(cached);
      }
    } else {
      const cached = localStorage.getItem('dkhp_auth_user');
      if (cached) currentUser = JSON.parse(cached);
    }

    updateHeaderAuthUI();
  }

  // ==============================================================================
  // 2. HEADER PROFILE WIDGET CONTROLLER
  // ==============================================================================
  function getAvatarDisplayHTML(user, sizePx = 28) {
    if (!user) return `<div class="user-avatar-circle" style="width: ${sizePx}px; height: ${sizePx}px; background: #64748b;">U</div>`;
    
    if (user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('data:image'))) {
      return `<img src="${user.avatar}" class="user-avatar-circle" style="width: ${sizePx}px; height: ${sizePx}px; object-fit: cover;" alt="${escapeHtml(user.displayName)}">`;
    }
    
    if (user.avatar && PRESET_AVATAR_EMOJIS.includes(user.avatar)) {
      return `<div class="user-avatar-circle" style="width: ${sizePx}px; height: ${sizePx}px; font-size: ${Math.floor(sizePx * 0.55)}px; background: ${user.avatarColor || '#2563eb'};">${user.avatar}</div>`;
    }

    const firstLetter = (user.displayName || user.username || 'U').charAt(0).toUpperCase();
    return `<div class="user-avatar-circle" style="width: ${sizePx}px; height: ${sizePx}px; font-size: ${Math.floor(sizePx * 0.46)}px; background: ${user.avatarColor || '#2563eb'};">${firstLetter}</div>`;
  }

  function updateHeaderAuthUI() {
    const authWidgets = document.querySelectorAll('.header-user-auth-widget');
    authWidgets.forEach(widget => {
      if (currentUser) {
        const avatarHTML = getAvatarDisplayHTML(currentUser, 28);
        const bigAvatarHTML = getAvatarDisplayHTML(currentUser, 44);
        const isAdmin = currentUser.role === 'admin' || currentUser.badge === 'ADMIN';
        const badgeHTML = isAdmin 
          ? '<span class="user-badge-admin">ADMIN</span>'
          : `<span class="user-badge-uiter">${escapeHtml(currentUser.badge || 'UITer')}</span>`;

        widget.innerHTML = `
          <div class="user-profile-header-btn" id="btnToggleUserDropdown" title="Tài khoản: ${escapeHtml(currentUser.displayName)}">
            ${avatarHTML}
            <div class="user-header-info">
              <div class="user-header-name">${escapeHtml(currentUser.displayName)}</div>
              ${badgeHTML}
            </div>
            <i class="fa-solid fa-chevron-down" style="font-size: 10px; opacity: 0.7; margin-left: 2px;"></i>
          </div>

          <!-- Profile Dropdown Menu -->
          <div class="user-profile-dropdown" id="userProfileDropdown" style="display: none;">
            <div class="dropdown-user-card">
              ${bigAvatarHTML}
              <div style="overflow: hidden; flex: 1;">
                <div style="font-weight: 800; font-size: 13.5px; color: var(--text-primary); text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${escapeHtml(currentUser.displayName)}</div>
                <div style="font-size: 11px; color: var(--text-muted); text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">@${escapeHtml(currentUser.username)}</div>
                ${currentUser.mssv ? `<div style="font-size: 11px; color: var(--primary); font-weight: 700; margin-top: 2px;">MSSV: ${escapeHtml(currentUser.mssv)}</div>` : ''}
              </div>
            </div>
            
            <div class="dropdown-divider"></div>
            
            <button type="button" class="dropdown-item" id="btnHeaderOpenEditProfile">
              <i class="fa-solid fa-user-pen" style="color: #38bdf8;"></i> Đổi Avatar & Hồ sơ
            </button>
            <a href="feed.html" class="dropdown-item">
              <i class="fa-solid fa-comments"></i> Diễn Đàn & Bài viết
            </a>
            <a href="index.html" class="dropdown-item">
              <i class="fa-solid fa-calendar-days"></i> Thời Khóa Biểu của tôi
            </a>
            <a href="reviews.html" class="dropdown-item">
              <i class="fa-solid fa-star"></i> Đánh giá giảng viên
            </a>
            
            <div class="dropdown-divider"></div>
            
            <button type="button" class="dropdown-item dropdown-logout-btn" id="btnHeaderLogout">
              <i class="fa-solid fa-arrow-right-from-bracket" style="color: #ef4444;"></i> Đăng xuất
            </button>
          </div>
        `;
      } else {
        widget.innerHTML = `
          <button type="button" class="btn btn-primary btn-sm btn-open-auth-modal" id="btnOpenAuthModal" style="padding: 6px 14px; font-size: 12.5px; font-weight: 700; border-radius: var(--radius-md); box-shadow: var(--shadow-sm);">
            <i class="fa-solid fa-user-circle"></i> Đăng nhập / Đăng ký
          </button>
        `;
      }
    });

    // Dropdown toggle
    document.querySelectorAll('#btnToggleUserDropdown').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dropdown = btn.parentElement.querySelector('#userProfileDropdown');
        if (dropdown) {
          const isShown = dropdown.style.display === 'block';
          dropdown.style.display = isShown ? 'none' : 'block';
        }
      });
    });

    // Edit Profile Click
    document.querySelectorAll('#btnHeaderOpenEditProfile').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.user-profile-dropdown').forEach(d => d.style.display = 'none');
        openEditProfileModal();
      });
    });

    // Logout Click (Sử dụng modal xác nhận đẹp)
    document.querySelectorAll('#btnHeaderLogout').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.user-profile-dropdown').forEach(d => d.style.display = 'none');
        showCustomConfirmDialog({
          title: 'Xác nhận Đăng xuất',
          message: 'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản UIT HUB? Bạn vẫn có thể sử dụng các tính năng ở chế độ Khách.',
          icon: '<i class="fa-solid fa-arrow-right-from-bracket" style="color: #ef4444; font-size: 26px;"></i>',
          confirmText: 'Đăng xuất ngay',
          cancelText: 'Hủy bỏ',
          confirmColor: '#ef4444',
          onConfirm: executeLogout
        });
      });
    });

    // Open Auth Modal
    document.querySelectorAll('.btn-open-auth-modal').forEach(btn => {
      btn.addEventListener('click', () => openAuthModal('login'));
    });
  }

  // Close dropdown on click outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.header-user-auth-widget')) {
      document.querySelectorAll('.user-profile-dropdown').forEach(d => d.style.display = 'none');
    }
  });

  // ==============================================================================
  // 3. AUTHENTICATION MODAL HTML (LOGIN • REGISTER WITH SPAM NOTICE)
  // ==============================================================================
  function renderAuthModalHTML() {
    if (document.getElementById('modalAuthApp')) return;

    const modalDiv = document.createElement('div');
    modalDiv.id = 'modalAuthApp';
    modalDiv.className = 'modal-backdrop';
    modalDiv.style.display = 'none';

    modalDiv.innerHTML = `
      <div class="modal-card auth-modal-box" style="max-width: 440px; width: 92%; padding: 0; overflow: hidden; border-radius: var(--radius-xl); box-shadow: var(--shadow-2xl); border: 1px solid var(--border-color); background: var(--bg-surface);">
        <!-- Modal Top Bar -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border-color); background: var(--bg-surface-elevated);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <img src="assets/logo-icon.png" alt="UIT HUB" style="width: 28px; height: 28px; object-fit: contain;">
            <strong style="font-size: 15px; color: var(--text-primary);">Tài Khoản UIT HUB</strong>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" id="btnCloseAuthModal" style="padding: 4px 8px; font-size: 16px; color: var(--text-muted);">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Auth Tab Switcher -->
        <div class="auth-tabs-nav" id="authTabsNav" style="display: flex; border-bottom: 1px solid var(--border-color); background: var(--bg-surface-elevated);">
          <button type="button" class="auth-tab-btn active" data-auth-tab="login" style="flex: 1; padding: 12px; font-weight: 700; font-size: 13.5px; border: none; background: transparent; cursor: pointer; color: var(--primary); border-bottom: 2px solid var(--primary);">
            Đăng nhập
          </button>
          <button type="button" class="auth-tab-btn" data-auth-tab="register" style="flex: 1; padding: 12px; font-weight: 700; font-size: 13.5px; border: none; background: transparent; cursor: pointer; color: var(--text-muted);">
            Đăng ký (Xác thực Email)
          </button>
        </div>

        <!-- Modal Body Content -->
        <div style="padding: 22px 20px;">

          <!-- 1. VIEW: LOGIN FORM -->
          <div id="viewAuthLogin" style="display: block;">
            <form id="formAuthLogin">
              <div class="form-group" style="margin-bottom: 14px;">
                <label style="display: block; font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px;">Tên đăng nhập hoặc Email</label>
                <div class="input-with-icon" style="position: relative;">
                  <i class="fa-solid fa-user" style="position: absolute; left: 12px; top: 12px; color: var(--text-muted); font-size: 13px;"></i>
                  <input type="text" id="loginIdentifier" required placeholder="Nhập username hoặc email..." style="width: 100%; padding: 10px 12px 10px 36px; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-surface-elevated); color: var(--text-primary); font-size: 13px;">
                </div>
              </div>

              <div class="form-group" style="margin-bottom: 18px;">
                <label style="display: block; font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px;">Mật khẩu</label>
                <div class="input-with-icon" style="position: relative;">
                  <i class="fa-solid fa-lock" style="position: absolute; left: 12px; top: 12px; color: var(--text-muted); font-size: 13px;"></i>
                  <input type="password" id="loginPassword" required placeholder="Nhập mật khẩu..." style="width: 100%; padding: 10px 12px 10px 36px; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-surface-elevated); color: var(--text-primary); font-size: 13px;">
                </div>
              </div>

              <button type="submit" class="btn btn-primary" id="btnSubmitLogin" style="width: 100%; padding: 11px; font-size: 13.5px; font-weight: 800; border-radius: var(--radius-md);">
                <i class="fa-solid fa-right-to-bracket"></i> Đăng nhập ngay
              </button>

              <div style="text-align: center; margin-top: 14px; font-size: 12px; color: var(--text-muted);">
                Chưa có tài khoản? <a href="javascript:void(0)" id="linkSwitchToRegister" style="color: var(--primary); font-weight: 700; text-decoration: none;">Đăng ký nhận mã OTP</a>
              </div>
            </form>
          </div>

          <!-- 2. VIEW: REGISTER STEP 1 (FILL INFO) -->
          <div id="viewAuthRegisterStep1" style="display: none;">
            <form id="formAuthRegister">
              <div class="form-group" style="margin-bottom: 12px;">
                <label style="display: block; font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-bottom: 5px;">Tên đăng nhập (Username) <span style="color: #ef4444;">*</span></label>
                <input type="text" id="regUsername" required placeholder="VD: nguyen_van_a (viết liền, không dấu)" style="width: 100%; padding: 9px 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-surface-elevated); color: var(--text-primary); font-size: 12.5px;">
              </div>

              <div class="form-group" style="margin-bottom: 12px;">
                <label style="display: block; font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-bottom: 5px;">Địa chỉ Email nhận mã OTP <span style="color: #ef4444;">*</span></label>
                <input type="email" id="regEmail" required placeholder="VD: 2252xxxx@gm.uit.edu.vn hoặc Gmail" style="width: 100%; padding: 9px 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-surface-elevated); color: var(--text-primary); font-size: 12.5px;">
                <span style="font-size: 10.5px; color: var(--text-muted); margin-top: 3px; display: block;">Mã xác thực 6 số sẽ được gửi trực tiếp tới email này.</span>
              </div>

              <div class="form-group" style="margin-bottom: 12px;">
                <label style="display: block; font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-bottom: 5px;">Mật khẩu (Tối thiểu 6 ký tự) <span style="color: #ef4444;">*</span></label>
                <input type="password" id="regPassword" required minlength="6" placeholder="Nhập mật khẩu an toàn..." style="width: 100%; padding: 9px 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-surface-elevated); color: var(--text-primary); font-size: 12.5px;">
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px;">
                <div>
                  <label style="display: block; font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-bottom: 5px;">Tên hiển thị</label>
                  <input type="text" id="regDisplayName" placeholder="VD: Tuấn Anh K19" style="width: 100%; padding: 9px 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-surface-elevated); color: var(--text-primary); font-size: 12.5px;">
                </div>
                <div>
                  <label style="display: block; font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-bottom: 5px;">MSSV (Tùy chọn)</label>
                  <input type="text" id="regMSSV" placeholder="VD: 22520000" style="width: 100%; padding: 9px 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-surface-elevated); color: var(--text-primary); font-size: 12.5px;">
                </div>
              </div>

              <button type="submit" class="btn btn-primary" id="btnSubmitSendOTP" style="width: 100%; padding: 11px; font-size: 13.5px; font-weight: 800; border-radius: var(--radius-md);">
                <i class="fa-solid fa-paper-plane"></i> Tiếp tục & Gửi mã OTP về Email
              </button>
            </form>
          </div>

          <!-- 3. VIEW: REGISTER STEP 2 (ENTER OTP & SPAM NOTICE) -->
          <div id="viewAuthRegisterStep2" style="display: none; text-align: center;">
            <div style="font-size: 40px; margin-bottom: 8px;">📬</div>
            <h4 style="font-size: 15px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">Xác thực Hộp Thư Email</h4>
            <p style="font-size: 12px; color: var(--text-muted); line-height: 1.5; margin-bottom: 12px;">
              Mã xác thực 6 số đã được gửi tới:<br>
              <strong style="color: var(--primary); font-size: 13px;" id="txtOtpTargetEmail">email@example.com</strong>
            </p>

            <!-- Prominent Spam / Junk Notice Box -->
            <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: var(--radius-md); padding: 10px 12px; margin-bottom: 16px; text-align: left; font-size: 11.5px; color: #f59e0b; display: flex; align-items: flex-start; gap: 8px; line-height: 1.5;">
              <i class="fa-solid fa-circle-exclamation" style="font-size: 14px; margin-top: 1px; flex-shrink: 0;"></i>
              <span><strong>Lưu ý quan trọng:</strong> Nếu không thấy email trong Hộp thư đến (Inbox), bạn vui lòng kiểm tra kỹ mục <strong>Thư rác (Spam)</strong> hoặc tab <strong>Quảng cáo / Xã hội</strong> nhé!</span>
            </div>

            <form id="formAuthVerifyOTP">
              <div style="margin-bottom: 14px;">
                <input type="text" id="inputOtpCode" maxlength="6" pattern="[0-9]{6}" required placeholder="• • • • • •" autocomplete="one-time-code" style="width: 220px; text-align: center; font-size: 26px; font-weight: 800; letter-spacing: 8px; padding: 10px 12px; border-radius: var(--radius-md); border: 2px solid var(--primary); background: var(--bg-surface-elevated); color: var(--text-primary); font-family: monospace;">
              </div>

              <div style="font-size: 12px; color: #f59e0b; margin-bottom: 16px; font-weight: 600;" id="txtOtpCountdown">
                ⏱️ Mã có hiệu lực trong: 05:00
              </div>

              <button type="submit" class="btn btn-primary" id="btnSubmitVerifyOTP" style="width: 100%; padding: 11px; font-size: 13.5px; font-weight: 800; border-radius: var(--radius-md);">
                <i class="fa-solid fa-check-circle"></i> Xác nhận & Hoàn tất Đăng ký
              </button>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; font-size: 12px;">
                <button type="button" class="btn btn-ghost btn-sm" id="btnBackToStep1" style="font-size: 11.5px; padding: 4px 8px; color: var(--text-muted);">
                  <i class="fa-solid fa-arrow-left"></i> Sửa thông tin
                </button>
                <button type="button" class="btn btn-ghost btn-sm" id="btnResendOTP" style="font-size: 11.5px; padding: 4px 8px; color: var(--primary); font-weight: 700;">
                  <i class="fa-solid fa-rotate-right"></i> Gửi lại mã
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    `;

    document.body.appendChild(modalDiv);
  }

  // ==============================================================================
  // 4. EDIT PROFILE & AVATAR CUSTOMIZER MODAL HTML
  // ==============================================================================
  function renderEditProfileModalHTML() {
    if (document.getElementById('modalEditProfileApp')) return;

    const modalDiv = document.createElement('div');
    modalDiv.id = 'modalEditProfileApp';
    modalDiv.className = 'modal-backdrop';
    modalDiv.style.display = 'none';

    modalDiv.innerHTML = `
      <div class="modal-card auth-modal-box" style="max-width: 480px; width: 92%; padding: 0; overflow: hidden; border-radius: var(--radius-xl); box-shadow: var(--shadow-2xl); border: 1px solid var(--border-color); background: var(--bg-surface);">
        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border-color); background: var(--bg-surface-elevated);">
          <strong style="font-size: 15px; color: var(--text-primary);"><i class="fa-solid fa-user-pen" style="color: #38bdf8; margin-right: 6px;"></i> Chỉnh Sửa Hồ Sơ & Đổi Avatar</strong>
          <button type="button" class="btn btn-ghost btn-sm" id="btnCloseEditProfileModal" style="padding: 4px 8px; font-size: 16px; color: var(--text-muted);">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div style="padding: 22px 20px; max-height: 75vh; overflow-y: auto;">
          <!-- Avatar Preview Center -->
          <div style="text-align: center; margin-bottom: 20px;">
            <div id="editAvatarPreviewContainer" style="display: inline-block; position: relative;">
              <!-- Target preview inserted here -->
            </div>
            <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 6px;">Bấm chọn Icon Emoji, Màu sắc hoặc Tải ảnh riêng bên dưới</div>
          </div>

          <!-- Section 1: Preset Emojis -->
          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px;">1. Chọn biểu tượng Avatar</label>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;" id="avatarEmojiGrid">
              ${PRESET_AVATAR_EMOJIS.map(em => `
                <button type="button" class="btn-avatar-emoji-choice" data-emoji="${em}" style="width: 38px; height: 38px; font-size: 18px; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-surface-elevated); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s ease;">
                  ${em}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Section 2: Preset Colors -->
          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px;">2. Chọn màu nền Avatar</label>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;" id="avatarColorGrid">
              ${PRESET_AVATAR_COLORS.map(c => `
                <button type="button" class="btn-avatar-color-choice" data-color="${c}" style="width: 30px; height: 30px; border-radius: 50%; background: ${c}; border: 2px solid transparent; cursor: pointer; transition: transform 0.15s ease;"></button>
              `).join('')}
            </div>
          </div>

          <!-- Section 3: Custom Image URL or Upload -->
          <div style="margin-bottom: 18px; padding-top: 12px; border-top: 1px solid var(--border-color);">
            <label style="display: block; font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px;">Hoặc tải ảnh đại diện / Link ảnh URL</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="inputCustomAvatarUrl" placeholder="Dán link ảnh (https://...)" style="flex: 1; padding: 8px 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-surface-elevated); color: var(--text-primary); font-size: 12px;">
              <label class="btn btn-secondary btn-sm" style="cursor: pointer; padding: 8px 12px; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                <i class="fa-solid fa-upload"></i> Tải ảnh
                <input type="file" id="fileUploadAvatar" accept="image/*" style="display: none;">
              </label>
            </div>
          </div>

          <!-- Section 4: Display Name & MSSV -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
            <div>
              <label style="display: block; font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-bottom: 5px;">Tên hiển thị</label>
              <input type="text" id="inputEditDisplayName" style="width: 100%; padding: 8px 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-surface-elevated); color: var(--text-primary); font-size: 12.5px;">
            </div>
            <div>
              <label style="display: block; font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-bottom: 5px;">Mã số sinh viên (MSSV)</label>
              <input type="text" id="inputEditMSSV" style="width: 100%; padding: 8px 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-surface-elevated); color: var(--text-primary); font-size: 12.5px;">
            </div>
          </div>

          <!-- Actions -->
          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button type="button" class="btn btn-secondary" id="btnCancelEditProfile">Hủy bỏ</button>
            <button type="button" class="btn btn-primary" id="btnSaveEditProfile" style="padding: 9px 18px; font-weight: 800;">
              <i class="fa-solid fa-floppy-disk"></i> Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalDiv);
  }

  // ==============================================================================
  // 5. HIGH-END CONFIRMATION MODAL (CHUYÊN NGHIỆP THAY CHO NATIVE CONFIRM)
  // ==============================================================================
  function renderConfirmDialogHTML() {
    if (document.getElementById('modalCustomConfirmDialog')) return;

    const modalDiv = document.createElement('div');
    modalDiv.id = 'modalCustomConfirmDialog';
    modalDiv.className = 'modal-backdrop';
    modalDiv.style.display = 'none';

    modalDiv.innerHTML = `
      <div class="modal-card auth-modal-box" style="max-width: 380px; width: 90%; padding: 24px 20px; border-radius: var(--radius-xl); box-shadow: var(--shadow-2xl); border: 1px solid var(--border-color); background: var(--bg-surface); text-align: center;">
        <div id="confirmDialogIcon" style="margin-bottom: 12px;"></div>
        <h3 id="confirmDialogTitle" style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px;"></h3>
        <p id="confirmDialogMessage" style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 22px;"></p>
        
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button type="button" class="btn btn-secondary" id="btnCancelConfirmDialog" style="flex: 1; padding: 10px; font-size: 13px; font-weight: 700;">
            Hủy bỏ
          </button>
          <button type="button" class="btn" id="btnAcceptConfirmDialog" style="flex: 1; padding: 10px; font-size: 13px; font-weight: 800; color: #fff; background: var(--primary);">
            Xác nhận
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modalDiv);
  }

  let onConfirmCallback = null;

  function showCustomConfirmDialog(options) {
    const modal = document.getElementById('modalCustomConfirmDialog');
    if (!modal) return;

    const iconEl = document.getElementById('confirmDialogIcon');
    const titleEl = document.getElementById('confirmDialogTitle');
    const msgEl = document.getElementById('confirmDialogMessage');
    const btnAccept = document.getElementById('btnAcceptConfirmDialog');
    const btnCancel = document.getElementById('btnCancelConfirmDialog');

    if (iconEl) iconEl.innerHTML = options.icon || '<i class="fa-solid fa-circle-question" style="color: var(--primary); font-size: 28px;"></i>';
    if (titleEl) titleEl.textContent = options.title || 'Xác nhận hành động';
    if (msgEl) msgEl.textContent = options.message || 'Bạn có chắc chắn muốn thực hiện hành động này?';
    if (btnAccept) {
      btnAccept.textContent = options.confirmText || 'Xác nhận';
      btnAccept.style.background = options.confirmColor || 'var(--primary)';
    }
    if (btnCancel) btnCancel.textContent = options.cancelText || 'Hủy bỏ';

    onConfirmCallback = options.onConfirm || null;
    modal.style.display = 'flex';
  }

  function closeCustomConfirmDialog() {
    const modal = document.getElementById('modalCustomConfirmDialog');
    if (modal) modal.style.display = 'none';
    onConfirmCallback = null;
  }

  // ==============================================================================
  // 6. EDIT PROFILE CONTROLLER & AVATAR SELECTION
  // ==============================================================================
  let tempAvatarValue = '';
  let tempAvatarColor = '#2563eb';

  function openEditProfileModal() {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }

    const modal = document.getElementById('modalEditProfileApp');
    if (!modal) return;

    tempAvatarValue = currentUser.avatar || '';
    tempAvatarColor = currentUser.avatarColor || '#2563eb';

    const inputName = document.getElementById('inputEditDisplayName');
    const inputMSSV = document.getElementById('inputEditMSSV');
    const inputUrl = document.getElementById('inputCustomAvatarUrl');

    if (inputName) inputName.value = currentUser.displayName || '';
    if (inputMSSV) inputMSSV.value = currentUser.mssv || '';
    if (inputUrl) inputUrl.value = (currentUser.avatar && currentUser.avatar.startsWith('http')) ? currentUser.avatar : '';

    updateEditAvatarPreview();
    modal.style.display = 'flex';
  }

  function closeEditProfileModal() {
    const modal = document.getElementById('modalEditProfileApp');
    if (modal) modal.style.display = 'none';
  }

  function updateEditAvatarPreview() {
    const container = document.getElementById('editAvatarPreviewContainer');
    if (!container) return;

    const mockUser = {
      displayName: document.getElementById('inputEditDisplayName')?.value || (currentUser ? currentUser.displayName : 'U'),
      avatar: tempAvatarValue,
      avatarColor: tempAvatarColor
    };

    container.innerHTML = getAvatarDisplayHTML(mockUser, 64);
  }

  // ==============================================================================
  // 7. BIND GLOBAL AUTH & MODAL EVENTS
  // ==============================================================================
  function bindGlobalAuthEvents() {
    // Auth Modal Handlers
    document.getElementById('btnCloseAuthModal')?.addEventListener('click', closeAuthModal);
    document.getElementById('modalAuthApp')?.addEventListener('click', (e) => {
      if (e.target.id === 'modalAuthApp') closeAuthModal();
    });

    document.querySelectorAll('.auth-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchAuthTab(btn.dataset.authTab));
    });

    document.getElementById('linkSwitchToRegister')?.addEventListener('click', () => switchAuthTab('register'));

    // Step 1: Send OTP
    const formReg = document.getElementById('formAuthRegister');
    if (formReg) {
      formReg.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('regUsername').value.trim();
        const email = document.getElementById('regEmail').value.trim().toLowerCase();
        const password = document.getElementById('regPassword').value;
        const displayName = document.getElementById('regDisplayName').value.trim();
        const mssv = document.getElementById('regMSSV').value.trim();

        const btnSubmit = document.getElementById('btnSubmitSendOTP');
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi mã OTP...';

        try {
          const res = await fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, displayName, mssv })
          });
          const data = await res.json();

          if (data.success) {
            pendingRegisterEmail = email;
            window._pendingOtpTicket = data.otpTicket || '';
            showAuthToast(data.message || 'Mã xác thực 6 số đã được gửi đến email của bạn!');

            document.getElementById('viewAuthRegisterStep1').style.display = 'none';
            document.getElementById('viewAuthRegisterStep2').style.display = 'block';
            document.getElementById('txtOtpTargetEmail').textContent = email;
            
            const otpInput = document.getElementById('inputOtpCode');
            otpInput.value = '';
            otpInput.focus();

            startOtpCountdown(300); // 5 minutes
          } else {
            showAuthToast(data.error || 'Có lỗi xảy ra khi gửi mã OTP!');
          }
        } catch (err) {
          showAuthToast('⚠️ Không thể kết nối tới máy chủ. Vui lòng thử lại sau!');
        } finally {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Tiếp tục & Gửi mã OTP về Email';
        }
      });
    }

    // Step 2: Verify OTP
    const formVerify = document.getElementById('formAuthVerifyOTP');
    if (formVerify) {
      formVerify.addEventListener('submit', async (e) => {
        e.preventDefault();
        const otpCode = document.getElementById('inputOtpCode').value.trim();
        const prevGuestId = localStorage.getItem('dkhp_chat_uid') || '';

        const btnVerify = document.getElementById('btnSubmitVerifyOTP');
        btnVerify.disabled = true;
        btnVerify.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xác thực...';

        try {
          const res = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: pendingRegisterEmail,
              otpCode: otpCode,
              otpTicket: window._pendingOtpTicket || '',
              previousGuestId: prevGuestId
            })
          });
          const data = await res.json();

          if (data.success) {
            currentUser = data.user;
            authToken = data.token;
            localStorage.setItem('dkhp_auth_token', authToken);
            localStorage.setItem('dkhp_auth_user', JSON.stringify(currentUser));
            localStorage.setItem('dkhp_chat_uid', currentUser.id);
            localStorage.setItem('dkhp_chat_uname', currentUser.displayName);

            showAuthToast(data.message || '🎉 Đăng ký tài khoản thành công!');
            closeAuthModal();
            updateHeaderAuthUI();

            if (typeof fetchPostsFromDB === 'function') fetchPostsFromDB(true);
          } else {
            showAuthToast(data.error || 'Mã OTP không hợp lệ!');
          }
        } catch (err) {
          showAuthToast('⚠️ Lỗi kết nối khi xác thực OTP!');
        } finally {
          btnVerify.disabled = false;
          btnVerify.innerHTML = '<i class="fa-solid fa-check-circle"></i> Xác nhận & Hoàn tất Đăng ký';
        }
      });
    }

    // Back to Step 1
    document.getElementById('btnBackToStep1')?.addEventListener('click', () => {
      document.getElementById('viewAuthRegisterStep1').style.display = 'block';
      document.getElementById('viewAuthRegisterStep2').style.display = 'none';
      clearInterval(otpCountdownTimer);
    });

    // Resend OTP
    document.getElementById('btnResendOTP')?.addEventListener('click', async () => {
      if (!pendingRegisterEmail) return;
      const btn = document.getElementById('btnResendOTP');
      btn.disabled = true;

      try {
        const res = await fetch('/api/auth/resend-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: pendingRegisterEmail })
        });
        const data = await res.json();
        if (data.success) {
          window._pendingOtpTicket = data.otpTicket || '';
          document.getElementById('inputOtpCode').value = '';
          showAuthToast(data.message || 'Mã xác thực mới đã được gửi đến email của bạn!');
          startOtpCountdown(300);
        } else {
          showAuthToast(data.error || 'Chưa thể gửi lại mã lúc này!');
        }
      } catch (err) {
        showAuthToast('⚠️ Lỗi gửi lại mã OTP');
      } finally {
        setTimeout(() => { btn.disabled = false; }, 5000);
      }
    });

    // Login Form
    const formLogin = document.getElementById('formAuthLogin');
    if (formLogin) {
      formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const usernameOrEmail = document.getElementById('loginIdentifier').value.trim();
        const password = document.getElementById('loginPassword').value;

        const btnLogin = document.getElementById('btnSubmitLogin');
        btnLogin.disabled = true;
        btnLogin.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang đăng nhập...';

        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usernameOrEmail, password })
          });
          const data = await res.json();

          if (data.success) {
            currentUser = data.user;
            authToken = data.token;
            localStorage.setItem('dkhp_auth_token', authToken);
            localStorage.setItem('dkhp_auth_user', JSON.stringify(currentUser));
            localStorage.setItem('dkhp_chat_uid', currentUser.id);
            localStorage.setItem('dkhp_chat_uname', currentUser.displayName);

            showAuthToast(data.message || 'Đăng nhập thành công!');
            closeAuthModal();
            updateHeaderAuthUI();

            if (typeof fetchPostsFromDB === 'function') fetchPostsFromDB(true);
          } else {
            showAuthToast(data.error || 'Đăng nhập thất bại!');
          }
        } catch (err) {
          showAuthToast('⚠️ Lỗi kết nối khi đăng nhập!');
        } finally {
          btnLogin.disabled = false;
          btnLogin.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Đăng nhập ngay';
        }
      });
    }

    // Edit Profile Modal Events
    document.getElementById('btnCloseEditProfileModal')?.addEventListener('click', closeEditProfileModal);
    document.getElementById('btnCancelEditProfile')?.addEventListener('click', closeEditProfileModal);
    document.getElementById('modalEditProfileApp')?.addEventListener('click', (e) => {
      if (e.target.id === 'modalEditProfileApp') closeEditProfileModal();
    });

    // Emoji pick
    document.querySelectorAll('.btn-avatar-emoji-choice').forEach(btn => {
      btn.addEventListener('click', () => {
        tempAvatarValue = btn.dataset.emoji;
        updateEditAvatarPreview();
      });
    });

    // Color pick
    document.querySelectorAll('.btn-avatar-color-choice').forEach(btn => {
      btn.addEventListener('click', () => {
        tempAvatarColor = btn.dataset.color;
        updateEditAvatarPreview();
      });
    });

    // URL input
    const inputUrl = document.getElementById('inputCustomAvatarUrl');
    if (inputUrl) {
      inputUrl.addEventListener('input', () => {
        const val = inputUrl.value.trim();
        if (val) {
          tempAvatarValue = val;
          updateEditAvatarPreview();
        }
      });
    }

    // File Upload input
    const fileUpload = document.getElementById('fileUploadAvatar');
    if (fileUpload) {
      fileUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          if (file.size > 1.5 * 1024 * 1024) {
            showAuthToast('⚠️ Dung lượng ảnh tối đa 1.5MB!');
            return;
          }
          const reader = new FileReader();
          reader.onload = (re) => {
            tempAvatarValue = re.target.result;
            updateEditAvatarPreview();
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Save Edit Profile Submit
    document.getElementById('btnSaveEditProfile')?.addEventListener('click', async () => {
      const newDisplayName = document.getElementById('inputEditDisplayName')?.value.trim();
      const newMSSV = document.getElementById('inputEditMSSV')?.value.trim();

      if (!newDisplayName) {
        showAuthToast('⚠️ Tên hiển thị không được để trống!');
        return;
      }

      const btnSave = document.getElementById('btnSaveEditProfile');
      btnSave.disabled = true;
      btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';

      try {
        const res = await fetch('/api/auth/update-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            displayName: newDisplayName,
            avatar: tempAvatarValue,
            avatarColor: tempAvatarColor,
            mssv: newMSSV
          })
        });
        const data = await res.json();

        if (data.success) {
          currentUser = data.user;
          localStorage.setItem('dkhp_auth_user', JSON.stringify(currentUser));
          localStorage.setItem('dkhp_chat_uname', currentUser.displayName);

          showAuthToast('🎉 Cập nhật hồ sơ & avatar thành công!');
          closeEditProfileModal();
          updateHeaderAuthUI();

          if (typeof fetchPostsFromDB === 'function') fetchPostsFromDB(true);
        } else {
          showAuthToast(data.error || 'Cập nhật thất bại!');
        }
      } catch (err) {
        showAuthToast('⚠️ Lỗi máy chủ khi cập nhật hồ sơ!');
      } finally {
        btnSave.disabled = false;
        btnSave.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Lưu thay đổi';
      }
    });

    // Custom Confirmation Dialog Events
    document.getElementById('btnCancelConfirmDialog')?.addEventListener('click', closeCustomConfirmDialog);
    document.getElementById('btnAcceptConfirmDialog')?.addEventListener('click', () => {
      if (typeof onConfirmCallback === 'function') onConfirmCallback();
      closeCustomConfirmDialog();
    });
    document.getElementById('modalCustomConfirmDialog')?.addEventListener('click', (e) => {
      if (e.target.id === 'modalCustomConfirmDialog') closeCustomConfirmDialog();
    });
  }

  // ==============================================================================
  // 8. LOGOUT EXECUTION
  // ==============================================================================
  async function executeLogout() {
    try {
      if (authToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
      }
    } catch (e) {}

    logoutLocally();
    showAuthToast('👋 Đã đăng xuất an toàn khỏi UIT HUB!');
  }

  function logoutLocally() {
    currentUser = null;
    authToken = '';
    localStorage.removeItem('dkhp_auth_token');
    localStorage.removeItem('dkhp_auth_user');
    
    const newGuestId = 'u_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('dkhp_chat_uid', newGuestId);
    localStorage.setItem('dkhp_chat_uname', 'Sinh viên UIT #' + newGuestId.slice(-3));

    updateHeaderAuthUI();
    if (typeof fetchPostsFromDB === 'function') fetchPostsFromDB(true);
  }

  function openAuthModal(tab = 'login') {
    const modal = document.getElementById('modalAuthApp');
    if (!modal) return;
    modal.style.display = 'flex';
    switchAuthTab(tab);
  }

  function closeAuthModal() {
    const modal = document.getElementById('modalAuthApp');
    if (modal) modal.style.display = 'none';
    clearInterval(otpCountdownTimer);
  }

  function switchAuthTab(tabName) {
    const tabs = document.querySelectorAll('.auth-tab-btn');
    tabs.forEach(t => {
      const isActive = t.dataset.authTab === tabName;
      t.classList.toggle('active', isActive);
      t.style.color = isActive ? 'var(--primary)' : 'var(--text-muted)';
      t.style.borderBottom = isActive ? '2px solid var(--primary)' : 'none';
    });

    const vLogin = document.getElementById('viewAuthLogin');
    const vReg1 = document.getElementById('viewAuthRegisterStep1');
    const vReg2 = document.getElementById('viewAuthRegisterStep2');

    if (tabName === 'login') {
      if (vLogin) vLogin.style.display = 'block';
      if (vReg1) vReg1.style.display = 'none';
      if (vReg2) vReg2.style.display = 'none';
      document.getElementById('loginIdentifier')?.focus();
    } else {
      if (vLogin) vLogin.style.display = 'none';
      if (vReg1) vReg1.style.display = 'block';
      if (vReg2) vReg2.style.display = 'none';
      document.getElementById('regUsername')?.focus();
    }
  }

  function startOtpCountdown(durationSeconds) {
    clearInterval(otpCountdownTimer);
    let remaining = durationSeconds;
    const txt = document.getElementById('txtOtpCountdown');

    const updateText = () => {
      const min = Math.floor(remaining / 60);
      const sec = remaining % 60;
      const fmt = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
      if (txt) txt.textContent = `⏱️ Mã có hiệu lực trong: ${fmt}`;
    };

    updateText();
    otpCountdownTimer = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(otpCountdownTimer);
        if (txt) txt.textContent = '⚠️ Mã OTP đã hết hạn! Vui lòng bấm Gửi lại mã.';
      } else {
        updateText();
      }
    }, 1000);
  }

  function showAuthToast(msg) {
    let toast = document.getElementById('authGlobalToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'authGlobalToast';
      toast.style.cssText = 'position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 999999; display: none;';
      document.body.appendChild(toast);
    }

    toast.innerHTML = `
      <div style="background: var(--bg-surface-elevated); color: var(--text-primary); border: 1.5px solid var(--primary); padding: 11px 18px; border-radius: var(--radius-md); box-shadow: var(--shadow-2xl); font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
        <span>${escapeHtml(msg)}</span>
      </div>
    `;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3500);
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

  // Global APIs
  window.UITHubAuth = {
    getUser: () => currentUser,
    getToken: () => authToken,
    openModal: openAuthModal,
    openEditProfile: openEditProfileModal,
    confirm: showCustomConfirmDialog,
    logout: () => {
      showCustomConfirmDialog({
        title: 'Xác nhận Đăng xuất',
        message: 'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản UIT HUB? Bạn vẫn có thể sử dụng các tính năng ở chế độ Khách.',
        icon: '<i class="fa-solid fa-arrow-right-from-bracket" style="color: #ef4444; font-size: 26px;"></i>',
        confirmText: 'Đăng xuất ngay',
        cancelText: 'Hủy bỏ',
        confirmColor: '#ef4444',
        onConfirm: executeLogout
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
  } else {
    initAuth();
  }
})();
