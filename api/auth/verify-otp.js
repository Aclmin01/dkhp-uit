const crypto = require("crypto");

const OTP_SECRET = process.env.SESSION_SECRET || "uithub_enterprise_cryptographic_secret_2026_uit_dkhp";

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
    const otpTicket = String(data.otpTicket || "").trim();

    if (!email || !otpCode) {
      return res.status(400).json({ success: false, error: "Vui lòng nhập đầy đủ email và mã xác thực 6 số!" });
    }

    let username = email.split("@")[0];
    let displayName = username;
    let mssv = "";
    let isValid = false;

    // 1. Verify via HMAC Cryptographic Ticket
    if (otpTicket) {
      try {
        const ticketJson = Buffer.from(otpTicket, "base64").toString("utf8");
        const ticket = JSON.parse(ticketJson);

        if (ticket && ticket.email === email) {
          if (Date.now() > ticket.expiresAt) {
            return res.status(400).json({ success: false, error: "Mã xác thực đã hết hạn (quá 5 phút). Vui lòng yêu cầu gửi lại mã mới!" });
          }

          const expectedSig = crypto.createHmac("sha256", OTP_SECRET)
            .update(`${email}:${otpCode}:${ticket.expiresAt}:${ticket.username}:${ticket.displayName}:${ticket.mssv}:${ticket.pHash}:${ticket.salt}`)
            .digest("hex");

          if (ticket.sig === expectedSig) {
            isValid = true;
            username = ticket.username || username;
            displayName = ticket.displayName || displayName;
            mssv = ticket.mssv || mssv;
          }
        }
      } catch (err) {
        console.warn("Invalid ticket decode:", err.message);
      }
    }

    // 2. Demo bypass fallback
    if (otpCode === "123456") {
      isValid = true;
    }

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: "⚠️ Mã xác thực OTP không chính xác. Vui lòng kiểm tra lại email hoặc bấm gửi lại mã mới!"
      });
    }

    const userId = "u_" + crypto.createHash("md5").update(username.toLowerCase()).digest("hex").slice(0, 12);
    const newUser = {
      id: userId,
      username: username,
      displayName: displayName || username,
      email: email,
      mssv: mssv,
      badge: "UITer",
      role: "user",
      avatarColor: "#0ea5e9",
      createdAt: new Date().toISOString()
    };

    const token = "tok_" + crypto.randomBytes(24).toString("hex");

    return res.status(200).json({
      success: true,
      message: "🎉 Chúc mừng bạn đã đăng ký tài khoản UIT HUB thành công!",
      token,
      user: newUser
    });
  } catch (err) {
    console.error("verify-otp error:", err);
    return res.status(500).json({ success: false, error: "Lỗi xác thực: " + err.message });
  }
};
