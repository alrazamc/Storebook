const mongoose = require('mongoose');
const moment = require("moment-timezone");

const schema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'store',
    index: true
  },
  saleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'sale',
    index: true
  },
  itemId: { //can be unit or pack
    type: mongoose.Schema.Types.ObjectId,
    ref: 'item'
  },
  parentId: { //parent item of packing, unit id if pack is purchase
    type: mongoose.Schema.Types.ObjectId,
    ref: 'item'
  },
  baseItemId: { //always unit item
    type: mongoose.Schema.Types.ObjectId,
    ref: 'item'
  },
  categoryId: { //always unit item
    type: mongoose.Schema.Types.ObjectId,
    ref: 'category'
  },
  isVoided: Boolean,

  quantity: Number,
  costPrice: Number,
  salePrice: Number,
  discountType: Number, // 1=> percentage, 2=> rupees
  discountValue: Number, // can be percent or rupee depending on above
  discount: Number, // always in rupees
  
  batches: [{
    batchNumber: String,
    batchExpiryDate: Date,
    batchQuantity: Number
  }],

  totalProfit: Number, // form total quntity of this item,
  time: Date
})

//store record/settings udpate
schema.methods.updateLastUpdated = function(){
  const now = moment().tz('Asia/Karachi').toDate();
  this.lastUpdated = now;
  return this.save();
}

module.exports = mongoose.model('saleItem', schema);