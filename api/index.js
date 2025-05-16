// api/index.js
const axios = require("axios");
const updateGithubPanel = require("../server/updateGithubPanel");
const { getUserPanels, ensureUserExists } = require("../server/utils");

module.exports = async (req, res) => {
  const { method, url } = req;
  const path = url.replace(/^\/api/, "");
  const body = await parseBody(req);

  // Parse cookie
  const cookies = parseCookies(req.headers.cookie || "");
  const user = cookies.user ? JSON.parse(cookies.user) : null;

  if (method === "POST" && path === "/login") {
    const { username, password } = body;
    try {
      const result = await ensureUserExists(username, password);
      res.setHeader("Set-Cookie", `user=${JSON.stringify({ username, password })}; Path=/; HttpOnly`);
      return res.status(200).json({ message: "Login successful", data: result });
    } catch (err) {
      return res.status(500).json({ message: "Login failed", error: err.message });
    }
  }

  if (method === "GET" && path === "/panels") {
    try {
      if (!user) throw new Error("Unauthorized");
      const panels = await getUserPanels(user.username, user.password);
      return res.status(200).json(panels);
    } catch (err) {
      return res.status(401).json({ message: "Unauthorized or error", error: err.message });
    }
  }

  if (method === "POST" && path === "/create-panel") {
    const { username, password, panelData } = body;
    try {
      const apiRes = await axios.post(
        "https://api-yudzxzy.x-server.my.id/api/panelHandler/create-panel",
        new URLSearchParams(panelData),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      const createdPanel = apiRes.data;
      await updateGithubPanel(username, password, createdPanel, "add");
      return res.status(200).json({ message: "Panel created and saved", panel: createdPanel });
    } catch (err) {
      return res.status(500).json({ message: "Create failed", error: err.message });
    }
  }

  if (method === "POST" && path === "/delete-panel") {
    const { username, password, userId, serverId } = body;
    try {
      await axios.post(
        "https://api-yudzxzy.x-server.my.id/api/panelHandler/delete-panel",
        new URLSearchParams({ userId, serverId }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      await updateGithubPanel(username, password, { serverId }, "remove");
      return res.status(200).json({ message: "Panel deleted and updated" });
    } catch (err) {
      return res.status(500).json({ message: "Delete failed", error: err.message });
    }
  }

  res.status(404).json({ message: "Not Found" });
};

// Helper: Body parser
function parseBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        resolve({});
      }
    });
  });
}

// Helper: Cookie parser
function parseCookies(cookieHeader) {
  const cookies = {};
  cookieHeader.split(";").forEach(cookie => {
    const [name, ...rest] = cookie.trim().split("=");
    cookies[name] = decodeURIComponent(rest.join("="));
  });
  return cookies;
