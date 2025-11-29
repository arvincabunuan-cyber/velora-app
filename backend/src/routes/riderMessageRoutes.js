const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const riderMessageController = require('../controllers/riderMessageController');

// All routes require authentication and rider role
router.use(authenticate);
router.use(authorize(['rider']));

// Send a message to the rider community
router.post('/', riderMessageController.sendMessage);

// Get recent messages
router.get('/', riderMessageController.getMessages);

// Delete a message
router.delete('/:id', riderMessageController.deleteMessage);

module.exports = router;
