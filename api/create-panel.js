const axios = require("axios");
const updateGithubPanel = require("../server/updateGithubPanel");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const body = await parseBody(req);
    const { github, panelData } = body;

    if (
      !github?.username ||
      !github?.password ||
      !panelData ||
      typeof panelData !== "object" ||
      Array.isArray(panelData)
    ) {
      return res.status(400).json({ message: "Missing or invalid required fields" });
    }

    // Kirim hanya panelData ke API eksternal
    console.log("Sending JSON to external API:", panelData);

    const apiRes = await axios.post(
      "https://api-yudzxzy.x-server.my.id/api/panelHandler/create-panel",
      panelData,
      {
        headers: { "Content-Type": "application/json" },
        validateStatus: () => true,
      }
    );

    if (apiRes.status !== 200) {
      console.error("External API error response:", apiRes.data);
      return res
        .status(apiRes.status)
        .json({ message: "External API error", details: apiRes.data });
    }

    const createdPanel = {
      ...apiRes.data,
      username: panelData.username,
      email: panelData.email || `${panelData.username}@gmail.com`,
      password: panelData.password,
    };

    // Simpan ke GitHub
    await updateGithubPanel(github.username, github.password, createdPanel, "add");

    return res
      .status(200)
      .json({ message: "Panel created and saved", panel: createdPanel });

  } catch (err) {
    console.error("Create panel error:", err);
    return res.status(500).json({ message: "Create failed", error: err.message });
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