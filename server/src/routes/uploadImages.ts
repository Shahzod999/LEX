import express from "express";
import {
  deleteUploads,
  getAllUploaded,
  uploadImg,
} from "../controllers/uploadImgController";
import { authenticate } from "../middleware/userMiddleware";
import { upload } from "../middleware/uploadMiddleware";

const router = express.Router();

// Route for uploading a single image
router.post("/", authenticate, upload.single("file"), uploadImg);

// Route for getting all user's uploaded images
router.get("/", authenticate, getAllUploaded);

// Route for deleting an image
router.delete("/delete", authenticate, deleteUploads);

export default router;