const axios = require("axios");
const updateGithubPanel = require("../server/updateGithubPanel");

module.exports = async (req, res) => {
  if (req.method !== "POST") 
    return res.status(405).json({ message: "Method not allowed" });

  const body = await parseBody(req);
  const { username, password, userId, serverId } = body;

  if (!username || !password || !userId || !serverId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const params = new URLSearchParams({ userId, serverId });

    const apiRes = await axios.post(
      "https://api-yudzxzy.x-server.my.id/api/panelHandler/delete-panel",
      params.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    if (apiRes.status !== 200) {
      throw new Error("Failed to delete panel on external API");
    }

    await updateGithubPanel(username, password, { serverId }, "remove");

    res.status(200).json({ message: "Panel deleted and updated" });
  } catch (err) {
    console.error("Delete panel error:", err);
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
};

function parseBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}