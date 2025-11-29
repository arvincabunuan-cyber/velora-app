const { db } = require('../config/database');

class Product {
  static collection = db.collection('products');

  static async create(productData) {
    const product = {
      ...productData,
      stock: productData.stock || 0,
      isAvailable: productData.isAvailable !== undefined ? productData.isAvailable : true,
      rating: productData.rating || 0,
      totalReviews: productData.totalReviews || 0,
      discount: productData.discount || 0,
      images: productData.images || [],
      tags: productData.tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await this.collection.add(product);
    return { id: docRef.id, ...product };
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
    const product = await this.findById(id);
    await this.collection.doc(id).delete();
    return product;
  }
}

module.exports = Product;
