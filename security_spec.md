# Security Specification (`security_spec.md`)

## 1. Data Invariants

1. **Global Default-Deny Safety Net**: Every path not explicitly matched is unconditionally denied (`allow read, write: if false;`).
2. **Verified Identity Invariant**: All write operations require an authenticated user with a verified email (`request.auth != null && request.auth.token.email_verified == true`).
3. **Path Variable Hardening (`isValidId`)**: All single-document operations (`get`, `create`, `update`, `delete`) validate path IDs (`userId`, `adminId`, `serviceId`, `slotId`, `appointmentId`) against `^[a-zA-Z0-9_\-]+$` with length `1..128`. `list` operations never invoke `isValidId` or `get()`/`exists()`.
4. **PII Isolation (Split Collection Strategy)**:
   - `/users/{userId}` and `/appointments/{appointmentId}` store PII (`email`, `phone`, `clientName`, `clientPhone`) and are strictly readable only by the document owner (`ownerId == request.auth.uid`) or the bootstrapped/verified Administrator.
   - `/bookedSlots/{slotId}` stores zero PII and exposes real-time slot occupancy exclusively for documents where `resource.data.visibility == 'public'`.
5. **Relational & Atomic Booking Invariant**:
   - An `/appointments/{appointmentId}` document cannot be created unless the referenced `/services/{serviceId}` exists (`exists(...)`) AND its paired `/bookedSlots/{slotId}` is atomically written in the same batch (`existsAfter(...)`).
6. **Temporal Integrity & Immutability**:
   - All `createdAt` and `updatedAt` fields must equal `request.time`.
   - `uid`, `ownerId`, and `createdAt` are strictly immutable across all updates.
7. **Terminal State Locking**:
   - Once an appointment or booked slot reaches a terminal state (`status == 'completed'` or `status == 'cancelled'`), non-admin users cannot mutate it further.

---

## 2. The "Dirty Dozen" Payloads

1. **Payload 1 — Privilege Escalation (Self-Assigned Admin Role on User Create)**:
   ```json
   {
     "path": "/users/attacker_uid",
     "op": "create",
     "auth": { "uid": "attacker_uid", "email": "attacker@example.com", "email_verified": true },
     "data": {
       "uid": "attacker_uid",
       "displayName": "Attacker",
       "email": "attacker@example.com",
       "phone": "+54911223344",
       "role": "admin",
       "createdAt": "REQUEST_TIME",
       "updatedAt": "REQUEST_TIME"
     }
   }
   ```
2. **Payload 2 — Shadow Field Injection on Service Create**:
   ```json
   {
     "path": "/services/corte_imperial",
     "op": "create",
     "auth": { "uid": "admin_uid", "email": "danielalvarenga751@gmail.com", "email_verified": true },
     "data": {
       "name": "Corte Imperial",
       "category": "corte",
       "description": "Corte clásico a tijera y navaja",
       "price": 35,
       "durationMinutes": 45,
       "visibility": "public",
       "featured": true,
       "isSecretAdminBypass": true,
       "createdAt": "REQUEST_TIME",
       "updatedAt": "REQUEST_TIME"
     }
   }
   ```
3. **Payload 3 — Admin Email Spoofing with Unverified Email (`email_verified: false`)**:
   ```json
   {
     "path": "/services/corte_spoof",
     "op": "delete",
     "auth": { "uid": "spoof_uid", "email": "danielalvarenga751@gmail.com", "email_verified": false }
   }
   ```
4. **Payload 4 — PII Blanket Read Attack on Another Client's Appointment**:
   ```json
   {
     "path": "/appointments/apt_victim_1",
     "op": "get",
     "auth": { "uid": "other_client_uid", "email": "other@example.com", "email_verified": true }
   }
   ```
