import mongoose from 'mongoose';
import http from 'http';
import { createApp } from '../app';
import { envConfig } from '../config/env.config';
import { User } from '../models/user.model';
import { Building } from '../models/building.model';
import { Provider } from '../models/provider.model';
import { Attendance } from '../models/attendance.model';
import { EntryLog } from '../models/entryLog.model';
import { Notification } from '../models/notification.model';

async function runIntegrationTests() {
  console.log('====================================================');
  console.log('    SecuShield Backend Final Readiness Test Suite   ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  }

  // Connect Database
  await mongoose.connect(envConfig.mongodbUri);

  // Start HTTP server on port 0 (dynamic free port)
  const app = createApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

  try {
    // -------------------------------------------------------------
    // Test Setup: Seed fresh isolated test data
    // -------------------------------------------------------------
    await User.deleteMany({ email: { $regex: /@test\.secushield/ } });
    await Building.deleteMany({ name: { $regex: /Test Building/ } });
    await Provider.deleteMany({ name: { $regex: /Test Provider/ } });

    const provider = await Provider.create({
      name: 'Test Provider Inc.',
      email: 'contact@test.secushield.com',
      phone: '+1-555-0000',
      address: '100 Test St',
      isActive: true,
    });

    const building = await Building.create({
      providerId: provider._id,
      name: 'Test Building Alpha',
      address: '10 Test Ave',
      contactPhone: '+1-555-1111',
      contactEmail: 'alpha@test.secushield.com',
      isActive: true,
    });

    const buildingBeta = await Building.create({
      providerId: provider._id,
      name: 'Test Building Beta',
      address: '20 Test Ave',
      contactPhone: '+1-555-2222',
      contactEmail: 'beta@test.secushield.com',
      isActive: true,
    });

    const adminUser = await User.create({
      name: 'Test Admin',
      email: 'admin@test.secushield.com',
      phone: '+1-555-9999',
      passwordHash: 'AdminPass@123',
      role: 'provider_admin',
      providerId: provider._id,
      isActive: true,
    });

    const guardUser = await User.create({
      name: 'Test Guard Alpha',
      email: 'guard.alpha@test.secushield.com',
      phone: '+1-555-8888',
      passwordHash: 'GuardPass@123',
      role: 'guard',
      providerId: provider._id,
      buildingId: building._id,
      employeeId: 'EMP-001',
      isActive: true,
    });

    const committeeUser = await User.create({
      name: 'Test Committee Alpha',
      email: 'committee.alpha@test.secushield.com',
      phone: '+1-555-7777',
      passwordHash: 'CommitteePass@123',
      role: 'committee',
      providerId: provider._id,
      buildingId: building._id,
      isActive: true,
    });

    const inactiveUser = await User.create({
      name: 'Inactive Guard',
      email: 'inactive@test.secushield.com',
      phone: '+1-555-6666',
      passwordHash: 'GuardPass@123',
      role: 'guard',
      providerId: provider._id,
      buildingId: building._id,
      isActive: false,
    });

    console.log('[1] Authentication Suite');
    // Scenario 1.1: Valid Login
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.secushield.com', password: 'AdminPass@123' }),
    });
    const loginData = (await loginRes.json()) as any;
    assert(loginRes.status === 200 && loginData.success && !!loginData.data.token, 'Valid login returns JWT token and user info');
    const adminToken = loginData.data.token;

    // Guard login
    const guardLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'guard.alpha@test.secushield.com', password: 'GuardPass@123' }),
    });
    const guardLoginData = (await guardLoginRes.json()) as any;
    assert(guardLoginRes.status === 200 && guardLoginData.success, 'Guard login returns success');
    const guardToken = guardLoginData.data.token;

    // Committee login
    const committeeLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'committee.alpha@test.secushield.com', password: 'CommitteePass@123' }),
    });
    const committeeLoginData = (await committeeLoginRes.json()) as any;
    assert(committeeLoginRes.status === 200 && committeeLoginData.success, 'Committee login returns success');
    const committeeToken = committeeLoginData.data.token;

    // Scenario 1.2: Invalid Password
    const badPassRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.secushield.com', password: 'WrongPassword' }),
    });
    assert(badPassRes.status === 401, 'Invalid password returns 401 Unauthorized');

    // Scenario 1.3: Inactive User Login
    const inactiveRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'inactive@test.secushield.com', password: 'GuardPass@123' }),
    });
    assert(inactiveRes.status === 401 || inactiveRes.status === 403, 'Inactive user login returns 401/403');

    // Scenario 1.4: Expired / Invalid JWT Token
    const invalidTokenRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: 'Bearer invalid.fake.token' },
    });
    assert(invalidTokenRes.status === 401, 'Invalid Bearer token returns 401 Unauthorized');

    console.log('\n[2] Role-Based Access Control (RBAC) & Tenant Scoping');
    // Scenario 2.1: Provider Admin can list buildings
    const bListRes = await fetch(`${baseUrl}/buildings`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(bListRes.status === 200, 'Provider Admin can access /buildings');

    // Scenario 2.2: Guard cannot create a building
    const guardCreateBRes = await fetch(`${baseUrl}/buildings`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${guardToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Unauthorized Building', address: '123 St' }),
    });
    assert(guardCreateBRes.status === 403, 'Guard is blocked from creating a building (403 Forbidden)');

    console.log('\n[3] Core Operational Workflows');
    // Scenario 3.1: Guard Shift Check-In
    const checkInRes = await fetch(`${baseUrl}/attendance/check-in`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${guardToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: 'Starting morning shift' }),
    });
    const checkInData = (await checkInRes.json()) as any;
    assert((checkInRes.status === 200 || checkInRes.status === 201) && checkInData.success, 'Guard can check in for duty');

    // Scenario 3.2: Visitor Entry Log Creation
    const entryRes = await fetch(`${baseUrl}/entry-logs`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${guardToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personName: 'John Visitor',
        phone: '+1-555-4321',
        personType: 'visitor',
        unitNumber: 'Flat 4B',
        purpose: 'Package Delivery',
      }),
    });
    const entryData = (await entryRes.json()) as any;
    assert((entryRes.status === 200 || entryRes.status === 201) && entryData.success && !!entryData.data._id, 'Guard can log a visitor entry');
    const createdLogId = entryData.data?._id;


    // Scenario 3.3: Mark Visitor Exit
    if (createdLogId) {
      const exitRes = await fetch(`${baseUrl}/entry-logs/${createdLogId}/exit`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${guardToken}` },
      });
      assert(exitRes.status === 200, 'Guard can mark visitor exit');
    }

    // Scenario 3.4: Guard Check-Out
    const checkOutRes = await fetch(`${baseUrl}/attendance/check-out`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${guardToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: 'Completed shift safely' }),
    });
    assert(checkOutRes.status === 200, 'Guard can check out from duty');

    console.log('\n[4] Security & Boundary Sanitization Checks');
    // Scenario 4.1: Malformed ObjectId handling
    const malformedIdRes = await fetch(`${baseUrl}/buildings/invalid-object-id-12345`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(malformedIdRes.status === 400, 'Malformed ObjectId in URL path returns 400 Bad Request');

    // Scenario 4.2: Malformed JSON body
    const malformedJsonRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ invalid-json-payload ',
    });
    assert(malformedJsonRes.status === 400, 'Malformed JSON payload returns 400 Bad Request');

    // Scenario 4.3: Missing Authorization Header
    const noAuthRes = await fetch(`${baseUrl}/profile`);
    assert(noAuthRes.status === 401, 'Unauthenticated request to protected endpoint returns 401');

    // Clean up test records
    await User.deleteMany({ email: { $regex: /@test\.secushield/ } });
    await Building.deleteMany({ name: { $regex: /Test Building/ } });
    await Provider.deleteMany({ name: { $regex: /Test Provider/ } });
  } finally {
    server.close();
    await mongoose.disconnect();
  }

  console.log('\n====================================================');
  console.log(`   Integration Test Suite Finished: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runIntegrationTests().catch((err) => {
  console.error('Test runner exception:', err);
  process.exit(1);
});
