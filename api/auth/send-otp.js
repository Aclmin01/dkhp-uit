const https = require("https");
const crypto = require("crypto");

global._otpStore = global._otpStore || new Map();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getEmailHtml(name, code) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; margin: 0; padding: 24px; color: #f8fafc;">
      <div style="max-width: 480px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 32px; text-align: center;">
        <h1 style="color: #38bdf8; font-size: 26px; margin: 0 0 4px 0; font-weight: 800;">UIT HUB</h1>
        <p style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 24px 0;">Cộng Đồng Sinh Viên UIT</p>
        <p style="font-size: 15px; color: #f1f5f9; margin-bottom: 12px;">Xin chào <strong>${name}</strong>! 👋</p>
        <p style="font-size: 13.5px; color: #cbd5e1; line-height: 1.6; margin-bottom: 20px;">
          Mã xác thực OTP đăng ký tài khoản của bạn tại <strong>Cổng UIT HUB</strong> là:
        </p>
        <div style="background: #0f172a; border: 2px dashed #0284c7; border-radius: 12px; padding: 16px 24px; margin: 20px 0; display: inline-block;">
          <span style="font-size: 32px; font-weight: 800; color: #38bdf8; letter-spacing: 8px; font-family: monospace;">${code}</span>
        </div>
        <p style="font-size: 12px; color: #f59e0b; margin-top: 16px;">⏱️ Mã này có hiệu lực trong <strong>5 phút</strong>. Tuyệt đối không chia sẻ cho người khác.</p>
        <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #334155; font-size: 11px; color: #64748b;">
          © 2026 UIT HUB • Trường Đại học Công nghệ Thông tin - ĐHQG TP.HCM
        </div>
      </div>
    </body>
    </html>
  `;
}

function sendViaBrevo(apiKey, toEmail, otpCode, displayName) {
  return new Promise((resolve) => {
    if (!apiKey) return resolve({ success: false, reason: "NO_BREVO_KEY" });

    const payload = JSON.stringify({
      sender: { name: "UIT HUB", email: process.env.BREVO_SENDER || "doanquanghoa007@gmail.com" },
      to: [{ email: toEmail, name: displayName }],
      subject: `[UIT HUB] Mã xác thực OTP đăng ký tài khoản: ${otpCode}`,
      htmlContent: getEmailHtml(displayName, otpCode)
    });

    const req = https.request({
      hostname: "api.brevo.com",
      port: 443,
      path: "/v3/smtp/email",
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, provider: "BREVO", data });
        } else {
          console.warn("Brevo API warning:", res.statusCode, data);
          resolve({ success: false, statusCode: res.statusCode, body: data });
        }
      });
    });
    req.on("error", e => resolve({ success: false, error: e.message }));
    req.write(payload);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method not allowed" });

  try {
    const data = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const email = String(data.email || "").trim().toLowerCase();
    const username = String(data.username || "").trim();
    const password = String(data.password || "");
    const displayName = String(data.displayName || username).trim();
    const mssv = String(data.mssv || "").trim();

    if (!email || !username || !password) {
      return res.status(400).json({ success: false, error: "Vui lòng điền đầy đủ Email, Tên đăng nhập và Mật khẩu!" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: "Địa chỉ Email không đúng định dạng!" });
    }

    if (username.length < 3) {
      return res.status(400).json({ success: false, error: "Tên đăng nhập phải từ 3 ký tự trở lên!" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: "Mật khẩu phải từ 6 ký tự trở lên!" });
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const pHash = crypto.createHash("sha512").update(password + salt).digest("hex");
    const otpCode = generateOTP();

    global._otpStore.set(email, {
      email,
      username,
      displayName: displayName || username,
      mssv,
      passwordHash: pHash,
      passwordSalt: salt,
      otpCode,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0,
      lastSentAt: Date.now()
    });

    const brevoKey = process.env.BREVO_API_KEY || "";
    const sent = await sendViaBrevo(brevoKey, email, otpCode, displayName || username);

    return res.status(200).json({
      success: true,
      message: `Mã xác thực 6 số đã được gửi trực tiếp đến email ${email}. Vui lòng kiểm tra hộp thư!`,
      email,
      delivered: sent.success
    });
  } catch (err) {
    console.error("send-otp error:", err);
    return res.status(500).json({ success: false, error: "Lỗi máy chủ khi tạo mã OTP: " + err.message });
  }
};
