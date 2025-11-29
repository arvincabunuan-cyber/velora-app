const { db } = require('../config/database');

class RiderNote {
  static collectionName = 'riderNotes';

  static async create(noteData) {
    const data = {
      riderId: noteData.riderId,
      type: noteData.type, // 'location' or 'person'
      subject: noteData.subject, // location address or person name
      phoneNumber: noteData.phoneNumber || null, // for person type
      category: noteData.category, // 'fake_booking', 'suspicious', 'dangerous', 'good_customer'
      note: noteData.note,
      severity: noteData.severity || 'medium', // 'low', 'medium', 'high'
      isPublic: noteData.isPublic || false, // whether other riders can see it
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Remove undefined values
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    const docRef = await db.collection(this.collectionName).add(data);
    return { id: docRef.id, ...data };
  }

  static async findById(id) {
    const doc = await db.collection(this.collectionName).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  static async findByRider(riderId) {
    const snapshot = await db.collection(this.collectionName)
      .where('riderId', '==', riderId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  static async findPublicNotes() {
    const snapshot = await db.collection(this.collectionName)
      .where('isPublic', '==', true)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  static async searchBySubject(subject) {
    const snapshot = await db.collection(this.collectionName)
      .where('subject', '==', subject)
      .where('isPublic', '==', true)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  static async searchByPhone(phoneNumber) {
    const snapshot = await db.collection(this.collectionName)
      .where('phoneNumber', '==', phoneNumber)
      .where('isPublic', '==', true)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  static async update(id, updateData) {
    const data = {
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    await db.collection(this.collectionName).doc(id).update(data);
    return this.findById(id);
  }

  static async delete(id) {
    await db.collection(this.collectionName).doc(id).delete();
    return { success: true };
  }
}

module.exports = RiderNote;
