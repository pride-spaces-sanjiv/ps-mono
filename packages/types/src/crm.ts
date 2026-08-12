export type LeadStatus = "new" | "contacted" | "qualified" | "proposal" | "closed_won" | "closed_lost";

export interface CRMLead {
  id: string;
  clientName: string;
  company: string;
  email: string;
  phone: string;
  seatsNeeded: number;
  targetCity: string;
  status: LeadStatus;
  estimatedValue: number;
  createdAt: string;
}

export interface CRMMetrics {
  activeLeads: number;
  openOpportunities: number;
  matchedSpaces: number;
  conversionRate: number;
}
