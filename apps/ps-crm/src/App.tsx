import React, { useState, useEffect } from "react";
import {
  Users,
  Building2,
  TrendingUp,
  Briefcase,
  Plus,
  ArrowUpRight,
  Zap,
  Search,
  Filter,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Edit,
  Flame,
  Snowflake,
  Sun,
  Clock,
  Database,
  Activity,
  Cpu,
  Eye,
  FileText,
  X,
} from "lucide-react";
import { MetricCard } from "@pride-spaces/ui/MetricCard.tsx";
import {
  CRMLead,
  ActivityLogItem,
  WipLogItem,
} from "@pride-spaces/types/crm.ts";
import AddLeadModal from "./components/AddLeadModal";
import EditLeadModal from "./components/EditLeadModal";

export default function App() {
  const [backendStatus, setBackendStatus] = useState<
    "checking" | "connected" | "offline"
  >("checking");
  const [backendUrl, setBackendUrl] = useState(
    import.meta.env.VITE_BASE_API || "http://localhost:5011",
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] =
    useState<CRMLead | null>(null);

  // Log View Modal state
  const [selectedLogsModal, setSelectedLogsModal] = useState<{
    title: string;
    type: "activity" | "wip";
    activities?: ActivityLogItem[];
    wip?: WipLogItem[];
  } | null>(null);

  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>("ALL");

  const checkBackendAndFetchLeads = (targetUrl = backendUrl) => {
    setLoadingLeads(true);
    fetch(`${targetUrl}/crm/leads`)
      .then(async (res) => {
        if (res.ok) {
          setBackendStatus("connected");
          setBackendUrl(targetUrl);
          const resData = await res.json();
          if (resData.success && Array.isArray(resData.data)) {
            setLeads(resData.data);
          }
        } else if (targetUrl !== "http://localhost:5011") {
          console.warn(
            `Remote API at ${targetUrl} returned 404. Falling back to local backend at http://localhost:5011`,
          );
          checkBackendAndFetchLeads("http://localhost:5011");
        } else {
          setBackendStatus("offline");
        }
      })
      .catch(() => {
        if (targetUrl !== "http://localhost:5011") {
          console.warn(
            `Failed to connect to ${targetUrl}. Falling back to local backend at http://localhost:5011`,
          );
          checkBackendAndFetchLeads("http://localhost:5011");
        } else {
          setBackendStatus("offline");
        }
      })
      .finally(() => {
        setLoadingLeads(false);
      });
  };

  const handleSeedDatabase = () => {
    setLoadingLeads(true);
    const targetUrl =
      backendStatus === "connected" ? backendUrl : "http://localhost:5011";
    fetch(`${targetUrl}/crm/leads/seed`, { method: "POST" })
      .then(async (res) => {
        if (res.ok) {
          checkBackendAndFetchLeads(targetUrl);
        } else if (targetUrl !== "http://localhost:5011") {
          fetch(`http://localhost:5011/crm/leads/seed`, {
            method: "POST",
          }).then(() => checkBackendAndFetchLeads("http://localhost:5011"));
        }
      })
      .catch(() => {
        fetch(`http://localhost:5011/crm/leads/seed`, { method: "POST" }).then(
          () => checkBackendAndFetchLeads("http://localhost:5011"),
        );
      })
      .finally(() => setLoadingLeads(false));
  };

  useEffect(() => {
    checkBackendAndFetchLeads();
  }, []);

  const handleEditClick = (lead: CRMLead) => {
    setSelectedLeadForEdit(lead);
    setIsEditModalOpen(true);
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.mobileNumber?.includes(searchQuery);

    const matchesStatus =
      selectedStatusTab === "ALL" ||
      lead.leadStatus === selectedStatusTab ||
      (selectedStatusTab === "Qualified" && lead.qualifyStatus === "Qualified");

    return matchesSearch && matchesStatus;
  });

  const calculateTotalPipelineValue = () => {
    return leads.reduce((sum, l) => sum + (l.dealValue || 0), 0);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f171c",
        color: "#f4f7fa",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Outer Container with Left & Right Side Gaps */}
      <div
        style={{ maxWidth: "1440px", margin: "0 auto", padding: "1.5rem 2rem" }}
      >
        {/* Top Header Bar */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "1.25rem",
            marginBottom: "1.5rem",
            borderBottom: "1px solid #293842",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "8px",
                background: "#222d36",
                border: "1px solid #293842",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Users
                style={{ width: "20px", height: "20px", color: "#4a90e2" }}
              />
            </div>
            <div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <h1
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "#ffffff",
                    margin: 0,
                  }}
                >
                  Pride Spaces
                </h1>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    background: "#222d36",
                    color: "#a6b5c2",
                    border: "1px solid #293842",
                    padding: "0.15rem 0.55rem",
                    borderRadius: "4px",
                  }}
                >
                  CRM Portal
                </span>
              </div>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "#a6b5c2",
                  fontWeight: 400,
                }}
              >
                Customer Relationship Management
              </span>
            </div>
          </div>

          {/* Navigation Actions */}
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <button
              onClick={() => setIsAddModalOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "#4a90e2",
                color: "#ffffff",
                border: "none",
                padding: "0.45rem 1rem",
                borderRadius: "6px",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Plus style={{ width: "15px", height: "15px" }} /> Add a Lead
            </button>

            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                background: "#222d36",
                color: "#f4f7fa",
                border: "1px solid #293842",
                padding: "0.45rem 0.8rem",
                borderRadius: "6px",
                fontSize: "0.82rem",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Admin Portal{" "}
              <ArrowUpRight
                style={{ width: "13px", height: "13px", color: "#a6b5c2" }}
              />
            </a>
          </div>
        </header>

        {/* Clean Metric Summary Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <MetricCard
            icon={<Users style={{ color: "#4a90e2" }} />}
            title="Total Pipeline Leads"
            value={leads.length.toString()}
            change={`${leads.filter((l) => l.priority === "Hot").length} Hot Leads`}
            positive
          />
          <MetricCard
            icon={<Briefcase style={{ color: "#10b981" }} />}
            title="Active Opportunities"
            value={leads
              .filter((l) => (l.leadStatus || "Active") === "Active")
              .length.toString()}
            change="In Active Stage"
            positive
          />
          <MetricCard
            icon={<CheckCircle2 style={{ color: "#34d399" }} />}
            title="Won Deals"
            value={leads
              .filter((l) => l.leadStatus === "Won")
              .length.toString()}
            change="LOI Signed"
            positive
          />
          <MetricCard
            icon={<TrendingUp style={{ color: "#ec4899" }} />}
            title="Pipeline Valuation"
            value={`₹${calculateTotalPipelineValue().toLocaleString("en-IN")}`}
            change="Estimated Value"
            positive
          />
        </div>

        {/* 21-Column Workspace Leads Table Section */}
        <div
          style={{
            background: "#151f26",
            borderRadius: "8px",
            border: "1px solid #293842",
            padding: "1.25rem",
          }}
        >
          {/* Section Header & Filters */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              marginBottom: "1.25rem",
            }}
          >
            <h3
              style={{
                fontSize: "1.15rem",
                fontWeight: 700,
                color: "#ffffff",
                margin: 0,
              }}
            >
              Workspace Leads
            </h3>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              {/* Search Bar */}
              <div style={{ position: "relative" }}>
                <Search
                  style={{
                    position: "absolute",
                    left: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "15px",
                    height: "15px",
                    color: "#a6b5c2",
                  }}
                />
                <input
                  type="text"
                  placeholder="Search by company, person..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: "#0f171c",
                    border: "1px solid #293842",
                    borderRadius: "6px",
                    padding: "0.45rem 0.75rem 0.45rem 2.2rem",
                    color: "#f4f7fa",
                    fontSize: "0.82rem",
                    outline: "none",
                    width: "230px",
                  }}
                />
              </div>

              {/* Status Filter Tabs */}
              <div
                style={{
                  display: "flex",
                  gap: "0.2rem",
                  background: "#0f171c",
                  padding: "0.2rem",
                  borderRadius: "6px",
                  border: "1px solid #293842",
                }}
              >
                {["ALL", "Active", "Won", "Hold", "Lost"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedStatusTab(st)}
                    style={{
                      background:
                        selectedStatusTab === st ? "#222d36" : "transparent",
                      color: selectedStatusTab === st ? "#ffffff" : "#a6b5c2",
                      border:
                        selectedStatusTab === st
                          ? "1px solid #293842"
                          : "1px solid transparent",
                      padding: "0.3rem 0.7rem",
                      borderRadius: "4px",
                      fontSize: "0.78rem",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => checkBackendAndFetchLeads()}
                title="Refresh leads list"
                style={{
                  background: "#222d36",
                  border: "1px solid #293842",
                  color: "#a6b5c2",
                  padding: "0.45rem",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <RefreshCw
                  style={{
                    width: "15px",
                    height: "15px",
                    animation: loadingLeads
                      ? "spin 1s linear infinite"
                      : "none",
                  }}
                />
              </button>
            </div>
          </div>

          {/* 21-Column Data Table */}
          <div
            style={{
              overflowX: "auto",
              border: "1px solid #293842",
              borderRadius: "6px",
            }}
          >
            <table
              style={{
                width: "100%",
                minWidth: "2300px",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "0.82rem",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#222d36",
                    borderBottom: "1px solid #293842",
                    color: "#a6b5c2",
                    textTransform: "uppercase",
                    fontSize: "0.72rem",
                    letterSpacing: "0.04em",
                  }}
                >
                  <th style={thStyle}>1. Priority</th>
                  <th style={thStyle}>2. Company Name</th>
                  <th style={thStyle}>3. Contact Person</th>
                  <th style={thStyle}>4. Mobile Number</th>
                  <th style={thStyle}>5. Requirement Snapshot</th>
                  <th style={thStyle}>6. Lead Progress</th>
                  <th style={thStyle}>7. Follow-up Date*</th>
                  <th style={thStyle}>8. Alternate Number</th>
                  <th style={thStyle}>9. Email</th>
                  <th style={thStyle}>10. Industry</th>
                  <th style={thStyle}>11. Company Size</th>
                  <th style={thStyle}>12. Existing Office</th>
                  <th style={thStyle}>13. Lead Source</th>
                  <th style={thStyle}>14. Assigned To</th>
                  <th style={thStyle}>15. Co-Manager</th>
                  <th style={thStyle}>16. Lead Created Date</th>
                  <th style={thStyle}>17. Assigned Date</th>
                  <th style={thStyle}>18. Space Type</th>
                  <th style={thStyle}>19. Designation</th>
                  <th style={thStyle}>20. Activity Log</th>
                  <th style={thStyle}>21. WIP Log</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td
                      colSpan={22}
                      style={{
                        textAlign: "center",
                        padding: "3.5rem 1rem",
                        color: "#a6b5c2",
                      }}
                    >
                      {loadingLeads
                        ? "Loading leads..."
                        : 'No matching leads found. Click "Seed Sample Lead" button above!'}
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const latestProgress =
                      lead.progressNotes && lead.progressNotes.length > 0
                        ? lead.progressNotes[lead.progressNotes.length - 1].note
                        : lead.requirementSnapshot;

                    return (
                      <tr
                        key={lead._id || lead.id}
                        style={{
                          borderBottom: "1px solid #293842",
                          transition: "background 0.15s",
                        }}
                      >
                        {/* 1. Priority */}
                        <td style={tdStyle}>
                          <PriorityPill priority={lead.priority || "Warm"} />
                        </td>

                        {/* 2. Company Name */}
                        <td style={tdStyle}>
                          <span
                            style={{
                              fontWeight: 600,
                              color: "#ffffff",
                              fontSize: "0.88rem",
                            }}
                          >
                            {lead.companyName}
                          </span>
                          <span
                            style={{
                              display: "block",
                              fontSize: "0.72rem",
                              color: "#a6b5c2",
                            }}
                          >
                            {lead.city}
                          </span>
                        </td>

                        {/* 3. Contact Person */}
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 500, color: "#f4f7fa" }}>
                            {lead.contactPerson}
                          </span>
                        </td>

                        {/* 4. Mobile Number */}
                        <td style={tdStyle}>
                          <span style={{ color: "#4a90e2", fontWeight: 500 }}>
                            <Phone
                              style={{
                                width: "11px",
                                height: "11px",
                                verticalAlign: "middle",
                              }}
                            />{" "}
                            {lead.mobileNumber}
                          </span>
                        </td>

                        {/* 5. Requirement snapshot */}
                        <td style={{ ...tdStyle, maxWidth: "200px" }}>
                          <span
                            style={{
                              color: "#a6b5c2",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {lead.requirementSnapshot}
                          </span>
                        </td>

                        {/* 6. Lead Progress */}
                        <td style={{ ...tdStyle, maxWidth: "240px" }}>
                          <span
                            style={{
                              color: "#f4f7fa",
                              fontSize: "0.8rem",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {latestProgress}
                          </span>
                        </td>

                        {/* 7. Follow-up Date* */}
                        <td style={tdStyle}>
                          {lead.followUpDate ? (
                            <span
                              style={{
                                background: "#222d36",
                                color: "#f59e0b",
                                border: "1px solid #293842",
                                padding: "0.15rem 0.5rem",
                                borderRadius: "4px",
                                fontSize: "0.75rem",
                                fontWeight: 500,
                              }}
                            >
                              <Clock
                                style={{
                                  width: "11px",
                                  height: "11px",
                                  verticalAlign: "middle",
                                }}
                              />{" "}
                              {lead.followUpDate}
                            </span>
                          ) : (
                            <span
                              style={{ color: "#a6b5c2", fontSize: "0.75rem" }}
                            >
                              None
                            </span>
                          )}
                        </td>

                        {/* 8. Alternate Number */}
                        <td style={tdStyle}>
                          <span style={{ color: "#a6b5c2" }}>
                            {lead.alternateNumber || "N/A"}
                          </span>
                        </td>

                        {/* 9. Email */}
                        <td style={tdStyle}>
                          <span style={{ color: "#a6b5c2" }}>
                            <Mail
                              style={{
                                width: "11px",
                                height: "11px",
                                verticalAlign: "middle",
                              }}
                            />{" "}
                            {lead.email}
                          </span>
                        </td>

                        {/* 10. Industry */}
                        <td style={tdStyle}>
                          <span style={{ color: "#f4f7fa", fontWeight: 500 }}>
                            {lead.industry || "IT"}
                          </span>
                        </td>

                        {/* 11. Company Size */}
                        <td style={tdStyle}>
                          <span
                            style={{
                              background: "#0f171c",
                              color: "#a6b5c2",
                              border: "1px solid #293842",
                              padding: "0.15rem 0.4rem",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                            }}
                          >
                            {lead.companyTeamSize || "200+"}
                          </span>
                        </td>

                        {/* 12. Existing Office */}
                        <td style={{ ...tdStyle, maxWidth: "200px" }}>
                          <span
                            style={{
                              color: "#a6b5c2",
                              fontSize: "0.78rem",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {lead.existingOffice || "N/A"}
                          </span>
                        </td>

                        {/* 13. Lead Source */}
                        <td style={tdStyle}>
                          <span
                            style={{
                              background: "#222d36",
                              color: "#4a90e2",
                              border: "1px solid #293842",
                              padding: "0.15rem 0.45rem",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                            }}
                          >
                            {lead.leadSource || "BD"}
                          </span>
                        </td>

                        {/* 14. Assigned To */}
                        <td style={tdStyle}>
                          <span style={{ color: "#ffffff", fontWeight: 500 }}>
                            {lead.assignedTo}
                          </span>
                        </td>

                        {/* 15. Co-Manager */}
                        <td style={tdStyle}>
                          <span style={{ color: "#a6b5c2" }}>
                            {lead.coManager}
                          </span>
                        </td>

                        {/* 16. Lead created Dates */}
                        <td style={tdStyle}>
                          <span
                            style={{ color: "#a6b5c2", fontSize: "0.75rem" }}
                          >
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </span>
                        </td>

                        {/* 17. Assigned Dates */}
                        <td style={tdStyle}>
                          <span
                            style={{ color: "#a6b5c2", fontSize: "0.75rem" }}
                          >
                            {lead.assignedDate
                              ? new Date(lead.assignedDate).toLocaleDateString()
                              : new Date(lead.createdAt).toLocaleDateString()}
                          </span>
                        </td>

                        {/* 18. Space Type */}
                        <td style={tdStyle}>
                          <span
                            style={{
                              background: "#222d36",
                              color: "#10b981",
                              border: "1px solid #293842",
                              padding: "0.15rem 0.45rem",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                            }}
                          >
                            {lead.spaceType || "Managed"}
                          </span>
                        </td>

                        {/* 19. Designation */}
                        <td style={tdStyle}>
                          <span style={{ color: "#a6b5c2" }}>
                            {lead.designation || "Admin Manager"}
                          </span>
                        </td>

                        {/* 20. Activity Log */}
                        <td style={tdStyle}>
                          <button
                            onClick={() =>
                              setSelectedLogsModal({
                                title: `Activity Logs: ${lead.companyName}`,
                                type: "activity",
                                activities: lead.activityLogs,
                              })
                            }
                            style={logButtonStyle}
                          >
                            <Activity
                              style={{ width: "12px", height: "12px" }}
                            />{" "}
                            {lead.activityLogs?.length || 0} Logs
                          </button>
                        </td>

                        {/* 21. WIP Log */}
                        <td style={tdStyle}>
                          <button
                            onClick={() =>
                              setSelectedLogsModal({
                                title: `WIP Logs: ${lead.companyName}`,
                                type: "wip",
                                wip: lead.wipLogs,
                              })
                            }
                            style={logButtonStyle}
                          >
                            <Cpu style={{ width: "12px", height: "12px" }} />{" "}
                            {lead.wipLogs?.length || 0} Logs
                          </button>
                        </td>

                        {/* Actions */}
                        <td style={tdStyle}>
                          <button
                            onClick={() => handleEditClick(lead)}
                            style={{
                              background: "#222d36",
                              border: "1px solid #293842",
                              color: "#4a90e2",
                              padding: "0.35rem 0.75rem",
                              borderRadius: "6px",
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.3rem",
                            }}
                          >
                            <Edit style={{ width: "13px", height: "13px" }} />{" "}
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onLeadAdded={() => checkBackendAndFetchLeads()}
        backendUrl={backendUrl}
      />

      <EditLeadModal
        isOpen={isEditModalOpen}
        lead={selectedLeadForEdit}
        onClose={() => setIsEditModalOpen(false)}
        onLeadUpdated={() => checkBackendAndFetchLeads()}
        backendUrl={backendUrl}
      />

      {/* Log Viewer Drawer Modal */}
      {selectedLogsModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 110,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "#151f26",
              border: "1px solid #293842",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "650px",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1rem 1.25rem",
                borderBottom: "1px solid #293842",
                background: "#222d36",
              }}
            >
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "#ffffff",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {selectedLogsModal.type === "activity" ? (
                  <Activity
                    style={{ width: "16px", height: "16px", color: "#10b981" }}
                  />
                ) : (
                  <Cpu
                    style={{ width: "16px", height: "16px", color: "#4a90e2" }}
                  />
                )}
                {selectedLogsModal.title}
              </h3>
              <button
                onClick={() => setSelectedLogsModal(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#a6b5c2",
                  cursor: "pointer",
                }}
              >
                <X style={{ width: "18px", height: "18px" }} />
              </button>
            </div>
            <div
              style={{
                overflowY: "auto",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {selectedLogsModal.type === "activity" ? (
                selectedLogsModal.activities &&
                selectedLogsModal.activities.length > 0 ? (
                  selectedLogsModal.activities.map((act, i) => (
                    <div
                      key={i}
                      style={{
                        background: "#0f171c",
                        borderLeft: "3px solid #10b981",
                        borderRadius: "4px",
                        padding: "0.75rem 1rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.72rem",
                          color: "#a6b5c2",
                          marginBottom: "0.2rem",
                        }}
                      >
                        <span style={{ fontWeight: 600, color: "#34d399" }}>
                          {act.author}
                        </span>
                        <span>{new Date(act.timestamp).toLocaleString()}</span>
                      </div>
                      <p
                        style={{
                          color: "#ffffff",
                          fontSize: "0.82rem",
                          margin: 0,
                          lineHeight: 1.4,
                        }}
                      >
                        {act.activity}
                      </p>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      color: "#a6b5c2",
                      textAlign: "center",
                      padding: "2rem",
                    }}
                  >
                    No activity logs recorded.
                  </div>
                )
              ) : selectedLogsModal.wip && selectedLogsModal.wip.length > 0 ? (
                selectedLogsModal.wip.map((wip, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#0f171c",
                      borderLeft: "3px solid #4a90e2",
                      borderRadius: "4px",
                      padding: "0.75rem 1rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.72rem",
                        color: "#a6b5c2",
                        marginBottom: "0.2rem",
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "#4a90e2" }}>
                        {wip.author || "System"}
                      </span>
                      <span>{new Date(wip.timestamp).toLocaleString()}</span>
                    </div>
                    <p
                      style={{
                        color: "#f4f7fa",
                        fontSize: "0.82rem",
                        margin: 0,
                        lineHeight: 1.4,
                      }}
                    >
                      {wip.log}
                    </p>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    color: "#a6b5c2",
                    textAlign: "center",
                    padding: "2rem",
                  }}
                >
                  No WIP logs recorded.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PriorityPill({ priority }: { priority: string }) {
  if (priority === "Hot") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.25rem",
          background: "#222d36",
          color: "#ef4444",
          border: "1px solid #293842",
          padding: "0.15rem 0.5rem",
          borderRadius: "4px",
          fontSize: "0.7rem",
          fontWeight: 600,
        }}
      >
        <Flame style={{ width: "11px", height: "11px", color: "#ef4444" }} />{" "}
        Hot 🔥
      </span>
    );
  }
  if (priority === "Warm") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.25rem",
          background: "#222d36",
          color: "#f59e0b",
          border: "1px solid #293842",
          padding: "0.15rem 0.5rem",
          borderRadius: "4px",
          fontSize: "0.7rem",
          fontWeight: 600,
        }}
      >
        <Sun style={{ width: "11px", height: "11px", color: "#f59e0b" }} /> Warm
        ☀️
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        background: "#222d36",
        color: "#3b82f6",
        border: "1px solid #293842",
        padding: "0.15rem 0.5rem",
        borderRadius: "4px",
        fontSize: "0.7rem",
        fontWeight: 600,
      }}
    >
      <Snowflake style={{ width: "11px", height: "11px", color: "#3b82f6" }} />{" "}
      Cold ❄️
    </span>
  );
}

const logButtonStyle: React.CSSProperties = {
  background: "#0f171c",
  border: "1px solid #293842",
  color: "#a6b5c2",
  padding: "0.25rem 0.6rem",
  borderRadius: "4px",
  fontSize: "0.72rem",
  fontWeight: 500,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "0.3rem",
};

const thStyle: React.CSSProperties = {
  padding: "0.85rem 1rem",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "0.85rem 1rem",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
};
