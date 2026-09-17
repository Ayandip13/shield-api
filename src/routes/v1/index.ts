import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from '../auth.routes';
import buildingRoutes from './building.routes';
import guardRoutes from './guard.routes';
import committeeRoutes from './committee.routes';

const v1Router = Router();

// Mount Endpoints
v1Router.use('/health', healthRoutes);
v1Router.use('/auth', authRoutes);
v1Router.use('/buildings', buildingRoutes);
v1Router.use('/guards', guardRoutes);
v1Router.use('/committee-members', committeeRoutes);
v1Router.use('/committee', committeeRoutes);

export default v1Router;


