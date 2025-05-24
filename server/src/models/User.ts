import mongoose from "mongoose";
import { Schema } from "mongoose";

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  profilePicture: {
    type: String,
    default: "",
  },
  bio: {
    type: String,
    default: "",
  },
  dateOfBirth: {
    type: Date,
    default: null,
  },
  phoneNumber: {
    type: String,
    default: "",
  },
  nationality: {
    type: String,
    default: "",
  },
  language: {
    type: String,
    default: "",
  },
});

const User = mongoose.model("User", userSchema);
export default User;
