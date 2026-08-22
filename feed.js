/**
 * ==============================================================================
 * UIT STUDENT SOCIAL NETWORK & FACEBOOK MESSENGER CONTROLLER
 * ==============================================================================
 * Database Persistence, 2-Way Friend Requests, Messenger Inbox & 1-on-1 Realtime Chat.
 * Zero-Flicker in-place DOM updates for smooth, instant commenting and liking!
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Theme Management Sync
  initThemeToggle();

  // 2. User Profile Setup (Persistent Identification)
  let myUserId = localStorage.getItem('dkhp_chat_uid');
  if (!myUserId) {
    myUserId = 'u_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('dkhp_chat_uid', myUserId);
  }
  let myUserName = localStorage.getItem('dkhp_chat_uname') || ('Sinh viên #' + myUserId.slice(-3));

  // Sync with mini profile
  const sidebarName = document.getElementById('sidebarMyUserName');
  if (sidebarName) sidebarName.textContent = myUserName;

  // 3. State Management
  let currentCategory = 'all';
  let currentSort = 'latest'; // 'latest' | 'hot' | 'comments'
  let currentSearch = '';
  
  const DEFAULT_INITIAL_POSTS = [
    {
      id: "post_1787409524253",
      title: "✨ Hoàng hôn yên bình tại Trường Đại học Công nghệ Thông tin (UIT) 💙",
      content: "Góc nhìn hoàng hôn tuyệt đẹp của tòa nhà E và khuôn viên trường UIT. Chúc toàn thể anh em UITer có một kỳ học mới bùng nổ, đăng ký học phần đúng 100% nguyện vọng và đạt nhiều điểm A+ nhé! 🎉💻🚀",
      category: "chat",
      authorId: "admin_ins0720",
      author: "Ins0720",
      isAnonymous: false,
      courseTag: "",
      teacherTag: "",
      image: "assets/uit-campus-twilight.png",
      upvotes: 1,
      createdAt: "2026-08-22T14:38:44.253Z",
      comments: []
    },
    {
      id: "post_intro_trade",
      title: "📢 Chào mừng bạn đến với Chợ Nhượng & Đổi Lớp Thời Khóa Biểu UIT",
      content: "Kênh hỗ trợ sinh viên trao đổi, tìm kiếm và nhượng lịch học giữa các lớp lý thuyết và thực hành.\n\nKhi đăng bài, bạn hãy nhớ gắn mã môn (VD: #IT004), ghi rõ ca học hiện tại và ca mong muốn đổi để kết nối nhanh nhất nhé!",
      category: "trade",
      authorId: "admin_ins0720",
      author: "Ins0720",
      isAnonymous: false,
      courseTag: "IT004",
      teacherTag: "",
      upvotes: 99,
      createdAt: "2026-08-22T11:27:28.682Z",
      comments: []
    },
    {
      id: "post_intro_study",
      title: "📚 Không gian Chia sẻ Tài liệu, Đề thi & Trao đổi Học thuật UIT",
      content: "Nơi sinh viên UIT cùng nhau chia sẻ slide bài giảng, đề thi mẫu giữa kỳ / cuối kỳ và trao đổi các môn học đại cương cũng như chuyên ngành.\n\nHãy cùng nhau chia sẻ kiến thức và học tập hiệu quả!",
      category: "study",
      authorId: "admin_ins0720",
      author: "Ins0720",
      isAnonymous: false,
      courseTag: "NT106",
      teacherTag: "",
      upvotes: 99,
      createdAt: "2026-08-22T11:27:38.682Z",
      comments: []
    },
    {
      id: "post_intro_teacher",
      title: "👨‍🏫 Góc Thảo Luận & Chia Sẻ Kinh Nghiệm Học Giảng Viên UIT",
      content: "Chuyên mục tổng hợp nhận xét, kinh nghiệm học tập và review khách quan về phong cách giảng dạy của thầy/cô tại UIT.\n\nMọi đánh giá đều dựa trên tinh thần tôn trọng và hỗ trợ sinh viên chọn lớp phù hợp nhất với bản thân!",
      category: "teacher",
      authorId: "admin_ins0720",
      author: "Ins0720",
      isAnonymous: false,
      courseTag: "",
      teacherTag: "Đặng Việt Dũng",
      upvotes: 99,
      createdAt: "2026-08-22T11:27:48.682Z",
      comments: []
    },
    {
      id: "post_intro_team",
      title: "👥 Kênh Tìm Đồng Đội, Lập Team Làm Đồ Án & Nghiên Cứu UIT",
      content: "Bạn đang tìm đồng đội cùng chí hướng để gánh team qua môn, làm đồ án môn học, khóa luận tốt nghiệp hay tham gia các cuộc thi công nghệ (Hackathon, Olympic tin học)?\n\nHãy đăng bài ghi rõ yêu cầu, kỹ năng và mục tiêu để tìm thấy những người bạn đồng hành tuyệt vời nhé!",
      category: "team",
      authorId: "admin_ins0720",
      author: "Ins0720",
      isAnonymous: false,
      courseTag: "IT007",
      teacherTag: "",
      upvotes: 99,
      createdAt: "2026-08-22T11:27:58.682Z",
      comments: []
    },
    {
      id: "post_intro_chat",
      title: "☕ Góc Tâm Sự, Chia Sẻ Cuộc Sống Sinh Viên & Văn Hóa UIT",
      content: "Không gian cởi mở dành cho cộng đồng UITer chia sẻ tâm tư, câu chuyện thường nhật, đời sống KTX / Làng Đại học hay những khoảnh khắc đáng nhớ dưới mái trường CNTT!",
      category: "chat",
      authorId: "admin_ins0720",
      author: "Ins0720",
      isAnonymous: false,
      courseTag: "",
      teacherTag: "",
      upvotes: 99,
      createdAt: "2026-08-22T11:28:08.682Z",
      comments: []
    }
  ];

  let posts = JSON.parse(localStorage.getItem('dkhp_social_posts_cache') || 'null') || DEFAULT_INITIAL_POSTS;
  
  // Friend System State
  let acceptedFriendsList = [];
  let pendingReceivedRequests = [];
  let pendingSentRequests = [];
  let friendsSet = new Set();
  let pendingSentSet = new Set();
  let pendingReceivedSet = new Set();

  let likedPostsSet = new Set(JSON.parse(localStorage.getItem('dkhp_liked_posts') || '[]'));
  let likedCommentsSet = new Set(JSON.parse(localStorage.getItem('dkhp_liked_comments') || '[]'));

  // 4. Time Formatter Helper
  function formatRelativeTime(isoString) {
    if (!isoString) return 'Vừa xong';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHour < 24) return `${diffHour} giờ trước`;
    if (diffDay < 7) return `${diffDay} ngày trước`;
    return new Date(isoString).toLocaleDateString('vi-VN');
  }

  // 5. Category Helpers
  const CATEGORY_MAP = {
    trade: { label: 'Đổi lớp TKB', class: 'cat-trade', icon: 'fa-arrow-right-arrow-left' },
    study: { label: 'Học tập & Tài liệu', class: 'cat-study', icon: 'fa-book-open' },
    teacher: { label: 'Thảo luận Giảng viên', class: 'cat-teacher', icon: 'fa-chalkboard-user' },
    team: { label: 'Tìm nhóm Đồ án', class: 'cat-team', icon: 'fa-users' },
    chat: { label: 'Tâm sự UIT', class: 'cat-chat', icon: 'fa-mug-hot' }
  };

  // 6. Fetch Posts from Backend Database
  async function fetchPostsFromDB(forceRerender = true) {
    try {
      const res = await fetch('/api/posts');
      const data = await res.json();
      if (data && data.success && Array.isArray(data.posts)) {
        posts = data.posts;
        if (forceRerender) renderFeed();
      }
    } catch (e) {
      console.warn('Fetch posts error, fallback to local cache:', e);
      const cached = localStorage.getItem('dkhp_social_posts_cache');
      if (cached) {
        posts = JSON.parse(cached);
        if (forceRerender) renderFeed();
      }
    }
  }

  // 7. Fetch Friends & Pending Requests from Backend Database
  async function fetchFriendsFromDB() {
    try {
      const res = await fetch(`/api/friends?userId=${encodeURIComponent(myUserId)}`);
      const data = await res.json();
      if (data && data.success) {
        acceptedFriendsList = data.accepted || [];
        pendingReceivedRequests = data.pendingReceived || [];
        pendingSentRequests = data.pendingSent || [];

        friendsSet = new Set(acceptedFriendsList.map(f => f.partnerId));
        pendingSentSet = new Set(pendingSentRequests.map(f => f.receiverId));
        pendingReceivedSet = new Set(pendingReceivedRequests.map(f => f.senderId));

        renderFriendsView();
      }
    } catch (e) {
      console.warn('Fetch friends error:', e);
    }
  }

  // 8. Filter and Sort Posts
  function getFilteredPosts() {
    let list = [...posts];

    // Category Filter
    if (currentCategory !== 'all') {
      list = list.filter(p => p.category === currentCategory);
    }

    // Search Query
    if (currentSearch.trim()) {
      const q = currentSearch.trim().toLowerCase();
      list = list.filter(p => 
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.content && p.content.toLowerCase().includes(q)) ||
        (p.courseTag && p.courseTag.toLowerCase().includes(q)) ||
        (p.teacherTag && p.teacherTag.toLowerCase().includes(q)) ||
        (p.author && p.author.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (currentSort === 'latest') {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (currentSort === 'hot') {
      list.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    } else if (currentSort === 'comments') {
      list.sort((a, b) => ((b.comments && b.comments.length) || 0) - ((a.comments && a.comments.length) || 0));
    }

    return list;
  }

  // Helper to determine friendship status button
  function getFriendshipBtnHTML(targetId, targetName, isMyOwn) {
    if (isMyOwn || !targetId || targetId === myUserId || targetName === myUserName) return '';

    if (friendsSet.has(targetId)) {
      return `
        <button type="button" class="feed-comment-action-link" data-action="unfriend" data-user-id="${targetId}" data-user-name="${escapeHtml(targetName)}" title="Đã là bạn bè (Bấm để hủy)">
          <i class="fa-solid fa-user-check" style="color: #10b981;"></i> Bạn bè
        </button>
      `;
    }

    if (pendingReceivedSet.has(targetId)) {
      return `
        <button type="button" class="feed-comment-action-link" data-action="accept-friend-req" data-user-id="${targetId}" data-user-name="${escapeHtml(targetName)}" title="Người này đã gửi lời mời cho bạn">
          <i class="fa-solid fa-user-plus" style="color: #f59e0b;"></i> Chấp nhận kết bạn
        </button>
      `;
    }

    if (pendingSentSet.has(targetId)) {
      return `
        <button type="button" class="feed-comment-action-link" data-action="cancel-friend-req" data-user-id="${targetId}" data-user-name="${escapeHtml(targetName)}" title="Đã gửi lời mời (Bấm để hủy)">
          <i class="fa-solid fa-clock" style="color: #8b5cf6;"></i> Đã gửi lời mời
        </button>
      `;
    }

    return `
      <button type="button" class="feed-comment-action-link" data-action="add-friend" data-user-id="${targetId}" data-user-name="${escapeHtml(targetName)}" title="Gửi lời mời kết bạn">
        <i class="fa-solid fa-user-plus" style="color: #3b82f6;"></i> Kết bạn
      </button>
    `;
  }

  // Render a Single Comment HTML String
  function renderSingleCommentHTML(c, post) {
    const isCommentLiked = likedCommentsSet.has(c.id);
    const isMyComment = (c.authorId && c.authorId === myUserId) || (c.author && c.author === myUserName);

    // Render Nested Replies
    let repliesHTML = '';
    if (c.replies && c.replies.length > 0) {
      const replyItems = c.replies.map(r => {
        const isMyReply = (r.authorId && r.authorId === myUserId) || (r.author && r.author === myUserName);
        return `
          <div class="feed-reply-item" id="reply_${r.id}">
            <div class="feed-comment-header">
              <span class="feed-comment-author ${!isMyReply ? 'user-clickable' : ''}" data-action="${!isMyReply ? 'open-direct-chat' : ''}" data-user-id="${r.authorId || ''}" data-user-name="${escapeHtml(r.author)}">
                ${r.isOP ? `<span class="comment-badge-op">Tác giả (OP)</span>` : `<span class="comment-badge-anon">${escapeHtml(r.author)}</span>`}
              </span>
              <span class="feed-comment-time">${formatRelativeTime(r.createdAt)}</span>
            </div>
            <div class="feed-comment-text">${escapeHtml(r.content)}</div>
            ${!isMyReply ? `
              <div class="feed-comment-actions-bar">
                <button type="button" class="feed-comment-action-link" data-action="open-direct-chat" data-user-id="${r.authorId || ''}" data-user-name="${escapeHtml(r.author)}">
                  <i class="fa-brands fa-facebook-messenger" style="color: #0ea5e9;"></i> Nhắn tin
                </button>
              </div>
            ` : ''}
          </div>
        `;
      }).join('');

      repliesHTML = `
        <div class="feed-replies-container">
          ${replyItems}
        </div>
      `;
    }

    const friendBtn = getFriendshipBtnHTML(c.authorId, c.author, isMyComment);

    return `
      <div class="feed-comment-item" id="comment_${c.id}">
        <div class="feed-comment-header">
          <span class="feed-comment-author ${!isMyComment ? 'user-clickable' : ''}" data-action="${!isMyComment ? 'open-direct-chat' : ''}" data-user-id="${c.authorId || ''}" data-user-name="${escapeHtml(c.author)}">
            ${c.isOP ? `<span class="comment-badge-op">Tác giả (OP)</span>` : `<span class="comment-badge-anon">${escapeHtml(c.author)}</span>`}
          </span>
          <span class="feed-comment-time">${formatRelativeTime(c.createdAt)}</span>
        </div>
        
        <div class="feed-comment-text">${escapeHtml(c.content)}</div>

        <!-- Comment Action Bar -->
        <div class="feed-comment-actions-bar">
          <button type="button" class="feed-comment-action-link ${isCommentLiked ? 'active-like' : ''}" data-action="like-comment" data-comment-id="${c.id}">
            <i class="${isCommentLiked ? 'fa-solid' : 'fa-regular'} fa-thumbs-up"></i> Thích ${c.upvotes ? `(${c.upvotes})` : ''}
          </button>
          •
          <button type="button" class="feed-comment-action-link" data-action="toggle-reply-box" data-post-id="${post.id}" data-comment-id="${c.id}" data-author-name="${escapeHtml(c.author)}">
            <i class="fa-solid fa-reply"></i> Trả lời
          </button>
          ${friendBtn ? `• ${friendBtn}` : ''}
          ${!isMyComment ? `
            •
            <button type="button" class="feed-comment-action-link" data-action="open-direct-chat" data-user-id="${c.authorId || ''}" data-user-name="${escapeHtml(c.author)}">
              <i class="fa-brands fa-facebook-messenger" style="color: #0ea5e9;"></i> Nhắn tin
            </button>
          ` : ''}
        </div>

        <!-- Nested Replies List -->
        ${repliesHTML}

        <!-- Inline Reply Box -->
        <div class="feed-reply-input-box" id="replyBox_${c.id}" style="display: none;">
          <input type="text" placeholder="Trả lời ${escapeHtml(c.author)} (Enter để gửi)..." class="feed-input-reply" data-post-id="${post.id}" data-parent-id="${c.id}">
          <button type="button" class="btn btn-primary btn-sm btn-send-reply" data-post-id="${post.id}" data-parent-id="${c.id}" style="padding: 4px 10px; font-size: 11px;">
            <i class="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>
    `;
  }

  // 9. Render Full Feed (Only on initial load or category/sort/search change)
  function renderFeed() {
    const container = document.getElementById('feedPostsContainer');
    if (!container) return;

    const filtered = getFilteredPosts();
    updateCategoryCounts();

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="feed-post-card" style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
          <i class="fa-solid fa-comments" style="font-size: 36px; opacity: 0.5; margin-bottom: 12px;"></i>
          <h4 style="font-size: 15px; font-weight: 700; color: var(--text-primary);">Chưa có bài viết nào trong mục này</h4>
          <p style="font-size: 12.5px; margin-top: 4px;">Hãy là người đầu tiên đăng bài hỏi han hoặc thảo luận!</p>
          <button type="button" class="btn btn-primary btn-sm" id="btnEmptyCreatePost" style="margin-top: 14px; margin-inline: auto;">
            <i class="fa-solid fa-pen-nib"></i> Đăng bài viết ngay
          </button>
        </div>
      `;
      const btn = document.getElementById('btnEmptyCreatePost');
      if (btn) btn.addEventListener('click', () => openCreatePostModal());
      return;
    }

    container.innerHTML = '';
    const fragment = document.createDocumentFragment();

    filtered.forEach(post => {
      const card = document.createElement('article');
      card.className = 'feed-post-card';
      card.id = `post_card_${post.id}`;

      const catInfo = CATEGORY_MAP[post.category] || { label: 'Thảo luận', class: 'cat-chat', icon: 'fa-comments' };
      const isLiked = likedPostsSet.has(post.id);
      const isMyPost = (post.authorId && post.authorId === myUserId) || (post.author && post.author === myUserName && !post.isAnonymous);

      // Count total comments including nested replies
      let totalCommentsCount = 0;
      if (post.comments) {
        totalCommentsCount = post.comments.reduce((acc, c) => acc + 1 + ((c.replies && c.replies.length) || 0), 0);
      }

      // Author Avatar Gradient
      const avatarLetter = post.isAnonymous ? '🎭' : (post.author ? post.author.charAt(0).toUpperCase() : 'U');
      const avatarBg = post.isAnonymous ? '#6366f1' : (post.author === 'Ins0720' ? '#2563eb' : '#0ea5e9');

      // Subject & Teacher Tag Badges
      let tagsHTML = '';
      if (post.courseTag || post.teacherTag) {
        tagsHTML = `
          <div class="feed-post-tags-row">
            ${post.courseTag ? `
              <a href="index.html?q=${encodeURIComponent(post.courseTag)}" class="feed-subject-tag" title="Bấm để mở xếp Thời Khóa Biểu môn ${escapeHtml(post.courseTag)}">
                <i class="fa-solid fa-calendar-days"></i> #${escapeHtml(post.courseTag)} (Xếp TKB)
              </a>
            ` : ''}
            ${post.teacherTag ? `
              <a href="reviews.html?q=${encodeURIComponent(post.teacherTag)}" class="feed-teacher-tag" title="Bấm để xem Review thầy/cô ${escapeHtml(post.teacherTag)}">
                <i class="fa-solid fa-star"></i> @${escapeHtml(post.teacherTag)} (Review GV)
              </a>
            ` : ''}
          </div>
        `;
      }

      // Threaded Comments & Replies HTML
      let commentsListHTML = '';
      if (post.comments && post.comments.length > 0) {
        commentsListHTML = post.comments.map(c => renderSingleCommentHTML(c, post)).join('');
      }

      card.innerHTML = `
        <div class="feed-post-header">
          <div class="feed-post-author-box">
            <div class="feed-post-avatar" style="background: ${avatarBg};">
              ${avatarLetter}
            </div>
            <div>
              <div class="feed-post-author-name">
                <span class="${!isMyPost ? 'user-clickable' : ''}" data-action="${!isMyPost ? 'open-direct-chat' : ''}" data-user-id="${post.authorId || ''}" data-user-name="${escapeHtml(post.author || 'Sinh viên UIT')}">${escapeHtml(post.author || 'Sinh viên UIT')}</span>
                ${post.author === 'Ins0720' ? '<span style="font-size: 11px; background: #2563eb; color: #fff; padding: 1px 6px; border-radius: 4px; font-weight: 800;">ADMIN</span>' : (post.isAnonymous ? '<span style="font-size: 11px; color: #a855f7; font-weight: 600;">(Ẩn danh)</span>' : '<span style="font-size: 11px; color: var(--primary); font-weight: 700;">✓ UITer</span>')}
              </div>
              <span class="feed-post-time">${formatRelativeTime(post.createdAt)}</span>
            </div>
          </div>

          <span class="feed-category-pill ${catInfo.class}">
            <i class="fa-solid ${catInfo.icon}"></i> ${catInfo.label}
          </span>
        </div>

        <h3 class="feed-post-title">${escapeHtml(post.title)}</h3>
        <div class="feed-post-body">${escapeHtml(post.content)}</div>

        ${post.image ? `
          <div class="feed-post-image-box" style="margin: 12px 0; border-radius: var(--radius-md); overflow: hidden; background: var(--bg-surface-elevated); border: 1px solid var(--border-color); cursor: pointer;" title="Bấm để xem ảnh phóng to" onclick="window.open('${escapeHtml(post.image)}', '_blank')">
            <img src="${escapeHtml(post.image)}" alt="Ảnh đính kèm" style="width: 100%; max-height: 480px; object-fit: cover; display: block;" loading="lazy">
          </div>
        ` : ''}

        ${tagsHTML}

        <div class="feed-post-footer">
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button type="button" class="feed-action-btn ${isLiked ? 'active-like' : ''}" data-action="like" data-post-id="${post.id}" title="Thả tim / Upvote bài viết này">
              <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
              <span class="post-like-count">${post.upvotes || 0}</span>
            </button>
            <button type="button" class="feed-action-btn" data-action="focus-comment-input" data-post-id="${post.id}" title="Bình luận bài viết">
              <i class="fa-regular fa-comment-dots"></i>
              <span class="post-comment-count-badge">${totalCommentsCount} Bình luận</span>
            </button>
            ${!isMyPost ? `
              <button type="button" class="feed-action-btn" data-action="open-direct-chat" data-user-id="${post.authorId || ''}" data-user-name="${escapeHtml(post.author || 'Sinh viên UIT')}" title="Nhắn tin riêng phong cách Messenger">
                <i class="fa-brands fa-facebook-messenger" style="color: #0ea5e9;"></i>
                <span>Nhắn tin</span>
              </button>
            ` : ''}
          </div>

          <button type="button" class="feed-action-btn" data-action="share" data-post-id="${post.id}" title="Sao chép link bài viết">
            <i class="fa-solid fa-share-nodes"></i> Chia sẻ
          </button>
        </div>

        <div class="feed-comment-input-row" style="margin-top: 10px;">
          <input type="text" placeholder="Viết bình luận công khai (Enter để gửi)..." class="feed-input-comment" data-post-id="${post.id}">
          <button type="button" class="btn btn-primary btn-sm btn-send-comment" data-post-id="${post.id}" style="padding: 6px 12px;">
            <i class="fa-solid fa-paper-plane"></i>
          </button>
        </div>

        <div class="feed-comments-box" id="comments_box_${post.id}">
          ${commentsListHTML}
        </div>
      `;

      fragment.appendChild(card);
    });

    container.appendChild(fragment);
  }

  // 10. Update Sidebar Category Counts
  function updateCategoryCounts() {
    const total = posts.length;
    const catCounts = { trade: 0, study: 0, teacher: 0, team: 0, chat: 0 };
    posts.forEach(p => {
      if (catCounts[p.category] !== undefined) catCounts[p.category]++;
    });

    const setBadge = (id, count) => {
      const el = document.getElementById(id);
      if (el) el.textContent = count;
    };

    setBadge('countCatAll', total);
    setBadge('countCatTrade', catCounts.trade);
    setBadge('countCatStudy', catCounts.study);
    setBadge('countCatTeacher', catCounts.teacher);
    setBadge('countCatTeam', catCounts.team);
    setBadge('countCatChat', catCounts.chat);
  }

  // 11. Render Top Tier S Teachers Widget in Right Sidebar
  function renderTopTeachersWidget() {
    const widgetBox = document.getElementById('feedTopTeachersWidget');
    if (!widgetBox) return;

    const realDB = window.EVERYTIME_REAL_DATABASE || {};
    const tierSTeachers = Object.values(realDB)
      .filter(t => t.tier === 'S' || (t.rating && t.rating >= 4.8))
      .slice(0, 4);

    if (tierSTeachers.length === 0) return;

    widgetBox.innerHTML = tierSTeachers.map(t => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; border-radius: var(--radius-md); background: var(--bg-surface-elevated); border: 1px solid var(--border-color);">
        <div style="display: flex; align-items: center; gap: 6px; overflow: hidden;">
          <span style="font-size: 14px;">🏆</span>
          <strong style="font-size: 12px; color: var(--text-primary); text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${escapeHtml(t.name)}</strong>
        </div>
        <a href="reviews.html?q=${encodeURIComponent(t.name)}" class="btn btn-secondary btn-sm" style="font-size: 10.5px; padding: 2px 7px; color: #f59e0b; flex-shrink: 0;">
          ⭐ ${t.rating || '5.0'}
        </a>
      </div>
    `).join('');
  }

  // ==============================================================================
  // 12. AUTO-SUGGESTIONS FOR COURSE CODES & TEACHER NAMES
  // ==============================================================================
  const inputCourseTag = document.getElementById('submitPostCourseTag');
  const listCourseSuggestions = document.getElementById('courseTagSuggestions');
  const inputTeacherTag = document.getElementById('submitPostTeacherTag');
  const listTeacherSuggestions = document.getElementById('teacherTagSuggestions');

  function getCourseSuggestionsList() {
    const map = new Map();
    if (typeof DEFAULT_TIMETABLE_DATA !== 'undefined' && Array.isArray(DEFAULT_TIMETABLE_DATA)) {
      DEFAULT_TIMETABLE_DATA.forEach(c => {
        if (c.maMH && !map.has(c.maMH)) {
          map.set(c.maMH, { code: c.maMH, name: c.tenMH || c.maMH });
        }
      });
    }
    if (map.size === 0) {
      const popular = [
        { code: 'IT004', name: 'Cơ sở dữ liệu' },
        { code: 'NT106', name: 'Lập trình mạng' },
        { code: 'IT007', name: 'Hệ điều hành' },
        { code: 'IE103', name: 'Quản trị cơ sở dữ liệu' },
        { code: 'MA005', name: 'Xác suất thống kê' },
        { code: 'SS007', name: 'Triết học Mác - Lênin' },
        { code: 'IT001', name: 'Nhập môn lập trình' },
        { code: 'IT002', name: 'Lập trình hướng đối tượng' },
        { code: 'IT003', name: 'Cấu trúc dữ liệu và giải thuật' },
        { code: 'IT005', name: 'Nhập môn mạng máy tính' }
      ];
      popular.forEach(p => map.set(p.code, p));
    }
    return Array.from(map.values());
  }

  function getTeacherSuggestionsList() {
    const list = [];
    if (typeof EVERYTIME_REAL_DATABASE !== 'undefined' && EVERYTIME_REAL_DATABASE) {
      Object.values(EVERYTIME_REAL_DATABASE).forEach(t => {
        if (t.name) {
          list.push({
            name: t.name,
            rating: t.rating ? t.rating.toFixed(1) : '5.0',
            tier: t.tier || 'S',
            subject: t.subject || ''
          });
        }
      });
    }
    if (list.length === 0) {
      const fallback = [
        { name: 'Đặng Việt Dũng', rating: '5.0', tier: 'S' },
        { name: 'Lê Sĩ Đồng', rating: '4.9', tier: 'S' },
        { name: 'Nguyễn Hữu Lượng', rating: '5.0', tier: 'S' },
        { name: 'Lê Võ Đình Kha', rating: '5.0', tier: 'S' },
        { name: 'Nguyễn Gia Tuấn Anh', rating: '5.0', tier: 'S' },
        { name: 'Phan Đình Duy', rating: '5.0', tier: 'S' },
        { name: 'Trần Văn Như Ý', rating: '5.0', tier: 'S' },
        { name: 'Đỗ Thị Hương Lan', rating: '4.3', tier: 'A' },
        { name: 'Vũ Minh Sang', rating: '5.0', tier: 'S' }
      ];
      list.push(...fallback);
    }
    return list;
  }

  function normalizeStr(str) {
    return (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd');
  }

  function handleCourseTagInput() {
    if (!inputCourseTag || !listCourseSuggestions) return;
    const query = inputCourseTag.value.trim().replace(/^#/, '');
    const normQ = normalizeStr(query);

    const allCourses = getCourseSuggestionsList();
    const matched = query.length === 0
      ? allCourses.slice(0, 8)
      : allCourses.filter(c => 
          normalizeStr(c.code).includes(normQ) || 
          normalizeStr(c.name).includes(normQ)
        ).slice(0, 8);

    if (matched.length === 0) {
      listCourseSuggestions.style.display = 'none';
      return;
    }

    listCourseSuggestions.innerHTML = matched.map(c => `
      <div class="tag-suggestion-item" data-code="${escapeHtml(c.code)}">
        <span class="tag-suggestion-code">#${escapeHtml(c.code)}</span>
        <span class="tag-suggestion-name">${escapeHtml(c.name)}</span>
      </div>
    `).join('');

    listCourseSuggestions.style.display = 'flex';
  }

  function handleTeacherTagInput() {
    if (!inputTeacherTag || !listTeacherSuggestions) return;
    const query = inputTeacherTag.value.trim().replace(/^@/, '');
    const normQ = normalizeStr(query);

    const allTeachers = getTeacherSuggestionsList();
    const matched = query.length === 0
      ? allTeachers.slice(0, 8)
      : allTeachers.filter(t => 
          normalizeStr(t.name).includes(normQ) ||
          normalizeStr(t.subject).includes(normQ)
        ).slice(0, 8);

    if (matched.length === 0) {
      listTeacherSuggestions.style.display = 'none';
      return;
    }

    listTeacherSuggestions.innerHTML = matched.map(t => `
      <div class="tag-suggestion-item" data-teacher="${escapeHtml(t.name)}">
        <span style="font-size: 14px;">👨‍🏫</span>
        <span class="tag-suggestion-name">${escapeHtml(t.name)}</span>
        <span class="tag-suggestion-rating">⭐ ${t.rating} (${t.tier})</span>
      </div>
    `).join('');

    listTeacherSuggestions.style.display = 'flex';
  }

  if (inputCourseTag) {
    inputCourseTag.addEventListener('input', handleCourseTagInput);
    inputCourseTag.addEventListener('focus', handleCourseTagInput);
  }

  if (inputTeacherTag) {
    inputTeacherTag.addEventListener('input', handleTeacherTagInput);
    inputTeacherTag.addEventListener('focus', handleTeacherTagInput);
  }

  // 13. Facebook-Style Modal: Create New Post with Editable Author Name
  const modalCreatePost = document.getElementById('modalCreatePost');
  const formCreatePost = document.getElementById('formCreatePost');
  const authorNameInput = document.getElementById('fbModalAuthorNameInput');
  let isAnonymousPost = true;

  if (authorNameInput) {
    authorNameInput.value = myUserName;
    authorNameInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val) {
        myUserName = val;
        localStorage.setItem('dkhp_chat_uname', myUserName);
        if (sidebarName) sidebarName.textContent = myUserName;
      }
    });
  }

  function openCreatePostModal(preselectedCat = null) {
    if (modalCreatePost) modalCreatePost.style.display = 'flex';
    
    if (authorNameInput) {
      authorNameInput.value = isAnonymousPost ? 'Sinh viên UIT' : myUserName;
      authorNameInput.disabled = isAnonymousPost;
      authorNameInput.style.opacity = isAnonymousPost ? '0.7' : '1';
    }

    if (preselectedCat) {
      document.querySelectorAll('#modalCategoryPicker .fb-cat-chip').forEach(b => {
        b.classList.toggle('active', b.dataset.postCat === preselectedCat);
      });
      const catInput = document.getElementById('submitPostCategory');
      if (catInput) catInput.value = preselectedCat;
    }

    document.getElementById('submitPostTitle')?.focus();
  }

  function closeCreatePostModal() {
    if (modalCreatePost) modalCreatePost.style.display = 'none';
  }

  // Privacy Pill Toggle (Anonymous vs Public)
  const btnTogglePrivacy = document.getElementById('btnTogglePrivacy');
  const btnQuickToggleAnon = document.getElementById('btnQuickToggleAnon');
  const txtPrivacyLabel = document.getElementById('txtPrivacyLabel');
  const iconPrivacyPill = document.getElementById('iconPrivacyPill');
  const chkPostAnonymous = document.getElementById('chkPostAnonymous');

  function togglePrivacyMode() {
    isAnonymousPost = !isAnonymousPost;
    if (chkPostAnonymous) chkPostAnonymous.value = isAnonymousPost ? 'true' : 'false';

    if (isAnonymousPost) {
      if (txtPrivacyLabel) txtPrivacyLabel.textContent = 'Đăng Ẩn danh';
      if (iconPrivacyPill) {
        iconPrivacyPill.className = 'fa-solid fa-mask';
        iconPrivacyPill.style.color = '#a855f7';
      }
      if (authorNameInput) {
        authorNameInput.value = 'Sinh viên UIT';
        authorNameInput.disabled = true;
        authorNameInput.style.opacity = '0.7';
      }
    } else {
      if (txtPrivacyLabel) txtPrivacyLabel.textContent = 'Công khai (UITer)';
      if (iconPrivacyPill) {
        iconPrivacyPill.className = 'fa-solid fa-globe';
        iconPrivacyPill.style.color = '#3b82f6';
      }
      if (authorNameInput) {
        authorNameInput.value = myUserName;
        authorNameInput.disabled = false;
        authorNameInput.style.opacity = '1';
        authorNameInput.focus();
      }
    }
  }

  if (btnTogglePrivacy) btnTogglePrivacy.addEventListener('click', togglePrivacyMode);
  if (btnQuickToggleAnon) btnQuickToggleAnon.addEventListener('click', togglePrivacyMode);

  // ==============================================================================
  // 13. POST ATTACHED IMAGE HANDLER
  // ==============================================================================
  let attachedPostImage = '';
  const btnTriggerImage = document.getElementById('btnTriggerPostImageUpload');
  const inputImageFile = document.getElementById('inputPostImageFile');
  const previewImageBox = document.getElementById('postAttachedImagePreviewContainer');
  const previewImageEl = document.getElementById('postAttachedImagePreview');
  const btnRemoveImage = document.getElementById('btnRemoveAttachedImage');

  if (btnTriggerImage && inputImageFile) {
    btnTriggerImage.addEventListener('click', () => inputImageFile.click());
    inputImageFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 8 * 1024 * 1024) {
        showFeedToast('⚠️ Dung lượng ảnh tối đa là 8MB!');
        return;
      }

      const reader = new FileReader();
      reader.onload = (re) => {
        attachedPostImage = re.target.result;
        if (previewImageEl && previewImageBox) {
          previewImageEl.src = attachedPostImage;
          previewImageBox.style.display = 'block';
        }
      };
      reader.readAsDataURL(file);
    });
  }

  if (btnRemoveImage) {
    btnRemoveImage.addEventListener('click', () => {
      attachedPostImage = '';
      if (previewImageEl) previewImageEl.src = '';
      if (previewImageBox) previewImageBox.style.display = 'none';
      if (inputImageFile) inputImageFile.value = '';
    });
  }

  // Focus Tag Helpers
  document.getElementById('btnFocusCourseTag')?.addEventListener('click', () => {
    inputCourseTag?.focus();
    handleCourseTagInput();
  });
  document.getElementById('btnFocusTeacherTag')?.addEventListener('click', () => {
    inputTeacherTag?.focus();
    handleTeacherTagInput();
  });

  // Modal Category Picker Buttons
  document.querySelectorAll('#modalCategoryPicker .fb-cat-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#modalCategoryPicker .fb-cat-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const catInput = document.getElementById('submitPostCategory');
      if (catInput) catInput.value = btn.dataset.postCat || 'trade';
    });
  });

  // Quick Action Buttons on Facebook-Style Post Card
  document.querySelectorAll('.fb-action-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const cat = pill.dataset.quickCat;
      openCreatePostModal(cat);
    });
  });

  // Handle Form Submit to Database
  if (formCreatePost) {
    formCreatePost.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Bot Honeypot Check
      const honeypot = document.getElementById('postHoneypotField')?.value;
      if (honeypot) {
        closeCreatePostModal();
        return;
      }

      const category = document.getElementById('submitPostCategory')?.value || 'trade';
      const title = (document.getElementById('submitPostTitle')?.value || '').trim();
      const courseTag = (document.getElementById('submitPostCourseTag')?.value || '').trim().replace(/^#/, '');
      const teacherTag = (document.getElementById('submitPostTeacherTag')?.value || '').trim().replace(/^@/, '');
      const content = (document.getElementById('submitPostContent')?.value || '').trim();

      if (!title || !content) {
        showFeedToast('⚠️ Vui lòng điền đầy đủ Tiêu đề và Nội dung bài viết!');
        return;
      }

      const chosenName = authorNameInput ? authorNameInput.value.trim() : myUserName;
      if (!isAnonymousPost && chosenName) {
        myUserName = chosenName;
        localStorage.setItem('dkhp_chat_uname', myUserName);
        if (sidebarName) sidebarName.textContent = myUserName;
      }

      const payload = {
        title: title.slice(0, 150),
        content: content.slice(0, 3000),
        category: category,
        authorId: myUserId,
        author: isAnonymousPost ? 'Sinh viên UIT' : myUserName,
        isAnonymous: isAnonymousPost,
        courseTag: courseTag.toUpperCase(),
        teacherTag: teacherTag,
        image: attachedPostImage
      };

      try {
        const res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await res.json();

        if (result.success) {
          formCreatePost.reset();
          attachedPostImage = '';
          if (previewImageEl) previewImageEl.src = '';
          if (previewImageBox) previewImageBox.style.display = 'none';
          if (inputImageFile) inputImageFile.value = '';

          closeCreatePostModal();
          showFeedToast('🎉 Đăng bài viết kèm ảnh lên Diễn đàn thành công!');
          fetchPostsFromDB(true);
        }
      } catch (err) {
        console.error('Error creating post:', err);
      }
    });
  }

  // ==============================================================================
  // 14. ZERO-FLICKER IN-PLACE COMMENT & REPLY INSERTION
  // ==============================================================================
  function appendCommentToDOM(postId, commentObj, parentId = null) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (!post.comments) post.comments = [];

    if (parentId) {
      // It's a reply to parent comment
      const parentComment = post.comments.find(c => c.id === parentId);
      if (parentComment) {
        if (!parentComment.replies) parentComment.replies = [];
        if (!parentComment.replies.some(r => r.id === commentObj.id)) {
          parentComment.replies.push(commentObj);
        }

        const commentEl = document.getElementById(`comment_${parentId}`);
        if (commentEl) {
          let repliesContainer = commentEl.querySelector('.feed-replies-container');
          if (!repliesContainer) {
            repliesContainer = document.createElement('div');
            repliesContainer.className = 'feed-replies-container';
            const actionsBar = commentEl.querySelector('.feed-comment-actions-bar');
            if (actionsBar) actionsBar.after(repliesContainer);
            else commentEl.appendChild(repliesContainer);
          }

          if (!document.getElementById(`reply_${commentObj.id}`)) {
            const isMyReply = (commentObj.authorId && commentObj.authorId === myUserId) || (commentObj.author && commentObj.author === myUserName);
            const replyDiv = document.createElement('div');
            replyDiv.className = 'feed-reply-item';
            replyDiv.id = `reply_${commentObj.id}`;
            replyDiv.innerHTML = `
              <div class="feed-comment-header">
                <span class="feed-comment-author ${!isMyReply ? 'user-clickable' : ''}" data-action="${!isMyReply ? 'open-direct-chat' : ''}" data-user-id="${commentObj.authorId || ''}" data-user-name="${escapeHtml(commentObj.author)}">
                  ${commentObj.isOP ? `<span class="comment-badge-op">Tác giả (OP)</span>` : `<span class="comment-badge-anon">${escapeHtml(commentObj.author)}</span>`}
                </span>
                <span class="feed-comment-time">${formatRelativeTime(commentObj.createdAt)}</span>
              </div>
              <div class="feed-comment-text">${escapeHtml(commentObj.content)}</div>
              ${!isMyReply ? `
                <div class="feed-comment-actions-bar">
                  <button type="button" class="feed-comment-action-link" data-action="open-direct-chat" data-user-id="${commentObj.authorId || ''}" data-user-name="${escapeHtml(commentObj.author)}">
                    <i class="fa-brands fa-facebook-messenger" style="color: #0ea5e9;"></i> Nhắn tin
                  </button>
                </div>
              ` : ''}
            `;
            repliesContainer.appendChild(replyDiv);
          }
        }
      }
    } else {
      // Top-level comment
      if (!post.comments.some(c => c.id === commentObj.id)) {
        post.comments.push(commentObj);
      }

      const commentsBox = document.getElementById(`comments_box_${postId}`);
      if (commentsBox && !document.getElementById(`comment_${commentObj.id}`)) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = renderSingleCommentHTML(commentObj, post);
        const newEl = tempDiv.firstElementChild;
        commentsBox.appendChild(newEl);
      }
    }

    // Update total comment count text in footer
    const totalCommentsCount = post.comments.reduce((acc, c) => acc + 1 + ((c.replies && c.replies.length) || 0), 0);
    const badge = document.querySelector(`#post_card_${postId} .post-comment-count-badge`);
    if (badge) badge.textContent = `${totalCommentsCount} Bình luận`;
  }

  // Submit Comment / Reply Handler
  async function handleSendComment(postId, inputEl, parentId = null) {
    if (!inputEl) return;
    const text = (inputEl.value || '').trim();
    if (!text) return;

    inputEl.value = '';

    const payload = {
      postId: postId,
      parentId: parentId,
      authorId: myUserId,
      author: myUserName,
      content: text.slice(0, 1000)
    };

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        const commentOrReply = data.reply || data.comment;
        appendCommentToDOM(postId, commentOrReply, parentId);

        // Hide inline reply box if open
        if (parentId) {
          const rBox = document.getElementById(`replyBox_${parentId}`);
          if (rBox) rBox.style.display = 'none';
        }
        showFeedToast(parentId ? '💬 Đã gửi câu trả lời!' : '💬 Đã gửi bình luận!');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  }

  // 15. Send or Update Friend Request (2-Way)
  async function handleFriendAction(targetUserId, targetUserName, action = 'request') {
    if (!targetUserId || targetUserId === myUserId || targetUserName === myUserName) {
      showFeedToast('ℹ️ Bạn không thể gửi yêu cầu cho chính mình!');
      return;
    }

    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: myUserId,
          senderName: myUserName,
          receiverId: targetUserId,
          receiverName: targetUserName,
          action: action
        })
      });
      const data = await res.json();
      if (data.success) {
        if (action === 'request') {
          showFeedToast(`🎉 Đã gửi lời mời kết bạn tới ${targetUserName}!`);
        } else if (action === 'accept') {
          showFeedToast(`🤝 Bạn và ${targetUserName} đã trở thành bạn bè!`);
        } else if (action === 'cancel') {
          showFeedToast(`⏳ Đã hủy lời mời kết bạn tới ${targetUserName}`);
        } else if (action === 'decline') {
          showFeedToast(`❌ Đã từ chối lời mời từ ${targetUserName}`);
        } else if (action === 'unfriend') {
          showFeedToast(`Đã hủy kết bạn với ${targetUserName}`);
        }
        fetchFriendsFromDB();
      }
    } catch (err) {
      console.error('Friend action error:', err);
    }
  }

  // 16. Event Delegation for Feed & Modal Interactions
  document.addEventListener('click', async (e) => {
    // Like Post (Zero flicker!)
    const likeBtn = e.target.closest('[data-action="like"]');
    if (likeBtn) {
      const postId = likeBtn.dataset.postId;
      const isCurrentlyLiked = likedPostsSet.has(postId);
      const post = posts.find(p => p.id === postId);

      if (isCurrentlyLiked) {
        likedPostsSet.delete(postId);
        likeBtn.classList.remove('active-like');
        const icon = likeBtn.querySelector('i');
        if (icon) icon.className = 'fa-regular fa-heart';
        if (post) post.upvotes = Math.max(0, (post.upvotes || 1) - 1);
      } else {
        likedPostsSet.add(postId);
        likeBtn.classList.add('active-like');
        const icon = likeBtn.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-heart';
        if (post) post.upvotes = (post.upvotes || 0) + 1;
      }
      localStorage.setItem('dkhp_liked_posts', JSON.stringify(Array.from(likedPostsSet)));

      const countEl = likeBtn.querySelector('.post-like-count');
      if (countEl && post) countEl.textContent = post.upvotes;

      try {
        fetch('/api/posts/like', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: postId, action: isCurrentlyLiked ? 'unlike' : 'like' })
        });
      } catch (err) {}
      return;
    }

    // Like Comment (Zero flicker!)
    const likeCommentBtn = e.target.closest('[data-action="like-comment"]');
    if (likeCommentBtn) {
      const commentId = likeCommentBtn.dataset.commentId;
      const isCurrentlyLiked = likedCommentsSet.has(commentId);
      if (isCurrentlyLiked) {
        likedCommentsSet.delete(commentId);
        likeCommentBtn.classList.remove('active-like');
        const icon = likeCommentBtn.querySelector('i');
        if (icon) icon.className = 'fa-regular fa-thumbs-up';
      } else {
        likedCommentsSet.add(commentId);
        likeCommentBtn.classList.add('active-like');
        const icon = likeCommentBtn.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-thumbs-up';
      }
      localStorage.setItem('dkhp_liked_comments', JSON.stringify(Array.from(likedCommentsSet)));
      return;
    }

    // Toggle Reply Box
    const replyBtn = e.target.closest('[data-action="toggle-reply-box"]');
    if (replyBtn) {
      const commentId = replyBtn.dataset.commentId;
      const box = document.getElementById(`replyBox_${commentId}`);
      if (box) {
        const isHidden = box.style.display === 'none';
        box.style.display = isHidden ? 'flex' : 'none';
        if (isHidden) box.querySelector('input')?.focus();
      }
      return;
    }

    // Focus comment
    const focusCommentBtn = e.target.closest('[data-action="focus-comment-input"]');
    if (focusCommentBtn) {
      const postId = focusCommentBtn.dataset.postId;
      const input = document.querySelector(`.feed-input-comment[data-post-id="${postId}"]`);
      if (input) input.focus();
      return;
    }

    // Friend Actions
    const addFriendBtn = e.target.closest('[data-action="add-friend"]');
    if (addFriendBtn) {
      handleFriendAction(addFriendBtn.dataset.userId, addFriendBtn.dataset.userName, 'request');
      return;
    }

    const cancelFriendBtn = e.target.closest('[data-action="cancel-friend-req"]');
    if (cancelFriendBtn) {
      handleFriendAction(cancelFriendBtn.dataset.userId, cancelFriendBtn.dataset.userName, 'cancel');
      return;
    }

    const acceptFriendBtn = e.target.closest('[data-action="accept-friend-req"]');
    if (acceptFriendBtn) {
      handleFriendAction(acceptFriendBtn.dataset.userId, acceptFriendBtn.dataset.userName, 'accept');
      return;
    }

    const declineFriendBtn = e.target.closest('[data-action="decline-friend-req"]');
    if (declineFriendBtn) {
      handleFriendAction(declineFriendBtn.dataset.userId, declineFriendBtn.dataset.userName, 'decline');
      return;
    }

    const unfriendBtn = e.target.closest('[data-action="unfriend"]');
    if (unfriendBtn) {
      if (confirm(`Bạn có chắc chắn muốn hủy kết bạn với ${unfriendBtn.dataset.userName}?`)) {
        handleFriendAction(unfriendBtn.dataset.userId, unfriendBtn.dataset.userName, 'unfriend');
      }
      return;
    }

    // Open Direct Chat
    const openDirectChatBtn = e.target.closest('[data-action="open-direct-chat"]');
    if (openDirectChatBtn) {
      const targetUserId = openDirectChatBtn.dataset.userId;
      const targetUserName = openDirectChatBtn.dataset.userName || 'Sinh viên UIT';
      
      if (targetUserId === myUserId || targetUserName === myUserName) {
        showFeedToast('ℹ️ Bạn không thể nhắn tin với chính mình!');
        return;
      }

      openDirectMessengerWindow(targetUserId, targetUserName);
      return;
    }

    // Course suggestion item click
    const courseItem = e.target.closest('#courseTagSuggestions .tag-suggestion-item');
    if (courseItem) {
      if (inputCourseTag) inputCourseTag.value = courseItem.dataset.code;
      if (listCourseSuggestions) listCourseSuggestions.style.display = 'none';
      return;
    }

    // Teacher suggestion item click
    const teacherItem = e.target.closest('#teacherTagSuggestions .tag-suggestion-item');
    if (teacherItem) {
      if (inputTeacherTag) inputTeacherTag.value = teacherItem.dataset.teacher;
      if (listTeacherSuggestions) listTeacherSuggestions.style.display = 'none';
      return;
    }

    // Hide dropdowns when clicked outside
    if (!e.target.closest('.fb-tag-input-group')) {
      if (listCourseSuggestions) listCourseSuggestions.style.display = 'none';
      if (listTeacherSuggestions) listTeacherSuggestions.style.display = 'none';
    }

    // Share button
    const shareBtn = e.target.closest('[data-action="share"]');
    if (shareBtn) {
      const postId = shareBtn.dataset.postId;
      const url = `${window.location.origin}${window.location.pathname}#${postId}`;
      navigator.clipboard.writeText(url).then(() => {
        showFeedToast('📋 Đã sao chép liên kết bài viết vào Clipboard!');
      });
      return;
    }

    // Send comment button
    const sendCommentBtn = e.target.closest('.btn-send-comment');
    if (sendCommentBtn) {
      const postId = sendCommentBtn.dataset.postId;
      const input = document.querySelector(`.feed-input-comment[data-post-id="${postId}"]`);
      handleSendComment(postId, input, null);
      return;
    }

    // Send reply button
    const sendReplyBtn = e.target.closest('.btn-send-reply');
    if (sendReplyBtn) {
      const postId = sendReplyBtn.dataset.postId;
      const parentId = sendReplyBtn.dataset.parentId;
      const input = document.querySelector(`.feed-input-reply[data-parent-id="${parentId}"]`);
      handleSendComment(postId, input, parentId);
      return;
    }

    // Close modal triggers
    if (e.target.matches('[data-close-modal="modalCreatePost"]') || e.target.closest('[data-close-modal="modalCreatePost"]')) {
      closeCreatePostModal();
    }
  });

  // Enter key in comment / reply inputs
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (e.target.classList.contains('feed-input-comment')) {
        e.preventDefault();
        const postId = e.target.dataset.postId;
        handleSendComment(postId, e.target, null);
      } else if (e.target.classList.contains('feed-input-reply')) {
        e.preventDefault();
        const postId = e.target.dataset.postId;
        const parentId = e.target.dataset.parentId;
        handleSendComment(postId, e.target, parentId);
      }
    }
  });

  // Category Buttons in Sidebar
  document.querySelectorAll('#feedCategoryList .feed-category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#feedCategoryList .feed-category-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.feedCat || 'all';
      renderFeed();
    });
  });

  // Sort Segmented Control
  document.querySelectorAll('#feedSortControl .seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#feedSortControl .seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSort = btn.dataset.feedSort || 'latest';
      renderFeed();
    });
  });

  // Search Input
  const searchInput = document.getElementById('feedSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value;
      renderFeed();
    });
  }

  // Quick Post Trigger Card
  const quickTrigger = document.getElementById('quickPostTrigger');
  if (quickTrigger) quickTrigger.addEventListener('click', () => openCreatePostModal());

  const btnOpenCreate = document.getElementById('btnOpenCreatePostModal');
  if (btnOpenCreate) btnOpenCreate.addEventListener('click', () => openCreatePostModal());

  // ==============================================================================
  // 17. FACEBOOK-STYLE MESSENGER CONTROLLER (INBOX • FRIENDS • ROOMS • CHAT)
  // ==============================================================================
  let socket = null;
  let currentChatRoom = 'general';
  let currentMessengerView = 'inbox'; // 'inbox' | 'friends' | 'rooms' | 'chat'
  let unreadCount = 0;
  let isChatOpen = false;

  let activeDirectChat = null; // { recipientId, recipientName }
  const directMessagesMap = new Map(); // recipientId => [messages]
  let cachedConversations = [];

  const btnOpenMessenger = document.getElementById('btnOpenMessenger');
  const btnSidebarOpenMessenger = document.getElementById('btnSidebarOpenMessenger');
  const messengerChatWindow = document.getElementById('messengerChatWindow');
  const btnMinimizeChat = document.getElementById('btnMinimizeChat');
  const btnCloseChat = document.getElementById('btnCloseChat');
  const btnBackToInbox = document.getElementById('btnBackToInbox');

  const messengerNavBar = document.getElementById('messengerNavBar');
  const viewMessengerInbox = document.getElementById('viewMessengerInbox');
  const viewMessengerFriends = document.getElementById('viewMessengerFriends');
  const viewMessengerRooms = document.getElementById('viewMessengerRooms');
  const viewMessengerChat = document.getElementById('viewMessengerChat');

  const inboxConversationsList = document.getElementById('inboxConversationsList');
  const inputSearchConversations = document.getElementById('inputSearchConversations');
  const friendRequestsContainer = document.getElementById('friendRequestsContainer');
  const acceptedFriendsContainer = document.getElementById('acceptedFriendsContainer');
  const badgeFriendRequests = document.getElementById('badgeFriendRequests');
  const countPendingRequests = document.getElementById('countPendingRequests');
  const countAcceptedFriends = document.getElementById('countAcceptedFriends');

  const chatMessagesContainer = document.getElementById('chatMessagesContainer');
  const formSendChatMessage = document.getElementById('formSendChatMessage');
  const inputChatMessage = document.getElementById('inputChatMessage');
  const chatUnreadBadge = document.getElementById('chatUnreadBadge');
  const chatSocketStatusDot = document.getElementById('chatSocketStatusDot');
  const chatSocketStatusText = document.getElementById('chatSocketStatusText');
  const chatOnlineCountText = document.getElementById('chatOnlineCountText');
  const chatHeaderTitle = document.getElementById('chatHeaderTitle');
  const chatTypingIndicator = document.getElementById('chatTypingIndicator');
  const chatTypingUserText = document.getElementById('chatTypingUserText');

  const ROOM_TITLES = {
    general: 'Sảnh Chung UIT',
    trade: 'Chợ Đổi Lớp TKB',
    study: 'Góc Học Tập & Đồ Án'
  };

  // Switch between Messenger Tabs & Chat view
  function switchMessengerView(viewName) {
    currentMessengerView = viewName;

    viewMessengerInbox.style.display = viewName === 'inbox' ? 'flex' : 'none';
    viewMessengerFriends.style.display = viewName === 'friends' ? 'flex' : 'none';
    viewMessengerRooms.style.display = viewName === 'rooms' ? 'flex' : 'none';
    viewMessengerChat.style.display = viewName === 'chat' ? 'flex' : 'none';

    if (viewName === 'chat') {
      messengerNavBar.style.display = 'none';
      btnBackToInbox.style.display = 'flex';
    } else {
      messengerNavBar.style.display = 'flex';
      btnBackToInbox.style.display = 'none';
      chatHeaderTitle.textContent = 'Messenger UIT';
      chatSocketStatusText.textContent = '🟢 Trực tuyến';

      document.querySelectorAll('.messenger-nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.msgTab === viewName);
      });

      if (viewName === 'inbox') fetchConversationsFromDB();
      if (viewName === 'friends') renderFriendsView();
    }
  }

  // 1. Fetch Conversations Inbox from DB
  async function fetchConversationsFromDB() {
    try {
      const res = await fetch(`/api/conversations?userId=${encodeURIComponent(myUserId)}`);
      const data = await res.json();
      if (data && data.success) {
        cachedConversations = data.conversations || [];
        renderConversationsList();
      }
    } catch (e) {
      console.warn('Fetch conversations error:', e);
    }
  }

  function renderConversationsList() {
    if (!inboxConversationsList) return;
    const query = (inputSearchConversations?.value || '').trim().toLowerCase();

    let list = [...cachedConversations];
    if (query) {
      list = list.filter(c => c.partnerName.toLowerCase().includes(query) || c.lastMessage.toLowerCase().includes(query));
    }

    if (list.length === 0) {
      inboxConversationsList.innerHTML = `
        <div style="text-align: center; padding: 30px 14px; color: var(--text-muted);">
          <i class="fa-regular fa-comment-dots" style="font-size: 32px; opacity: 0.5; margin-bottom: 8px;"></i>
          <p style="font-size: 12px; margin: 0;">Chưa có đoạn chat nào.</p>
          <p style="font-size: 11px; margin-top: 4px; color: var(--primary);">Hãy bấm Nhắn tin trên bài viết hoặc danh sách bạn bè!</p>
        </div>
      `;
      return;
    }

    inboxConversationsList.innerHTML = list.map(c => {
      const timeStr = formatRelativeTime(c.lastTimestamp);
      const isMine = c.lastSenderId === myUserId;
      const previewText = (isMine ? 'Bạn: ' : '') + escapeHtml(c.lastMessage);
      const letter = c.partnerName.charAt(0).toUpperCase();

      return `
        <div class="conversation-item" data-action="open-direct-chat" data-user-id="${c.partnerId}" data-user-name="${escapeHtml(c.partnerName)}">
          <div class="conversation-avatar">
            ${letter}
            <span class="online-indicator"></span>
          </div>
          <div class="conversation-info">
            <div class="conversation-name">${escapeHtml(c.partnerName)}</div>
            <div class="conversation-preview">${previewText}</div>
          </div>
          <div class="conversation-meta">
            <span class="conversation-time">${timeStr}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  if (inputSearchConversations) {
    inputSearchConversations.addEventListener('input', renderConversationsList);
  }

  // 2. Render Friends & Pending Requests Tab
  function renderFriendsView() {
    // Update Badge Counters
    const pendingCount = pendingReceivedRequests.length;
    if (badgeFriendRequests) {
      badgeFriendRequests.textContent = pendingCount;
      badgeFriendRequests.style.display = pendingCount > 0 ? 'inline-block' : 'none';
    }
    if (countPendingRequests) countPendingRequests.textContent = pendingCount;
    if (countAcceptedFriends) countAcceptedFriends.textContent = acceptedFriendsList.length;

    // Render Pending Requests
    if (friendRequestsContainer) {
      if (pendingReceivedRequests.length === 0) {
        friendRequestsContainer.innerHTML = `
          <div style="font-size: 11.5px; color: var(--text-muted); padding: 8px 4px;">Không có lời mời kết bạn nào.</div>
        `;
      } else {
        friendRequestsContainer.innerHTML = pendingReceivedRequests.map(r => `
          <div class="friend-request-card">
            <div class="friend-card-info">
              <div class="conversation-avatar" style="width: 30px; height: 30px; font-size: 12px;">${r.senderName.charAt(0).toUpperCase()}</div>
              <div class="friend-card-name">${escapeHtml(r.senderName)}</div>
            </div>
            <div class="friend-req-actions">
              <button type="button" class="btn-friend-action btn-friend-accept" data-action="accept-friend-req" data-user-id="${r.senderId}" data-user-name="${escapeHtml(r.senderName)}">
                <i class="fa-solid fa-check"></i> Chấp nhận
              </button>
              <button type="button" class="btn-friend-action btn-friend-decline" data-action="decline-friend-req" data-user-id="${r.senderId}" data-user-name="${escapeHtml(r.senderName)}">
                <i class="fa-solid fa-xmark"></i> Xóa
              </button>
            </div>
          </div>
        `).join('');
      }
    }

    // Render Accepted Friends List
    if (acceptedFriendsContainer) {
      if (acceptedFriendsList.length === 0) {
        acceptedFriendsContainer.innerHTML = `
          <div style="font-size: 11.5px; color: var(--text-muted); padding: 8px 4px;">Chưa có bạn bè nào. Hãy gửi lời mời kết bạn trên Diễn đàn!</div>
        `;
      } else {
        acceptedFriendsContainer.innerHTML = acceptedFriendsList.map(f => `
          <div class="friend-card">
            <div class="friend-card-info">
              <div class="conversation-avatar" style="width: 32px; height: 32px; font-size: 13px;">
                ${f.partnerName.charAt(0).toUpperCase()}
                <span class="online-indicator"></span>
              </div>
              <div>
                <div class="friend-card-name">${escapeHtml(f.partnerName)}</div>
                <div style="font-size: 10px; color: #10b981; font-weight: 700;">🟢 Online</div>
              </div>
            </div>
            <button type="button" class="btn btn-primary btn-sm" data-action="open-direct-chat" data-user-id="${f.partnerId}" data-user-name="${escapeHtml(f.partnerName)}" style="padding: 4px 8px; font-size: 11px;">
              <i class="fa-brands fa-facebook-messenger"></i> Nhắn tin
            </button>
          </div>
        `).join('');
      }
    }
  }

  // 3. Realtime WebSocket Engine
  function initRealtimeWebSocket() {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

    try {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        if (chatSocketStatusDot) chatSocketStatusDot.style.background = '#10b981';
        if (chatSocketStatusText) chatSocketStatusText.textContent = '🟢 Trực tuyến';
        
        socket.send(JSON.stringify({
          type: 'register_user',
          userId: myUserId,
          userName: myUserName
        }));

        socket.send(JSON.stringify({
          type: 'join_room',
          room: currentChatRoom,
          userId: myUserId,
          userName: myUserName
        }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'init_connection') {
            if (data.onlineCount && chatOnlineCountText) {
              chatOnlineCountText.textContent = `${data.onlineCount} online`;
            }
            if (data.history && !activeDirectChat && currentMessengerView === 'chat') {
              renderChatMessages(data.history);
            }
          } else if (data.type === 'room_history') {
            if (!activeDirectChat && currentMessengerView === 'chat') {
              renderChatMessages(data.history || []);
            }
          } else if (data.type === 'new_message') {
            if (!activeDirectChat && data.message.room === currentChatRoom && currentMessengerView === 'chat') {
              appendSingleChatMessage(data.message);
            }
            if (!isChatOpen) {
              unreadCount++;
              updateUnreadBadge();
            }
          } else if (data.type === 'new_direct_message') {
            handleIncomingDirectMessage(data.message);
          } else if (data.type === 'new_friend_request_notify') {
            showFeedToast(`🔔 ${data.fromUserName} vừa gửi lời mời kết bạn cho bạn!`);
            fetchFriendsFromDB();
          } else if (data.type === 'friend_request_accepted_notify') {
            showFeedToast(`🤝 ${data.byUserName} đã chấp nhận lời mời kết bạn!`);
            fetchFriendsFromDB();
          } else if (data.type === 'friendship_updated') {
            fetchFriendsFromDB();
          } else if (data.type === 'new_comment_event') {
            // Zero-flicker in-place DOM append!
            appendCommentToDOM(data.postId, data.comment, null);
          } else if (data.type === 'new_reply_event') {
            // Zero-flicker in-place DOM append!
            appendCommentToDOM(data.postId, data.reply, data.parentId);
          } else if (data.type === 'new_post_event') {
            fetchPostsFromDB(true);
          } else if (data.type === 'online_count') {
            if (chatOnlineCountText) chatOnlineCountText.textContent = `${data.count} online`;
          } else if (data.type === 'user_typing') {
            handleTypingNotification(data);
          }
        } catch (e) {
          console.error('WS Parse Error:', e);
        }
      };

      socket.onclose = () => {
        if (chatSocketStatusDot) chatSocketStatusDot.style.background = '#f59e0b';
        if (chatSocketStatusText) chatSocketStatusText.textContent = 'Đang kết nối...';
        setTimeout(initRealtimeWebSocket, 3000);
      };

      socket.onerror = () => {
        if (chatSocketStatusDot) chatSocketStatusDot.style.background = '#ef4444';
      };
    } catch (e) {
      console.warn('Network notice:', e);
    }
  }

  function handleIncomingDirectMessage(msg) {
    const otherUserId = msg.senderId === myUserId ? msg.recipientId : msg.senderId;
    const otherUserName = msg.senderId === myUserId ? msg.recipientName : msg.senderName;

    if (!directMessagesMap.has(otherUserId)) directMessagesMap.set(otherUserId, []);
    directMessagesMap.get(otherUserId).push(msg);

    fetchConversationsFromDB();

    if (activeDirectChat && activeDirectChat.recipientId === otherUserId && currentMessengerView === 'chat') {
      appendSingleChatMessage(msg);
    } else {
      openDirectMessengerWindow(otherUserId, otherUserName, false);
      unreadCount++;
      updateUnreadBadge();
    }
  }

  function renderChatMessages(msgList) {
    if (!chatMessagesContainer) return;
    chatMessagesContainer.innerHTML = '';
    msgList.forEach(m => appendSingleChatMessage(m, false));
    scrollChatToBottom();
  }

  let activeReplyTarget = null; // { id, senderName, content }
  let activeChatAttachment = null; // { type: 'image' | 'file', data, name, size }

  const chatReplyBar = document.getElementById('chatReplyBar');
  const chatReplyAuthorName = document.getElementById('chatReplyAuthorName');
  const chatReplySnippet = document.getElementById('chatReplySnippet');
  const btnCancelChatReply = document.getElementById('btnCancelChatReply');

  const chatAttachmentPreviewBar = document.getElementById('chatAttachmentPreviewBar');
  const chatAttachmentPreviewContent = document.getElementById('chatAttachmentPreviewContent');
  const btnRemoveChatAttachment = document.getElementById('btnRemoveChatAttachment');

  const chatEmojiPicker = document.getElementById('chatEmojiPicker');
  const btnChatToggleEmoji = document.getElementById('btnChatToggleEmoji');
  const btnChatAttachImage = document.getElementById('btnChatAttachImage');
  const btnChatAttachFile = document.getElementById('btnChatAttachFile');
  const chatImageInput = document.getElementById('chatImageInput');
  const chatFileInput = document.getElementById('chatFileInput');

  function renderChatReplyPreview() {
    if (!chatReplyBar) return;
    if (activeReplyTarget) {
      if (chatReplyAuthorName) chatReplyAuthorName.textContent = activeReplyTarget.senderName || 'Sinh viên';
      if (chatReplySnippet) chatReplySnippet.textContent = activeReplyTarget.content || '(Tệp đính kèm)';
      chatReplyBar.style.display = 'flex';
      if (inputChatMessage) inputChatMessage.focus();
    } else {
      chatReplyBar.style.display = 'none';
    }
  }

  function renderChatAttachmentPreview() {
    if (!chatAttachmentPreviewBar || !chatAttachmentPreviewContent) return;
    if (activeChatAttachment) {
      if (activeChatAttachment.type === 'image') {
        chatAttachmentPreviewContent.innerHTML = `
          <img src="${escapeHtml(activeChatAttachment.data)}" alt="Preview" class="chat-attachment-thumb">
          <span>${escapeHtml(activeChatAttachment.name)} (${escapeHtml(activeChatAttachment.size)})</span>
        `;
      } else {
        chatAttachmentPreviewContent.innerHTML = `
          <i class="fa-solid fa-file-lines" style="font-size: 20px; color: var(--primary);"></i>
          <span>${escapeHtml(activeChatAttachment.name)} (${escapeHtml(activeChatAttachment.size)})</span>
        `;
      }
      chatAttachmentPreviewBar.style.display = 'flex';
    } else {
      chatAttachmentPreviewBar.style.display = 'none';
      chatAttachmentPreviewContent.innerHTML = '';
      if (chatImageInput) chatImageInput.value = '';
      if (chatFileInput) chatFileInput.value = '';
    }
  }

  function appendSingleChatMessage(msg, autoScroll = true) {
    if (!chatMessagesContainer) return;

    const isMine = msg.senderId === myUserId;
    const timeStr = new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const row = document.createElement('div');
    row.className = `msg-row ${isMine ? 'sent' : 'received'}`;

    // Bubble Contents
    let bubbleBodyHtml = '';

    // 1. Remind Badge
    if (msg.isRemind) {
      bubbleBodyHtml += `<div class="msg-remind-tag"><i class="fa-solid fa-thumbtack"></i> Đã nhắc lại tin nhắn</div>`;
    }

    // 2. Quoted Reply Header
    if (msg.replyTo) {
      bubbleBodyHtml += `
        <div class="msg-quoted-box">
          <div class="msg-quoted-author">↩️ ${escapeHtml(msg.replyTo.senderName || 'Sinh viên')}:</div>
          <div class="msg-quoted-text">${escapeHtml(msg.replyTo.content || '(Tệp đính kèm)')}</div>
        </div>
      `;
    }

    // 3. Text Content
    if (msg.content) {
      bubbleBodyHtml += `<div>${escapeHtml(msg.content)}</div>`;
    }

    // 4. Image Attachment
    if (msg.image) {
      bubbleBodyHtml += `
        <div class="msg-attachment-img-box" onclick="window.open('${escapeHtml(msg.image)}', '_blank')" title="Bấm để xem ảnh lớn">
          <img src="${escapeHtml(msg.image)}" alt="Ảnh gửi" class="msg-attachment-img" loading="lazy">
        </div>
      `;
    }

    // 5. File Attachment
    if (msg.file) {
      bubbleBodyHtml += `
        <a href="${escapeHtml(msg.file.data)}" download="${escapeHtml(msg.file.name)}" class="msg-file-card" title="Bấm để tải về: ${escapeHtml(msg.file.name)}">
          <div class="msg-file-icon"><i class="fa-solid fa-file-arrow-down"></i></div>
          <div class="msg-file-info">
            <div class="msg-file-name">${escapeHtml(msg.file.name)}</div>
            <div class="msg-file-size">${escapeHtml(msg.file.size || 'Tệp')} • Bấm tải về</div>
          </div>
        </a>
      `;
    }

    // 6. Action Toolbar on Hover
    const actionsToolbarHtml = `
      <div class="msg-actions-toolbar">
        <button type="button" class="msg-tool-action-btn" data-chat-action="reply" data-msg-id="${escapeHtml(msg.id)}" data-msg-sender="${escapeHtml(msg.senderName || 'Sinh viên')}" data-msg-content="${escapeHtml(msg.content || (msg.file ? msg.file.name : (msg.image ? 'Ảnh đính kèm' : '')))}" title="Trả lời tin nhắn">
          <i class="fa-solid fa-reply"></i>
        </button>
        <button type="button" class="msg-tool-action-btn" data-chat-action="copy" data-msg-content="${escapeHtml(msg.content || '')}" title="Sao chép nội dung">
          <i class="fa-regular fa-copy"></i>
        </button>
        <button type="button" class="msg-tool-action-btn" data-chat-action="remind" data-msg-id="${escapeHtml(msg.id)}" data-msg-sender="${escapeHtml(msg.senderName || 'Sinh viên')}" data-msg-content="${escapeHtml(msg.content || '')}" title="Nhắc lại tin nhắn">
          <i class="fa-solid fa-thumbtack"></i>
        </button>
        <button type="button" class="msg-tool-action-btn" data-chat-action="share" data-msg-sender="${escapeHtml(msg.senderName || 'Sinh viên')}" data-msg-content="${escapeHtml(msg.content || '')}" title="Chia sẻ tin nhắn">
          <i class="fa-solid fa-share-nodes"></i>
        </button>
      </div>
    `;

    row.innerHTML = `
      <div>
        ${!isMine ? `<div class="msg-sender-name">${escapeHtml(msg.senderName || 'Sinh viên')}</div>` : ''}
        <div class="msg-bubble">
          ${bubbleBodyHtml}
          <span class="msg-time">${timeStr}</span>
        </div>
      </div>
      ${actionsToolbarHtml}
    `;

    chatMessagesContainer.appendChild(row);
    if (autoScroll) scrollChatToBottom();
  }

  function scrollChatToBottom() {
    if (chatMessagesContainer) {
      chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }
  }

  function updateUnreadBadge() {
    if (!chatUnreadBadge) return;
    if (unreadCount > 0) {
      chatUnreadBadge.textContent = unreadCount > 9 ? '9+' : unreadCount;
      chatUnreadBadge.style.display = 'block';
    } else {
      chatUnreadBadge.style.display = 'none';
    }
  }

  function openMessengerBox(view = 'inbox') {
    isChatOpen = true;
    unreadCount = 0;
    updateUnreadBadge();

    if (messengerChatWindow) messengerChatWindow.style.display = 'flex';
    switchMessengerView(view);
  }

  // Open 1-on-1 Direct Chat Window
  async function openDirectMessengerWindow(recipientId, recipientName, focusInput = true) {
    activeDirectChat = { recipientId, recipientName };
    isChatOpen = true;
    unreadCount = 0;
    updateUnreadBadge();

    if (messengerChatWindow) messengerChatWindow.style.display = 'flex';
    switchMessengerView('chat');

    if (chatHeaderTitle) chatHeaderTitle.textContent = recipientName || 'Sinh viên UIT';
    if (chatSocketStatusText) chatSocketStatusText.textContent = `🟢 Trực tuyến`;

    // Fetch conversation thread from server
    try {
      const res = await fetch(`/api/direct-messages?user1=${encodeURIComponent(myUserId)}&user2=${encodeURIComponent(recipientId)}`);
      const data = await res.json();
      if (data && data.success) {
        directMessagesMap.set(recipientId, data.messages || []);
        renderChatMessages(data.messages || []);
      }
    } catch (e) {
      const existing = directMessagesMap.get(recipientId) || [];
      renderChatMessages(existing);
    }

    if (focusInput && inputChatMessage) {
      inputChatMessage.placeholder = `Nhắn tin cho ${recipientName}...`;
      inputChatMessage.focus();
    }
  }

  function openRoomChat(roomKey) {
    activeDirectChat = null;
    currentChatRoom = roomKey;
    switchMessengerView('chat');

    if (chatHeaderTitle) chatHeaderTitle.textContent = ROOM_TITLES[roomKey] || 'Phòng Chat';
    if (chatSocketStatusText) chatSocketStatusText.textContent = '🟢 Trực tuyến';

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'join_room',
        room: roomKey,
        userId: myUserId,
        userName: myUserName
      }));
    }

    if (inputChatMessage) {
      inputChatMessage.placeholder = `Nhắn vào ${ROOM_TITLES[roomKey]}...`;
      inputChatMessage.focus();
    }
  }

  function closeMessengerBox() {
    isChatOpen = false;
    activeDirectChat = null;
    activeReplyTarget = null;
    activeChatAttachment = null;
    renderChatReplyPreview();
    renderChatAttachmentPreview();
    if (chatEmojiPicker) chatEmojiPicker.style.display = 'none';
    if (messengerChatWindow) messengerChatWindow.style.display = 'none';
  }

  // Messenger Header & Launcher Handlers
  if (btnOpenMessenger) {
    btnOpenMessenger.addEventListener('click', () => {
      if (isChatOpen) closeMessengerBox();
      else openMessengerBox('inbox');
    });
  }

  if (btnSidebarOpenMessenger) {
    btnSidebarOpenMessenger.addEventListener('click', () => openMessengerBox('inbox'));
  }

  if (btnMinimizeChat) btnMinimizeChat.addEventListener('click', closeMessengerBox);
  if (btnCloseChat) btnCloseChat.addEventListener('click', closeMessengerBox);
  if (btnBackToInbox) btnBackToInbox.addEventListener('click', () => switchMessengerView('inbox'));

  // Messenger Navigation Tab Clicks (Đoạn chat • Bạn bè • Phòng chung)
  document.querySelectorAll('.messenger-nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchMessengerView(tab.dataset.msgTab);
    });
  });

  // Room Card Pick
  document.querySelectorAll('.messenger-room-card').forEach(card => {
    card.addEventListener('click', () => {
      openRoomChat(card.dataset.roomPick);
    });
  });

  // ==========================================================================
  // CHAT TOOLBAR ACTIONS: REPLY, COPY, REMIND, SHARE
  // ==========================================================================
  document.addEventListener('click', (e) => {
    const btnTool = e.target.closest('.msg-tool-action-btn');
    if (!btnTool) return;

    const action = btnTool.dataset.chatAction;
    const msgId = btnTool.dataset.msgId;
    const sender = btnTool.dataset.msgSender || 'Sinh viên';
    const content = btnTool.dataset.msgContent || '';

    if (action === 'reply') {
      activeReplyTarget = { id: msgId, senderName: sender, content: content };
      renderChatReplyPreview();
      showFeedToast(`↩️ Đang trả lời tin nhắn của ${sender}`);
    } else if (action === 'copy') {
      if (content) {
        navigator.clipboard.writeText(content).then(() => {
          showFeedToast('📋 Đã sao chép nội dung tin nhắn!');
        }).catch(() => {
          showFeedToast('📋 Đã sao chép tin nhắn!');
        });
      }
    } else if (action === 'remind') {
      if (socket && socket.readyState === WebSocket.OPEN) {
        const payload = {
          type: activeDirectChat ? 'direct_message' : 'chat_message',
          senderId: myUserId,
          senderName: myUserName,
          content: content ? `📌 Nhắc lại: "${content}"` : '📌 Nhắc lại tin nhắn',
          isRemind: true,
          replyTo: { id: msgId, senderName: sender, content: content }
        };

        if (activeDirectChat) {
          payload.recipientId = activeDirectChat.recipientId;
          payload.recipientName = activeDirectChat.recipientName;
        } else {
          payload.room = currentChatRoom;
          payload.isAnon = false;
        }

        socket.send(JSON.stringify(payload));
        showFeedToast('📌 Đã nhắc lại tin nhắn thành công!');
      }
    } else if (action === 'share') {
      const shareText = `[Tin nhắn từ ${sender} trên UIT HUB]: ${content}`;
      navigator.clipboard.writeText(shareText).then(() => {
        showFeedToast('↗️ Đã sao chép nội dung tin nhắn để chia sẻ!');
      }).catch(() => {
        showFeedToast('↗️ Đã sao chép tin nhắn!');
      });
    }
  });

  // Reply cancel button
  if (btnCancelChatReply) {
    btnCancelChatReply.addEventListener('click', () => {
      activeReplyTarget = null;
      renderChatReplyPreview();
    });
  }

  // Attachment remove button
  if (btnRemoveChatAttachment) {
    btnRemoveChatAttachment.addEventListener('click', () => {
      activeChatAttachment = null;
      renderChatAttachmentPreview();
    });
  }

  // Emoji Toggle & Pick
  if (btnChatToggleEmoji && chatEmojiPicker) {
    btnChatToggleEmoji.addEventListener('click', (e) => {
      e.stopPropagation();
      chatEmojiPicker.style.display = chatEmojiPicker.style.display === 'none' ? 'block' : 'none';
    });

    document.querySelectorAll('.chat-emoji-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const emoji = item.dataset.emoji;
        if (inputChatMessage) {
          inputChatMessage.value += emoji;
          inputChatMessage.focus();
        }
        chatEmojiPicker.style.display = 'none';
      });
    });

    document.addEventListener('click', (e) => {
      if (chatEmojiPicker && !chatEmojiPicker.contains(e.target) && e.target !== btnChatToggleEmoji) {
        chatEmojiPicker.style.display = 'none';
      }
    });
  }

  // Image Attachment Handlers
  if (btnChatAttachImage && chatImageInput) {
    btnChatAttachImage.addEventListener('click', () => chatImageInput.click());
    chatImageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        showFeedToast('⚠️ Vui lòng chọn ảnh dung lượng dưới 5MB!');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        activeChatAttachment = {
          type: 'image',
          data: ev.target.result,
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB'
        };
        renderChatAttachmentPreview();
      };
      reader.readAsDataURL(file);
    });
  }

  // File Attachment Handlers
  if (btnChatAttachFile && chatFileInput) {
    btnChatAttachFile.addEventListener('click', () => chatFileInput.click());
    chatFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        showFeedToast('⚠️ Vui lòng chọn tệp dung lượng dưới 10MB!');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        activeChatAttachment = {
          type: 'file',
          data: ev.target.result,
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB'
        };
        renderChatAttachmentPreview();
      };
      reader.readAsDataURL(file);
    });
  }

  // Send Message Form Submit
  if (formSendChatMessage) {
    formSendChatMessage.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!inputChatMessage) return;

      const content = inputChatMessage.value.trim();
      const hasAttachment = !!activeChatAttachment;

      if (!content && !hasAttachment) return;

      if (socket && socket.readyState === WebSocket.OPEN) {
        const payload = {
          senderId: myUserId,
          senderName: myUserName,
          content: content,
          image: activeChatAttachment && activeChatAttachment.type === 'image' ? activeChatAttachment.data : null,
          file: activeChatAttachment && activeChatAttachment.type === 'file' ? { name: activeChatAttachment.name, size: activeChatAttachment.size, data: activeChatAttachment.data } : null,
          replyTo: activeReplyTarget ? { id: activeReplyTarget.id, senderName: activeReplyTarget.senderName, content: activeReplyTarget.content } : null
        };

        if (activeDirectChat) {
          payload.type = 'direct_message';
          payload.recipientId = activeDirectChat.recipientId;
          payload.recipientName = activeDirectChat.recipientName;
        } else {
          payload.type = 'chat_message';
          payload.room = currentChatRoom;
          payload.isAnon = false;
        }

        socket.send(JSON.stringify(payload));

        // Reset input state
        inputChatMessage.value = '';
        activeReplyTarget = null;
        activeChatAttachment = null;
        renderChatReplyPreview();
        renderChatAttachmentPreview();
        if (chatEmojiPicker) chatEmojiPicker.style.display = 'none';
      } else {
        showFeedToast('⚠️ Không thể gửi tin nhắn lúc này, vui lòng thử lại sau!');
      }
    });
  }

  // Typing Broadcast
  let typingTimer = null;
  if (inputChatMessage) {
    inputChatMessage.addEventListener('input', () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'typing',
          room: currentChatRoom,
          senderId: myUserId,
          senderName: myUserName,
          isDirect: !!activeDirectChat,
          recipientId: activeDirectChat ? activeDirectChat.recipientId : null,
          isTyping: true
        }));

        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
          socket.send(JSON.stringify({
            type: 'typing',
            room: currentChatRoom,
            senderId: myUserId,
            senderName: myUserName,
            isDirect: !!activeDirectChat,
            recipientId: activeDirectChat ? activeDirectChat.recipientId : null,
            isTyping: false
          }));
        }, 1500);
      }
    });
  }

  function handleTypingNotification(data) {
    if (!chatTypingIndicator || data.senderId === myUserId) return;

    if (data.isTyping) {
      if (chatTypingUserText) chatTypingUserText.textContent = `${data.senderName} đang nhập...`;
      chatTypingIndicator.style.display = 'flex';
      scrollChatToBottom();
    } else {
      chatTypingIndicator.style.display = 'none';
    }
  }

  // 18. Toast Notification
  function showFeedToast(msg) {
    const toast = document.getElementById('feedToastNotification');
    if (!toast) return;
    toast.innerHTML = `
      <div style="background: var(--bg-surface-elevated); color: var(--text-primary); border: 1.5px solid var(--primary); padding: 10px 16px; border-radius: var(--radius-md); box-shadow: var(--shadow-lg); font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
        <span>${escapeHtml(msg)}</span>
      </div>
    `;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
  }

  // 19. Helper: Escape HTML
  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // 20. Unified Cross-Tab Theme Sync Helper
  function applyGlobalTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
    const icon = document.getElementById('themeIcon');
    if (icon) {
      icon.className = theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    }
  }

  function initThemeToggle() {
    const btn = document.getElementById('btnThemeToggle');
    const savedTheme = localStorage.getItem('dkhp_theme') || localStorage.getItem('tkb_theme') || 'dark';
    applyGlobalTheme(savedTheme);

    // Cross-tab realtime theme synchronization
    window.addEventListener('storage', (e) => {
      if (e.key === 'dkhp_theme' || e.key === 'tkb_theme') {
        applyGlobalTheme(e.newValue || 'dark');
      }
    });

    if (btn) {
      btn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem('dkhp_theme', next);
        localStorage.setItem('tkb_theme', next);
        applyGlobalTheme(next);
      });
    }
  }

  const DEFAULT_PORTAL_NOTICES = [
    {
      id: "thong-bao-ve-viec-cong-nhan-mon-giao-duc-cam-xuc-xa-hoi-la-mon-tu-chon-tu-do-cho-tat-ca-cac-nganh-dao-tao-dai-hoc-chinh-",
      title: "Thông báo về việc công nhận môn Giáo dục cảm xúc xã hội là môn tự chọn tự do cho tất cả các ngành đào tạo đại học chính quy",
      link: "https://portal.uit.edu.vn/bai-viet/thong-bao-ve-viec-cong-nhan-mon-giao-duc-cam-xuc-xa-hoi-la-mon-tu-chon-tu-do-cho-tat-ca-cac-nganh-dao-tao-dai-hoc-chinh-",
      date: "20 Th 8",
      department: "P. Đào tạo",
      isNew: true,
      isPinned: false
    },
    {
      id: "thong-bao-ket-qua-du-kien-diem-ren-luyen-sinh-vien-hoc-ky-2-nam-hoc-2025-2026",
      title: "Thông báo kết quả dự kiến Điểm rèn luyện sinh viên học kỳ 2 năm học 2025-2026",
      link: "https://portal.uit.edu.vn/bai-viet/thong-bao-ket-qua-du-kien-diem-ren-luyen-sinh-vien-hoc-ky-2-nam-hoc-2025-2026",
      date: "18 Th 8",
      department: "P. Đào tạo",
      isNew: false,
      isPinned: false
    },
    {
      id: "thong-tin-va-huong-dan-danh-cho-co-van-hoc-tap",
      title: "Thông tin và Hướng dẫn dành cho Cố vấn học tập",
      link: "https://portal.uit.edu.vn/bai-viet/thong-tin-va-huong-dan-danh-cho-co-van-hoc-tap",
      date: "Mới",
      department: "P. Đào tạo",
      isNew: false,
      isPinned: true
    },
    {
      id: "thong-bao-lich-dkhp-va-tkb-du-kien-hk1-2026-2027",
      title: "Thông báo lịch ĐKHP và TKB (dự kiến) HK1 2026-2027",
      link: "https://portal.uit.edu.vn/bai-viet/thong-bao-lich-dkhp-va-tkb-du-kien-hk1-2026-2027",
      date: "14 Th 8",
      department: "P. Đào tạo",
      isNew: false,
      isPinned: true
    },
    {
      id: "thong-bao-thu-hoc-phi-hoc-ky-1-nam-hoc-2026-2027-khoa-2026",
      title: "Thông báo thu học phí học kỳ 1, năm học 2026-2027 - Khóa 2026",
      link: "https://portal.uit.edu.vn/bai-viet/thong-bao-thu-hoc-phi-hoc-ky-1-nam-hoc-2026-2027-khoa-2026",
      date: "14 Th 8",
      department: "P. Đào tạo",
      isNew: false,
      isPinned: false
    },
    {
      id: "thong-bao-ve-thoi-khoa-bieu-hoc-phan-5-hk1-nam-hoc-2026-2027-cua-lop-lien-thong-chinh-quy-khoa-2025",
      title: "Thông báo về thời khóa biểu học phần 5 HK1 năm học 2026-2027 của lớp liên thông chính quy khóa 2025",
      link: "https://portal.uit.edu.vn/bai-viet/thong-bao-ve-thoi-khoa-bieu-hoc-phan-5-hk1-nam-hoc-2026-2027-cua-lop-lien-thong-chinh-quy-khoa-2025",
      date: "13 Th 8",
      department: "P. Đào tạo",
      isNew: false,
      isPinned: true
    }
  ];

  function renderPortalNoticesList(notices) {
    const listEl = document.getElementById('portalNoticesList');
    if (!listEl) return;
    if (!notices || notices.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 12px; font-size: 11.5px; color: var(--text-muted);">
          Chưa có thông báo mới nào.
        </div>
      `;
      return;
    }

    listEl.innerHTML = notices.map(notice => `
      <a href="${escapeHtml(notice.link)}" target="_blank" rel="noopener noreferrer" class="portal-notice-item">
        <div class="portal-notice-title">${escapeHtml(notice.title)}</div>
        <div class="portal-notice-meta">
          <span><i class="fa-regular fa-calendar" style="font-size: 10px;"></i> ${escapeHtml(notice.date)}</span>
          <span>•</span>
          <span>${escapeHtml(notice.department || 'P. Đào tạo')}</span>
          ${notice.isNew ? '<span class="portal-badge-new">MỚI</span>' : ''}
          ${notice.isPinned ? '<span class="portal-badge-pin">📌 Ghim</span>' : ''}
        </div>
      </a>
    `).join('');
  }

  // ==========================================================================
  // 12. FETCH & RENDER PORTAL.UIT.EDU.VN LIVE NOTICES
  // ==========================================================================
  async function loadPortalNotices() {
    // Render default cache immediately for instant UI
    renderPortalNoticesList(DEFAULT_PORTAL_NOTICES);

    try {
      const res = await fetch('/api/portal/notices');
      if (!res.ok) throw new Error('Network response not ok');
      const data = await res.json();
      const notices = data.notices || [];
      if (notices.length > 0) {
        renderPortalNoticesList(notices);
      }
    } catch (err) {
      console.warn('Could not load online portal notices, using cached list:', err);
    }
  }

  // Initialize
  fetchPostsFromDB(true);
  fetchFriendsFromDB();
  fetchConversationsFromDB();
  renderTopTeachersWidget();
  loadPortalNotices();
  setInterval(loadPortalNotices, 5 * 60 * 1000);
  initRealtimeWebSocket();

  // PWA Service Worker Registration & 1-Click App Install Prompt
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  let deferredPwaPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPwaPrompt = e;
    const apkBtns = document.querySelectorAll('.btn-apk-download');
    apkBtns.forEach(btn => {
      btn.innerHTML = '<i class="fa-solid fa-download"></i> <span>Cài Đặt App</span>';
      btn.title = 'Cài đặt ứng dụng UIT HUB trực tiếp lên điện thoại';
    });
  });

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-apk-download');
    if (btn && deferredPwaPrompt) {
      e.preventDefault();
      deferredPwaPrompt.prompt();
      deferredPwaPrompt.userChoice.then(() => {
        deferredPwaPrompt = null;
      });
    }
  });
});
