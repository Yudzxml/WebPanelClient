const axios = require("axios");
const updateGithubPanel = require("../server/updateGithubPanel");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const body = await parseBody(req);
    const { username, password, panelData } = body;

    if (
      !username ||
      !password ||
      !panelData ||
      typeof panelData !== "object" ||
      Array.isArray(panelData)
    ) {
      return res
        .status(400)
        .json({ message: "Missing or invalid required fields" });
    }

    // Siapkan parameter POST ke API eksternal
    const filteredPanelData = {};
    for (const key in panelData) {
      if (key !== "username" && key !== "password") {
        filteredPanelData[key] = panelData[key];
      }
    }

    const params = new URLSearchParams(filteredPanelData);
    params.append("username", username);
    params.append("password", password);

    console.log("Sending data to external API:", params.toString());

    const apiRes = await axios.post(
      "https://api-yudzxzy.x-server.my.id/api/panelHandler/create-panel",
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
        .json({ message: "External API error", details: apiRes.data });
    }

    const createdPanel = apiRes.data;

    // Pastikan username dan password sesuai input (bukan dari API response)
    createdPanel.username = username;
    createdPanel.password = password;

    await updateGithubPanel(username, password, createdPanel, "add");

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