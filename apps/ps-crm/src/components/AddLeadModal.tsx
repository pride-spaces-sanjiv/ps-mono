import React, { useState } from 'react';
import { X, Send, AlertCircle, Building2, User, Layers, Briefcase, Flame, DollarSign, Calendar } from 'lucide-react';
import { CreateLeadPayload, LeadPriority } from '@pride-spaces/types';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadAdded: () => void;
  backendUrl: string;
}

const CITIES = [
  'Mumbai',
  'Delhi NCR',
  'Bengaluru',
  'Hyderabad',
  'Pune',
  'Chennai',
  'Kolkata',
  'Ahmedabad',
  'Gurgaon',
  'Noida',
  'Chandigarh',
  'Jaipur',
  'Kochi'
];

const SPACE_TYPES = [
  'Conventional Office',
  'Managed Office',
  'Unmanaged Office',
  'Coworking',
  'Meeting / Conference / Training Room / Event Space',
  'Virtual Office',
  'Day Pass / Hot Desk'
];

const INDUSTRIES = [
  'IT & Software',
  'BPO',
  'BFSI',
  'Healthcare',
  'E-com/Retail',
  'Manufacturing/Industrial',
  'Real estate',
  'Media/Advertising/Marketing',
  'Education/EdTech',
  'Service Provider',
  'Recruitment/Staffing',
  'Others'
];

const TEAM_SIZES = ['0-10', '10-50', '50-100', '100+', '200+', '500+'];

const COMPANY_TYPES = ['Startup', 'MSME', 'Mid-Market Enterprise', 'Large Enterprise', 'MNC'];

const LEAD_SOURCES = [
  'Website',
  'Referral',
  'BD',
  'Social Media',
  'Cold Call',
  'Renewal/Expansion',
  'Channel Partner',
  'Others'
];

const TEAM_MEMBERS = ['Abhay Kumawat (Admin)', 'Sarah Jenkins (BD Lead)', 'Rajesh Sharma (Sales Manager)', 'Priya Nair (Account Exec)', 'Vikram Malhotra (Senior Manager)'];

