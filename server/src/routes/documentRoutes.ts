import express from "express";
import {
  deleteDocs,
  getUserAllDocs,
  getUserCurrentDoc,
  uploadDocument,
} from "../controllers/documentController";
import { authenticate } from "../middleware/userMiddleware";
import { upload } from "../middleware/uploadMiddleware";

const router = express.Router();

router
  .post("/", authenticate, upload.array("files", 10), uploadDocument)
  .get("/", authenticate, getUserAllDocs)
  .get("/:id", authenticate, getUserCurrentDoc)
  .delete("/:id", authenticate, deleteDocs);

export default router;
