const axios = require("axios");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = "Yudzxml/WebClientV1";
const FILE_PATH = "panelDatabase.json";
const BRANCH = "main";
const FILE_URL = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const file = await axios.get(FILE_URL, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
    });

    const contentJson = JSON.parse(
      Buffer.from(file.data.content, "base64").toString()
    );

    const users = Object.entries(contentJson).map(([username, data]) => ({
      username,
      password: data.UserPassword || null,
      totalPanel: Array.isArray(data.ListPanel) ? data.ListPanel.length : 0,
    }));

    res.status(200).json({ users });
  } catch (err) {
    console.error("List users error:", err.response?.data || err.message);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};