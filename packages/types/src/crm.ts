export type LeadSpaceType =
  | "Conventional Office"
  | "Managed Office"
  | "Unmanaged Office"
  | "Coworking"
  | "Meeting / Conference / Training Room / Event Space"
  | "Virtual Office"
  | "Day Pass / Hot Desk";

export type LeadIndustry =
  | "IT"
  | "IT & Software"
  | "BPO"
  | "BFSI"
  | "Healthcare"
  | "E-com/Retail"
  | "Manufacturing/Industrial"
  | "Real estate"
  | "Media/Advertising/Marketing"
  | "Education/EdTech"
  | "Service Provider"
  | "Recruitment/Staffing"
  | "Others";

export type LeadTeamSize = "0-10" | "10-50" | "50-100" | "100+" | "200+" | "500+";

export type CompanyType = "Startup" | "MSME" | "Mid-Market Enterprise" | "Large Enterprise" | "MNC";

export type LeadSource =
  | "Website"
  | "Referral"
  | "BD"
  | "Social Media"
  | "Cold Call"
  | "Renewal/Expansion"
  | "Channel Partner"
  | "Others";

export type QualifyStatus = "Qualified" | "Unqualified" | "Invalid";

export type LeadPriority = "Cold" | "Warm" | "Hot";

export type LeadMainStatus = "Active" | "Won" | "Lost" | "Hold";

export type ActiveSubStatus =
  | "Contacted"
  | "Requirement Discussion"
  | "Options Shared"
  | "Site Visit Scheduled"
  | "Site Visit Done";

export type LostSubStatus =
  | "Budget Issue"
  | "Chose Competitor"
  | "Requirement Cancelled"
  | "No Response"
  | "Not Qualified";

export type HoldSubStatus =
  | "Client Hold"
  | "Budget Approval"
  | "Management Approval"
  | "Timeline Changed";

export type WonSubStatus =
  | "LOI Signed"
  | "SD Received"
  | "Agreement Signed"
  | "Commission Invoice Raised"
  | "Deal Closed";

export interface ProgressNoteItem {
  _id?: string;
  note: string;
  followUpDate: string;
  createdAt: string;
}

export interface ActivityLogItem {
  _id?: string;
  activity: string;
  author: string;
  timestamp: string;
}

export interface WipLogItem {
  _id?: string;
  log: string;
  author?: string;
  timestamp: string;
}

export interface LeadDocuments {
  loiSignedCopy?: string;
  agreementSignedCopy?: string;
  invoiceCopy?: string;
  feeLetterCopy?: string;
}

export interface CreateLeadPayload {
  companyName: string;
  contactPerson: string;
  designation?: string;
  mobileNumber: string;
  alternateNumber?: string;
  email: string;
  spaceType?: LeadSpaceType | string;
  requirementSnapshot: string;
  city: string;
  industry?: LeadIndustry | string;
  companyTeamSize?: LeadTeamSize | string;
  companyType?: CompanyType | string;
  existingOffice?: string;
  leadSource?: LeadSource | string;
  assignedTo: string;
  coManager: string;
  qualifyStatus: QualifyStatus;
  unqualifiedReason?: string;
  priority?: LeadPriority;
  dealValue?: number;
  minDealValue?: number;
  maxDealValue?: number;
  leadStatus?: LeadMainStatus;
  subStatus?: string;
  expectedClosureDate?: string;
  followUpDate?: string;
  assignedDate?: string;
  progressNotes?: ProgressNoteItem[];
  activityLogs?: ActivityLogItem[];
  wipLogs?: WipLogItem[];
  lockInEndDate?: string;
  expansionPlan?: string;
  documents?: LeadDocuments;
}

export interface CRMLead extends CreateLeadPayload {
  _id?: string;
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface CRMMetrics {
  activeLeads: number;
  openOpportunities: number;
  matchedSpaces: number;
  conversionRate: number;
}
