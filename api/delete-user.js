const updateGithubPanel = require("../server/updateGithubPanel");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const body = await parseBody(req);
    const { username } = body;

    if (!username) {
      return res.status(400).json({ message: "Missing username" });
    }

    await updateGithubPanel(username, null, null, "deleteUser");

    res.status(200).json({ message: `User '${username}' deleted successfully` });
  } catch (err) {
    console.error("Delete user error:", err.message);
    res.status(500).json({ message: "Failed to delete user", error: err.message });
  }
};

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => (body += chunk.toString()));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}