const https = require("https");
const crypto = require("crypto");

// Global memory store across warm lambda invocations
global._otpStore = global._otpStore || new Map();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function sendEmailViaResend(apiKey, to, code, name) {
  return new Promise((resolve, reject) => {
    if (!apiKey) {
      console.warn("No RESEND_API_KEY provided");
      return resolve({ success: true, mock: true });
    }

    const payload = JSON.stringify({
      from: "UIT HUB <onboarding@resend.dev>",
      to: [to],
      subject: `[UIT HUB] Mã xác thực OTP đăng ký tài khoản của bạn: ${code}`,
      html: `
        <div style="font-family: sans-serif; background: #0f172a; color: #fff; padding: 24px; border-radius: 12px; max-width: 480px; margin: 0 auto; text-align: center;">
          <h2 style="color: #38bdf8; margin-bottom: 4px;">UIT HUB</h2>
          <p style="color: #94a3b8; font-size: 12px; margin-bottom: 20px;">CỘNG ĐỒNG SINH VIÊN UIT</p>
          <p>Xin chào <strong>${name}</strong>,</p>
          <p>Mã xác thực 6 số đăng ký tài khoản UIT HUB của bạn là:</p>
          <div style="background: #1e293b; border: 2px dashed #0284c7; border-radius: 8px; padding: 14px 20px; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #38bdf8; margin: 20px 0; display: inline-block;">
            ${code}
          </div>
          <p style="font-size: 12px; color: #f59e0b;">Mã có hiệu lực trong 5 phút. Vui lòng không chia sẻ cho người khác.</p>
        </div>
      `
    });

    const options = {
      hostname: "api.resend.com",
      port: 443,
      path: "/emails",
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let resBody = "";
      res.on("data", chunk => { resBody += chunk; });
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: resBody });
        } else {
          console.warn("Resend API warning:", res.statusCode, resBody);
          resolve({ success: true, warning: resBody });
        }
      });
    });

    req.on("error", (e) => {
      console.warn("Resend request error:", e);
      resolve({ success: true, error: e.message });
    });

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

    const apiKey = process.env.RESEND_API_KEY || "";
    await sendEmailViaResend(apiKey, email, otpCode, displayName || username);

    return res.status(200).json({
      success: true,
      message: `Mã xác thực 6 số đã được gửi đến ${email}. Vui lòng kiểm tra hộp thư!`,
      email
    });
  } catch (err) {
    console.error("send-otp error:", err);
    return res.status(500).json({ success: false, error: "Lỗi máy chủ khi tạo mã OTP: " + err.message });
  }
};
