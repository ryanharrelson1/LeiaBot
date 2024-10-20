import express from "express";
import { Login, Logout, SessionValid } from "../Controllers/AdminController.js";
import { ProtectedRoute } from "../utils/ProtectedRoute.js";
const router = express.Router();

router.post("/login", Login);

router.post("/logout", Logout);

router.get("/test-auth", ProtectedRoute, SessionValid);

export default router;
