import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  AlertCircle,
  Building2,
  User,
  Layers,
  Briefcase,
  Flame,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Upload,
  FileText,
  MessageSquare,
  Plus,
  ShieldCheck,
  Activity,
  Cpu,
} from "lucide-react";
import {
  CRMLead,
  LeadPriority,
  LeadMainStatus,
  ActiveSubStatus,
  LostSubStatus,
  HoldSubStatus,
  WonSubStatus,
} from "@pride-spaces/types/crm.ts";

interface EditLeadModalProps {
  isOpen: boolean;
  lead: CRMLead | null;
  onClose: () => void;
  onLeadUpdated: () => void;
  backendUrl: string;
}

const CITIES = [
  "Mumbai",
  "Delhi NCR",
  "Bengaluru",
  "Hyderabad",
  "Pune",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
  "Gurgaon",
  "Noida",
  "Chandigarh",
  "Jaipur",
  "Kochi",
];

const SPACE_TYPES = [
  "Conventional Office",
  "Managed Office",
  "Unmanaged Office",
  "Coworking",
  "Meeting / Conference / Training Room / Event Space",
  "Virtual Office",
  "Day Pass / Hot Desk",
];

const INDUSTRIES = [
  "IT",
  "IT & Software",
  "BPO",
  "BFSI",
  "Healthcare",
  "E-com/Retail",
  "Manufacturing/Industrial",
  "Real estate",
  "Media/Advertising/Marketing",
  "Education/EdTech",
  "Service Provider",
  "Recruitment/Staffing",
  "Others",
];

const TEAM_SIZES = ["0-10", "10-50", "50-100", "100+", "200+", "500+"];
const COMPANY_TYPES = [
  "Startup",
  "MSME",
  "Mid-Market Enterprise",
  "Large Enterprise",
  "MNC",
];
const LEAD_SOURCES = [
  "Website",
  "Referral",
  "BD",
  "Social Media",
  "Cold Call",
  "Renewal/Expansion",
  "Channel Partner",
  "Others",
];
const TEAM_MEMBERS = [
  "Debasish",
  "Rehan",
  "Abhay Kumawat (Admin)",
  "Sarah Jenkins (BD Lead)",
  "Rajesh Sharma (Sales Manager)",
  "Priya Nair (Account Exec)",
  "Vikram Malhotra (Senior Manager)",
];

const ACTIVE_SUB_STATUSES: ActiveSubStatus[] = [
  "Contacted",
  "Requirement Discussion",
  "Options Shared",
  "Site Visit Scheduled",
  "Site Visit Done",
];

const LOST_SUB_STATUSES: LostSubStatus[] = [
  "Budget Issue",
  "Chose Competitor",
  "Requirement Cancelled",
  "No Response",
  "Not Qualified",
];

const HOLD_SUB_STATUSES: HoldSubStatus[] = [
  "Client Hold",
  "Budget Approval",
  "Management Approval",
  "Timeline Changed",
];

const WON_SUB_STATUSES: WonSubStatus[] = [
  "LOI Signed",
  "SD Received",
  "Agreement Signed",
  "Commission Invoice Raised",
  "Deal Closed",
];

