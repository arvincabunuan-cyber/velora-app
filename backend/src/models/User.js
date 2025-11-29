const { db } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static collection = db.collection('users');

  static async create(userData) {
    // Hash password
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }

    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(userData).filter(([_, v]) => v !== undefined)
    );

    // Set defaults
    const user = {
      ...cleanData,
      role: cleanData.role || 'buyer',
      profileImage: cleanData.profileImage || 'default-avatar.png',
      isActive: cleanData.isActive !== undefined ? cleanData.isActive : true,
      isVerified: cleanData.isVerified || false,
      rating: cleanData.rating || 0,
      totalRatings: cleanData.totalRatings || 0,
      isAvailable: cleanData.isAvailable !== undefined ? cleanData.isAvailable : true,
      // ID Verification fields for buyers
      idType: cleanData.idType || null,
      idNumber: cleanData.idNumber || null,
      idImageUrl: cleanData.idImageUrl || null,
      faceImageUrl: cleanData.faceImageUrl || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await this.collection.add(user);
    return { id: docRef.id, ...user };
  }

  static async findById(id) {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  static async findOne(query) {
    const field = Object.keys(query)[0];
    const value = query[field];
    
    const snapshot = await this.collection.where(field, '==', value).limit(1).get();
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  static async find(query = {}) {
    let ref = this.collection;
    
    Object.entries(query).forEach(([field, value]) => {
      ref = ref.where(field, '==', value);
    });

    const snapshot = await ref.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async findByIdAndUpdate(id, updateData) {
    // Remove undefined values to prevent Firestore errors
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v !== undefined)
    );
    
    cleanData.updatedAt = new Date();
    await this.collection.doc(id).update(cleanData);
    return this.findById(id);
  }

  static async findByIdAndDelete(id) {
    const user = await this.findById(id);
    await this.collection.doc(id).delete();
    return user;
  }

  static async comparePassword(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }
}

module.exports = User;
