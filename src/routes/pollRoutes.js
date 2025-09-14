
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { createPoll, getPoll, votePoll,getAllPolls } from "../controllers/pollController.js";

const prisma = new PrismaClient();
const router = Router();

 router.post("/", (req, res) => createPoll(req, res, prisma));
router.get("/:id", (req, res) => getPoll(req, res, prisma));
router.post("/:pollId/vote", (req, res) =>
  votePoll(req, res, prisma, req.app.get("broadcastPollResults"))
);
router.get("/", (req, res) => getAllPolls(req, res, prisma));

export default router;
