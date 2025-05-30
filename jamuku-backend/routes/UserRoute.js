    // routes/UserRoute.js
    import express from "express";
    import { getUsers, approveUserRequest } from "../controllers/UserController.js";
    import { verifyToken, verifyManager, verifyUser } from "../middleware/authMiddleware.js";

    const router = express.Router();

    router.get("/users", verifyToken, verifyUser, getUsers);
    router.put("/users/request/:id/approve", verifyToken, verifyManager, approveUserRequest);

    export default router;