const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
module.exports = sequelize.define('SyncspherePayment', {
  itemType: { type: DataTypes.STRING(20), allowNull: false },
  itemName: { type: DataTypes.STRING(100), allowNull: false },
  amount: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  reference: { type: DataTypes.STRING(40), allowNull: false, unique: true },
  paidAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'Paid' },
}, { tableName: 'syncsphere_payments' });
