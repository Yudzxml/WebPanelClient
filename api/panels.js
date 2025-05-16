const axios = require("axios");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const cookie = req.headers.cookie || "";
  const match = cookie.match(/user=([^;]+)/);
  if (!match) {
    return res.status(401).json({ message: "Not logged in" });
  }

  let user;
  try {
    user = JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return res.status(400).json({ message: "Invalid cookie" });
  }

  const { username, password } = user;
  if (!username || !password) {
    return res.status(400).json({ message: "Missing credentials" });
  }

  try {
    // Ambil file langsung dari GitHub (tanpa cache)
    const repoUrl = "https://api.github.com/repos/Yudzxml/WebClientV1/contents/panelDatabase.json";
    const response = await axios.get(repoUrl, {
      headers: {
        "Accept": "application/vnd.github.v3.raw"
      }
    });

    const data = response.data;

    if (!data[username]) {
      return res.status(200).json([]); // Belum ada panel untuk user ini
    }

    const panels = Array.isArray(data[username].ListPanel)
      ? data[username].ListPanel
      : [];

    return res.status(200).json(panels);
  } catch (err) {
    console.error("Error fetching panel data:", err.message);
    return res.status(500).json({ message: "Failed to load panel data" });
  }
};