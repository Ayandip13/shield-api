import mongoose from 'mongoose';
import { envConfig } from './config/env.config';
import { Provider } from './models/provider.model';
import { Building } from './models/building.model';
import { User } from './models/user.model';
import { logger } from './utils/logger';

async function seedDatabase(): Promise<void> {
  try {
    logger.info('Connecting to MongoDB for database seeding...');
    await mongoose.connect(envConfig.mongodbUri);
    logger.info('Connected to MongoDB.');

    // Clear existing development collections
    logger.info('Clearing existing data...');
    await User.deleteMany({});
    await Building.deleteMany({});
    await Provider.deleteMany({});

    // 1. Create Security Provider
    logger.info('Creating Provider: SecureGuard Services');
    const provider = await Provider.create({
      name: 'SecureGuard Services',
      email: 'contact@secureguard.com',
      phone: '+1-800-555-0199',
      address: '100 Security Boulevard, Suite 400',
      isActive: true,
    });

    // 2. Create Buildings under Provider
    logger.info('Creating Buildings: Green View Residency & Blue Heights');
    const greenViewBuilding = await Building.create({
      providerId: provider._id,
      name: 'Green View Residency',
      address: '42 Park Avenue, Sector 5',
      contactPhone: '+1-555-0101',
      contactEmail: 'info@greenviewresidency.com',
      isActive: true,
    });

    const blueHeightsBuilding = await Building.create({
      providerId: provider._id,
      name: 'Blue Heights',
      address: '88 Skyline Drive, Tower B',
      contactPhone: '+1-555-0202',
      contactEmail: 'contact@blueheights.com',
      isActive: true,
    });

    // 3. Create Seed Users
    logger.info('Creating Users for provider_admin, committee, and guard roles...');

    // Provider Admin
    await User.create({
      name: 'Alexander Pierce (Provider Admin)',
      email: 'admin@secureguard.com',
      phone: '+1-555-9000',
      passwordHash: 'Admin@123', // Mongoose pre-save hook automatically hashes passwordHash
      role: 'provider_admin',
      providerId: provider._id,
      isActive: true,
    });

    // Committee - Green View Residency
    await User.create({
      name: 'Elena Rostova (Green View Committee)',
      email: 'committee.greenview@secureguard.com',
      phone: '+1-555-9101',
      passwordHash: 'Committee@123',
      role: 'committee',
      providerId: provider._id,
      buildingId: greenViewBuilding._id,
      isActive: true,
    });

    // Committee - Blue Heights
    await User.create({
      name: 'Marcus Vance (Blue Heights Committee)',
      email: 'committee.blueheights@secureguard.com',
      phone: '+1-555-9202',
      passwordHash: 'Committee@123',
      role: 'committee',
      providerId: provider._id,
      buildingId: blueHeightsBuilding._id,
      isActive: true,
    });

    // Guard 1 - Green View Residency
    await User.create({
      name: 'John Miller (Green View Guard 1)',
      email: 'guard1.greenview@secureguard.com',
      phone: '+1-555-9301',
      passwordHash: 'Guard@123',
      role: 'guard',
      providerId: provider._id,
      buildingId: greenViewBuilding._id,
      isActive: true,
    });

    // Guard 2 - Green View Residency
    await User.create({
      name: 'David Smith (Green View Guard 2)',
      email: 'guard2.greenview@secureguard.com',
      phone: '+1-555-9302',
      passwordHash: 'Guard@123',
      role: 'guard',
      providerId: provider._id,
      buildingId: greenViewBuilding._id,
      isActive: true,
    });

    // Guard 1 - Blue Heights
    await User.create({
      name: 'Robert Davis (Blue Heights Guard 1)',
      email: 'guard1.blueheights@secureguard.com',
      phone: '+1-555-9401',
      passwordHash: 'Guard@123',
      role: 'guard',
      providerId: provider._id,
      buildingId: blueHeightsBuilding._id,
      isActive: true,
    });

    logger.info('Seeding completed successfully!');
    logger.info('================ DEVELOPMENT SEED CREDENTIALS ================');
    logger.info('Provider Admin : admin@secureguard.com / Admin@123');
    logger.info('Committee (GV) : committee.greenview@secureguard.com / Committee@123');
    logger.info('Committee (BH) : committee.blueheights@secureguard.com / Committee@123');
    logger.info('Guard 1 (GV)   : guard1.greenview@secureguard.com / Guard@123');
    logger.info('Guard 2 (GV)   : guard2.greenview@secureguard.com / Guard@123');
    logger.info('Guard 1 (BH)   : guard1.blueheights@secureguard.com / Guard@123');
    logger.info('===============================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedDatabase();
