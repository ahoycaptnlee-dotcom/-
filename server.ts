import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // In-memory state storage: roomID -> state
  // roomId is "group-{groupId}-char-{charId}"
  const roomStates: Record<string, any> = {};

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join-room", (roomId: string) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
      
      // Initialize room state if it doesn't exist
      if (!roomStates[roomId]) {
        roomStates[roomId] = {
          boxes: {
            1: [],
            2: [],
            3: [],
            4: []
          }
        };
      }
      
      // Send the current state of the room to the joining user
      socket.emit("init-state", roomStates[roomId]);
    });

    socket.on("add-card", ({ roomId, boxId, card }) => {
      if (roomStates[roomId]) {
        roomStates[roomId].boxes[boxId].push(card);
        io.to(roomId).emit("state-updated", roomStates[roomId]);
      }
    });

    socket.on("remove-card", ({ roomId, boxId, cardId }) => {
        if (roomStates[roomId]) {
          roomStates[roomId].boxes[boxId] = roomStates[roomId].boxes[boxId].filter((c: any) => c.id !== cardId);
          io.to(roomId).emit("state-updated", roomStates[roomId]);
        }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false, // HMR is disabled in this environment
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
