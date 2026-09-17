import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from '../auth.routes';
import buildingRoutes from './building.routes';

const v1Router = Router();

// Mount Endpoints
v1Router.use('/health', healthRoutes);
v1Router.use('/auth', authRoutes);
v1Router.use('/buildings', buildingRoutes);

export default v1Router;

