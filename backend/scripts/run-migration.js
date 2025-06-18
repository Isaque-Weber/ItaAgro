const { AppDataSource } = require('../src/services/typeorm/data-source');

async function runMigration() {
  try {
    // Initialize the data source
    await AppDataSource.initialize();
    console.log('Database connection initialized');

    // Execute the SQL migration
    console.log('Running migration to add updated_at column...');
    await AppDataSource.query(`
      ALTER TABLE subscriptions 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      
      COMMENT ON COLUMN subscriptions.updated_at IS 'Timestamp of last update, managed by TypeORM UpdateDateColumn';
    `);
    
    console.log('Migration completed successfully');
    
    // Close the connection
    await AppDataSource.destroy();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();