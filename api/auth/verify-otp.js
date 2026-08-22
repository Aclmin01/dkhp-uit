const crypto = require("crypto");
global._otpStore = global._otpStore || new Map();
global._userStore = global._userStore || new Map();
global._sessionStore = global._sessionStore || new Map();

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method not allowed" });

  try {
    const data = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const email = String(data.email || "").trim().toLowerCase();
    const otpCode = String(data.otpCode || "").trim();

    const record = global._otpStore.get(email);
    // Allow demo OTP 123456 or correct otpCode
    if (!record && otpCode !== "123456") {
      return res.status(400).json({ success: false, error: "Không tìm thấy yêu cầu xác thực hoặc mã đã hết hạn. Vui lòng thử lại!" });
    }

    if (record && record.otpCode !== otpCode && otpCode !== "123456") {
      return res.status(400).json({ success: false, error: "Mã xác thực OTP không chính xác. Vui lòng kiểm tra lại!" });
    }

    const userId = "u_" + crypto.randomBytes(6).toString("hex");
    const newUser = {
      id: userId,
      username: record ? record.username : email.split("@")[0],
      displayName: record ? record.displayName : email.split("@")[0],
      email: email,
      mssv: record ? record.mssv : "",
      badge: "UITer",
      role: "user",
      avatarColor: "#0ea5e9",
      createdAt: new Date().toISOString()
    };

    const token = crypto.randomBytes(32).toString("hex");
    global._userStore.set(userId, newUser);
    global._sessionStore.set(token, { userId, createdAt: Date.now() });

    if (record) global._otpStore.delete(email);

    return res.status(200).json({
      success: true,
      message: "🎉 Chúc mừng bạn đã đăng ký tài khoản UIT HUB thành công!",
      token,
      user: newUser
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Lỗi xác thực: " + err.message });
  }
};
