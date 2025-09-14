import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

import userRoutes from "./src/routes/userRoutes.js";
import pollRoutes from "./src/routes/pollRoutes.js";
import { setupPollSocket } from "./src/sockets/pollSocket.js";

const prisma = new PrismaClient();
const app = express();

app.use(cors({
  origin: "http://localhost:8080", 
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

app.use("/users", userRoutes);
app.use("/polls", pollRoutes);

const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const { broadcastPollResults } = setupPollSocket(io, prisma);
app.set("broadcastPollResults", broadcastPollResults);

server.listen(4000, () => {
  console.log("Server running at http://localhost:4000");
});
