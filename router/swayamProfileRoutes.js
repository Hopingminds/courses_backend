import { Router } from "express";
const router = Router();

import {
  createProfile,
  getAllProfiles,
  getProfileById,
  updateProfile,
  deleteProfile,
} from "../controllers/SwayamProfileController.js";

router.post("/profile", createProfile);
router.get("/profile", getAllProfiles);
router.get("/profile/:id", getProfileById);
router.put("/profile/:id", updateProfile);
router.delete("/profile/:id", deleteProfile);

export default router;
