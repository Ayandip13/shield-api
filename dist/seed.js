"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const env_config_1 = require("./config/env.config");
const provider_model_1 = require("./models/provider.model");
const building_model_1 = require("./models/building.model");
const user_model_1 = require("./models/user.model");
const logger_1 = require("./utils/logger");
async function seedDatabase() {
    try {
        if (env_config_1.envConfig.isProduction && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
            logger_1.logger.error('CRITICAL: Seeding is blocked in production environment!');
            logger_1.logger.error('To force seeding in production, set ALLOW_PRODUCTION_SEED=true.');
            process.exit(1);
        }
        logger_1.logger.info('Connecting to MongoDB for database seeding...');
        await mongoose_1.default.connect(env_config_1.envConfig.mongodbUri);
        logger_1.logger.info('Connected to MongoDB.');
        // Clear existing development collections
        logger_1.logger.info('Clearing existing data...');
        await user_model_1.User.deleteMany({});
        await building_model_1.Building.deleteMany({});
        await provider_model_1.Provider.deleteMany({});
        // 1. Create Security Provider
        logger_1.logger.info('Creating Provider: SecureGuard Services');
        const provider = await provider_model_1.Provider.create({
            name: 'SecureGuard Services',
            email: 'contact@secureguard.com',
            phone: '+1-800-555-0199',
            address: '100 Security Boulevard, Suite 400',
            isActive: true,
        });
        // 2. Create Buildings under Provider
        logger_1.logger.info('Creating Buildings: Green View Residency & Blue Heights');
        const greenViewBuilding = await building_model_1.Building.create({
            providerId: provider._id,
            name: 'Green View Residency',
            address: '42 Park Avenue, Sector 5',
            contactPhone: '+1-555-0101',
            contactEmail: 'info@greenviewresidency.com',
            isActive: true,
        });
        const blueHeightsBuilding = await building_model_1.Building.create({
            providerId: provider._id,
            name: 'Blue Heights',
            address: '88 Skyline Drive, Tower B',
            contactPhone: '+1-555-0202',
            contactEmail: 'contact@blueheights.com',
            isActive: true,
        });
        // 3. Create Seed Users
        logger_1.logger.info('Creating Users for provider_admin, committee, and guard roles...');
        // Provider Admin
        await user_model_1.User.create({
            name: 'Alexander Pierce (Provider Admin)',
            email: 'admin@secureguard.com',
            phone: '+1-555-9000',
            passwordHash: 'Admin@123', // Mongoose pre-save hook automatically hashes passwordHash
            role: 'provider_admin',
            providerId: provider._id,
            isActive: true,
        });
        // Committee - Green View Residency
        await user_model_1.User.create({
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
        await user_model_1.User.create({
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
        await user_model_1.User.create({
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
        await user_model_1.User.create({
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
        await user_model_1.User.create({
            name: 'Robert Davis (Blue Heights Guard 1)',
            email: 'guard1.blueheights@secureguard.com',
            phone: '+1-555-9401',
            passwordHash: 'Guard@123',
            role: 'guard',
            providerId: provider._id,
            buildingId: blueHeightsBuilding._id,
            isActive: true,
        });
        logger_1.logger.info('Seeding completed successfully!');
        logger_1.logger.info('================ DEVELOPMENT SEED CREDENTIALS ================');
        logger_1.logger.info('Provider Admin : admin@secureguard.com / Admin@123');
        logger_1.logger.info('Committee (GV) : committee.greenview@secureguard.com / Committee@123');
        logger_1.logger.info('Committee (BH) : committee.blueheights@secureguard.com / Committee@123');
        logger_1.logger.info('Guard 1 (GV)   : guard1.greenview@secureguard.com / Guard@123');
        logger_1.logger.info('Guard 2 (GV)   : guard2.greenview@secureguard.com / Guard@123');
        logger_1.logger.info('Guard 1 (BH)   : guard1.blueheights@secureguard.com / Guard@123');
        logger_1.logger.info('===============================================================');
        await mongoose_1.default.disconnect();
        process.exit(0);
    }
    catch (error) {
        logger_1.logger.error('Error seeding database:', error);
        await mongoose_1.default.disconnect();
        process.exit(1);
    }
}
seedDatabase();
