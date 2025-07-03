import dotenv from 'dotenv';
import { AppDataSource } from '../src/services/typeorm/data-source';

dotenv.config({ path: '.env.test' });

beforeAll(async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
});

afterEach(async () => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    await queryRunner.query(`SET session_replication_role = 'replica'`);
    for (const entity of AppDataSource.entityMetadatas) {
      const tableName = `"${entity.tableName}"`;
      await queryRunner.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`);
    }
    await queryRunner.query(`SET session_replication_role = 'origin'`);
    await queryRunner.commitTransaction();
  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw err;
  } finally {
    await queryRunner.release();
  }
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

jest.setTimeout(20000);
