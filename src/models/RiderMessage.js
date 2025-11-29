const { db } = require('../config/database');

class RiderMessage {
  static collectionName = 'riderMessages';

  static async create(messageData) {
    const data = {
      senderId: messageData.senderId,
      senderName: messageData.senderName,
      message: messageData.message,
      type: messageData.type || 'general', // 'general', 'warning', 'tip', 'question'
      relatedLocation: messageData.relatedLocation || null,
      relatedPhone: messageData.relatedPhone || null,
      createdAt: new Date().toISOString()
    };

    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    const docRef = await db.collection(this.collectionName).add(data);
    return { id: docRef.id, ...data };
  }

  static async findRecent(limit = 50) {
    const snapshot = await db.collection(this.collectionName)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  static async findById(id) {
    const doc = await db.collection(this.collectionName).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  static async delete(id) {
    await db.collection(this.collectionName).doc(id).delete();
    return { success: true };
  }
}

module.exports = RiderMessage;
