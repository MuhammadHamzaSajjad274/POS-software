const { app } = require('electron');

app.whenReady().then(() => {
  try {
    const { initializeDatabase } = require('../electron-db.cjs');
    const database = initializeDatabase();
    const requiredTables = [
      'categories',
      'products',
      'accounts',
      'users',
      'transactions',
      'inventory',
      'purchase_orders',
      'bill_orders',
      'quotations',
      'schema_migrations',
    ];
    const tables = new Set(
      database
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
        .all()
        .map((row) => row.name),
    );
    const missingTables = requiredTables.filter((table) => !tables.has(table));
    if (missingTables.length > 0) {
      throw new Error(`Missing required tables: ${missingTables.join(', ')}`);
    }
    console.log('Database smoke test passed');
    database.close();
    app.quit();
  } catch (error) {
    console.error('Database smoke test failed:', error);
    app.exit(1);
  }
});
