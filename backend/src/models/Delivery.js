const { db } = require('../config/database');

class Delivery {
  static collection = db.collection('deliveries');

  static async create(deliveryData) {
    // Generate delivery number if not provided
    if (!deliveryData.deliveryNumber) {
      const snapshot = await this.collection.count().get();
      const count = snapshot.data().count || 0;
      deliveryData.deliveryNumber = `DEL-${Date.now()}-${count + 1}`;
    }

    // Remove undefined values to prevent Firestore errors
    const cleanData = Object.fromEntries(
      Object.entries(deliveryData).filter(([_, v]) => v !== undefined)
    );

    const delivery = {
      ...cleanData,
      status: cleanData.status || 'pending',
      distance: cleanData.distance || 0,
      tracking: cleanData.tracking || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await this.collection.add(delivery);
    return { id: docRef.id, ...delivery };
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
    const delivery = await this.findById(id);
    await this.collection.doc(id).delete();
    return delivery;
  }
}

module.exports = Delivery;
