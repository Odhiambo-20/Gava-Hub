import { authenticatedRequest, authorizationHeader, getSession } from "./auth";

export interface User {
  id: string;
  email: string;
  displayName: string;
  status: string;
  createdAt: string;
}
export interface Candidate {
  id: string;
  userId: string;
  givenName: string;
  familyName: string;
  headline?: string;
  profileStatus: string;
  createdAt: string;
}
export interface Organization {
  id: string;
  legalName: string;
  tradingName?: string;
  organizationType: string;
  status: string;
  createdAt: string;
}
export interface OrganizationMember {
  organizationId: string;
  userId: string;
  email: string;
  displayName: string;
  memberRole: string;
  status: string;
  joinedAt?: string;
}
export interface DocumentRecord {
  id: string;
  ownerUserId?: string;
  ownerOrganizationId?: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  malwareScanStatus: string;
  createdAt: string;
}
export interface Credential {
  id: string;
  candidateId: string;
  issuingOrganizationId?: string;
  credentialType: string;
  title: string;
  credentialNumber?: string;
  issuedOn?: string;
  expiresOn?: string;
  status: string;
}
export interface Verification {
  id: string;
  referenceNumber: string;
  candidateId: string;
  requestingOrganizationId?: string;
  status: string;
  purpose: string;
  submittedAt?: string;
  completedAt?: string;
  createdAt: string;
}
export interface Invoice {
  id: string;
  invoiceNumber: string;
  billedUserId?: string;
  billedOrganizationId?: string;
  status: string;
  total: number;
  currency: string;
  dueAt?: string;
  paidAt?: string;
  createdAt: string;
}
export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  status: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}
export interface NotificationRecord {
  id: string;
  recipientUserId: string;
  channel: string;
  templateCode: string;
  status: string;
  attemptCount: number;
  sentAt?: string;
  createdAt: string;
}
export interface AuditEvent {
  id: string;
  actorUserId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  outcome: string;
  requestId?: string;
  occurredAt: string;
}
export interface SystemStatus {
  service: string;
  status: string;
  time: string;
}

function userId() {
  const id = getSession()?.userId;
  if (!id) throw new Error("Authentication required");
  return id;
}
const json = (method: string, body: unknown): RequestInit => ({
  method,
  body: JSON.stringify(body),
});

export const dashboardApi = {
  me: () => authenticatedRequest<User>(`/users/${userId()}`),
  updateMe: (displayName: string) =>
    authenticatedRequest<User>(
      `/users/${userId()}`,
      json("PUT", { displayName, status: "ACTIVE" }),
    ),
  roles: () => authenticatedRequest<string[]>(`/users/${userId()}/roles`),
  users: () => authenticatedRequest<User[]>("/users"),
  grantRole: (id: string, role: string) =>
    authenticatedRequest<User>(`/users/${id}/roles`, json("POST", { role })),
  revokeRole: (id: string, role: string) =>
    authenticatedRequest<void>(`/users/${id}/roles/${role}`, { method: "DELETE" }),
  candidates: () => authenticatedRequest<Candidate[]>(`/candidates?userId=${userId()}`),
  allCandidates: () => authenticatedRequest<Candidate[]>("/candidates"),
  updateCandidate: (id: string, body: unknown) =>
    authenticatedRequest<Candidate>(`/candidates/${id}`, json("PUT", body)),
  organizations: () => authenticatedRequest<Organization[]>(`/organizations?userId=${userId()}`),
  allOrganizations: () => authenticatedRequest<Organization[]>("/organizations"),
  updateOrganization: (id: string, body: unknown) =>
    authenticatedRequest<Organization>(`/organizations/${id}`, json("PUT", body)),
  members: (id: string) =>
    authenticatedRequest<OrganizationMember[]>(`/organizations/${id}/members`),
  addMember: (id: string, body: unknown) =>
    authenticatedRequest<OrganizationMember[]>(`/organizations/${id}/members`, json("POST", body)),
  documents: () => authenticatedRequest<DocumentRecord[]>(`/documents?ownerUserId=${userId()}`),
  uploadDocument: (file: File) => {
    const body = new FormData();
    body.append("ownerUserId", userId());
    body.append("file", file);
    return authenticatedRequest<DocumentRecord>("/documents", { method: "POST", body });
  },
  deleteDocument: (id: string) =>
    authenticatedRequest<void>(`/documents/${id}`, { method: "DELETE" }),
  downloadDocument: async (document: DocumentRecord) => {
    const base = (import.meta.env["VITE_API_BASE_URL"] || "/api/v1").replace(/\/$/, "");
    const response = await fetch(`${base}/documents/${document.id}/content`, {
      headers: authorizationHeader(),
    });
    if (!response.ok) throw new Error("Document download failed");
    const url = URL.createObjectURL(await response.blob());
    const link = window.document.createElement("a");
    link.href = url;
    link.download = document.originalFilename;
    link.click();
    URL.revokeObjectURL(url);
  },
  credentials: (candidateId: string) =>
    authenticatedRequest<Credential[]>(`/credentials?candidateId=${candidateId}`),
  createCredential: (body: unknown) =>
    authenticatedRequest<Credential>("/credentials", json("POST", body)),
  revokeCredential: (id: string) =>
    authenticatedRequest<void>(`/credentials/${id}`, { method: "DELETE" }),
  verifications: () => authenticatedRequest<Verification[]>("/verifications"),
  createVerification: (body: unknown) =>
    authenticatedRequest<Verification>("/verifications", json("POST", body)),
  updateVerification: (id: string, body: unknown) =>
    authenticatedRequest<Verification>(`/verifications/${id}`, json("PUT", body)),
  decideVerification: (id: string, body: unknown) =>
    authenticatedRequest<Verification>(`/verifications/${id}/decisions`, json("POST", body)),
  invoices: () => authenticatedRequest<Invoice[]>(`/invoices?userId=${userId()}`),
  createInvoice: (body: unknown) => authenticatedRequest<Invoice>("/invoices", json("POST", body)),
  pay: (invoiceId: string, phoneNumber: string) =>
    authenticatedRequest<Payment>("/payments/mpesa/stk-push", {
      ...json("POST", { invoiceId, userId: userId(), phoneNumber }),
      headers: { "Idempotency-Key": crypto.randomUUID() },
    }),
  payments: () => authenticatedRequest<Payment[]>(`/payments?userId=${userId()}`),
  notifications: () =>
    authenticatedRequest<NotificationRecord[]>(`/notifications?userId=${userId()}`),
  createNotification: (body: unknown) =>
    authenticatedRequest<NotificationRecord>("/notifications", json("POST", body)),
  audit: () => authenticatedRequest<AuditEvent[]>("/audit"),
  system: () => authenticatedRequest<SystemStatus>("/system/status"),
};
