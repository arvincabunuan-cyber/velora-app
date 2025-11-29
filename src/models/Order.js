const { db } = require('../config/database');

class Order {
  static collection = db.collection('orders');

  static async create(orderData) {
    // Generate order number if not provided
    if (!orderData.orderNumber) {
      const snapshot = await this.collection.count().get();
      const count = snapshot.data().count || 0;
      orderData.orderNumber = `ORD-${Date.now()}-${count + 1}`;
    }

    // Remove undefined values to prevent Firestore errors
    const cleanData = Object.fromEntries(
      Object.entries(orderData).filter(([_, v]) => v !== undefined)
    );

    const order = {
      ...cleanData,
      deliveryType: cleanData.deliveryType || 'product',
      status: cleanData.status || 'pending',
      paymentStatus: cleanData.paymentStatus || 'pending',
      deliveryFee: cleanData.deliveryFee || 0,
      statusHistory: cleanData.statusHistory || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await this.collection.add(order);
    return { id: docRef.id, ...order };
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
    updateData.updatedAt = new Date();
    await this.collection.doc(id).update(updateData);
    return this.findById(id);
  }

  static async findByIdAndDelete(id) {
    const order = await this.findById(id);
    await this.collection.doc(id).delete();
    return order;
  }
}

module.exports = Order;
