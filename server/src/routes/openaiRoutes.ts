import { Router } from "express";
import { openaiController } from "../controllers/openaiController";

const router = Router();

router.post("/", openaiController);

export default router;
