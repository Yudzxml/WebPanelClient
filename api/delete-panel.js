const axios = require("axios");
const updateGithubPanel = require("../server/updateGithubPanel");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const body = await parseBody(req);
    const { username, password, userId, serverId } = body;

    if (!username || !password || !userId || !serverId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const params = new URLSearchParams({ userId, serverId });

    const apiRes = await axios.post(
      "https://api-yudzxzy.x-server.my.id/api/panelHandler/delete-panel",
      params.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        validateStatus: () => true,
      }
    );

    if (apiRes.status !== 200) {
      console.error("External API error response:", apiRes.data);
      return res
        .status(apiRes.status)
        .json({ message: "Failed to delete panel on external API", details: apiRes.data });
    }

    // Kirim serverId dan userId supaya hanya panel yang sesuai yang dihapus
    await updateGithubPanel(username, password, { serverId, userId }, "remove");

    return res.status(200).json({ message: "Panel deleted and updated" });
  } catch (err) {
    console.error("Delete panel error:", err);
    return res.status(500).json({ message: "Delete failed", error: err.message });
  }
};

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", (err) => reject(err));
  });
}