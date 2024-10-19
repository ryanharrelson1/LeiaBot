import express from "express";
import { Login, Logout } from "../Controllers/AdminController.js";
const router = express.Router();

router.post("/login", Login);

router.post("/logout", Logout);

export default router;
