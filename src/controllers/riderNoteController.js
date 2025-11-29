const RiderNote = require('../models/RiderNote');

exports.createNote = async (req, res) => {
  try {
    const { type, subject, phoneNumber, category, note, severity, isPublic } = req.body;

    if (!type || !subject || !category || !note) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const noteData = {
      riderId: req.user.id,
      type,
      subject,
      phoneNumber,
      category,
      note,
      severity,
      isPublic
    };

    const newNote = await RiderNote.create(noteData);
    res.status(201).json(newNote);
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ message: 'Server error creating note' });
  }
};

exports.getMyNotes = async (req, res) => {
  try {
    const notes = await RiderNote.findByRider(req.user.id);
    res.json(notes);
  } catch (error) {
    console.error('Get my notes error:', error);
    res.status(500).json({ message: 'Server error fetching notes' });
  }
};

exports.getPublicNotes = async (req, res) => {
  try {
    const notes = await RiderNote.findPublicNotes();
    res.json(notes);
  } catch (error) {
    console.error('Get public notes error:', error);
    res.status(500).json({ message: 'Server error fetching public notes' });
  }
};

exports.searchNotes = async (req, res) => {
  try {
    const { subject, phoneNumber } = req.query;

    let notes = [];
    if (subject) {
      notes = await RiderNote.searchBySubject(subject);
    } else if (phoneNumber) {
      notes = await RiderNote.searchByPhone(phoneNumber);
    } else {
      return res.status(400).json({ message: 'Provide subject or phoneNumber to search' });
    }

    res.json(notes);
  } catch (error) {
    console.error('Search notes error:', error);
    res.status(500).json({ message: 'Server error searching notes' });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await RiderNote.findById(id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (note.riderId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this note' });
    }

    const updatedNote = await RiderNote.update(id, req.body);
    res.json(updatedNote);
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ message: 'Server error updating note' });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await RiderNote.findById(id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (note.riderId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this note' });
    }

    await RiderNote.delete(id);
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ message: 'Server error deleting note' });
  }
};
