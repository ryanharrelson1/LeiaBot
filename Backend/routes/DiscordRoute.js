import express from "express";
import {
  DiscordAuth,
  DiscordCallback,
} from "../Controllers/DiscordController.js";

const router = express.Router();

router.get("/discord", DiscordAuth);

router.get("/discord/callback", DiscordCallback);

export default router;
