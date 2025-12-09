const { db } = require('../config/database');

class Review {
  static collection = db.collection('reviews');

  static async create(reviewData) {
    const review = {
      ...reviewData,
      rating: reviewData.rating || 5,
      comment: reviewData.comment || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await this.collection.add(review);
    return { id: docRef.id, ...review };
  }

  static async findById(id) {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  static async find(query = {}) {
    let ref = this.collection;
    
    Object.entries(query).forEach(([field, value]) => {
      ref = ref.where(field, '==', value);
    });

    const snapshot = await ref.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async findByIdAndUpdate(id, updateData) {
    updateData.updatedAt = new Date();
    await this.collection.doc(id).update(updateData);
    return this.findById(id);
  }

  static async findByIdAndDelete(id) {
    const review = await this.findById(id);
    await this.collection.doc(id).delete();
    return review;
  }
}

module.exports = Review;
