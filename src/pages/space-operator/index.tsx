import { useState } from "react";
import { toast } from "sonner";
import RotatingLoader from "@/components/loaders/rotating";
import ActionButton from "@/components/buttons/action-btn";
import type { SpaceSchema } from "@/utils/schemas/space";

interface SpaceItem extends SpaceSchema {
  id: number;
}

/* ---------- Random Enterprise ---------- */

const enterpriseList = ["ENT001", "ENT002", "ENT003"];

const getRandomEnterprise = () =>
  enterpriseList[Math.floor(Math.random() * enterpriseList.length)];

/* ---------- Dummy Spaces ---------- */

const dummySpaces: SpaceItem[] = [
  {
    id: 1,
    branch: "BR001",
    enterprise: "ENT001",
    name: "Awfis Cyber Hub",
    email: "cyberhub@awfis.com",
    location: {
      address: "Cyber Hub",
      city: "Gurgaon",
      state: "Haryana",
      postalCode: "122002",
      country: "India",
      lat: 0,
      lng: 0,
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
    id: 2,
    branch: "BR002",
    enterprise: "ENT002",
    name: "Smartworks Andheri",
    email: "andheri@smartworks.com",
    location: {
      address: "Andheri",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400069",
      country: "India",
      lat: 0,
      lng: 0,
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
    id: 3,
    branch: "BR003",
    enterprise: "ENT003",
    name: "IndiQube Whitefield",
    email: "whitefield@indiqube.com",
    location: {
      address: "Whitefield",
      city: "Bangalore",
      state: "Karnataka",
      postalCode: "560066",
      country: "India",
      lat: 0,
      lng: 0,
    },
    description: "Startup workspace",
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
  const [spaces, setSpaces] = useState<SpaceItem[]>(dummySpaces);
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SpaceItem | null>(null);

  const [loading, setLoading] = useState(false);

  const itemsPerPage = 10;
  const [page, setPage] = useState(1);

  /* ---------- Filter ---------- */

  const filteredSpaces = spaces.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  /* ---------- Pagination ---------- */

  const totalPages = Math.ceil(filteredSpaces.length / itemsPerPage);

  const paginatedSpaces = filteredSpaces.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  /* ---------- Form ---------- */

  const [form, setForm] = useState({
    branch: "",
    name: "",
    email: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    lat: "",
    lng: "",
    description: "",
    openTime: "",
    closeTime: "",
    openDays: "",
    rating: "",
    reviews: "",
    isVerified: false,
    isActive: false,
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ---------- Submit ---------- */

  const handleSubmit = () => {
    if (!form.name || !form.email) {
      toast.error("Please fill required fields");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      if (editing) {
        setSpaces(
          spaces.map((s) =>
            s.id === editing.id
              ? {
                  ...s,
                  name: form.name,
                  email: form.email,
                  location: {
                    ...s.location,
                    city: form.city,
                    state: form.state,
                  },
                  description: form.description,
                }
              : s
          )
        );

        toast.success("Space updated successfully");
        setEditing(null);
      } else {
        const newSpace: SpaceItem = {
          id: spaces.length + 1,
          branch: form.branch,
          enterprise: getRandomEnterprise(),
          name: form.name,
          email: form.email,
          location: {
            address: form.address,
            city: form.city,
            state: form.state,
            postalCode: form.postalCode,
            country: form.country,
            lat: Number(form.lat),
            lng: Number(form.lng),
          },
          description: form.description,
          openTime: new Date(),
          closeTime: new Date(),
          openDays: Number(form.openDays),
          isVerified: form.isVerified,
          isActive: form.isActive,
          rating: Number(form.rating),
          reviews: Number(form.reviews),
        };

        setSpaces([...spaces, newSpace]);
        toast.success("Space created successfully");
      }

      setShowForm(false);
      setLoading(false);
    }, 600);
  };

  /* ---------- Delete ---------- */

  const handleDelete = (id: number) => {
    setSpaces(spaces.filter((s) => s.id !== id));
    toast.success("Space deleted");
  };

  /* ---------- Edit ---------- */

  const handleEdit = (space: SpaceItem) => {
    setEditing(space);
    setShowForm(true);

    setForm({
      branch: space.branch,
      name: space.name,
      email: space.email,
      address: space.location.address,
      city: space.location.city,
      state: space.location.state,
      postalCode: space.location.postalCode,
      country: space.location.country,
      lat: String(space.location.lat),
      lng: String(space.location.lng),
      description: space.description || "",
      openTime: "",
      closeTime: "",
      openDays: String(space.openDays),
      rating: String(space.rating),
      reviews: String(space.reviews),
      isVerified: space.isVerified ?? false,
      isActive: space.isActive ?? false,
    });
  };

  return (
    <div className="p-10 min-h-screen bg-gradient-to-b from-slate-900 to-black text-white">

      <h1 className="text-2xl font-semibold mb-6">
        Spaces Under Operator
      </h1>

      {/* Search */}

      <div className="flex gap-4 mb-6">

        <input
          type="text"
          placeholder="Search spaces..."
          className="px-4 py-2 bg-slate-800 border border-slate-600 rounded"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <ActionButton
          onClick={() => setShowForm(true)}
          className="ml-auto bg-blue-600"
        >
          Add Space
        </ActionButton>

      </div>

      {/* Table */}

      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">

        <table className="w-full">

          <thead className="bg-slate-800">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Name</th>
              <th className="p-4">Enterprise</th>
              <th className="p-4">Email</th>
              <th className="p-4">Location</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>

          <tbody>

            {paginatedSpaces.map((space) => (

              <tr
                key={space.id}
                className="border-t border-slate-700 hover:bg-slate-800"
              >

                <td className="p-4">{space.id}</td>

                <td className="p-4">{space.name}</td>

                <td className="p-4">{space.enterprise}</td>

                <td className="p-4">{space.email}</td>

                <td className="p-4">
                  {space.location.city}, {space.location.state}
                </td>

                <td className="p-4 flex gap-2">

                  <ActionButton
                    onClick={() => handleEdit(space)}
                    className="bg-yellow-600"
                  >
                    Edit
                  </ActionButton>

                  <ActionButton
                    onClick={() => handleDelete(space.id)}
                    className="bg-red-600"
                  >
                    Delete
                  </ActionButton>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      {/* Pagination */}

      {filteredSpaces.length > 3 && (

        <div className="flex gap-3 mt-6">

          {Array.from({ length: totalPages }, (_, i) => (

            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1 rounded ${
                page === i + 1
                  ? "bg-blue-600"
                  : "bg-slate-700"
              }`}
            >
              {i + 1}
            </button>

          ))}

        </div>

      )}

      {/* Modal Form */}

      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">

          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-[500px] max-h-[80vh] overflow-y-auto shadow-xl">

            <h2 className="text-xl font-semibold mb-4">
              {editing ? "Edit Space" : "Add Space"}
            </h2>

            <div className="grid grid-cols-2 gap-3">

              <input name="branch" placeholder="Branch ID" onChange={handleChange} className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg"/>

              <input name="name" placeholder="Space Name" onChange={handleChange} className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg"/>

              <input name="email" placeholder="Email" onChange={handleChange} className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg"/>

              <input name="address" placeholder="Address" onChange={handleChange} className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg"/>

              <input name="city" placeholder="City" onChange={handleChange} className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg"/>

              <input name="state" placeholder="State" onChange={handleChange} className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg"/>

              <input name="postalCode" placeholder="Postal Code" onChange={handleChange} className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg"/>

              <input name="country" placeholder="Country" onChange={handleChange} className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg"/>

              <input name="lat" placeholder="Latitude" onChange={handleChange} className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg"/>

              <input name="lng" placeholder="Longitude" onChange={handleChange} className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg"/>

              <input type="time" name="openTime" onChange={handleChange} className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg"/>

              <input type="time" name="closeTime" onChange={handleChange} className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg"/>

              <input name="openDays" placeholder="Open Days" onChange={handleChange} className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg"/>

              <input name="rating" placeholder="Rating" onChange={handleChange} className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg"/>

              <input name="reviews" placeholder="Reviews" onChange={handleChange} className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg"/>

            </div>

            <textarea
              name="description"
              placeholder="Description"
              onChange={handleChange}
              className="mt-3 w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg"
            />

            <div className="flex items-center gap-4 mt-3">

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  onChange={(e) =>
                    setForm({ ...form, isVerified: e.target.checked })
                  }
                />
                Verified
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                />
                Active
              </label>

            </div>

            <div className="flex justify-end mt-5">

              <ActionButton
                onClick={handleSubmit}
                className="bg-green-600 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <RotatingLoader className="size-4" />
                    Saving...
                  </>
                ) : (
                  "Submit"
                )}
              </ActionButton>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}