import express from "express";
import {
  DiscordAuth,
  DiscordCallback,
  GetServerChannelsAndRoles,
  UpdateConfigFile,
} from "../Controllers/DiscordController.js";
import { ProtectedRoute } from "../utils/ProtectedRoute.js";

const router = express.Router();

router.get("/discord", DiscordAuth);

router.get("/discord/callback", DiscordCallback);

router.get("/discord/guild", GetServerChannelsAndRoles);

router.put("/discord/update-config", UpdateConfigFile);

export default router;
