const { ensureUserExists } = require("../server/utils");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  const body = await parseBody(req);
  const { username, password } = body;

  try {
    const result = await ensureUserExists(username, password);
    res.setHeader(
      "Set-Cookie",
      `user=${JSON.stringify({ username, password })}; Path=/; HttpOnly`
    );
    res.status(200).json({ message: "Login successful", data: result });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed", error: err.message });
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