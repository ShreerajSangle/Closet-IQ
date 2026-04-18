import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import wardrobeRouter from "./wardrobe";
import outfitsRouter from "./outfits";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileRouter);
router.use(wardrobeRouter);
router.use(outfitsRouter);

export default router;
