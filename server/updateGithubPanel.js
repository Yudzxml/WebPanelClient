const axios = require("axios");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = "Yudzxml/WebClientV1";
const FILE_PATH = "panelDatabase.json";
const BRANCH = "main";
const FILE_URL = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;

if (!GITHUB_TOKEN) {
  throw new Error("GITHUB_TOKEN environment variable is required");
}

async function getFileContent() {
  const res = await axios.get(FILE_URL, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
    },
  });
  return res.data;
}

async function updateGithubPanel(username, password, panelData, action) {
  try {
    const file = await getFileContent();
    const contentJson = JSON.parse(Buffer.from(file.content, "base64").toString());

    if (!contentJson[username]) {
      contentJson[username] = { UserPassword: password, ListPanel: [] };
    } else if (!Array.isArray(contentJson[username].ListPanel)) {
      contentJson[username].ListPanel = [];
    }

    if (action === "add") {
      // Cek duplikat berdasarkan serverId
      const exists = contentJson[username].ListPanel.some(
        (panel) => panel.serverId === panelData.serverId
      );
      if (!exists) {
        contentJson[username].ListPanel.push(panelData);
      }
    } else if (action === "remove") {
      contentJson[username].ListPanel = contentJson[username].ListPanel.filter(
        (panel) => panel.serverId !== panelData.serverId
      );
    }

    const updatedContent = Buffer.from(JSON.stringify(contentJson, null, 2)).toString("base64");

    await axios.put(
      FILE_URL,
      {
        message: `${action} panel for ${username}`,
        content: updatedContent,
        sha: file.sha,
        branch: BRANCH,
      },
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
        },
      }
    );
  } catch (error) {
    console.error("Failed to update GitHub panel:", error.response?.data || error.message);
    throw error;
  }
}

module.exports = updateGithubPanel;