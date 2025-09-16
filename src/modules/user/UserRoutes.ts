import { Router } from "express";
import { userService } from "./UserService";
const router = Router();

// GET all users
router.get("/", async (req, res) => {
  const queryParams: any = {};
  
  // Handle status query
  if (req.query.status) {
    queryParams.where = {
      status: req.query.status
    };
  }
  
  const users = await userService.findMany(queryParams);
  res.json(users);
});

// GET single user
router.get("/:id", async (req, res) => {
  const user = await userService.findUnique(req.params.id);
  
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  
  res.json(user);
});

// GET user form data
router.get("/:id/form", async (req, res) => {
  const formData = await userService.getForm(req.params.id);
  
  if (!formData) {
    return res.status(404).json({ error: "User not found" });
  }
  
  res.json(formData);
});

export default router;