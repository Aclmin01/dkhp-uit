const fs = require("fs");
const path = require("path");

function getDB() {
  try {
    const dbPath = path.join(process.cwd(), "social_db.json");
    if (fs.existsSync(dbPath)) {
      return JSON.parse(fs.readFileSync(dbPath, "utf8"));
    }
  } catch (e) {}
  return { portalNotices: [] };
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const db = getDB();
  const notices = db.portalNotices || [];
  return res.status(200).json({
    success: true,
    notices: notices,
    lastUpdated: new Date().toISOString()
  });
};
