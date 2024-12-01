const express = require("express");
const Task = require("../models/Tasks");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Middleware to authenticate requests
const authenticate = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

// Create a new task
router.post("/", authenticate, async (req, res) => {
  try {
    const { title, description, priority, deadline } = req.body;
    const newTask = new Task({
      title,
      description,
      priority,
      deadline,
      userId: req.user.id,
    });

    await newTask.save();
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get all tasks for a user
router.get("/", authenticate, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Update a task
router.put("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedTask = await Task.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      updates,
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Delete a task
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedTask = await Task.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    });

    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

//modify routes/Tasks.js to include filtering and search functionality
// Get tasks with filtering and search
router.get("/", authenticate, async (req, res) => {
    try {
      const { priority, deadline, search } = req.query;
      const query = { userId: req.user.id };
  
      // Filter by priority
      if (priority) {
        query.priority = priority;
      }
  
      // Filter by deadline
      if (deadline) {
        query.deadline = { $lte: new Date(deadline) }; // Tasks due before or on the specified date
      }
  
      // Search by title or description
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } }, // Case-insensitive regex search
          { description: { $regex: search, $options: "i" } },
        ];
      }
  
      const tasks = await Task.find(query);
      res.status(200).json(tasks);
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  //proper error handling
  // Add a new task
router.post("/", authenticate, async (req, res, next) => {
    try {
      const { title, description, priority, deadline } = req.body;
      if (!title || !priority) {
        return res.status(400).json({ error: "Title and priority are required." });
      }
  
      const task = new Task({
        userId: req.user.id,
        title,
        description,
        priority,
        deadline,
      });
      await task.save();
      res.status(201).json(task);
    } catch (err) {
      next(err); // Pass error to the global handler
    }
  });
  