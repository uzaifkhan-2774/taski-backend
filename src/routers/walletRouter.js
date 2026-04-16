import express from "express";
import { protect } from "../middleware/auth.js";
import { addMoney, getWallet } from "../controller/wallet.js";


const router = express.Router();

router.post("/add", protect, addMoney);
router.get("/", protect, getWallet);


export default router;