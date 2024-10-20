import express from "express";
import { Logout,Login, SessionValid } from "../controllers/AdminController.js";
import { ProtectedRoute } from "../utils/ProtectedRoute.js";
const router = express.Router();

router.post("/login", Login);

router.post("/logout", Logout);

router.get("/test-auth", ProtectedRoute, SessionValid);

export default router;
