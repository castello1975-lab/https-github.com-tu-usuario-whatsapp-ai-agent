export interface Organization {
  id: string;
  business_name: string;
  owner_name: string | null;
  timezone: string;
  address: string | null;
  phone: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  org_id: string;
  full_name: string | null;
  created_at: string;
}

export interface BusinessHour {
  id: string;
  org_id: string;
  day_of_week: number;
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
}

export interface Service {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Faq {
  question: string;
  answer: string;
}

export interface AgentSettings {
  id: string;
  org_id: string;
  system_prompt: string;
  tone: string | null;
  ask_new_patient: boolean;
  greeting_message: string;
  handoff_message: string;
  faqs: Faq[];
  policies: string | null;
  updated_at: string;
}

export interface Contact {
  id: string;
  org_id: string;
  whatsapp_phone: string;
  display_name: string | null;
  created_at: string;
}

export type ConversationStatus = "open" | "handoff" | "closed";

export interface Conversation {
  id: string;
  org_id: string;
  contact_id: string;
  bot_enabled: boolean;
  status: ConversationStatus;
  last_message_at: string;
  created_at: string;
}

export type MessageDirection = "inbound" | "outbound";
export type MessageSenderType = "contact" | "bot" | "staff";
export type MessageStatus = "sent" | "delivered" | "read" | "failed";

export interface Message {
  id: string;
  org_id: string;
  conversation_id: string;
  direction: MessageDirection;
  sender_type: MessageSenderType;
  content: string;
  whatsapp_message_id: string | null;
  status: MessageStatus;
  created_at: string;
}

export type AppointmentStatus = "booked" | "cancelled" | "completed" | "no_show";

export interface Appointment {
  id: string;
  org_id: string;
  conversation_id: string | null;
  contact_id: string | null;
  service_id: string | null;
  customer_name: string;
  is_new_patient: boolean | null;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  google_event_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoogleCalendarConnection {
  id: string;
  org_id: string;
  google_account_email: string | null;
  calendar_id: string | null;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  token_expiry: string | null;
  scope: string | null;
  connected_at: string | null;
  updated_at: string;
}

export type ConversationEventType =
  | "bot_disabled"
  | "bot_enabled"
  | "handoff_triggered";

export interface ConversationEvent {
  id: string;
  org_id: string;
  conversation_id: string;
  event_type: ConversationEventType;
  meta: Record<string, unknown> | null;
  created_at: string;
}
