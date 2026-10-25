require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');
const { assertSchemaCurrent } = require('./utils/schemaCheck');
const { Subscription, UtilityBill } = require('./models');

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log(`Database connected (${sequelize.getDialect()}).`);

    // Dev-stage table sync. A production deployment would replace this
    // with versioned Sequelize migrations (see README).
    await sequelize.sync();
    await assertSchemaCurrent(sequelize);
    // Seed SyncSphere sample records only when the new tables are empty.
    if (await Subscription.count() === 0) await Subscription.bulkCreate([
      { name: 'Netflix', category: 'Entertainment', amount: 649, billingCycle: 'Monthly', nextBillingDate: '2026-11-02', color: '#e50914' },
      { name: 'Spotify Premium', category: 'Music', amount: 119, billingCycle: 'Monthly', nextBillingDate: '2026-11-05', color: '#1db954' },
      { name: 'Google One', category: 'Cloud storage', amount: 130, billingCycle: 'Monthly', nextBillingDate: '2026-11-09', color: '#4285f4' },
      { name: 'Amazon Prime', category: 'Shopping', amount: 1499, billingCycle: 'Yearly', nextBillingDate: '2026-12-12', color: '#00a8e1' },
      { name: 'YouTube Premium', category: 'Entertainment', amount: 189, billingCycle: 'Monthly', nextBillingDate: '2026-11-18', color: '#ff0033' },
    ]);
    if (await UtilityBill.count() === 0) await UtilityBill.bulkCreate([
      { provider: 'TNEB Electricity', utilityType: 'Electricity', accountReference: '**** 4821', amount: 1240, dueDate: '2026-10-29' },
      { provider: 'ACT Fibernet', utilityType: 'Internet', accountReference: '**** 1108', amount: 799, dueDate: '2026-11-03' },
      { provider: 'Chennai Metro Water', utilityType: 'Water', accountReference: '**** 7290', amount: 460, dueDate: '2026-11-07' },
      { provider: 'Airtel Postpaid', utilityType: 'Mobile', accountReference: '**** 6632', amount: 599, dueDate: '2026-11-10' },
    ]);
    console.log(`All ${Object.keys(sequelize.models).length} tables ready.`);

    app.listen(PORT, () => {
      console.log(`SyncSphere API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    if (err.isSchemaError) console.error(`\n${err.message}\n`);
    else console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
