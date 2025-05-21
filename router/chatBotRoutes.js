import { Router } from 'express';
const router = Router();

import * as ChatBotV2Controller from "../controllers/ChatBotV2Controller.js"

// POST ROUTES
router.route('/createChatQuestion').post(ChatBotV2Controller.createChatQuestion);

// GET ROUTES
router.route('/getChatBotResponse').get(ChatBotV2Controller.getChatBotResponse);

// PUT ROUTES
router.route('/editChatQuestion').put(ChatBotV2Controller.editChatQuestion);

// DELETE ROUTES

export default router;