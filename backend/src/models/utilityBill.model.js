const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
module.exports = sequelize.define('UtilityBill', {
  provider: { type: DataTypes.STRING(100), allowNull: false },
  utilityType: { type: DataTypes.STRING(40), allowNull: false },
  accountReference: { type: DataTypes.STRING(100), allowNull: false },
  amount: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  dueDate: { type: DataTypes.DATEONLY, allowNull: false },
  status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'Pending' },
}, { tableName: 'utility_bills' });
