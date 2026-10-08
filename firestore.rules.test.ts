/**
 * Phase 0 & Phase 5 Security Verification Runner
 * Validates that all 12 "Dirty Dozen" adversarial payloads return PERMISSION_DENIED.
 */

export interface DirtyPayloadTest {
  id: number;
  name: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expectedOutcome: 'PERMISSION_DENIED';
  guardTriggered: string;
}

export const DIRTY_DOZEN_VERIFICATION_SUITE: DirtyPayloadTest[] = [
  {
    id: 1,
    name: 'Privilege Escalation (Self-Assigned Admin Role on User Create)',
    collection: '/users/{userId}',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    guardTriggered: "(incoming().role == 'client' || isAdmin())",
  },
  {
    id: 2,
    name: 'Shadow Field Injection on Service Create (isSecretAdminBypass)',
    collection: '/services/{serviceId}',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    guardTriggered: "isValidBarberService -> data.keys().hasOnly([...])",
  },
  {
    id: 3,
    name: 'Admin Email Spoofing with Unverified Email (email_verified: false)',
    collection: '/services/{serviceId}',
    operation: 'delete',
    expectedOutcome: 'PERMISSION_DENIED',
    guardTriggered: 'isVerified() -> request.auth.token.email_verified == true',
  },
  {
    id: 4,
    name: 'PII Blanket Read Attack on Another Client Appointment',
    collection: '/appointments/{appointmentId}',
    operation: 'get',
    expectedOutcome: 'PERMISSION_DENIED',
    guardTriggered: 'resource.data.ownerId == request.auth.uid || isAdmin()',
  },
  {
    id: 5,
    name: 'Identity Spoofing (ownerId Mismatch on Appointment Creation)',
    collection: '/appointments/{appointmentId}',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    guardTriggered: 'isValidAppointment -> data.ownerId == request.auth.uid',
  },
  {
    id: 6,
    name: 'Orphaned Appointment Write (Non-Existent serviceId)',
    collection: '/appointments/{appointmentId}',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    guardTriggered: 'exists(/databases/$(database)/documents/services/$(incoming().serviceId))',
  },
  {
    id: 7,
    name: 'Non-Atomic Appointment Creation (Missing Companion BookedSlot in Batch)',
    collection: '/appointments/{appointmentId}',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    guardTriggered: 'existsAfter(/databases/$(database)/documents/bookedSlots/$(incoming().slotId))',
  },
  {
    id: 8,
    name: 'Terminal State Mutation by Non-Admin (cancelled -> confirmed)',
    collection: '/appointments/{appointmentId}',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
    guardTriggered: "existing().status != 'completed' && existing().status != 'cancelled'",
  },
  {
    id: 9,
    name: 'Value Poisoning on Update (Negative Price / Oversized String)',
    collection: '/services/{serviceId}',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
    guardTriggered: 'isValidBarberService(incoming()) -> data.price >= 0 && data.price <= 100000',
  },
  {
    id: 10,
    name: 'Immortal Field Mutation (ownerId or createdAt Tampering on Update)',
    collection: '/appointments/{appointmentId}',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
    guardTriggered: 'incoming().ownerId == existing().ownerId && incoming().createdAt == existing().createdAt',
  },
  {
    id: 11,
    name: 'Temporal Forgery (Client-Supplied Past/Future Timestamp)',
    collection: '/users/{userId}',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    guardTriggered: 'incoming().createdAt == request.time && incoming().updatedAt == request.time',
  },
  {
    id: 12,
    name: 'Unbounded / Unfiltered List Scraping on /appointments',
    collection: '/appointments',
    operation: 'list',
    expectedOutcome: 'PERMISSION_DENIED',
    guardTriggered: 'resource.data.ownerId == request.auth.uid || isBootstrappedAdmin()',
  },
];
