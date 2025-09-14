// src/routes/userRoutes.js
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { createUser } from "../controllers/userController.js";

const prisma = new PrismaClient();
const router = Router();

router.post("/", (req, res) => createUser(req, res, prisma));

export default router;
