const updateGithubPanel = require("../server/updateGithubPanel");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const body = await parseBody(req);
    const { username, password, activeDays } = body;

    if (!username || !password || !activeDays || isNaN(activeDays) || activeDays <= 0) {
      return res.status(400).json({ message: "Missing or invalid fields" });
    }

    const expiredAt = Date.now() + activeDays * 86400000;

    await updateGithubPanel(username, password, expiredAt, "addUser");

    return res.status(200).json({ message: "User successfully added", user: username });
  } catch (err) {
    console.error("Add user error:", err);
    return res.status(500).json({ message: "Failed to add user", error: err.message });
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