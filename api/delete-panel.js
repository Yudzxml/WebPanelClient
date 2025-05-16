const axios = require("axios");
const updateGithubPanel = require("../server/updateGithubPanel");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  const body = await parseBody(req);
  const { username, password, userId, serverId } = body;

  try {
    await axios.post(
      "https://api-yudzxzy.x-server.my.id/api/panelHandler/delete-panel",
      new URLSearchParams({ userId, serverId }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );
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
    req.on("data", chunk => body += chunk.toString());
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}