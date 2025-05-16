const axios = require("axios");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = "Yudzxml/WebClientV1";
const FILE_PATH = "panelDatabase.json";
const BRANCH = "main";
const FILE_URL = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;

if (!GITHUB_TOKEN) {
  throw new Error("GITHUB_TOKEN environment variable is required");
}

async function fetchData() {
  try {
    const res = await axios.get(FILE_URL, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
    });
    const content = JSON.parse(Buffer.from(res.data.content, "base64").toString());
    return { json: content, sha: res.data.sha };
  } catch (error) {
    console.error("Error fetching data from GitHub:", error.response?.data || error.message);
    throw error;
  }
}

async function writeData(data, sha, message) {
  try {
    const encoded = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");
    const res = await axios.put(
      FILE_URL,
      {
        message,
        content: encoded,
        sha,
        branch: BRANCH,
      },
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
        },
      }
    );
    return res.data;
  } catch (error) {
    console.error("Error writing data to GitHub:", error.response?.data || error.message);
    throw error;
  }
}

async function ensureUserExists(username, password) {
  const { json, sha } = await fetchData();
  if (!json[username]) {
    json[username] = {
      UserPassword: password,
      ListPanel: [],
    };
    await writeData(json, sha, `Register new user ${username}`);
  } else if (json[username].UserPassword !== password) {
    throw new Error("Password mismatch");
  }
  return json[username];
}

async function getUserPanels(username, password) {
  const { json } = await fetchData();
  if (!json[username] || json[username].UserPassword !== password) {
    throw new Error("Unauthorized");
  }
  if (!Array.isArray(json[username].ListPanel)) {
    json[username].ListPanel = [];
  }
  return json[username].ListPanel;
}

module.exports = {
  ensureUserExists,
  getUserPanels,
};