export default function EditLeadModal({
  isOpen,
  lead,
  onClose,
  onLeadUpdated,
  backendUrl,
}: EditLeadModalProps) {
  const [formData, setFormData] = useState<Partial<CRMLead>>({});
  const [activeTab, setActiveTab] = useState<
    "details" | "status" | "progress" | "documents" | "activity"
  >("details");

  // New Note state
  const [newNoteText, setNewNoteText] = useState("");
  const [newFollowUpDate, setNewFollowUpDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (lead) {
      setFormData({
        ...lead,
        priority: lead.priority || "Warm",
        dealValue: lead.dealValue || 0,
        leadStatus: lead.leadStatus || "Active",
        subStatus: lead.subStatus || "Contacted",
        documents: lead.documents || {},
      });
      setNewNoteText("");
      setNewFollowUpDate(lead.followUpDate || "");
      setErrorMsg("");
      setSuccessMsg("");
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: name === "dealValue" ? (value ? Number(value) : 0) : value,
      };

      // Reset default sub-status if main lead status changes
      if (name === "leadStatus") {
        if (value === "Active") updated.subStatus = "Contacted";
        if (value === "Won") updated.subStatus = "LOI Signed";
        if (value === "Lost") updated.subStatus = "Budget Issue";
        if (value === "Hold") updated.subStatus = "Client Hold";
      }

      return updated;
    });
  };

  const handleDocumentChange = (
    docKey: keyof NonNullable<CRMLead["documents"]>,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        [docKey]: value,
      },
    }));
  };

  const handleAddProgressNote = () => {
    if (!newNoteText.trim()) {
      setErrorMsg("Note text cannot be empty.");
      return;
    }
    if (!newFollowUpDate) {
      setErrorMsg("Follow-up Date is mandatory after adding a note.");
      return;
    }

    const newNoteObj = {
      note: newNoteText,
      followUpDate: newFollowUpDate,
      createdAt: new Date().toISOString(),
    };

    setFormData((prev) => ({
      ...prev,
      followUpDate: newFollowUpDate,
      progressNotes: [...(prev.progressNotes || []), newNoteObj],
    }));

    setNewNoteText("");
    setErrorMsg("");
    setSuccessMsg(
      'Progress note added to queue. Click "Save Changes" to persist.',
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      let response = await fetch(
        `${backendUrl}/crm/leads/${lead._id || lead.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        },
      );

      if (!response.ok && backendUrl !== "http://localhost:5011") {
        response = await fetch(
          `http://localhost:5011/crm/leads/${lead._id || lead.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          },
        );
      }

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.message || "Failed to update lead");
      }

      setSuccessMsg("Lead updated successfully!");
      onLeadUpdated();
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      setErrorMsg(err?.message || "Something went wrong while updating lead.");
    } finally {
      setLoading(false);
    }
  };

  const getSubStatusesForMainStatus = () => {
    switch (formData.leadStatus) {
      case "Active":
        return ACTIVE_SUB_STATUSES;
      case "Lost":
        return LOST_SUB_STATUSES;
      case "Hold":
        return HOLD_SUB_STATUSES;
      case "Won":
        return WON_SUB_STATUSES;
      default:
        return ACTIVE_SUB_STATUSES;
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "#0f172a",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "950px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1.25rem 1.75rem",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            background: "rgba(30, 41, 59, 0.5)",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                padding: "0.5rem",
                borderRadius: "10px",
              }}
            >
              <Building2
                style={{ width: "20px", height: "20px", color: "#fff" }}
              />
            </div>
            <div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <h2
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: 700,
                    color: "#f8fafc",
                    margin: 0,
                  }}
                >
                  Edit Lead: {lead.companyName}
                </h2>
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    background: "rgba(99, 102, 241, 0.15)",
                    color: "#818cf8",
                    padding: "0.15rem 0.5rem",
                    borderRadius: "4px",
                  }}
                >
                  {lead.city}
                </span>
              </div>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                Contact: {lead.contactPerson} ({lead.email})
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "0.4rem",
              borderRadius: "8px",
            }}
          >
            <X style={{ width: "20px", height: "20px" }} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            padding: "0.75rem 1.75rem",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            background: "rgba(15, 23, 42, 0.6)",
            overflowX: "auto",
          }}
        >
          <TabButton
            id="details"
            label="1. Lead Info & Details"
            active={activeTab === "details"}
            onClick={() => setActiveTab("details")}
          />
          <TabButton
            id="status"
            label="2. Deal & Pipeline Stage"
            active={activeTab === "status"}
            onClick={() => setActiveTab("status")}
          />
          <TabButton
            id="progress"
            label="3. Progress Notes & Follow-up"
            active={activeTab === "progress"}
            onClick={() => setActiveTab("progress")}
            badge={formData.progressNotes?.length?.toString()}
          />
          <TabButton
            id="documents"
            label="4. Won Documents & Terms"
            active={activeTab === "documents"}
            onClick={() => setActiveTab("documents")}
          />
          <TabButton
            id="activity"
            label="5. Immutable Activity & WIP Logs"
            active={activeTab === "activity"}
            onClick={() => setActiveTab("activity")}
            badge={
              (formData.activityLogs?.length || 0) +
              (formData.wipLogs?.length || 0)
                ? `${(formData.activityLogs?.length || 0) + (formData.wipLogs?.length || 0)}`
                : undefined
            }
          />
        </div>

        {/* Banners */}
        {errorMsg && (
          <div
            style={{
              margin: "1rem 1.75rem 0 1.75rem",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
              padding: "0.6rem 1rem",
              borderRadius: "8px",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <AlertCircle
              style={{ width: "16px", height: "16px", flexShrink: 0 }}
            />{" "}
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div
            style={{
              margin: "1rem 1.75rem 0 1.75rem",
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#6ee7b7",
              padding: "0.6rem 1rem",
              borderRadius: "8px",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <CheckCircle2
              style={{ width: "16px", height: "16px", flexShrink: 0 }}
            />{" "}
            {successMsg}
          </div>
        )}

        {/* Modal Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            overflowY: "auto",
            padding: "1.5rem 1.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
          }}
        >
          {/* TAB 1: Lead Info & Contact Details */}
          {activeTab === "details" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              <div>
                <h3 style={sectionHeaderStyle}>
                  <User style={{ width: "15px", height: "15px" }} /> Contact
                  Person Information
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <label style={labelStyle}>
                      Company Name <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      required
                      value={formData.companyName || ""}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>
                      Contact Person <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="contactPerson"
                      required
                      value={formData.contactPerson || ""}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Designation</label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation || ""}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>
                      Mobile Number <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="tel"
                      name="mobileNumber"
                      required
                      value={formData.mobileNumber || ""}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Alternate Number</label>
                    <input
                      type="tel"
                      name="alternateNumber"
                      value={formData.alternateNumber || ""}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>
                      Email Address <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email || ""}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 style={sectionHeaderStyle}>
                  <Layers style={{ width: "15px", height: "15px" }} />{" "}
                  Requirement & Company Profile
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <label style={labelStyle}>Space Type</label>
                    <select
                      name="spaceType"
                      value={formData.spaceType || ""}
                      onChange={handleChange}
                      style={inputStyle}
                    >
                      {SPACE_TYPES.map((st) => (
                        <option
                          key={st}
                          value={st}
                          style={{ background: "#1e293b" }}
                        >
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>
                      City <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <select
                      name="city"
                      required
                      value={formData.city || ""}
                      onChange={handleChange}
                      style={inputStyle}
                    >
                      {CITIES.map((c) => (
                        <option
                          key={c}
                          value={c}
                          style={{ background: "#1e293b" }}
                        >
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Industry</label>
                    <select
                      name="industry"
                      value={formData.industry || ""}
                      onChange={handleChange}
                      style={inputStyle}
                    >
                      {INDUSTRIES.map((ind) => (
                        <option
                          key={ind}
                          value={ind}
                          style={{ background: "#1e293b" }}
                        >
                          {ind}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Company Team Size</label>
                    <select
                      name="companyTeamSize"
                      value={formData.companyTeamSize || ""}
                      onChange={handleChange}
                      style={inputStyle}
                    >
                      {TEAM_SIZES.map((ts) => (
                        <option
                          key={ts}
                          value={ts}
                          style={{ background: "#1e293b" }}
                        >
                          {ts} members
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>
                      Assigned To <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <select
                      name="assignedTo"
                      required
                      value={formData.assignedTo || ""}
                      onChange={handleChange}
                      style={inputStyle}
                    >
                      {TEAM_MEMBERS.map((m) => (
                        <option
                          key={m}
                          value={m}
                          style={{ background: "#1e293b" }}
                        >
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>
                      Co-Manager <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <select
                      name="coManager"
                      required
                      value={formData.coManager || ""}
                      onChange={handleChange}
                      style={inputStyle}
                    >
                      {TEAM_MEMBERS.map((m) => (
                        <option
                          key={m}
                          value={m}
                          style={{ background: "#1e293b" }}
                        >
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle}>
                      Requirement Snapshot{" "}
                      <span style={{ color: "#ef4444" }}>*</span> (Max 100
                      words)
                    </label>
                    <textarea
                      name="requirementSnapshot"
                      required
                      rows={2}
                      value={formData.requirementSnapshot || ""}
                      onChange={handleChange}
                      style={{ ...inputStyle, resize: "vertical" }}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle}>Existing Office Details</label>
                    <textarea
                      name="existingOffice"
                      rows={2}
                      value={formData.existingOffice || ""}
                      onChange={handleChange}
                      style={{ ...inputStyle, resize: "vertical" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Deal Status & Pipeline Stage */}
          {activeTab === "status" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              <div>
                <h3 style={sectionHeaderStyle}>
                  <Flame style={{ width: "15px", height: "15px" }} /> Priority &
                  Valuation
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <label style={labelStyle}>Priority</label>
                    <select
                      name="priority"
                      value={formData.priority || "Warm"}
                      onChange={handleChange}
                      style={inputStyle}
                    >
                      <option value="Cold" style={{ background: "#1e293b" }}>
                        Cold ❄️
                      </option>
                      <option value="Warm" style={{ background: "#1e293b" }}>
                        Warm ☀️
                      </option>
                      <option value="Hot" style={{ background: "#1e293b" }}>
                        Hot 🔥
                      </option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Deal Value^ (₹)</label>
                    <input
                      type="number"
                      name="dealValue"
                      value={formData.dealValue || ""}
                      onChange={handleChange}
                      placeholder="e.g. 750000"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>
                      Expected Closure (Month & Year)
                    </label>
                    <input
                      type="month"
                      name="expectedClosureDate"
                      value={formData.expectedClosureDate || ""}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 style={sectionHeaderStyle}>
                  <Briefcase style={{ width: "15px", height: "15px" }} /> Lead
                  Status & Stage Pipeline
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "1.25rem",
                  }}
                >
                  <div>
                    <label style={labelStyle}>
                      Main Lead Status{" "}
                      <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <select
                      name="leadStatus"
                      required
                      value={formData.leadStatus || "Active"}
                      onChange={handleChange}
                      style={{
                        ...inputStyle,
                        fontWeight: 700,
                        borderColor: "#6366f1",
                      }}
                    >
                      <option value="Active" style={{ background: "#1e293b" }}>
                        Active ⚡
                      </option>
                      <option value="Won" style={{ background: "#1e293b" }}>
                        Won 🎉
                      </option>
                      <option value="Lost" style={{ background: "#1e293b" }}>
                        Lost ❌
                      </option>
                      <option value="Hold" style={{ background: "#1e293b" }}>
                        Hold ⏸️
                      </option>
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>
                      Sub-Status Stage for ({formData.leadStatus}){" "}
                      <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <select
                      name="subStatus"
                      required
                      value={formData.subStatus || ""}
                      onChange={handleChange}
                      style={inputStyle}
                    >
                      {getSubStatusesForMainStatus().map((sub) => (
                        <option
                          key={sub}
                          value={sub}
                          style={{ background: "#1e293b" }}
                        >
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>
                      Qualify Status <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <select
                      name="qualifyStatus"
                      required
                      value={formData.qualifyStatus || "Qualified"}
                      onChange={handleChange}
                      style={inputStyle}
                    >
                      <option
                        value="Qualified"
                        style={{ background: "#1e293b" }}
                      >
                        Qualified
                      </option>
                      <option
                        value="Unqualified"
                        style={{ background: "#1e293b" }}
                      >
                        Unqualified
                      </option>
                      <option value="Invalid" style={{ background: "#1e293b" }}>
                        Invalid
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Progress Notes & Follow-up */}
          {activeTab === "progress" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              <div
                style={{
                  background: "rgba(30, 41, 59, 0.4)",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  padding: "1.25rem",
                }}
              >
                <h3 style={sectionHeaderStyle}>
                  <MessageSquare style={{ width: "15px", height: "15px" }} />{" "}
                  Add Lead Progress Note
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <label style={labelStyle}>
                      Lead Progress Note (Max 100 words)
                    </label>
                    <textarea
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      rows={2}
                      placeholder="Enter discussion summary, client feedback, space options shared..."
                      style={{ ...inputStyle, resize: "vertical" }}
                    />
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "1rem",
                      alignItems: "end",
                    }}
                  >
                    <div>
                      <label style={labelStyle}>
                        Follow-up Date{" "}
                        <span style={{ color: "#ef4444" }}>*</span> (Mandatory
                        after adding note)
                      </label>
                      <input
                        type="date"
                        value={newFollowUpDate}
                        onChange={(e) => setNewFollowUpDate(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddProgressNote}
                      style={{
                        background: "rgba(99, 102, 241, 0.2)",
                        border: "1px solid rgba(99, 102, 241, 0.4)",
                        color: "#a5b4fc",
                        padding: "0.65rem 1.25rem",
                        borderRadius: "8px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <Plus style={{ width: "16px", height: "16px" }} /> Add
                      Note to Timeline
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress History Timeline */}
              <div>
                <h3 style={sectionHeaderStyle}>
                  <Clock style={{ width: "15px", height: "15px" }} /> Historical
                  Progress Log
                </h3>
                {!formData.progressNotes ||
                formData.progressNotes.length === 0 ? (
                  <div
                    style={{
                      color: "#64748b",
                      fontSize: "0.85rem",
                      padding: "1rem 0",
                    }}
                  >
                    No progress notes recorded yet for this lead.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    {formData.progressNotes.map((pn, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "rgba(15, 23, 42, 0.6)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: "10px",
                          padding: "0.85rem 1.25rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "0.3rem",
                            fontSize: "0.75rem",
                            color: "#94a3b8",
                          }}
                        >
                          <span>
                            Recorded on:{" "}
                            {new Date(pn.createdAt).toLocaleDateString()}
                          </span>
                          <span style={{ color: "#818cf8", fontWeight: 600 }}>
                            Follow-up: {pn.followUpDate}
                          </span>
                        </div>
                        <p
                          style={{
                            color: "#e2e8f0",
                            fontSize: "0.85rem",
                            margin: 0,
                            lineHeight: 1.5,
                          }}
                        >
                          {pn.note}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Won Documents & Terms */}
          {activeTab === "documents" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              <div>
                <h3 style={sectionHeaderStyle}>
                  <FileText style={{ width: "15px", height: "15px" }} /> Won
                  Stage Document Upload Copies
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "1rem",
                  }}
                >
                  <DocUploadBox
                    label="Signed LOI Copy"
                    value={formData.documents?.loiSignedCopy}
                    onChange={(v) => handleDocumentChange("loiSignedCopy", v)}
                  />
                  <DocUploadBox
                    label="Signed Agreement Copy"
                    value={formData.documents?.agreementSignedCopy}
                    onChange={(v) =>
                      handleDocumentChange("agreementSignedCopy", v)
                    }
                  />
                  <DocUploadBox
                    label="Commission Invoice Copy"
                    value={formData.documents?.invoiceCopy}
                    onChange={(v) => handleDocumentChange("invoiceCopy", v)}
                  />
                  <DocUploadBox
                    label="Fee Letter Copy"
                    value={formData.documents?.feeLetterCopy}
                    onChange={(v) => handleDocumentChange("feeLetterCopy", v)}
                  />
                </div>
              </div>

              <div>
                <h3 style={sectionHeaderStyle}>
                  <Calendar style={{ width: "15px", height: "15px" }} /> Won
                  Closure Terms & Expansion Plan
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <label style={labelStyle}>
                      Lock-in End Date (Calendar picker)
                    </label>
                    <input
                      type="date"
                      name="lockInEndDate"
                      value={formData.lockInEndDate || ""}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle}>
                      Expansion Plan Note (Max 100 words)
                    </label>
                    <textarea
                      name="expansionPlan"
                      rows={2}
                      value={formData.expansionPlan || ""}
                      onChange={handleChange}
                      placeholder="Detail future seat expansion, secondary location requirements..."
                      style={{ ...inputStyle, resize: "vertical" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Activity Log & WIP Log (Immutable Audit Trail) */}
          {activeTab === "activity" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              {/* Activity Log Section */}
              <div
                style={{
                  background: "rgba(30, 41, 59, 0.4)",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  padding: "1.25rem",
                }}
              >
                <h3 style={sectionHeaderStyle}>
                  <Activity style={{ width: "15px", height: "15px" }} />{" "}
                  Activity Log (Immutable Audit Trail)
                </h3>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "#94a3b8",
                    marginBottom: "1rem",
                  }}
                >
                  Automatically records every activity with the employee's name,
                  date, and time. Activity logs are immutable and cannot be
                  modified or deleted by any employee.
                </p>
                {!formData.activityLogs ||
                formData.activityLogs.length === 0 ? (
                  <div style={{ color: "#64748b", fontSize: "0.85rem" }}>
                    No activity logs recorded.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.6rem",
                    }}
                  >
                    {formData.activityLogs.map((act, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "rgba(15, 23, 42, 0.6)",
                          borderLeft: "3px solid #10b981",
                          borderRadius: "6px",
                          padding: "0.65rem 0.9rem",
                          fontSize: "0.8rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            color: "#94a3b8",
                            fontSize: "0.72rem",
                            marginBottom: "0.2rem",
                          }}
                        >
                          <span style={{ fontWeight: 600, color: "#34d399" }}>
                            <ShieldCheck
                              style={{
                                width: "12px",
                                height: "12px",
                                verticalAlign: "middle",
                              }}
                            />{" "}
                            {act.author}
                          </span>
                          <span>
                            {new Date(act.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p
                          style={{
                            color: "#f8fafc",
                            margin: 0,
                            lineHeight: 1.4,
                          }}
                        >
                          {act.activity}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* WIP Log Section */}
              <div
                style={{
                  background: "rgba(30, 41, 59, 0.4)",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  padding: "1.25rem",
                }}
              >
                <h3 style={sectionHeaderStyle}>
                  <Cpu style={{ width: "15px", height: "15px" }} /> WIP Log
                  (Work In Progress & System Usage)
                </h3>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "#94a3b8",
                    marginBottom: "1rem",
                  }}
                >
                  Records the total time each team member spends working in the
                  CRM. This helps monitor productivity, user engagement, and
                  system usage.
                </p>
                {!formData.wipLogs || formData.wipLogs.length === 0 ? (
                  <div style={{ color: "#64748b", fontSize: "0.85rem" }}>
                    No WIP logs recorded.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.6rem",
                    }}
                  >
                    {formData.wipLogs.map((wip, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "rgba(15, 23, 42, 0.6)",
                          borderLeft: "3px solid #6366f1",
                          borderRadius: "6px",
                          padding: "0.65rem 0.9rem",
                          fontSize: "0.8rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            color: "#94a3b8",
                            fontSize: "0.72rem",
                            marginBottom: "0.2rem",
                          }}
                        >
                          <span style={{ fontWeight: 600, color: "#a5b4fc" }}>
                            {wip.author || "System"}
                          </span>
                          <span>
                            {new Date(wip.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p
                          style={{
                            color: "#e2e8f0",
                            margin: 0,
                            lineHeight: 1.4,
                          }}
                        >
                          {wip.log}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "1rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                color: "#cbd5e1",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                padding: "0.75rem 1.5rem",
                borderRadius: "10px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#ffffff",
                border: "none",
                padding: "0.75rem 1.75rem",
                borderRadius: "10px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
              }}
            >
              <Save style={{ width: "16px", height: "16px" }} />{" "}
              {loading ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TabButton({
  id,
  label,
  active,
  onClick,
  badge,
}: {
  id: string;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? "rgba(99, 102, 241, 0.2)" : "transparent",
        border: active ? "1px solid rgba(99, 102, 241, 0.4)" : "none",
        color: active ? "#818cf8" : "#94a3b8",
        padding: "0.5rem 0.9rem",
        borderRadius: "8px",
        fontSize: "0.82rem",
        fontWeight: 600,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        whiteSpace: "nowrap",
        transition: "all 0.2s",
      }}
    >
      {label}
      {badge && (
        <span
          style={{
            background: "rgba(99, 102, 241, 0.3)",
            color: "#a5b4fc",
            fontSize: "0.7rem",
            padding: "0.1rem 0.4rem",
            borderRadius: "9999px",
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function DocUploadBox({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (val: string) => void;
}) {
  return (
    <div
      style={{
        background: "rgba(30, 41, 59, 0.5)",
        border: "1px dashed rgba(255, 255, 255, 0.15)",
        borderRadius: "10px",
        padding: "1rem",
      }}
    >
      <label style={labelStyle}>{label}</label>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="File name / link e.g. loi_signed.pdf"
          style={{ ...inputStyle, fontSize: "0.8rem" }}
        />
        <button
          type="button"
          onClick={() => onChange(`uploaded_${Date.now()}.pdf`)}
          title="Simulate File Upload"
          style={{
            background: "rgba(99, 102, 241, 0.15)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            color: "#818cf8",
            padding: "0.5rem",
            borderRadius: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Upload style={{ width: "14px", height: "14px" }} />
        </button>
      </div>
    </div>
  );
}

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: "0.85rem",
  fontWeight: 600,
  color: "#818cf8",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "0.85rem",
  display: "flex",
  alignItems: "center",
  gap: "0.4rem",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.8rem",
  fontWeight: 500,
  color: "#94a3b8",
  marginBottom: "0.4rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(30, 41, 59, 0.7)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "8px",
  padding: "0.65rem 0.85rem",
  color: "#f8fafc",
  fontSize: "0.85rem",
  outline: "none",
  fontFamily: "inherit",
};
