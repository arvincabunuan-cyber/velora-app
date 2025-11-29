const RiderMessage = require('../models/RiderMessage');

exports.sendMessage = async (req, res) => {
  try {
    const { message, type, relatedLocation, relatedPhone } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const messageData = {
      senderId: req.user.id,
      senderName: req.user.name,
      message,
      type,
      relatedLocation,
      relatedPhone
    };

    const newMessage = await RiderMessage.create(messageData);
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error sending message' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const messages = await RiderMessage.findRecent(limit);
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error fetching messages' });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await RiderMessage.findById(id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.senderId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await RiderMessage.delete(id);
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error deleting message' });
  }
};
