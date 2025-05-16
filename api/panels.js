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
    // Ambil file dari GitHub
    const repoUrl = "https://raw.githubusercontent.com/Yudzxml/WebClientV1/refs/heads/main/panelDatabase.json";
    const response = await axios.get(repoUrl);

    const data = response.data;

    if (!data[username]) {
      return res.status(200).json([]); // User belum punya panel
    }

    const panels = data[username].ListPanel || [];

    return res.status(200).json(panels);
  } catch (err) {
    console.error("Error fetching panel data:", err.message);
    return res.status(500).json({ message: "Failed to load panel data" });
  }
};