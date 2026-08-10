import { apiRequest } from "./client";

export type RequesterType = "CANDIDATE" | "EMPLOYER" | "INSTITUTION" | "OTHER";

export interface ContactRequest {
  fullName: string;
  email: string;
  phoneNumber?: string;
  requesterType: RequesterType;
  message: string;
}

export interface ContactResponse {
  id: string;
  referenceNumber: string;
  status: "NEW";
  createdAt: string;
}

export function submitContact(request: ContactRequest) {
  return apiRequest<ContactResponse>("/contact", {
    method: "POST",
    body: JSON.stringify(request),
  });
}
