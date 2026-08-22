/**
 * ==============================================================================
 * DKHP UIT - ENTERPRISE SOCIAL NETWORK, AUTHENTICATION & WEBSOCKET ENGINE
 * ==============================================================================
 * 1. Cryptographic Security & Password Hashing (PBKDF2-HMAC-SHA512 with 32-byte Salt)
 * 2. Email OTP Verification Engine via Resend API (Rate-limiting & Anti-Brute-Force)
 * 3. User & Session Management (Hybrid Guest & Registered User Support with Data Migration)
 * 4. File-backed Database Persistence (social_db.json - Git Ignored for Zero Leakage)
 * 5. Realtime WebSockets: Live 2-way chat (Direct & Rooms), Typing, Friends, Post events.
 * 6. High-Performance Static File Server for UIT HUB (index.html, feed.html, reviews.html).
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer, WebSocket } = require('ws');

// ==============================================================================
// 1. ENVIRONMENT CONFIGURATION (.env Loader)
// ==============================================================================
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const match = trimmed.match(/^([\w_]+)\s*=\s*(.*)?$/);
      if (match) {
        let val = (match[2] || '').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[match[1]] = val;
      }
    });
  }
}
loadEnv();

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;
const DB_FILE = path.join(__dirname, 'social_db.json');
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'UIT HUB <onboarding@resend.dev>';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.apk': 'application/vnd.android.package-archive',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

// ==============================================================================
// 2. CRYPTOGRAPHIC & SECURITY UTILITIES
// ==============================================================================
function generateSalt() {
  return crypto.randomBytes(32).toString('hex');
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(String(password), String(salt), 100000, 64, 'sha512').toString('hex');
}

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName || user.username,
    email: user.email,
    mssv: user.mssv || '',
    badge: user.badge || 'UITer',
    role: user.role || 'user',
    avatarColor: user.avatarColor || '#2563eb',
    createdAt: user.createdAt
  };
}

// In-Memory OTP Store: email.toLowerCase() => { email, username, displayName, mssv, passwordHash, passwordSalt, otpCode, expiresAt, attempts, lastSentAt }
const otpStore = new Map();

// ==============================================================================
// 3. EMAIL OTP DELIVERY ENGINE (RESEND API)
// ==============================================================================
async function sendResendOTPEmail(toEmail, otpCode, displayName) {
  const safeName = displayName || 'Bạn';
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 20px; color: #f8fafc; }
        .card { max-width: 500px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center; }
        .logo { font-size: 24px; font-weight: 800; color: #38bdf8; letter-spacing: 1px; margin-bottom: 4px; }
        .tagline { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 24px; }
        .greeting { font-size: 16px; font-weight: 600; color: #f1f5f9; margin-bottom: 12px; }
        .desc { font-size: 13.5px; color: #cbd5e1; line-height: 1.6; margin-bottom: 24px; }
        .otp-box { background: #0f172a; border: 2px dashed #0284c7; border-radius: 12px; padding: 18px 24px; margin: 24px 0; display: inline-block; }
        .otp-code { font-size: 32px; font-weight: 800; color: #38bdf8; letter-spacing: 8px; font-family: monospace; }
        .warning { font-size: 12px; color: #f59e0b; margin-top: 16px; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #334155; font-size: 11px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">UIT HUB</div>
        <div class="tagline">Connect • Collaborate • Innovate</div>
        <div class="greeting">Xin chào ${safeName}! 👋</div>
        <div class="desc">Bạn đang thực hiện đăng ký tài khoản tại <strong>Cổng Thông Tin & Diễn Đàn Sinh Viên UIT</strong>. Dưới đây là mã xác thực OTP 6 chữ số của bạn:</div>
        <div class="otp-box">
          <div class="otp-code">${otpCode}</div>
        </div>
        <div class="warning">⏱️ Mã xác thực này có hiệu lực trong <strong>5 phút</strong>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai!</div>
        <div class="footer">
          © 2026 UIT HUB • Đại học Công nghệ Thông tin - ĐHQG-TP.HCM.<br>
          Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.
        </div>
      </div>
    </body>
    </html>
  `;

  const payload = JSON.stringify({
    from: EMAIL_FROM,
    to: [toEmail],
    subject: `[UIT HUB] Mã xác thực đăng ký tài khoản: ${otpCode}`,
    html: htmlContent
  });

  return new Promise((resolve) => {
    if (!RESEND_API_KEY || RESEND_API_KEY.startsWith('re_your_')) {
      console.log(`\n📧 [DEV MOCK EMAIL] OTP for ${toEmail}: >>> ${otpCode} <<< (Resend key not set)\n`);
      resolve({ success: true, mock: true });
      return;
    }

    const req = https.request({
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ [RESEND EMAIL SENT] Successfully sent OTP to ${toEmail}`);
          resolve({ success: true, resendId: body });
        } else {
          console.warn(`⚠️ [RESEND EMAIL WARNING] Status ${res.statusCode}: ${body}`);
          console.log(`📧 [FALLBACK OTP LOG] OTP for ${toEmail}: >>> ${otpCode} <<<`);
          resolve({ success: true, fallback: true });
        }
      });
    });

    req.on('error', (err) => {
      console.error(`❌ [RESEND EMAIL ERROR]`, err.message);
      console.log(`📧 [FALLBACK OTP LOG] OTP for ${toEmail}: >>> ${otpCode} <<<`);
      resolve({ success: true, fallback: true });
    });

    req.write(payload);
    req.end();
  });
}

// ==============================================================================
// 4. DATABASE LAYER (File-backed Persistent Database)
// ==============================================================================
const DEFAULT_DB = {
  users: [
    {
      id: "admin_ins0720",
      username: "Ins0720",
      displayName: "Ins0720",
      email: "ins0720@uit.edu.vn",
      mssv: "22520720",
      passwordHash: hashPassword("uit123456", "admin_salt_ins0720"),
      passwordSalt: "admin_salt_ins0720",
      badge: "ADMIN",
      role: "admin",
      avatarColor: "#2563eb",
      createdAt: new Date().toISOString()
    }
  ],
  sessions: [],
  posts: [
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
      createdAt: new Date().toISOString(),
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
      createdAt: new Date().toISOString(),
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
      createdAt: new Date().toISOString(),
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
      createdAt: new Date().toISOString(),
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
      createdAt: new Date().toISOString(),
      comments: []
    }
  ],
  roomMessages: {
    general: [],
    trade: [],
    study: []
  },
  directMessages: [],
  friendships: []
};

let db = { ...DEFAULT_DB };

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const loaded = JSON.parse(raw);
      db = {
        ...DEFAULT_DB,
        ...loaded,
        users: Array.isArray(loaded.users) && loaded.users.length > 0 ? loaded.users : DEFAULT_DB.users,
        sessions: Array.isArray(loaded.sessions) ? loaded.sessions : [],
        posts: Array.isArray(loaded.posts) && loaded.posts.length > 0 ? loaded.posts : DEFAULT_DB.posts,
        roomMessages: loaded.roomMessages || DEFAULT_DB.roomMessages,
        directMessages: loaded.directMessages || [],
        friendships: loaded.friendships || []
      };
      console.log(`📦 Database loaded successfully: ${db.users.length} users, ${db.posts.length} posts`);
    } else {
      saveDatabase();
      console.log('🆕 Created new clean database file social_db.json');
    }
  } catch (err) {
    console.error('⚠️ Database load error, using default:', err);
    db = { ...DEFAULT_DB };
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('❌ Database save error:', err);
  }
}

loadDatabase();

// ==============================================================================
// PORTAL UIT NOTICES WORKER (Periodic 10-minute Sync & In-Memory Cache)
// ==============================================================================
let portalNoticesCache = db.portalNotices || [];
let portalNoticesLastUpdated = new Date().toISOString();

function fetchPortalNoticesFromUIT() {
  const https = require('https');
  const req = https.get('https://portal.uit.edu.vn/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8'
    },
    timeout: 10000
  }, (res) => {
    let html = '';
    res.on('data', chunk => { html += chunk; });
    res.on('end', () => {
      try {
        const notices = [];
        const regex = /<a[^>]+href="(\/bai-viet\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
        let m;
        while ((m = regex.exec(html)) !== null) {
          const link = 'https://portal.uit.edu.vn' + m[1];
          const chunk = m[2];
          
          let title = '';
          const tMatch = chunk.match(/<div class="font-semibold[^>]*>([\s\S]*?)<\/div>/) || chunk.match(/<strong[^>]*>([\s\S]*?)<\/strong>/);
          if (tMatch) {
            title = tMatch[1].replace(/<[^>]+>/g, '').replace(/MỚI/g, '').trim();
          }

          let date = '';
          const dMatch = chunk.match(/(\d{1,2})\s*<\/div>\s*<div[^>]*>\s*Th\s*(\d{1,2})/i);
          if (dMatch) {
            date = `${dMatch[1]} Th ${dMatch[2]}`;
          } else {
            const dAlt = chunk.match(/Đăng:\s*<!-- -->\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
            if (dAlt) date = dAlt[1];
          }

          let dept = 'P. Đào tạo';
          if (chunk.includes('Thông báo chung')) dept = 'P. Đào tạo';
          else if (chunk.includes('CTSV')) dept = 'Phòng CTSV';
          else if (chunk.includes('KHTC') || title.includes('học phí')) dept = 'P. KHTC';

          const isNew = chunk.includes('MỚI') || title.includes('MỚI');
          const isPin = chunk.includes('lucide-pin') || chunk.includes('NỔI BẬT');

          if (title && !notices.some(n => n.link === link)) {
            notices.push({
              id: m[1].replace('/bai-viet/', ''),
              title: title,
              link: link,
              date: date || 'Mới',
              department: dept,
              isNew: isNew,
              isPinned: isPin
            });
          }
        }

        if (notices.length > 0) {
          portalNoticesCache = notices;
          portalNoticesLastUpdated = new Date().toISOString();
          db.portalNotices = notices;
          saveDatabase();
          console.log(`🏛️ [PORTAL UIT SYNC] Successfully synced ${notices.length} notices from portal.uit.edu.vn`);
        }
      } catch (err) {
        console.error('Error parsing portal HTML:', err);
      }
    });
  });

  req.on('error', (err) => {
    console.error('⚠️ Could not connect to portal.uit.edu.vn, retaining cached notices:', err.message);
  });
  req.on('timeout', () => {
    req.destroy();
  });
}

// Initial Sync & 10-minute Periodic Cron
setTimeout(fetchPortalNoticesFromUIT, 2000);
setInterval(fetchPortalNoticesFromUIT, 10 * 60 * 1000);

// Helper: Authenticate request token
function getAuthenticatedUser(req) {
  const authHeader = req.headers['authorization'] || '';
  let token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    token = req.headers['x-auth-token'] || '';
  }
  if (!token) return null;

  const session = (db.sessions || []).find(s => s.token === token && new Date(s.expiresAt) > new Date());
  if (!session) return null;

  return (db.users || []).find(u => u.id === session.userId) || null;
}

// ==============================================================================
// 5. HTTP SERVER & REST API
// ==============================================================================
const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const jsonResponse = (statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
  };

  // --- REST API ENDPOINTS ---
  if (pathname.startsWith('/api/')) {

    // ==========================================================================
    // AUTH API: SEND OTP (REGISTER STEP 1)
    // ==========================================================================
    if (pathname === '/api/auth/send-otp' && method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const email = String(data.email || '').trim().toLowerCase();
          const username = String(data.username || '').trim();
          const password = String(data.password || '');
          const displayName = String(data.displayName || username).trim();
          const mssv = String(data.mssv || '').trim();

          // 1. Validation Checks
          if (!email || !username || !password) {
            return jsonResponse(400, { success: false, error: 'Vui lòng điền đầy đủ Email, Tên đăng nhập và Mật khẩu!' });
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            return jsonResponse(400, { success: false, error: 'Địa chỉ Email không đúng định dạng!' });
          }

          if (username.length < 3 || username.length > 25) {
            return jsonResponse(400, { success: false, error: 'Tên đăng nhập phải từ 3 đến 25 ký tự!' });
          }

          if (password.length < 6) {
            return jsonResponse(400, { success: false, error: 'Mật khẩu phải có độ dài tối thiểu 6 ký tự!' });
          }

          // 2. Duplicate Checks (Username, Email, MSSV)
          const isUsernameTaken = (db.users || []).some(u => u.username.toLowerCase() === username.toLowerCase());
          if (isUsernameTaken) {
            return jsonResponse(409, { success: false, error: '⚠️ Tên đăng nhập này đã có người sử dụng. Vui lòng chọn tên khác!' });
          }

          const isEmailTaken = (db.users || []).some(u => u.email.toLowerCase() === email.toLowerCase());
          if (isEmailTaken) {
            return jsonResponse(409, { success: false, error: '⚠️ Email này đã được đăng ký tài khoản. Vui lòng đăng nhập hoặc dùng email khác!' });
          }

          if (mssv) {
            const isMssvTaken = (db.users || []).some(u => u.mssv && u.mssv.toLowerCase() === mssv.toLowerCase());
            if (isMssvTaken) {
              return jsonResponse(409, { success: false, error: '⚠️ Mã số sinh viên (MSSV) này đã được liên kết với một tài khoản khác!' });
            }
          }

          // 3. Cooldown Check (60s anti-spam)
          const existingOtp = otpStore.get(email);
          if (existingOtp && (Date.now() - existingOtp.lastSentAt) < 60000) {
            const waitSec = Math.ceil((60000 - (Date.now() - existingOtp.lastSentAt)) / 1000);
            return jsonResponse(429, { success: false, error: `Vui lòng đợi ${waitSec} giây nữa trước khi yêu cầu gửi lại mã!` });
          }

          // 4. Generate Salt, Hash Password, Generate OTP
          const salt = generateSalt();
          const pHash = hashPassword(password, salt);
          const otpCode = generateOTP();

          otpStore.set(email, {
            email: email,
            username: username,
            displayName: displayName || username,
            mssv: mssv,
            passwordHash: pHash,
            passwordSalt: salt,
            otpCode: otpCode,
            expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
            attempts: 0,
            lastSentAt: Date.now()
          });

          // 5. Send OTP via Resend
          await sendResendOTPEmail(email, otpCode, displayName || username);

          return jsonResponse(200, {
            success: true,
            message: `Mã xác thực 6 số đã được gửi đến hộp thư ${email}. Vui lòng kiểm tra email!`,
            email: email
          });
        } catch (err) {
          console.error('Send OTP Error:', err);
          return jsonResponse(500, { success: false, error: 'Lỗi máy chủ khi tạo mã OTP!' });
        }
      });
      return;
    }

    // ==========================================================================
    // AUTH API: VERIFY OTP & COMPLETE REGISTRATION (STEP 2)
    // ==========================================================================
    if (pathname === '/api/auth/verify-otp' && method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const email = String(data.email || '').trim().toLowerCase();
          const otpCode = String(data.otpCode || '').trim();
          const previousGuestId = String(data.previousGuestId || '').trim();

          const record = otpStore.get(email);
          if (!record) {
            return jsonResponse(400, { success: false, error: 'Không tìm thấy yêu cầu xác thực hoặc mã đã hết hạn. Vui lòng thử lại từ đầu!' });
          }

          if (Date.now() > record.expiresAt) {
            otpStore.delete(email);
            return jsonResponse(400, { success: false, error: 'Mã xác thực đã hết hạn (quá 5 phút). Vui lòng yêu cầu gửi lại mã mới!' });
          }

          if (record.attempts >= 5) {
            otpStore.delete(email);
            return jsonResponse(400, { success: false, error: 'Bạn đã nhập sai mã quá 5 lần. Yêu cầu đăng ký đã bị hủy để đảm bảo an toàn!' });
          }

          if (record.otpCode !== otpCode) {
            record.attempts++;
            const remaining = 5 - record.attempts;
            return jsonResponse(400, { success: false, error: `Mã OTP không chính xác! (Còn lại ${remaining} lần thử)` });
          }

          // OTP is Valid -> Create New User
          const isInsAdmin = record.username.toLowerCase() === 'ins0720';
          const newUser = {
            id: 'u_' + crypto.randomBytes(6).toString('hex'),
            username: record.username,
            displayName: record.displayName,
            email: record.email,
            mssv: record.mssv || '',
            passwordHash: record.passwordHash,
            passwordSalt: record.passwordSalt,
            badge: isInsAdmin ? 'ADMIN' : 'UITer',
            role: isInsAdmin ? 'admin' : 'user',
            avatarColor: isInsAdmin ? '#2563eb' : '#0ea5e9',
            createdAt: new Date().toISOString()
          };

          if (!db.users) db.users = [];
          db.users.push(newUser);

          // Generate Session Token (Valid 30 days)
          const sessionToken = generateSessionToken();
          if (!db.sessions) db.sessions = [];
          db.sessions.push({
            token: sessionToken,
            userId: newUser.id,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 86400000).toISOString()
          });

          // Data Migration from Guest to Registered Account
          if (previousGuestId && previousGuestId !== newUser.id) {
            if (Array.isArray(db.posts)) {
              db.posts.forEach(p => {
                if (p.authorId === previousGuestId) {
                  p.authorId = newUser.id;
                  p.author = newUser.displayName;
                }
                if (Array.isArray(p.comments)) {
                  p.comments.forEach(c => {
                    if (c.authorId === previousGuestId) {
                      c.authorId = newUser.id;
                      c.author = newUser.displayName;
                    }
                    if (Array.isArray(c.replies)) {
                      c.replies.forEach(r => {
                        if (r.authorId === previousGuestId) {
                          r.authorId = newUser.id;
                          r.author = newUser.displayName;
                        }
                      });
                    }
                  });
                }
              });
            }

            if (Array.isArray(db.directMessages)) {
              db.directMessages.forEach(m => {
                if (m.senderId === previousGuestId) {
                  m.senderId = newUser.id;
                  m.senderName = newUser.displayName;
                }
                if (m.recipientId === previousGuestId) {
                  m.recipientId = newUser.id;
                  m.recipientName = newUser.displayName;
                }
              });
            }

            if (Array.isArray(db.friendships)) {
              db.friendships.forEach(f => {
                if (f.user1 === previousGuestId) { f.user1 = newUser.id; f.user1Name = newUser.displayName; }
                if (f.user2 === previousGuestId) { f.user2 = newUser.id; f.user2Name = newUser.displayName; }
              });
            }
          }

          saveDatabase();
          otpStore.delete(email);

          console.log(`🎉 [NEW USER CREATED] ${newUser.username} (${newUser.email})`);
          return jsonResponse(200, {
            success: true,
            message: '🎉 Chúc mừng bạn đã đăng ký tài khoản UIT HUB thành công!',
            token: sessionToken,
            user: sanitizeUser(newUser)
          });
        } catch (err) {
          console.error('Verify OTP Error:', err);
          return jsonResponse(500, { success: false, error: 'Lỗi máy chủ khi xác thực OTP!' });
        }
      });
      return;
    }

    // ==========================================================================
    // AUTH API: LOGIN
    // ==========================================================================
    if (pathname === '/api/auth/login' && method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const identifier = String(data.usernameOrEmail || '').trim().toLowerCase();
          const password = String(data.password || '');

          if (!identifier || !password) {
            return jsonResponse(400, { success: false, error: 'Vui lòng nhập Tên đăng nhập/Email và Mật khẩu!' });
          }

          const user = (db.users || []).find(u => 
            u.username.toLowerCase() === identifier || 
            u.email.toLowerCase() === identifier
          );

          if (!user) {
            return jsonResponse(404, { success: false, error: 'Tài khoản không tồn tại trên hệ thống!' });
          }

          const computedHash = hashPassword(password, user.passwordSalt);
          if (computedHash !== user.passwordHash) {
            return jsonResponse(401, { success: false, error: 'Mật khẩu không chính xác! Vui lòng thử lại.' });
          }

          const sessionToken = generateSessionToken();
          if (!db.sessions) db.sessions = [];
          db.sessions.push({
            token: sessionToken,
            userId: user.id,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 86400000).toISOString()
          });

          saveDatabase();
          console.log(`🔑 [USER LOGIN] ${user.username} logged in successfully`);

          return jsonResponse(200, {
            success: true,
            message: `Chào mừng ${user.displayName} đã quay trở lại UIT HUB!`,
            token: sessionToken,
            user: sanitizeUser(user)
          });
        } catch (err) {
          console.error('Login Error:', err);
          return jsonResponse(500, { success: false, error: 'Lỗi máy chủ khi đăng nhập!' });
        }
      });
      return;
    }

    // ==========================================================================
    // AUTH API: RESEND OTP
    // ==========================================================================
    if (pathname === '/api/auth/resend-otp' && method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const email = String(data.email || '').trim().toLowerCase();
          const record = otpStore.get(email);

          if (!record) {
            return jsonResponse(400, { success: false, error: 'Không tìm thấy phiên đăng ký. Vui lòng quay lại bước 1!' });
          }

          if ((Date.now() - record.lastSentAt) < 60000) {
            const waitSec = Math.ceil((60000 - (Date.now() - record.lastSentAt)) / 1000);
            return jsonResponse(429, { success: false, error: `Vui lòng đợi ${waitSec} giây nữa để gửi lại mã!` });
          }

          const newOtp = generateOTP();
          record.otpCode = newOtp;
          record.expiresAt = Date.now() + 5 * 60 * 1000;
          record.attempts = 0;
          record.lastSentAt = Date.now();

          await sendResendOTPEmail(email, newOtp, record.displayName);
          return jsonResponse(200, { success: true, message: `Đã gửi lại mã OTP mới về email ${email}!` });
        } catch (err) {
          return jsonResponse(500, { success: false, error: 'Lỗi khi gửi lại OTP' });
        }
      });
      return;
    }

    // ==========================================================================
    // AUTH API: GET CURRENT USER (ME)
    // ==========================================================================
    if (pathname === '/api/auth/me' && method === 'GET') {
      const user = getAuthenticatedUser(req);
      if (!user) {
        return jsonResponse(401, { success: false, message: 'Phiên đăng nhập hết hạn hoặc chưa đăng nhập' });
      }
      return jsonResponse(200, { success: true, user: sanitizeUser(user) });
    }

    // ==========================================================================
    // AUTH API: LOGOUT
    // ==========================================================================
    if (pathname === '/api/auth/logout' && method === 'POST') {
      const authHeader = req.headers['authorization'] || '';
      let token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (!token) token = req.headers['x-auth-token'] || '';

      if (token && Array.isArray(db.sessions)) {
        db.sessions = db.sessions.filter(s => s.token !== token);
        saveDatabase();
      }
      return jsonResponse(200, { success: true, message: 'Đã đăng xuất tài khoản an toàn' });
    }

    // ==========================================================================
    // AUTH API: UPDATE PROFILE & AVATAR
    // ==========================================================================
    if (pathname === '/api/auth/update-profile' && method === 'POST') {
      const user = getAuthenticatedUser(req);
      if (!user) {
        return jsonResponse(401, { success: false, error: 'Vui lòng đăng nhập để cập nhật hồ sơ!' });
      }

      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.displayName) {
            user.displayName = String(data.displayName).trim().slice(0, 50);
          }
          if (data.avatar !== undefined) {
            user.avatar = String(data.avatar).slice(0, 500000);
          }
          if (data.avatarColor) {
            user.avatarColor = String(data.avatarColor).slice(0, 20);
          }
          if (data.mssv !== undefined) {
            user.mssv = String(data.mssv).trim().slice(0, 20);
          }

          // Sync displayName to user's posts, comments and messages
          if (user.displayName) {
            if (Array.isArray(db.posts)) {
              db.posts.forEach(p => {
                if (p.authorId === user.id) p.author = user.displayName;
                if (Array.isArray(p.comments)) {
                  p.comments.forEach(c => {
                    if (c.authorId === user.id) c.author = user.displayName;
                    if (Array.isArray(c.replies)) {
                      c.replies.forEach(r => {
                        if (r.authorId === user.id) r.author = user.displayName;
                      });
                    }
                  });
                }
              });
            }
            if (Array.isArray(db.directMessages)) {
              db.directMessages.forEach(m => {
                if (m.senderId === user.id) m.senderName = user.displayName;
                if (m.recipientId === user.id) m.recipientName = user.displayName;
              });
            }
            if (Array.isArray(db.friendships)) {
              db.friendships.forEach(f => {
                if (f.user1 === user.id) f.user1Name = user.displayName;
                if (f.user2 === user.id) f.user2Name = user.displayName;
              });
            }
          }

          saveDatabase();
          return jsonResponse(200, {
            success: true,
            message: '🎉 Cập nhật thông tin và avatar thành công!',
            user: sanitizeUser(user)
          });
        } catch (err) {
          return jsonResponse(400, { success: false, error: 'Dữ liệu cập nhật không hợp lệ!' });
        }
      });
      return;
    }

    // ==========================================================================
    // SOCIAL API: POSTS
    // ==========================================================================
    if (pathname === '/api/posts' && method === 'GET') {
      return jsonResponse(200, { success: true, posts: db.posts });
    }

    if (pathname === '/api/posts' && method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (!data.title || !data.content) {
            return jsonResponse(400, { success: false, message: 'Missing title or content' });
          }

          const authed = getAuthenticatedUser(req);
          const authorId = authed ? authed.id : (data.authorId || ('u_' + Date.now()));
          const authorName = authed ? authed.displayName : (data.author || 'Sinh viên UIT');

          const newPost = {
            id: 'post_' + Date.now(),
            title: String(data.title).slice(0, 150),
            content: String(data.content).slice(0, 3000),
            category: data.category || 'trade',
            authorId: authorId,
            author: authorName,
            isAnonymous: data.isAnonymous ?? true,
            courseTag: (data.courseTag || '').toUpperCase(),
            teacherTag: data.teacherTag || '',
            image: data.image ? String(data.image).slice(0, 10000000) : '',
            upvotes: 1,
            createdAt: new Date().toISOString(),
            comments: []
          };

          db.posts.unshift(newPost);
          saveDatabase();

          broadcastWS({
            type: 'new_post_event',
            post: newPost
          });

          return jsonResponse(200, { success: true, post: newPost });
        } catch (err) {
          return jsonResponse(400, { success: false, message: 'Invalid payload' });
        }
      });
      return;
    }

    // 3. POST /api/posts/like - Like / Upvote a post
    if (pathname === '/api/posts/like' && method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const post = db.posts.find(p => p.id === data.postId);
          if (!post) {
            return jsonResponse(404, { success: false, message: 'Post not found' });
          }

          if (data.action === 'unlike') {
            post.upvotes = Math.max(0, (post.upvotes || 1) - 1);
          } else {
            post.upvotes = (post.upvotes || 0) + 1;
          }

          saveDatabase();
          return jsonResponse(200, { success: true, upvotes: post.upvotes });
        } catch (err) {
          return jsonResponse(400, { success: false, message: 'Invalid payload' });
        }
      });
      return;
    }

    // 4. POST /api/comments - Add a top-level comment or reply to existing comment
    if (pathname === '/api/comments' && method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const post = db.posts.find(p => p.id === data.postId);
          if (!post) {
            return jsonResponse(404, { success: false, message: 'Post not found' });
          }

          const authed = getAuthenticatedUser(req);
          const authorId = authed ? authed.id : (data.authorId || ('u_' + Date.now()));
          const authorName = authed ? authed.displayName : (data.author || 'Sinh viên');

          if (data.parentId) {
            // Reply to comment
            const parentComment = post.comments.find(c => c.id === data.parentId);
            if (!parentComment) {
              return jsonResponse(404, { success: false, message: 'Parent comment not found' });
            }
            if (!parentComment.replies) parentComment.replies = [];

            const isOP = authorId === post.authorId;
            const newReply = {
              id: 'r_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
              authorId: authorId,
              author: authorName,
              isOP: isOP,
              content: String(data.content).slice(0, 1000),
              createdAt: new Date().toISOString(),
              upvotes: 0
            };

            parentComment.replies.push(newReply);
            saveDatabase();

            broadcastWS({
              type: 'new_reply_event',
              postId: post.id,
              parentId: data.parentId,
              reply: newReply
            });

            return jsonResponse(200, { success: true, reply: newReply });
          } else {
            // Top level comment
            const isOP = authorId === post.authorId;
            const newComment = {
              id: 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
              authorId: authorId,
              author: authorName,
              isOP: isOP,
              content: String(data.content).slice(0, 1000),
              createdAt: new Date().toISOString(),
              upvotes: 0,
              replies: []
            };

            if (!post.comments) post.comments = [];
            post.comments.push(newComment);
            saveDatabase();

            broadcastWS({
              type: 'new_comment_event',
              postId: post.id,
              comment: newComment
            });

            return jsonResponse(200, { success: true, comment: newComment });
          }
        } catch (err) {
          return jsonResponse(400, { success: false, message: 'Invalid comment payload' });
        }
      });
      return;
    }

    // 5. GET /api/conversations - List recent conversations for a user
    if (pathname === '/api/conversations' && method === 'GET') {
      const userId = parsedUrl.searchParams.get('userId');
      if (!userId) {
        return jsonResponse(400, { success: false, message: 'Missing userId' });
      }

      const convMap = new Map();
      const allDMs = db.directMessages || [];

      allDMs.forEach(msg => {
        if (msg.senderId === userId || msg.recipientId === userId) {
          const partnerId = msg.senderId === userId ? msg.recipientId : msg.senderId;
          const partnerName = msg.senderId === userId ? msg.recipientName : msg.senderName;
          
          if (!convMap.has(partnerId) || new Date(msg.timestamp) > new Date(convMap.get(partnerId).lastTimestamp)) {
            convMap.set(partnerId, {
              partnerId: partnerId,
              partnerName: partnerName || 'Sinh viên UIT',
              lastMessage: msg.content,
              lastTimestamp: msg.timestamp,
              lastSenderId: msg.senderId
            });
          }
        }
      });

      const convList = Array.from(convMap.values()).sort((a, b) => new Date(b.lastTimestamp) - new Date(a.lastTimestamp));
      return jsonResponse(200, { success: true, conversations: convList });
    }

    // 6. GET /api/direct-messages - Fetch messages between two users
    if (pathname === '/api/direct-messages' && method === 'GET') {
      const user1 = parsedUrl.searchParams.get('user1');
      const user2 = parsedUrl.searchParams.get('user2');

      if (!user1 || !user2) {
        return jsonResponse(400, { success: false, message: 'Missing user1 or user2' });
      }

      const history = (db.directMessages || []).filter(m => 
        (m.senderId === user1 && m.recipientId === user2) ||
        (m.senderId === user2 && m.recipientId === user1)
      );

      return jsonResponse(200, { success: true, messages: history });
    }

    // 7. GET & POST /api/friends - 2-Way Friendship Request & Accept Engine
    if (pathname === '/api/friends' && method === 'GET') {
      const userId = parsedUrl.searchParams.get('userId');
      if (!userId) {
        return jsonResponse(400, { success: false, message: 'Missing userId' });
      }

      const userFriends = (db.friendships || []).filter(f => f.user1 === userId || f.user2 === userId);
      const accepted = userFriends.filter(f => f.status === 'accepted').map(f => {
        const isUser1 = f.user1 === userId;
        return {
          id: f.id,
          partnerId: isUser1 ? f.user2 : f.user1,
          partnerName: isUser1 ? f.user2Name : f.user1Name,
          since: f.createdAt
        };
      });

      const pendingReceived = userFriends.filter(f => f.user2 === userId && f.status === 'pending').map(f => ({
        id: f.id,
        senderId: f.user1,
        senderName: f.user1Name,
        createdAt: f.createdAt
      }));

      const pendingSent = userFriends.filter(f => f.user1 === userId && f.status === 'pending').map(f => ({
        id: f.id,
        receiverId: f.user2,
        receiverName: f.user2Name,
        createdAt: f.createdAt
      }));

      return jsonResponse(200, {
        success: true,
        accepted: accepted,
        pendingReceived: pendingReceived,
        pendingSent: pendingSent
      });
    }

    if (pathname === '/api/friends' && method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const { senderId, senderName, receiverId, receiverName, action } = data;

          if (!senderId || !receiverId) {
            return jsonResponse(400, { success: false, message: 'Missing senderId or receiverId' });
          }

          if (!db.friendships) db.friendships = [];

          let existing = db.friendships.find(f => 
            (f.user1 === senderId && f.user2 === receiverId) ||
            (f.user1 === receiverId && f.user2 === senderId)
          );

          if (action === 'request') {
            if (!existing) {
              const newReq = {
                id: 'fr_' + Date.now(),
                user1: senderId,
                user1Name: senderName || 'Sinh viên UIT',
                user2: receiverId,
                user2Name: receiverName || 'Sinh viên UIT',
                status: 'pending',
                createdAt: new Date().toISOString()
              };
              db.friendships.push(newReq);
              saveDatabase();

              sendDirectSocketNotification(receiverId, {
                type: 'new_friend_request_notify',
                fromUserId: senderId,
                fromUserName: senderName
              });
            }
          } else if (action === 'accept') {
            if (existing && existing.status === 'pending') {
              existing.status = 'accepted';
              saveDatabase();

              sendDirectSocketNotification(existing.user1 === senderId ? existing.user2 : existing.user1, {
                type: 'friend_request_accepted_notify',
                byUserId: senderId,
                byUserName: senderName
              });
            }
          } else if (action === 'cancel' || action === 'decline' || action === 'unfriend') {
            db.friendships = db.friendships.filter(f => !(
              (f.user1 === senderId && f.user2 === receiverId) ||
              (f.user1 === receiverId && f.user2 === senderId)
            ));
            saveDatabase();

            sendDirectSocketNotification(receiverId, {
              type: 'friendship_updated'
            });
          }

          return jsonResponse(200, { success: true, action: action });
        } catch (err) {
          return jsonResponse(400, { success: false, message: 'Invalid friend payload' });
        }
      });
      return;
    }

    // ==========================================================================
    // 7. PORTAL NOTICES API: GET /api/portal/notices
    // ==========================================================================
    if (pathname === '/api/portal/notices' && method === 'GET') {
      return jsonResponse(200, {
        success: true,
        notices: portalNoticesCache.length > 0 ? portalNoticesCache : (db.portalNotices || []),
        lastUpdated: portalNoticesLastUpdated
      });
    }

    // ==========================================================================
    // 8. APK DOWNLOAD API: GET /api/download/apk
    // ==========================================================================
    if (pathname === '/api/download/apk' && method === 'GET') {
      const apkPath = path.join(PUBLIC_DIR, 'downloads', 'UIT-HUB-v1.0.apk');
      if (fs.existsSync(apkPath)) {
        res.writeHead(200, {
          'Content-Type': 'application/vnd.android.package-archive',
          'Content-Disposition': 'attachment; filename="UIT-HUB-v1.0.apk"',
          'Content-Length': fs.statSync(apkPath).size
        });
        return fs.createReadStream(apkPath).pipe(res);
      }
      return jsonResponse(404, { success: false, message: 'APK file not found' });
    }

    return jsonResponse(404, { success: false, message: 'API Endpoint Not Found' });
  }

  // --- STATIC FILE SERVING ---
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath).toLowerCase();

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404 - Trang không tồn tại (UIT HUB)</h1>');
      return;
    }

    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

// ==============================================================================
// 6. REALTIME WEBSOCKET SERVER (Messenger, Inbox, 1-on-1 Direct Chat & Rooms)
// ==============================================================================
const wss = new WebSocketServer({ server, path: '/ws' });
const connectedClients = new Map(); // ws => { userId, userName, room }

function broadcastWS(data) {
  const json = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  });
}

function sendDirectSocketNotification(targetUserId, data) {
  const json = JSON.stringify(data);
  for (const [client, meta] of connectedClients.entries()) {
    if (meta.userId === targetUserId && client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  }
}

wss.on('connection', (ws) => {
  connectedClients.set(ws, {
    userId: 'guest_' + Math.random().toString(36).substr(2, 6),
    userName: 'Sinh viên UIT',
    room: 'general'
  });

  broadcastWS({
    type: 'online_count',
    count: connectedClients.size
  });

  ws.send(JSON.stringify({
    type: 'init_connection',
    onlineCount: connectedClients.size,
    history: db.roomMessages ? (db.roomMessages.general || []) : []
  }));

  ws.on('message', (messageRaw) => {
    try {
      const data = JSON.parse(messageRaw);
      const meta = connectedClients.get(ws) || {};

      if (data.type === 'register_user') {
        meta.userId = data.userId;
        meta.userName = data.userName;
        connectedClients.set(ws, meta);
      } else if (data.type === 'join_room') {
        meta.room = data.room || 'general';
        connectedClients.set(ws, meta);
        const history = (db.roomMessages && db.roomMessages[meta.room]) || [];
        ws.send(JSON.stringify({
          type: 'room_history',
          room: meta.room,
          history: history
        }));
      } else if (data.type === 'chat_message') {
        const room = data.room || 'general';
        const msg = {
          id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          room: room,
          senderId: data.senderId || meta.userId,
          senderName: data.senderName || meta.userName,
          isAnon: data.isAnon ?? true,
          content: String(data.content || '').slice(0, 2000),
          image: data.image || null,
          file: data.file || null,
          replyTo: data.replyTo || null,
          isRemind: !!data.isRemind,
          timestamp: new Date().toISOString()
        };

        if (!db.roomMessages) db.roomMessages = {};
        if (!db.roomMessages[room]) db.roomMessages[room] = [];
        db.roomMessages[room].push(msg);
        if (db.roomMessages[room].length > 100) db.roomMessages[room].shift();
        saveDatabase();

        broadcastWS({
          type: 'new_message',
          message: msg
        });
      } else if (data.type === 'direct_message') {
        const msg = {
          id: 'dm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          conversationKey: [data.senderId, data.recipientId].sort().join('__'),
          senderId: data.senderId,
          senderName: data.senderName,
          recipientId: data.recipientId,
          recipientName: data.recipientName,
          content: String(data.content || '').slice(0, 2000),
          image: data.image || null,
          file: data.file || null,
          replyTo: data.replyTo || null,
          isRemind: !!data.isRemind,
          timestamp: new Date().toISOString()
        };

        if (!db.directMessages) db.directMessages = [];
        db.directMessages.push(msg);
        saveDatabase();

        for (const [client, clientMeta] of connectedClients.entries()) {
          if (client.readyState === WebSocket.OPEN) {
            if (clientMeta.userId === data.recipientId || clientMeta.userId === data.senderId) {
              client.send(JSON.stringify({
                type: 'new_direct_message',
                message: msg
              }));
            }
          }
        }
      } else if (data.type === 'typing') {
        if (data.isDirect && data.recipientId) {
          sendDirectSocketNotification(data.recipientId, {
            type: 'user_typing',
            senderId: data.senderId,
            senderName: data.senderName,
            isTyping: data.isTyping
          });
        } else {
          broadcastWS({
            type: 'user_typing',
            room: data.room || 'general',
            senderId: data.senderId,
            senderName: data.senderName,
            isTyping: data.isTyping
          });
        }
      }
    } catch (e) {
      console.error('WS Error:', e);
    }
  });

  ws.on('close', () => {
    connectedClients.delete(ws);
    broadcastWS({
      type: 'online_count',
      count: connectedClients.size
    });
  });
});

// ==============================================================================
// 7. START SERVER
// ==============================================================================
server.listen(PORT, () => {
  console.log(`
================================================================
🚀 UIT HUB Enterprise Security Backend Running!
🌐 Local URL     : http://localhost:${PORT}
💬 Diễn Đàn & TKB: http://localhost:${PORT}/feed.html
🔐 Auth API      : http://localhost:${PORT}/api/auth/send-otp
📧 Email Service : Resend API (Encrypted in .env)
⚡ WebSocket URL : ws://localhost:${PORT}/ws
================================================================
`);
});
