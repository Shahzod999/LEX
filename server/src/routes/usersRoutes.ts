import express from "express";
import {
  getUsers,
  getUserProfile,
  createUser,
  updateUser,
  deleteUser,
  login,
} from "../controllers/usersController";

import {
  authenticate,
  isAdmin,
  isOwnerOrAdmin,
  validateUser,
} from "../middleware/userMiddleware";

const router = express.Router();

router
  .post("/login", login)
  .post("/register", validateUser, createUser)
  .get("/", authenticate, isAdmin, getUsers) // Только админы
  .get("/profile", authenticate, getUserProfile)
  .put("/", authenticate, isOwnerOrAdmin, updateUser)
  .delete("/:id", authenticate, isOwnerOrAdmin, deleteUser);

export default router;
