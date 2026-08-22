module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return res.status(401).json({ success: false, error: "Chưa đăng nhập" });
  }

  if (token.startsWith("token_admin_")) {
    return res.status(200).json({
      success: true,
      user: {
        id: "admin_ins0720",
        username: "Ins0720",
        displayName: "Ins0720",
        email: "ins0720@uit.edu.vn",
        mssv: "22520720",
        badge: "ADMIN",
        role: "admin",
        avatarColor: "#2563eb"
      }
    });
  }

  return res.status(200).json({
    success: true,
    user: {
      id: "u_member",
      username: "Sinh viên UIT",
      displayName: "Sinh viên UIT",
      email: "sinhvien@uit.edu.vn",
      badge: "UITer",
      role: "user",
      avatarColor: "#0ea5e9"
    }
  });
};