export default function AddLeadModal({ isOpen, onClose, onLeadAdded, backendUrl }: AddLeadModalProps) {
  const [formData, setFormData] = useState<CreateLeadPayload>({
    companyName: '',
    contactPerson: '',
    designation: '',
    mobileNumber: '',
    alternateNumber: '',
    email: '',
    spaceType: 'Managed Office',
    requirementSnapshot: '',
    city: 'Mumbai',
    industry: 'IT & Software',
    companyTeamSize: '10-50',
    companyType: 'Startup',
    existingOffice: '',
    leadSource: 'Website',
    assignedTo: TEAM_MEMBERS[0],
    coManager: TEAM_MEMBERS[1],
    qualifyStatus: 'Qualified',
    unqualifiedReason: '',
    priority: 'Warm',
    dealValue: 0,
    expectedClosureDate: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'dealValue' ? (value ? Number(value) : 0) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      let response = await fetch(`${backendUrl}/crm/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok && backendUrl !== 'http://localhost:5011') {
        response = await fetch(`http://localhost:5011/crm/leads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
      }

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.message || 'Failed to create lead');
      }

      onLeadAdded();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Something went wrong while creating lead.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)', padding: '1rem' }}>
      <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '16px', width: '100%', maxWidth: '850px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(30, 41, 59, 0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', padding: '0.5rem', borderRadius: '10px' }}>
              <Building2 style={{ width: '20px', height: '20px', color: '#fff' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>Add New Lead</h2>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Fill in customer details & workspace requirement specification</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.4rem', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Form Error Banner */}
        {errorMsg && (
          <div style={{ margin: '1rem 1.75rem 0 1.75rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} /> {errorMsg}
          </div>
        )}

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Section 1: Client Contact Information */}
          <div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User style={{ width: '15px', height: '15px' }} /> 1. Contact & Company Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Company Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" name="companyName" required value={formData.companyName} onChange={handleChange} placeholder="e.g. Acme Space Tech" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Contact Person <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" name="contactPerson" required value={formData.contactPerson} onChange={handleChange} placeholder="e.g. John Doe" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Designation</label>
                <input type="text" name="designation" value={formData.designation} onChange={handleChange} placeholder="e.g. Head of Operations" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Mobile Number <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="tel" name="mobileNumber" required value={formData.mobileNumber} onChange={handleChange} placeholder="+91 9876543210" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Alternate Number</label>
                <input type="tel" name="alternateNumber" value={formData.alternateNumber} onChange={handleChange} placeholder="+91 9876500000" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="john@acme.com" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Section 2: Workspace Requirement */}
          <div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers style={{ width: '15px', height: '15px' }} /> 2. Space Requirement & Location
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Space Type</label>
                <select name="spaceType" value={formData.spaceType} onChange={handleChange} style={inputStyle}>
                  {SPACE_TYPES.map((st) => (
                    <option key={st} value={st} style={{ background: '#1e293b' }}>{st}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>City <span style={{ color: '#ef4444' }}>*</span></label>
                <select name="city" required value={formData.city} onChange={handleChange} style={inputStyle}>
                  {CITIES.map((c) => (
                    <option key={c} value={c} style={{ background: '#1e293b' }}>{c}</option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Requirement Snapshot <span style={{ color: '#ef4444' }}>*</span> (Max 100 words)</label>
                <textarea name="requirementSnapshot" required rows={2} value={formData.requirementSnapshot} onChange={handleChange} placeholder="Describe team headcount, preferred layout, target timeline..." style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </div>
          </div>

          {/* Section 3: Business & Priority Parameters */}
          <div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Briefcase style={{ width: '15px', height: '15px' }} /> 3. Priority, Deal Value & Classification
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Lead Priority</label>
                <select name="priority" value={formData.priority} onChange={handleChange} style={inputStyle}>
                  <option value="Cold" style={{ background: '#1e293b' }}>Cold ❄️</option>
                  <option value="Warm" style={{ background: '#1e293b' }}>Warm ☀️</option>
                  <option value="Hot" style={{ background: '#1e293b' }}>Hot 🔥</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Deal Value (₹)</label>
                <input type="number" name="dealValue" value={formData.dealValue || ''} onChange={handleChange} placeholder="e.g. 500000" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Expected Closure Date</label>
                <input type="month" name="expectedClosureDate" value={formData.expectedClosureDate || ''} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Industry</label>
                <select name="industry" value={formData.industry} onChange={handleChange} style={inputStyle}>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind} style={{ background: '#1e293b' }}>{ind}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Company Team Size</label>
                <select name="companyTeamSize" value={formData.companyTeamSize} onChange={handleChange} style={inputStyle}>
                  {TEAM_SIZES.map((ts) => (
                    <option key={ts} value={ts} style={{ background: '#1e293b' }}>{ts} members</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Company Type</label>
                <select name="companyType" value={formData.companyType} onChange={handleChange} style={inputStyle}>
                  {COMPANY_TYPES.map((ct) => (
                    <option key={ct} value={ct} style={{ background: '#1e293b' }}>{ct}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Lead Source</label>
                <select name="leadSource" value={formData.leadSource} onChange={handleChange} style={inputStyle}>
                  {LEAD_SOURCES.map((ls) => (
                    <option key={ls} value={ls} style={{ background: '#1e293b' }}>{ls}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Assignment & Qualification */}
          <div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User style={{ width: '15px', height: '15px' }} /> 4. Assignment & Qualification
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Assigned To <span style={{ color: '#ef4444' }}>*</span></label>
                <select name="assignedTo" required value={formData.assignedTo} onChange={handleChange} style={inputStyle}>
                  {TEAM_MEMBERS.map((m) => (
                    <option key={m} value={m} style={{ background: '#1e293b' }}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Co-Manager <span style={{ color: '#ef4444' }}>*</span></label>
                <select name="coManager" required value={formData.coManager} onChange={handleChange} style={inputStyle}>
                  {TEAM_MEMBERS.map((m) => (
                    <option key={m} value={m} style={{ background: '#1e293b' }}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Qualify Status <span style={{ color: '#ef4444' }}>*</span></label>
                <select name="qualifyStatus" required value={formData.qualifyStatus} onChange={handleChange} style={inputStyle}>
                  <option value="Qualified" style={{ background: '#1e293b' }}>Qualified</option>
                  <option value="Unqualified" style={{ background: '#1e293b' }}>Unqualified</option>
                  <option value="Invalid" style={{ background: '#1e293b' }}>Invalid</option>
                </select>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button type="button" onClick={onClose} style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#cbd5e1', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 500, cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#ffffff', border: 'none', padding: '0.75rem 1.75rem', borderRadius: '10px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)' }}>
              <Send style={{ width: '16px', height: '16px' }} /> {loading ? 'Saving Lead...' : 'Submit Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 500,
  color: '#94a3b8',
  marginBottom: '0.4rem'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(30, 41, 59, 0.7)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '8px',
  padding: '0.65rem 0.85rem',
  color: '#f8fafc',
  fontSize: '0.85rem',
  outline: 'none',
  fontFamily: 'inherit'
};
