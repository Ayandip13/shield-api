import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from '../auth.routes';

const v1Router = Router();

// Mount Endpoints
v1Router.use('/health', healthRoutes);
v1Router.use('/auth', authRoutes);

export default v1Router;
