const axios = require("axios");
const updateGithubPanel = require("../server/updateGithubPanel");

module.exports = async (req, res) => {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  const body = await parseBody(req);
  const { username, password, panelData } = body;

  if (!username || !password || !panelData || typeof panelData !== 'object') {
    return res.status(400).json({ message: "Missing or invalid required fields" });
  }

  try {
    const params = new URLSearchParams();
    params.append("username", username);
    params.append("password", password);

    // Pastikan panelData tidak mengandung username dan password lagi
    for (const key in panelData) {
      if (key !== "username" && key !== "password") {
        params.append(key, panelData[key]);
      }
    }

    // Log data yang dikirim ke API eksternal untuk debugging
    console.log("Sending data to external API:", params.toString());

    const apiRes = await axios.post(
      "https://api-yudzxzy.x-server.my.id/api/panelHandler/create-panel",
      params.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        validateStatus: () => true // supaya axios tidak throw otomatis untuk status >=400
      }
    );

    if (apiRes.status !== 200) {
      console.error("External API error response:", apiRes.data);
      return res.status(apiRes.status).json({ message: "External API error", details: apiRes.data });
    }

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