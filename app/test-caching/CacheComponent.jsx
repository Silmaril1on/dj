"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const CacheComponent = ({ rows }) => {
  const router = useRouter();

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", age: "" });

  const startEdit = (row) => {
    setEditing(row.id);
    setForm({
      name: row.name,
      age: row.age,
    });
  };

  const handleUpdate = async (id) => {
    await fetch("/api/test-cache-route", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        name: form.name,
        age: Number(form.age),
      }),
    });
    setEditing(null);
    router.refresh();
  };

  return (
    <div className="p-3 space-y-4 min-h-screen">
      <h1 className="text-3xl font-bold">Cache Table</h1>

      <div className="grid grid-cols-3 gap-3">
        {rows?.map((row) => (
          <div key={row.id} className="bg-stone-800 p-3 text-gold">
            <p>ID: {row.id}</p>
            {editing === row.id ? (
              <>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />

                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                />

                <button
                  className="bg-green-600 px-2 py-1"
                  onClick={() => handleUpdate(row.id)}
                >
                  Save
                </button>
              </>
            ) : (
              <>
                <p>Name: {row.name}</p>
                <p>Age: {row.age}</p>

                <button
                  className="bg-blue-600 px-2 py-1 mt-2"
                  onClick={() => startEdit(row)}
                >
                  Edit
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CacheComponent;
