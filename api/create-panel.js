const axios = require("axios");
const updateGithubPanel = require("../server/updateGithubPanel");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  const body = await parseBody(req);
  const { username, password, panelData } = body;

  try {
    const apiRes = await axios.post(
      "https://api-yudzxzy.x-server.my.id/api/panelHandler/create-panel",
      new URLSearchParams(panelData),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );
    const createdPanel = apiRes.data;
    await updateGithubPanel(username, password, createdPanel, "add");
    res.status(200).json({ message: "Panel created and saved", panel: createdPanel });
  } catch (err) {
    console.error("Create panel error:", err);
    res.status(500).json({ message: "Create failed", error: err.message });
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