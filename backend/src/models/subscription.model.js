const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
module.exports = sequelize.define('Subscription', {
  name: { type: DataTypes.STRING(100), allowNull: false },
  category: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'Entertainment' },
  amount: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  billingCycle: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'Monthly' },
  nextBillingDate: { type: DataTypes.DATEONLY, allowNull: false },
  status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'Active' },
  color: { type: DataTypes.STRING(20), allowNull: false, defaultValue: '#6c63ff' },
}, { tableName: 'subscriptions' });
