const { ensureUserExists } = require("../server/utils");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  const body = await parseBody(req);
  const { username, password } = body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username dan password wajib diisi" });
  }

  try {
    const result = await ensureUserExists(username, password);

    // Encode JSON string agar aman di cookie
    const userCookieValue = encodeURIComponent(JSON.stringify({ username, password }));

    // Set cookie tanpa HttpOnly supaya bisa dibaca di frontend
    res.setHeader(
      "Set-Cookie",
      `user=${userCookieValue}; Path=/; SameSite=Lax`
    );

    res.status(200).json({ message: "Login successful", data: result });
  } catch (err) {
    console.error("Login error:", err);
    res.status(401).json({ message: "Login failed", error: err.message });
  }
};

function parseBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", chunk => (body += chunk.toString()));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}