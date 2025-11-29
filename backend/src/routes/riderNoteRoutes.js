const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const riderNoteController = require('../controllers/riderNoteController');

// All routes require authentication and rider role
router.use(authenticate);
router.use(authorize(['rider']));

// Create a new note
router.post('/', riderNoteController.createNote);

// Get my notes
router.get('/my-notes', riderNoteController.getMyNotes);

// Get public notes (shared by other riders)
router.get('/public', riderNoteController.getPublicNotes);

// Search notes by subject or phone number
router.get('/search', riderNoteController.searchNotes);

// Update a note
router.put('/:id', riderNoteController.updateNote);

// Delete a note
router.delete('/:id', riderNoteController.deleteNote);

module.exports = router;
