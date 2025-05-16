const axios = require("axios");
const updateGithubPanel = require("../server/updateGithubPanel");

module.exports = async (req, res) => {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  const body = await parseBody(req);
  const { username, password, panelData } = body;

  if (!username || !password || !panelData) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Membuat URLSearchParams dengan gabungan username, password, dan panelData
    const params = new URLSearchParams();
    params.append("username", username);
    params.append("password", password);

    for (const key in panelData) {
      params.append(key, panelData[key]);
    }

    // Kirim request POST ke API eksternal
    const apiRes = await axios.post(
      "https://api-yudzxzy.x-server.my.id/api/panelHandler/create-panel",
      params.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    if (apiRes.status !== 200) {
      throw new Error("API external gagal membuat panel");
    }

    const createdPanel = apiRes.data;

    // Simpan data panel ke GitHub atau database
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