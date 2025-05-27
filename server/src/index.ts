import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { createServer } from "http"; //new
import connectDB from "./config/db";
import cookieParser from "cookie-parser";
import usersRoutes from "./routes/usersRoutes";
import chatRoutes from "./routes/chatRoutes";
import documentRoutes from "./routes/documentRoutes";
import uploadImages from "./routes/uploadImages";
import { ChatWebSocketServer } from "./controllers/websocketController"; //new

dotenv.config();

connectDB();

const app = express();
const server = createServer(app); //new
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const allowedOrigins = [
  "http://localhost:3000",
  "https://your-production-domain.com",
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Initialize WebSocket server
const chatWS = new ChatWebSocketServer(server); //new

server.listen(port, () => {
  console.log(`Server running on port: ${port}`); //new
  console.log(
    `WebSocket server available at ws://localhost:${port}/ws/chat`
  ); //new
});

app.get("/", (_req, res) => {
  res.send({ message: "nice" });
});

app.use("/api/users", usersRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/upload", uploadImages);

export default app;
export { server, chatWS }; //new
