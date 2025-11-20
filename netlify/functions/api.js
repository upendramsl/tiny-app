const serverless = require("serverless-http");
const express = require("express");
const { neon } = require("@neondatabase/serverless");
const { randomBytes } = require("crypto");

const app = express();
app.use(express.json());

const sql = neon(process.env.DATABASE_URL);

function generateCode() {
  const length = Math.floor(Math.random() * 3) + 6; // 6-8
  return randomBytes(length).toString('base64url').slice(0, length);
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// API routes
app.get("/api/links", async (req, res) => {
  try {
    const links = await sql`SELECT * FROM link ORDER BY "createdAt" DESC`;
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch links' });
  }
});

app.post("/api/links", async (req, res) => {
  try {
    const { url, code } = req.body;

    if (!url || !isValidUrl(url)) {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    let finalCode = code;
    if (!finalCode) {
      finalCode = generateCode();
    } else {
      if (!/^[A-Za-z0-9]{6,8}$/.test(finalCode)) {
        return res.status(400).json({ error: 'Invalid code format' });
      }
    }

    // Check uniqueness
    const existing = await sql`SELECT * FROM link WHERE code = ${finalCode}`;
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Code already exists' });
    }

    const link = await sql`INSERT INTO link (code, url) VALUES (${finalCode}, ${url}) RETURNING *`;

    res.status(201).json(link[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create link' });
  }
});

app.get("/api/links/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const links = await sql`SELECT * FROM link WHERE code = ${code}`;
    if (links.length === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }
    res.json(links[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch link' });
  }
});

app.delete("/api/links/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const links = await sql`SELECT * FROM link WHERE code = ${code}`;
    if (links.length === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }
    await sql`DELETE FROM link WHERE code = ${code}`;
    res.json({ message: 'Link deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete link' });
  }
});

// Redirect route
app.get("/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const links = await sql`SELECT * FROM link WHERE code = ${code}`;
    if (links.length === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }
    const link = links[0];

    // Increment clicks and update lastClick
    await sql`UPDATE link SET clicks = clicks + 1, "lastClick" = NOW() WHERE code = ${code}`;

    res.redirect(302, link.url);
  } catch (error) {
    res.status(500).json({ error: 'Failed to redirect' });
  }
});

// Health check
app.get("/healthz", (req, res) => {
  res.json({ status: 'ok' });
});

module.exports.handler = serverless(app);