const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Asset schema
const assetSchema = new Schema({
  assetName: { type: String },
  assetType: { type: String },
  investedValue: { type: String },
  currentValue: { type: String }
});

// Trade Entry schema for portfolio data inside a report
const tradeEntrySchema = new Schema({
  stockName: { type: String, required: true },
  investedDate: { type: String, required: true },  // or Date if you want to store Date objects
  investedAmount: { type: String, required: true },
  currentValue: { type: String, required: true },
  profitOrLoss: { type: String, required: true }
});

// Report schema (with tradeEntries added)
const reportSchema = new Schema({
  reportName: { type: String },
  reportData: { type: String },
  reportPdf: { type: String },
  assets: [assetSchema],
  tradeEntries: [tradeEntrySchema]  // <-- Added this line
});

const articleSchema = new mongoose.Schema({
  author: { type: String, required: true },
  title: { type: String, required: true },
  section: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// User schema
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  reports: [reportSchema],
  articles:[articleSchema]
});

// Create models
const userSchemaModel = mongoose.model('user', userSchema);

// Export all models together
module.exports = {
  userSchemaModel
};
