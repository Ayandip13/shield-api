"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const http_1 = __importDefault(require("http"));
const app_1 = require("../app");
const env_config_1 = require("../config/env.config");
const user_model_1 = require("../models/user.model");
const building_model_1 = require("../models/building.model");
const provider_model_1 = require("../models/provider.model");
async function runIntegrationTests() {
    console.log('====================================================');
    console.log('    SecuShield Backend Final Readiness Test Suite   ');
    console.log('====================================================\n');
    let passed = 0;
    let failed = 0;
    function assert(condition, testName) {
        if (condition) {
            console.log(`  ✓ PASS: ${testName}`);
            passed++;
        }
        else {
            console.error(`  ✗ FAIL: ${testName}`);
            failed++;
        }
    }
    // Connect Database
    await mongoose_1.default.connect(env_config_1.envConfig.mongodbUri);
    // Start HTTP server on port 0 (dynamic free port)
    const app = (0, app_1.createApp)();
    const server = http_1.default.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;
    try {
        // -------------------------------------------------------------
        // Test Setup: Seed fresh isolated test data
        // -------------------------------------------------------------
        await user_model_1.User.deleteMany({ email: { $regex: /@test\.secushield/ } });
        await building_model_1.Building.deleteMany({ name: { $regex: /Test Building/ } });
        await provider_model_1.Provider.deleteMany({ name: { $regex: /Test Provider/ } });
        const provider = await provider_model_1.Provider.create({
            name: 'Test Provider Inc.',
            email: 'contact@test.secushield.com',
            phone: '+1-555-0000',
            address: '100 Test St',
            isActive: true,
        });
        const building = await building_model_1.Building.create({
            providerId: provider._id,
            name: 'Test Building Alpha',
            address: '10 Test Ave',
            contactPhone: '+1-555-1111',
            contactEmail: 'alpha@test.secushield.com',
            isActive: true,
        });
        const buildingBeta = await building_model_1.Building.create({
            providerId: provider._id,
            name: 'Test Building Beta',
            address: '20 Test Ave',
            contactPhone: '+1-555-2222',
            contactEmail: 'beta@test.secushield.com',
            isActive: true,
        });
        const adminUser = await user_model_1.User.create({
            name: 'Test Admin',
            email: 'admin@test.secushield.com',
            phone: '+1-555-9999',
            passwordHash: 'AdminPass@123',
            role: 'provider_admin',
            providerId: provider._id,
            isActive: true,
        });
        const provider2 = await provider_model_1.Provider.create({
            name: 'Test Provider Beta Inc.',
            email: 'contact.beta@test.secushield.com',
            phone: '+1-555-0002',
            address: '200 Test St',
            isActive: true,
        });
        const guardUser = await user_model_1.User.create({
            name: 'Test Guard Alpha',
            email: 'guard.alpha@test.secushield.com',
            phone: '+1-555-8888',
            passwordHash: 'GuardPass@123',
            role: 'guard',
            providerId: provider._id,
            buildingId: building._id,
            employeeId: 'EMP-001',
            monthlySalary: 18000,
            isActive: true,
        });
        const guardUser2 = await user_model_1.User.create({
            name: 'Test Guard Beta',
            email: 'guard.beta@test.secushield.com',
            phone: '+1-555-8889',
            passwordHash: 'GuardPass@123',
            role: 'guard',
            providerId: provider2._id,
            monthlySalary: 25000,
            isActive: true,
        });
        const committeeUser = await user_model_1.User.create({
            name: 'Test Committee Alpha',
            email: 'committee.alpha@test.secushield.com',
            phone: '+1-555-7777',
            passwordHash: 'CommitteePass@123',
            role: 'committee',
            providerId: provider._id,
            buildingId: building._id,
            isActive: true,
        });
        const inactiveUser = await user_model_1.User.create({
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
        const loginData = (await loginRes.json());
        assert(loginRes.status === 200 && loginData.success && !!loginData.data.token, 'Valid login returns JWT token and user info');
        const adminToken = loginData.data.token;
        // Guard login
        const guardLoginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'guard.alpha@test.secushield.com', password: 'GuardPass@123' }),
        });
        const guardLoginData = (await guardLoginRes.json());
        assert(guardLoginRes.status === 200 && guardLoginData.success, 'Guard login returns success');
        const guardToken = guardLoginData.data.token;
        // Committee login
        const committeeLoginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'committee.alpha@test.secushield.com', password: 'CommitteePass@123' }),
        });
        const committeeLoginData = (await committeeLoginRes.json());
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
        const checkInData = (await checkInRes.json());
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
        const entryData = (await entryRes.json());
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
        console.log('\n[5] Salary Visibility & Role-Based Access Control Suite');
        // 1. Provider Admin can view own provider guard salary
        const adminGetGuardRes = await fetch(`${baseUrl}/guards/${guardUser._id}`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        const adminGetGuardData = (await adminGetGuardRes.json());
        assert(adminGetGuardRes.status === 200 && adminGetGuardData.data?.monthlySalary === 18000, 'Provider Admin can view own provider guard salary');
        const adminGetGuardsListRes = await fetch(`${baseUrl}/guards`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        const adminGetGuardsListData = (await adminGetGuardsListRes.json());
        const foundGuardInList = adminGetGuardsListData.data?.find((g) => g._id === guardUser._id.toString());
        assert(adminGetGuardsListRes.status === 200 && foundGuardInList?.monthlySalary === 18000, 'Provider Admin can view salaries in guards list');
        // 2. Provider Admin cannot view another provider's guard salary
        const adminCrossTenantRes = await fetch(`${baseUrl}/guards/${guardUser2._id}`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert(adminCrossTenantRes.status === 403, 'Provider Admin cannot view guard belonging to another provider (403 Forbidden)');
        // 3. Guard can view own salary
        const guardMeRes = await fetch(`${baseUrl}/guards/me`, {
            headers: { Authorization: `Bearer ${guardToken}` },
        });
        const guardMeData = (await guardMeRes.json());
        assert(guardMeRes.status === 200 && guardMeData.data?.monthlySalary === 18000, 'Guard can view own salary via /guards/me');
        const guardProfileRes = await fetch(`${baseUrl}/profile`, {
            headers: { Authorization: `Bearer ${guardToken}` },
        });
        const guardProfileData = (await guardProfileRes.json());
        assert(guardProfileRes.status === 200 && guardProfileData.data?.monthlySalary === 18000, 'Guard can view own salary via /profile');
        // 4. Guard cannot view another guard's salary
        const guardListAttemptRes = await fetch(`${baseUrl}/guards`, {
            headers: { Authorization: `Bearer ${guardToken}` },
        });
        assert(guardListAttemptRes.status === 403, 'Guard cannot query guards list (403 Forbidden)');
        const guardDetailAttemptRes = await fetch(`${baseUrl}/guards/${guardUser2._id}`, {
            headers: { Authorization: `Bearer ${guardToken}` },
        });
        assert(guardDetailAttemptRes.status === 403, 'Guard cannot query another guard details (403 Forbidden)');
        // 5. Committee cannot view salary
        const committeeProfileRes = await fetch(`${baseUrl}/profile`, {
            headers: { Authorization: `Bearer ${committeeToken}` },
        });
        const committeeProfileData = (await committeeProfileRes.json());
        assert(committeeProfileRes.status === 200 && committeeProfileData.data?.monthlySalary === undefined, 'Committee profile response does NOT contain monthlySalary');
        const committeeGuardsRes = await fetch(`${baseUrl}/guards`, {
            headers: { Authorization: `Bearer ${committeeToken}` },
        });
        assert(committeeGuardsRes.status === 403, 'Committee user cannot access /guards endpoint (403 Forbidden)');
        // 6. Guard cannot modify their own salary
        const guardModifySalaryRes = await fetch(`${baseUrl}/profile`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${guardToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ monthlySalary: 999999 }),
        });
        const guardCheckAfterRes = await fetch(`${baseUrl}/profile`, {
            headers: { Authorization: `Bearer ${guardToken}` },
        });
        const guardCheckAfterData = (await guardCheckAfterRes.json());
        assert(guardModifySalaryRes.status === 200 && guardCheckAfterData.data?.monthlySalary === 18000, 'Guard cannot modify their own salary via /profile');
        const guardPatchGuardRes = await fetch(`${baseUrl}/guards/${guardUser._id}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${guardToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ monthlySalary: 999999 }),
        });
        assert(guardPatchGuardRes.status === 403, 'Guard cannot call /guards/:id endpoint to modify salary (403 Forbidden)');
        // 7. Committee cannot modify salary
        const committeePatchGuardRes = await fetch(`${baseUrl}/guards/${guardUser._id}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${committeeToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ monthlySalary: 999999 }),
        });
        assert(committeePatchGuardRes.status === 403, 'Committee user cannot modify guard salary (403 Forbidden)');
        // 8. Provider Admin can update salary
        const adminUpdateSalaryRes = await fetch(`${baseUrl}/guards/${guardUser._id}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ monthlySalary: 22000 }),
        });
        const adminUpdateSalaryData = (await adminUpdateSalaryRes.json());
        assert(adminUpdateSalaryRes.status === 200 && adminUpdateSalaryData.data?.monthlySalary === 22000, 'Provider Admin can update guard monthly salary');
        // 9. Mass-assignment attempts cannot escalate permissions or tenant ownership
        const massAssignRes = await fetch(`${baseUrl}/guards/${guardUser._id}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: 'provider_admin', providerId: provider2._id.toString() }),
        });
        assert(massAssignRes.status === 400, 'Mass-assignment attempts to modify role or providerId are rejected with 400');
        // 10. Unauthenticated salary access returns 401
        const unauthSalaryRes = await fetch(`${baseUrl}/guards/${guardUser._id}`);
        assert(unauthSalaryRes.status === 401, 'Unauthenticated request for guard details returns 401');
        // 11. Unauthorized salary access returns appropriate 403/404
        const unauthOtherTenantRes = await fetch(`${baseUrl}/guards/${guardUser2._id}`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert(unauthOtherTenantRes.status === 403, 'Unauthorized cross-tenant salary access returns 403');
        // Clean up test records
        await user_model_1.User.deleteMany({ email: { $regex: /@test\.secushield/ } });
        await building_model_1.Building.deleteMany({ name: { $regex: /Test Building/ } });
        await provider_model_1.Provider.deleteMany({ name: { $regex: /Test Provider/ } });
    }
    finally {
        server.close();
        await mongoose_1.default.disconnect();
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
