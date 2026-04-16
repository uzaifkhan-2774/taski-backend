import express from "express";
import {register,login, seedDb} from "../controller/auth.js";



const router = express.Router();





router.post("/register", register);
router.post("/login", login);
router.get("/seed", seedDb);

export default router;