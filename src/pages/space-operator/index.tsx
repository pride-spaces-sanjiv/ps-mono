import { useState } from "react";
import type { SpaceSchema } from "@/utils/schemas/space";

const initialSpaces: SpaceSchema[] = [
  {
    branch: "BR001",
    enterprise: "ENT001",
    name: "Awfis – Cyber Hub",
    email: "cyberhub@awfis.com",
    location: {
      address: "Cyber Hub",
      city: "Gurgaon",
      state: "Haryana",
      postalCode: "122002",
      country: "India",
      lat: 28.495,
      lng: 77.089,
    },
    description: "Premium coworking space",
    openTime: new Date(),
    closeTime: new Date(),
    openDays: 5,
    isVerified: true,
    isActive: true,
    rating: 4.6,
    reviews: 120,
  },
  {
    branch: "BR002",
    enterprise: "ENT001",
    name: "Smartworks – Andheri East",
    email: "andheri@smartworks.com",
    location: {
      address: "Andheri East",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400069",
      country: "India",
      lat: 19.113,
      lng: 72.869,
    },
    description: "Large coworking campus",
    openTime: new Date(),
    closeTime: new Date(),
    openDays: 6,
    isVerified: false,
    isActive: true,
    rating: 4.2,
    reviews: 80,
  },
  {
    branch: "BR003",
    enterprise: "ENT001",
    name: "IndiQube – Whitefield",
    email: "whitefield@indiqube.com",
    location: {
      address: "Whitefield",
      city: "Bangalore",
      state: "Karnataka",
      postalCode: "560066",
      country: "India",
      lat: 12.969,
      lng: 77.75,
    },
    description: "Flexible startup workspace",
    openTime: new Date(),
    closeTime: new Date(),
    openDays: 5,
    isVerified: true,
    isActive: false,
    rating: 4.8,
    reviews: 210,
  },
];

export default function SpaceOperatorPage() {
  const [spaces, setSpaces] = useState<SpaceSchema[]>(initialSpaces);
  const [search, setSearch] = useState("");

  const filteredSpaces = spaces.filter((space) =>
    space.name.toLowerCase().includes(search.toLowerCase())
  );

  // ADD SPACE (only if < 3)
  const handleAdd = () => {
    if (spaces.length >= 3) {
      alert("Maximum 3 spaces allowed");
      return;
    }

    const newSpace: SpaceSchema = {
      branch: "BR004",
      enterprise: "ENT001",
      name: "New Workspace",
      email: "new@workspace.com",
      location: {
        address: "New Address",
        city: "Delhi",
        state: "Delhi",
        postalCode: "110001",
        country: "India",
        lat: 0,
        lng: 0,
      },
      description: "Newly created space",
      openTime: new Date(),
      closeTime: new Date(),
      openDays: 5,
      isVerified: false,
      isActive: true,
      rating: 0,
      reviews: 0,
    };

    setSpaces([...spaces, newSpace]);
  };

  // DELETE SPACE (not below 3)
  const handleDelete = (index: number) => {
    if (spaces.length <= 3) {
      alert("Minimum 3 spaces required");
      return;
    }

    const updated = spaces.filter((_, i) => i !== index);
    setSpaces(updated);
  };

  // EDIT SPACE
  const handleEdit = (index: number) => {
    const updated = [...spaces];
    updated[index].name = updated[index].name + " (Edited)";
    setSpaces(updated);
  };

  return (
    <div className="p-10 min-h-screen bg-gradient-to-b from-slate-900 to-black text-white">

      {/* Breadcrumb */}
      <div className="text-sm text-gray-400 mb-4">
        Dashboard / Operators / <span className="text-white">Spaces</span>
      </div>

      {/* Page Title */}
      <h1 className="text-2xl font-semibold mb-6">
        Spaces Under Operator
      </h1>

      {/* Search + Add */}
      <div className="flex items-center mb-6 gap-4">

        <input
          type="text"
          placeholder="Search spaces..."
          className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white w-80"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          onClick={handleAdd}
          className="ml-auto bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg"
        >
          Add Space
        </button>

      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">

        <table className="w-full text-left">

          <thead className="bg-slate-800 text-gray-200">
            <tr>
              <th className="p-4">Branch</th>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Location</th>
              <th className="p-4">Description</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>

          <tbody>

            {filteredSpaces.map((space, index) => (
              <tr
                key={index}
                className="border-t border-slate-700 hover:bg-slate-800"
              >

                <td className="p-4">{space.branch}</td>
                <td className="p-4">{space.name}</td>
                <td className="p-4">{space.email}</td>
                <td className="p-4">
                  {space.location.city}, {space.location.state}
                </td>
                <td className="p-4 text-gray-300">
                  {space.description}
                </td>

                <td className="p-4 flex gap-3">

                  <button
                    onClick={() => handleEdit(index)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>

                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>
    </div>
  );
}