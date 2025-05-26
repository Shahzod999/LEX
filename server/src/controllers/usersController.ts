import asyncHandler from "../middleware/asyncHandler";
import User from "../models/User";
import type { Request, Response } from "express";
import bycript from "bcryptjs";
import { generateToken } from "../utils/createToken";
import { AuthenticatedRequest } from "../types/RequestTypes";
import { createUserDirectory } from "../utils/createUserDirectory";

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const {
    name,
    email,
    password,
    isAdmin,
    profilePicture,
    bio,
    dateOfBirth,
    phoneNumber,
    nationality,
    language,
  } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400).json({ message: "User already exists" });
    return;
  }

  const salt = await bycript.genSalt(10);
  const hashedPassword = await bycript.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    isAdmin,
    profilePicture,
    bio,
    dateOfBirth,
    phoneNumber,
    nationality,
    language,
  });
  try {
    const token = generateToken(
      {
        userId: user._id.toString(),
        role: user.isAdmin ? "admin" : "user",
      },
      "20d"
    );
    res.status(201).json({
      status: "success",
      token,
      data: { user },
    });
    createUserDirectory(user._id);
  } catch (error) {
    throw new Error("Register Error");
  }
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new Error("Password and Email required");
  }

  const existingUser = await User.findOne({ email });

  if (!existingUser) {
    throw new Error("User not registered");
  }

  const isPasswordValid = await bycript.compare(
    password,
    existingUser.password
  );

  if (!isPasswordValid) {
    throw new Error("Invalid password or Email");
  }

  try {
    const token = generateToken(
      {
        userId: existingUser._id.toString(),
        role: existingUser.isAdmin ? "admin" : "user",
      },
      "20d"
    );

    res.status(201).json({
      status: "success",
      token,
      data: {
        _id: existingUser._id,
        email: existingUser.email,
      },
    });
  } catch (error) {
    throw new Error("Ups login problem");
  }
});

export const getUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await User.find({}).select("-password");
  res.status(200).json({
    status: "success",
    data: {
      users,
    },
  });
});

export const getUserProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = await User.findById(req.user?.userId).select("-password");
    if (user) {
      res.status(200).json({
        status: "success",
        data: { user },
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  }
);

export const updateUser = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const {
      name,
      email,
      password,
      oldPassword,
      profilePicture,
      bio,
      dateOfBirth,
      phoneNumber,
      nationality,
      language,
    } = req.body;

    const existingUser = await User.findById(req.user?.userId);

    if (!existingUser) {
      throw new Error("User not found");
    }

    if (existingUser) {
      existingUser.name = name || existingUser.name;
      existingUser.email = email || existingUser.email;
      existingUser.profilePicture =
        profilePicture || existingUser.profilePicture;
      existingUser.bio = bio || existingUser.bio;
      existingUser.dateOfBirth = dateOfBirth || existingUser.dateOfBirth;
      existingUser.phoneNumber = phoneNumber || existingUser.phoneNumber;
      existingUser.nationality = nationality || existingUser.nationality;
      existingUser.language = language || existingUser.language;

      if (password) {
        if (oldPassword) {
          const isPasswordValid = await bycript.compare(
            oldPassword,
            existingUser.password
          );
          if (!isPasswordValid) {
            throw new Error("Invalid old password");
          }
          const newPassword = await bycript.hash(password, 10);
          existingUser.password = newPassword;
        } else {
          throw new Error("Old password is required");
        }
      }

      if (email && email !== existingUser.email) {
        const emailTaken = await User.findOne({ email });
        if (emailTaken) {
          throw new Error("Email taken by another user");
        }
      }

      const updatedUser = await existingUser.save();
      const { password: _, ...user } = updatedUser.toObject();

      res.status(200).json({
        status: "success",
        data: {
          user,
        },
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  }
);

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (user) {
    res.status(200).json({
      status: "success",
      message: "User deleted successfully",
    });
  } else {
    res.status(404).json({ message: "User not found" });
  }
});
