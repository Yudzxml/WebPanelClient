const updateGithubPanel = require("../server/updateGithubPanel");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const body = await parseBody(req);
    const { username, password, changeDays } = body;

    if (!username || (changeDays == null && !password)) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const parsedDays = parseInt(changeDays);
    const validChange = !isNaN(parsedDays) ? parsedDays : 0;

    await updateGithubPanel(username, password, validChange, "updateUser");

    return res.status(200).json({
      message: "User updated successfully",
      user: username,
      updatedFields: {
        ...(password && { password }),
        ...(changeDays != null && { changeDays: validChange }),
      },
    });
  } catch (err) {
    console.error("Update user error:", err);
    return res.status(500).json({ message: "Failed to update user", error: err.message });
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