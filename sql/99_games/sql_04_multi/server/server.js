"use strict";

const express = require("express");
const { WebSocketServer } = require("ws");
const http = require("http");
const path = require("path");

const PORT = process.env.PORT || 3000;
const COLS = 16;
const ROWS = 10;

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Serve static client files
app.use(express.static(path.join(__dirname, "../client")));

// Expose sql_04_co assets (staircase image + video) under /co-assets/
app.use("/co-assets", express.static(path.join(__dirname, "../../sql_04_co")));

// players: Map<id, { ws, name, floor, x, y }>
const players = new Map();

function genId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function sanitizeName(raw) {
  return String(raw || "Player")
    .replace(/[<>&"']/g, "")
    .trim()
    .slice(0, 20) || "Player";
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function snapshot(id) {
  const p = players.get(id);
  if (!p) return null;
  return { id, name: p.name, floor: p.floor, x: p.x, y: p.y };
}

function sendTo(ws, msg) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function broadcastExcept(senderId, msg) {
  const json = JSON.stringify(msg);
  for (const [id, p] of players) {
    if (id !== senderId && p.ws.readyState === p.ws.OPEN) {
      p.ws.send(json);
    }
  }
}

function removePlayer(id) {
  const existed = players.delete(id);
  if (existed) {
    broadcastExcept(id, { type: "player_leave", id });
  }
}

function pruneStalePlayers() {
  for (const [pid, p] of players.entries()) {
    if (!p || !p.ws || p.ws.readyState !== p.ws.OPEN) {
      removePlayer(pid);
    }
  }
}

wss.on("connection", (ws) => {
  const id = genId();

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    if (msg.type === "join") {
      pruneStalePlayers();

      // Reject duplicate join
      if (players.has(id)) return;

      const name = sanitizeName(msg.name);

      // Reject if name already taken by another connected player
      const nameTaken = [...players.values()].some(p => p.name.toLowerCase() === name.toLowerCase());
      if (nameTaken) {
        sendTo(ws, { type: "name_taken", name });
        return;
      }
      players.set(id, { ws, name, floor: 0, x: 0, y: 0 });

      // Send this player their id + all current peers
      const peers = [...players.entries()]
        .filter(([pid]) => pid !== id)
        .map(([pid]) => snapshot(pid))
        .filter(Boolean);

      sendTo(ws, { type: "init", id, peers });

      // Notify everyone else of the new player
      broadcastExcept(id, { type: "player_join", player: snapshot(id) });
      return;
    }

    if (msg.type === "move") {
      const p = players.get(id);
      if (!p) return;

      // Validate and clamp values
      const x = clamp(Math.round(Number(msg.x)), 0, COLS - 1);
      const y = clamp(Math.round(Number(msg.y)), 0, ROWS - 1);
      const floor = Math.max(0, Math.round(Number(msg.floor)));

      p.x = x;
      p.y = y;
      p.floor = floor;

      broadcastExcept(id, { type: "player_update", player: snapshot(id) });
      return;
    }

    if (msg.type === "game_event") {
      const p = players.get(id);
      if (!p) return;
      const allowed = ["ghost", "trophy", "win", "floor"];
      const ev = allowed.includes(msg.event) ? msg.event : null;
      if (!ev) return;
      const floor = Math.max(0, Math.round(Number(msg.floor) || 0));
      const extra = {};
      if (ev === "win") {
        if (msg.gold != null) extra.gold = Math.round(Number(msg.gold) || 0);
        if (msg.time)         extra.time = String(msg.time).slice(0, 10);
      }
      // broadcast to ALL players including sender
      const json = JSON.stringify({ type: "game_event", name: p.name, event: ev, floor, ...extra });
      for (const [, peer] of players) {
        if (peer.ws.readyState === peer.ws.OPEN) peer.ws.send(json);
      }
      return;
    }
  });

  ws.on("close", () => {
    removePlayer(id);
  });

  ws.on("error", () => {
    removePlayer(id);
  });
});

server.listen(PORT, () => {
  console.log(`SQL Stair Sprint multiplayer: http://localhost:${PORT}`);
});
