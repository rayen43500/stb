import { Router } from "express";
import { handleChatMessage } from "../controllers/chatController.js";
import { optionalAuth, optionalLoadUser } from "../middleware/auth.js";

const r = Router();

r.post("/message", optionalAuth, optionalLoadUser, handleChatMessage);

export default r;
