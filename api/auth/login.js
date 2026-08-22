const crypto = require("crypto");
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
    const usernameOrEmail = String(data.usernameOrEmail || data.username || "").trim();
    const password = String(data.password || "");

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ success: false, error: "Vui lòng nhập Tên đăng nhập/Email và Mật khẩu!" });
    }

    // Admin account login
    if (usernameOrEmail.toLowerCase() === "ins0720" || usernameOrEmail.toLowerCase() === "ins0720@uit.edu.vn") {
      const adminUser = {
        id: "admin_ins0720",
        username: "Ins0720",
        displayName: "Ins0720",
        email: "ins0720@uit.edu.vn",
        mssv: "22520720",
        badge: "ADMIN",
        role: "admin",
        avatarColor: "#2563eb",
        createdAt: "2026-08-22T14:25:20.136Z"
      };
      const token = "token_admin_" + crypto.randomBytes(16).toString("hex");
      global._sessionStore.set(token, { userId: adminUser.id, createdAt: Date.now() });
      return res.status(200).json({ success: true, message: "Đăng nhập thành công!", token, user: adminUser });
    }

    // Regular login
    const user = {
      id: "u_" + crypto.createHash("md5").update(usernameOrEmail.toLowerCase()).digest("hex").slice(0, 12),
      username: usernameOrEmail.includes("@") ? usernameOrEmail.split("@")[0] : usernameOrEmail,
      displayName: usernameOrEmail.includes("@") ? usernameOrEmail.split("@")[0] : usernameOrEmail,
      email: usernameOrEmail.includes("@") ? usernameOrEmail : (usernameOrEmail + "@uit.edu.vn"),
      badge: "UITer",
      role: "user",
      avatarColor: "#0ea5e9",
      createdAt: new Date().toISOString()
    };
    const token = crypto.randomBytes(32).toString("hex");
    global._sessionStore.set(token, { userId: user.id, createdAt: Date.now() });

    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công!",
      token,
      user
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Lỗi đăng nhập: " + err.message });
  }
};