5. **Payload 5 — Identity Spoofing (`ownerId` Mismatch on Appointment Creation)**:
   ```json
   {
     "path": "/appointments/apt_spoof_1",
     "op": "create",
     "auth": { "uid": "attacker_uid", "email": "attacker@example.com", "email_verified": true },
     "data": {
       "slotId": "2026-10-01_1000",
       "date": "2026-10-01",
       "time": "10:00",
       "serviceId": "srv_corte_autor",
       "serviceName": "Corte de Autor",
       "servicePrice": 30,
       "durationMinutes": 45,
       "clientName": "Victima",
       "clientPhone": "+54911000000",
       "notes": "",
       "status": "confirmed",
       "source": "online",
       "ownerId": "victim_uid",
       "createdAt": "REQUEST_TIME",
       "updatedAt": "REQUEST_TIME"
     }
   }
   ```
6. **Payload 6 — Orphaned Appointment Write (Non-Existent `serviceId`)**:
   ```json
   {
     "path": "/appointments/apt_orphan_1",
     "op": "create",
     "auth": { "uid": "client_uid", "email": "client@example.com", "email_verified": true },
     "data": {
       "slotId": "2026-10-01_1100",
       "date": "2026-10-01",
       "time": "11:00",
       "serviceId": "non_existent_service_999",
       "serviceName": "Ghost Service",
       "servicePrice": 30,
       "durationMinutes": 45,
       "clientName": "Juan Perez",
       "clientPhone": "+5491122334455",
       "notes": "",
       "status": "confirmed",
       "source": "online",
       "ownerId": "client_uid",
       "createdAt": "REQUEST_TIME",
       "updatedAt": "REQUEST_TIME"
     }
   }
   ```
7. **Payload 7 — Non-Atomic Appointment Creation (Missing Companion `BookedSlot` in Batch)**:
   ```json
   {
     "path": "/appointments/apt_nonatomic_1",
     "op": "create",
     "auth": { "uid": "client_uid", "email": "client@example.com", "email_verified": true },
     "note": "Created without writing /bookedSlots/2026-10-01_1200 in the same atomic batch."
   }
   ```
8. **Payload 8 — Terminal State Mutation by Non-Admin (`cancelled` -> `confirmed`)**:
   ```json
   {
     "path": "/appointments/apt_cancelled_1",
     "op": "update",
     "auth": { "uid": "client_uid", "email": "client@example.com", "email_verified": true },
     "existingStatus": "cancelled",
     "data": { "status": "confirmed", "updatedAt": "REQUEST_TIME" }
   }
   ```
9. **Payload 9 — Value Poisoning on Update (Oversized String / Invalid Price Type)**:
   ```json
   {
     "path": "/services/srv_corte_autor",
     "op": "update",
     "auth": { "uid": "admin_uid", "email": "danielalvarenga751@gmail.com", "email_verified": true },
     "data": { "price": -500, "updatedAt": "REQUEST_TIME" }
   }
   ```
10. **Payload 10 — Immortal Field Mutation (`createdAt` or `ownerId` Tampering on Update)**:
    ```json
    {
      "path": "/appointments/apt_valid_1",
      "op": "update",
      "auth": { "uid": "client_uid", "email": "client@example.com", "email_verified": true },
      "data": { "ownerId": "another_uid", "status": "cancelled", "updatedAt": "REQUEST_TIME" }
    }
    ```
11. **Payload 11 — Temporal Forgery (Client-Supplied Past/Future `createdAt` Timestamp)**:
    ```json
    {
      "path": "/users/client_uid",
      "op": "create",
      "auth": { "uid": "client_uid", "email": "client@example.com", "email_verified": true },
      "data": {
        "uid": "client_uid",
        "displayName": "Client",
        "email": "client@example.com",
        "phone": "+5491155554444",
        "role": "client",
        "createdAt": "2020-01-01T00:00:00Z",
        "updatedAt": "2020-01-01T00:00:00Z"
      }
    }
    ```
12. **Payload 12 — Unbounded / Unfiltered List Scraping on `/appointments`**:
    ```json
    {
      "path": "/appointments",
      "op": "list",
      "auth": { "uid": "random_client_uid", "email": "random@example.com", "email_verified": true },
      "query": "collection(db, 'appointments') // without where('ownerId', '==', 'random_client_uid')"
    }
    ```

---

## 3. Test Runner Reference

See `firestore.rules.test.ts` for the complete verification suite asserting that all 12 Dirty Dozen payloads return `PERMISSION_DENIED`.
