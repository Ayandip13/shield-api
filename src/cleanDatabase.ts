import mongoose from 'mongoose';
import { envConfig } from './config/env.config';
import { Provider, User, Building, Shift, Attendance, EntryLog, Notification } from './models';
import { logger } from './utils/logger';

async function cleanAndResetDatabase(): Promise<void> {
  try {
    logger.info('Connecting to MongoDB database for clean reset...');
    await mongoose.connect(envConfig.mongodbUri);
    logger.info('Connected to MongoDB.');

    logger.info('Wiping all dummy data and collections...');
    await Attendance.deleteMany({});
    await EntryLog.deleteMany({});
    await Notification.deleteMany({});
    await Shift.deleteMany({});
    await Building.deleteMany({});
    await User.deleteMany({});
    await Provider.deleteMany({});

    logger.info('Creating clean initial Provider...');
    const provider = await Provider.create({
      name: 'Shield Security Services',
      email: 'admin@secureguard.com',
      phone: '+1-800-555-0199',
      address: '100 Security Boulevard, Suite 400',
      isActive: true,
    });

    logger.info('Creating single Admin User credential...');
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@secureguard.com',
      phone: '+1-555-9000',
      passwordHash: 'Admin@123',
      role: 'provider_admin',
      providerId: provider._id,
      isActive: true,
    });

    logger.info('==============================================================');
    logger.info('DATABASE RESET COMPLETE - ALL DUMMY ACCOUNTS & RECORDS CLEARED');
    logger.info('Only Admin Account Remains:');
    logger.info(`Email   : ${adminUser.email}`);
    logger.info('Password: Admin@123');
    logger.info('==============================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Error cleaning database:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

cleanAndResetDatabase();
