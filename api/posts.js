const fs = require("fs");
const path = require("path");

function getDB() {
  try {
    const dbPath = path.join(process.cwd(), "social_db.json");
    if (fs.existsSync(dbPath)) {
      return JSON.parse(fs.readFileSync(dbPath, "utf8"));
    }
  } catch (e) {}
  return { posts: [] };
}

module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  const db = getDB();
  if (req.method === "GET") {
    return res.status(200).json({ success: true, posts: db.posts || [] });
  }

  if (req.method === "POST") {
    const body = req.body || {};
    const newPost = {
      id: "post_" + Date.now(),
      title: body.title || "",
      content: body.content || "",
      category: body.category || "chat",
      authorId: body.authorId || "guest",
      author: body.author || "Sinh viên UIT",
      isAnonymous: !!body.isAnonymous,
      courseTag: body.courseTag || "",
      teacherTag: body.teacherTag || "",
      image: body.image || "",
      upvotes: 1,
      createdAt: new Date().toISOString(),
      comments: []
    };
    return res.status(200).json({ success: true, post: newPost });
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
};
