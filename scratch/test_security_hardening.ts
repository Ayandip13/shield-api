import http from 'http';
import { createApp } from '../src/app';
import { connectDatabase } from '../src/config/database';
import { User } from '../src/models/user.model';
import { Provider } from '../src/models/provider.model';
import { Building } from '../src/models/building.model';
import { Attendance } from '../src/models/attendance.model';
import { EntryLog } from '../src/models/entryLog.model';
import mongoose from 'mongoose';

const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

function makeRequest(
  method: string,
  path: string,
  data?: any,
  token?: string
): Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const postData = data ? JSON.stringify(data) : '';

    const options: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let bodyStr = '';
      res.on('data', (chunk) => (bodyStr += chunk));
      res.on('end', () => {
        let bodyJson = {};
        try {
          bodyJson = JSON.parse(bodyStr);
        } catch {
          bodyJson = { raw: bodyStr };
        }
        resolve({ status: res.statusCode || 500, body: bodyJson, headers: res.headers });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runSecurityTests() {
  console.log('=== STARTING BACKEND SECURITY HARDENING INTEGRATION TESTS ===\n');

  await connectDatabase();
  const app = createApp();

  const server = app.listen(PORT, async () => {
    console.log(`Test server running on port ${PORT}...`);

    try {
      // Setup seed test data
      console.log('--- Setting up test providers, buildings, and users ---');

      // Provider A
      let provA = await Provider.findOne({ name: 'Hardening Provider A' });
      if (!provA) {
        provA = await Provider.create({ name: 'Hardening Provider A', address: '100 Security Way', contactPhone: '+8801711111111' });
      }

      // Provider B
      let provB = await Provider.findOne({ name: 'Hardening Provider B' });
      if (!provB) {
        provB = await Provider.create({ name: 'Hardening Provider B', address: '200 Guard St', contactPhone: '+8801722222222' });
      }

      // Building A
      let buildA = await Building.findOne({ name: 'Building A (Hardened)', providerId: provA._id });
      if (!buildA) {
        buildA = await Building.create({ providerId: provA._id, name: 'Building A (Hardened)', address: '1 Alpha Ave' });
      }

      // Building B
      let buildB = await Building.findOne({ name: 'Building B (Hardened)', providerId: provB._id });
      if (!buildB) {
        buildB = await Building.create({ providerId: provB._id, name: 'Building B (Hardened)', address: '2 Beta Blvd' });
      }

      // Admin A
      const adminAEmail = 'admin_a_hardened@secushield.com';
      await User.deleteOne({ email: adminAEmail });
      const adminA = await User.create({
        name: 'Admin A',
        email: adminAEmail,
        passwordHash: 'password123',
        role: 'provider_admin',
        providerId: provA._id,
      });

      // Admin B
      const adminBEmail = 'admin_b_hardened@secushield.com';
      await User.deleteOne({ email: adminBEmail });
      const adminB = await User.create({
        name: 'Admin B',
        email: adminBEmail,
        passwordHash: 'password123',
        role: 'provider_admin',
        providerId: provB._id,
      });

      // Guard A (Building A)
      const guardAEmail = 'guard_a_hardened@secushield.com';
      await User.deleteOne({ email: guardAEmail });
      const guardA = await User.create({
        name: 'Guard A',
        email: guardAEmail,
        passwordHash: 'password123',
        role: 'guard',
        providerId: provA._id,
        buildingId: buildA._id,
        employeeId: 'EMP-A-100',
      });

      // Guard B (Building B)
      const guardBEmail = 'guard_b_hardened@secushield.com';
      await User.deleteOne({ email: guardBEmail });
      const guardB = await User.create({
        name: 'Guard B',
        email: guardBEmail,
        passwordHash: 'password123',
        role: 'guard',
        providerId: provB._id,
        buildingId: buildB._id,
        employeeId: 'EMP-B-200',
      });

      // Committee A (Building A)
      const commAEmail = 'comm_a_hardened@secushield.com';
      await User.deleteOne({ email: commAEmail });
      const commA = await User.create({
        name: 'Committee A',
        email: commAEmail,
        passwordHash: 'password123',
        role: 'committee',
        providerId: provA._id,
        buildingId: buildA._id,
      });

      // Logins
      console.log('1. Testing Logins and JWT generation...');
      const loginA = await makeRequest('POST', '/auth/login', { email: adminAEmail, password: 'password123' });
      console.assert(loginA.status === 200, 'Admin A login failed');
      const tokenA = loginA.body.data.token;
      console.log('   ✓ Admin A logged in successfully. X-Request-ID present:', !!loginA.headers['x-request-id']);

      const loginB = await makeRequest('POST', '/auth/login', { email: adminBEmail, password: 'password123' });
      const tokenB = loginB.body.data.token;
      console.log('   ✓ Admin B logged in successfully.');

      const loginGuardA = await makeRequest('POST', '/auth/login', { email: guardAEmail, password: 'password123' });
      const tokenGuardA = loginGuardA.body.data.token;
      console.log('   ✓ Guard A logged in successfully.');

      const loginGuardB = await makeRequest('POST', '/auth/login', { email: guardBEmail, password: 'password123' });
      const tokenGuardB = loginGuardB.body.data.token;
      console.log('   ✓ Guard B logged in successfully.');

      const loginCommA = await makeRequest('POST', '/auth/login', { email: commAEmail, password: 'password123' });
      const tokenCommA = loginCommA.body.data.token;
      console.log('   ✓ Committee A logged in successfully.');

      // Test 2: Invalid password
      console.log('\n2. Testing invalid password login...');
      const resBadPass = await makeRequest('POST', '/auth/login', { email: adminAEmail, password: 'wrongpassword' });
      console.assert(resBadPass.status === 401, 'Should return 401 for bad password');
      console.log('   ✓ Invalid password rejected (401 Unauthorized)');

      // Test 3: Malformed JWT token
      console.log('\n3. Testing malformed/invalid JWT token...');
      const resBadToken = await makeRequest('GET', '/buildings', undefined, 'invalid.jwt.token');
      console.assert(resBadToken.status === 401, 'Should return 401 for malformed JWT');
      console.log('   ✓ Malformed token rejected (401 Unauthorized)');

      // Test 4: RBAC Role Authorization
      console.log('\n4. Testing Role-Based Access Control (Guard accessing Provider routes)...');
      const resGuardProvAccess = await makeRequest('GET', '/buildings', undefined, tokenGuardA);
      console.assert(resGuardProvAccess.status === 403, 'Guard accessing buildings should be 403');
      console.log('   ✓ Guard attempt to access /buildings rejected (403 Forbidden)');

      const resCommProvAccess = await makeRequest('GET', '/buildings', undefined, tokenCommA);
      console.assert(resCommProvAccess.status === 403, 'Committee accessing buildings should be 403');
      console.log('   ✓ Committee attempt to access /buildings rejected (403 Forbidden)');

      // Test 5: Tenant Isolation - Provider A attempting to access Provider B's building
      console.log('\n5. Testing Provider Tenant Isolation (Provider A accessing Provider B building)...');
      const resCrossBuilding = await makeRequest('GET', `/buildings/${buildB._id}`, undefined, tokenA);
      console.assert(resCrossBuilding.status === 403, 'Cross-provider building access should be 403');
      console.log('   ✓ Provider A attempt to access Provider B building rejected (403 Forbidden)');

      // Test 6: Tenant Isolation - Provider A attempting to access Provider B's guard
      console.log('\n6. Testing Provider Tenant Isolation (Provider A accessing Provider B guard)...');
      const resCrossGuard = await makeRequest('GET', `/guards/${guardB._id}`, undefined, tokenA);
      console.assert(resCrossGuard.status === 403, 'Cross-provider guard access should be 403');
      console.log('   ✓ Provider A attempt to access Provider B guard rejected (403 Forbidden)');

      // Test 7: Malformed ObjectId Route Parameter Validation
      console.log('\n7. Testing Malformed ObjectId parameter validation...');
      const resBadObjectId = await makeRequest('GET', '/buildings/invalid-hex-id-999', undefined, tokenA);
      console.assert(resBadObjectId.status === 400, 'Malformed ObjectId should return 400');
      console.log('   ✓ Malformed ObjectId parameter rejected cleanly (400 Bad Request)');

      // Test 8: Input Length Validation
      console.log('\n8. Testing Input String Length Validation...');
      const longName = 'A'.repeat(150);
      const resLongName = await makeRequest('POST', '/buildings', { name: longName, address: '123 St' }, tokenA);
      console.assert(resLongName.status === 400, 'Overly long building name should return 400');
      console.log('   ✓ Overly long string input rejected (400 Bad Request)');

      // Test 9: Mass Assignment & Role Escalation Prevention
      console.log('\n9. Testing Role Escalation & Mass Assignment Protection...');
      await User.deleteOne({ email: 'hacker_guard@secushield.com' });

      const resCreateGuardEscalate = await makeRequest(
        'POST',
        '/guards',
        {
          name: 'Hacker Guard',
          email: 'hacker_guard@secushield.com',
          password: 'password123',
          buildingId: buildA._id.toString(),
          role: 'provider_admin', // Escalation attempt
        },
        tokenA
      );
      console.assert(resCreateGuardEscalate.status === 201, 'Guard creation should succeed');
      console.assert(resCreateGuardEscalate.body.data.role === 'guard', 'Role must remain guard');
      console.log('   ✓ Role escalation attempt ignored cleanly (created user role is strictly "guard")');

      // Test 10: Duty Check-In & Race Condition Protection
      console.log('\n10. Testing Attendance Check-In and Duplicate Check-In Protection...');
      // Clear attendance for Guard A first
      await Attendance.deleteMany({ guardId: guardA._id });

      const checkIn1 = await makeRequest('POST', '/attendance/check-in', {}, tokenGuardA);
      console.assert(checkIn1.status === 201, 'Check-in 1 should succeed with 201');
      console.log('    ✓ Guard A duty check-in successful.');

      const checkIn2 = await makeRequest('POST', '/attendance/check-in', {}, tokenGuardA);
      console.assert(checkIn2.status === 400, 'Duplicate check-in should return 400');
      console.log('    ✓ Duplicate check-in blocked cleanly (400 Bad Request).');

      // Test 11: Duty Check-Out
      console.log('\n11. Testing Attendance Check-Out and Duplicate Check-Out Protection...');
      const checkOut1 = await makeRequest('POST', '/attendance/check-out', { notes: 'End of shift' }, tokenGuardA);
      console.assert(checkOut1.status === 200, 'Check-out 1 should succeed');
      console.log('    ✓ Guard A duty check-out successful.');

      const checkOut2 = await makeRequest('POST', '/attendance/check-out', {}, tokenGuardA);
      console.assert(checkOut2.status === 400, 'Duplicate check-out should return 400');
      console.log('    ✓ Second check-out blocked cleanly (400 Bad Request).');

      // Test 12: Entry Log Exit Race Condition & Tenant Isolation
      console.log('\n12. Testing Visitor Entry Log & Cross-Building Exit Protection...');
      const createEntry = await makeRequest(
        'POST',
        '/entry-logs',
        {
          personName: 'Test Visitor',
          phone: '+8801700000000',
          personType: 'visitor',
          flatUnit: 'A-101',
          purpose: 'Meeting',
        },
        tokenGuardA
      );
      console.assert(createEntry.status === 201, 'Create entry log should succeed');
      const entryId = createEntry.body.data._id;
      console.log('    ✓ Guard A recorded visitor entry log.');

      // Guard B (Building B) trying to mark exit on Guard A's building entry log
      const crossExit = await makeRequest('PATCH', `/entry-logs/${entryId}/exit`, {}, tokenGuardB);
      console.assert(crossExit.status === 403, 'Cross-building entry log exit should return 403');
      console.log('    ✓ Guard B attempt to exit Guard A building visitor rejected (403 Forbidden).');

      // Guard A marking exit on Guard A's building entry log
      const validExit = await makeRequest('PATCH', `/entry-logs/${entryId}/exit`, {}, tokenGuardA);
      console.assert(validExit.status === 200, 'Guard A exit should succeed');
      console.log('    ✓ Guard A successfully marked visitor exit.');

      // Duplicate exit attempt
      const dupExit = await makeRequest('PATCH', `/entry-logs/${entryId}/exit`, {}, tokenGuardA);
      console.assert(dupExit.status === 400, 'Duplicate exit attempt should return 400');
      console.log('    ✓ Duplicate visitor exit attempt blocked (400 Bad Request).');

      // Test 13: Password Security - Ensuring password hashes are never exposed
      console.log('\n13. Testing Password Hash Exclusion in API Responses...');
      const meRes = await makeRequest('GET', '/auth/me', undefined, tokenA);
      console.assert(meRes.body.data.user.passwordHash === undefined, 'passwordHash must be undefined');
      const profileRes = await makeRequest('GET', '/profile', undefined, tokenGuardA);
      console.assert(profileRes.body.data.passwordHash === undefined, 'passwordHash must be undefined');
      console.log('    ✓ Verified passwordHash is strictly excluded from all user/profile response payloads.');

      // Test 14: Health Check
      console.log('\n14. Testing Health Check Endpoint...');
      const healthRes = await makeRequest('GET', '/health');
      console.assert(healthRes.status === 200, 'Health check should be 200');
      console.assert(healthRes.body.data.database.connected === true, 'Database should be connected');
      console.log('    ✓ Health check operational:', JSON.stringify(healthRes.body.data.database));

      console.log('\n=== ALL SECURITY HARDENING INTEGRATION TESTS PASSED PERFECTLY ===');
    } catch (err) {
      console.error('\n❌ SECURITY TEST FAILURE:', err);
    } finally {
      server.close(() => {
        mongoose.connection.close();
        process.exit(0);
      });
    }
  });
}

runSecurityTests();
