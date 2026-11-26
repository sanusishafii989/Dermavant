"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Plus, Pencil, Trash2, RefreshCw, Package } from "lucide-react";

interface MedicineItem {
  _id: string;
  medicine_id?: string;
  name: string;
  brand?: string;
  category?: string;
  price: number;
  quantity: number;
  description?: string;
  image?: string;
  expiry_date?: string;
  status?: string;
  qr_code?: string;
}

const EMPTY_FORM = {
  name: "",
  brand: "",
  category: "General",
  price: "",
  quantity: "",
  expiry_date: "",
  description: "",
  image: "",
};

export function PharmacyCatalogue() {
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MedicineItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<MedicineItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadMedicines = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/medicines", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Unable to load medicines.");
      setMedicines(Array.isArray(data?.medicines) ? data.medicines : []);
    } catch (err: any) {
      setError(err?.message || "Unable to load medicines.");
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMedicines();
  }, []);

  const totalInventory = useMemo(
    () => medicines.reduce((sum, item) => sum + (item.quantity || 0), 0),
    [medicines]
  );

  const openAddModal = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setShowFormModal(true);
  };

  const openEditModal = (item: MedicineItem) => {
    setEditingItem(item);
    setForm({
      name: item.name || "",
      brand: item.brand || "",
      category: item.category || "General",
      price: String(item.price ?? ""),
      quantity: String(item.quantity ?? ""),
      expiry_date: item.expiry_date ? new Date(item.expiry_date).toISOString().split("T")[0] : "",
      description: item.description || "",
      image: item.image || "",
    });
    setShowFormModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.quantity || !form.expiry_date || !form.image) {
      setError("Name, price, quantity, expiry date, and product image are required.");
      return;
    }

    const priceNum = Number(form.price);
    const quantityNum = Number(form.quantity);
    if (isNaN(priceNum) || priceNum < 0) {
      setError("Price must be a valid non-negative number.");
      return;
    }
    if (isNaN(quantityNum) || quantityNum < 0) {
      setError("Quantity must be a valid non-negative number.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: form.name,
        brand: form.brand,
        category: form.category,
        price: Number(form.price),
        quantity: Number(form.quantity),
        expiry_date: form.expiry_date,
        description: form.description,
        image: form.image,
      };

      let response;
      if (editingItem) {
        response = await fetch(`/api/medicines/${editingItem._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch("/api/medicines", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();
      if (!data.ok) {
        setError(data.error || "Failed to save medicine.");
        return;
      }

      setShowFormModal(false);
      void loadMedicines();
    } catch {
      setError("Failed to save medicine.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/medicines/${deletingItem._id}`, { method: "DELETE" });
      const data = await response.json();
      if (data.ok) {
        setShowDeleteModal(false);
        setDeletingItem(null);
        void loadMedicines();
      } else {
        setError(data.error || "Failed to delete medicine.");
      }
    } catch {
      setError("Failed to delete medicine.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-[var(--border)] bg-[var(--bg-input)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Partner catalogue</p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">Your medicines</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
              Manage your pharmacy inventory. Add, edit, or delist medicines.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-input)] px-4 py-3 text-sm text-[var(--text-secondary)]">
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Inventory</div>
              <div className="mt-1 text-xl font-semibold text-[var(--text-primary)]">{totalInventory}</div>
            </div>
            <Button variant="secondary" onClick={() => void loadMedicines()} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="primary" onClick={openAddModal}>
              <Plus className="mr-2 h-4 w-4" />
              Add medicine
            </Button>
          </div>
        </div>
      </Card>

      {error ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {loading ? (
        <Card className="p-6 text-[var(--text-secondary)]">Loading medicines…</Card>
      ) : medicines.length === 0 ? (
        <Card className="p-6 text-center text-[var(--text-secondary)]">
          <Package className="mx-auto h-12 w-12 text-[var(--accent-cyan)]/40" />
          <p className="mt-3">No medicines yet. Click &ldquo;Add medicine&rdquo; to create your first listing.</p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {medicines.map((medicine) => (
            <Card key={medicine._id} className="border border-[var(--border)] bg-[var(--bg-input)] p-5">
              <div className="flex gap-4">
                {medicine.image && medicine.image !== "/placeholder-pill.svg" ? (
                  <img src={medicine.image} alt={medicine.name} className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-input)]">
                    <Package className="h-8 w-8 text-[var(--text-muted)]" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--text-primary)]">{medicine.name}</h2>
                      <p className="mt-1 text-sm text-[var(--accent-cyan)]">{medicine.brand || "General brand"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={medicine.status === "active" ? "success" : "default"}>
                        {medicine.status || "active"}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
                    <span className="rounded-full border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-1">{medicine.category || "General"}</span>
                    <span className="rounded-full border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-1">Qty: {medicine.quantity}</span>
                    <span className="rounded-full border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-1">₦{medicine.price.toLocaleString()}</span>
                    {medicine.expiry_date ? (
                      <span className="rounded-full border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-1">
                        Exp: {new Date(medicine.expiry_date).toLocaleDateString("en-NG", { month: "short", year: "numeric" })}
                      </span>
                    ) : null}
                  </div>

                  {medicine.description ? <p className="mt-4 text-sm text-[var(--text-secondary)]">{medicine.description}</p> : null}

                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openEditModal(medicine)}>
                      <Pencil className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setDeletingItem(medicine); setShowDeleteModal(true); }}>
                      <Trash2 className="mr-1 h-3 w-3" />
                      Delist
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal open={showFormModal} onClose={() => setShowFormModal(false)} title={editingItem ? "Edit medicine" : "Add medicine"}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Paracetamol 500mg" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="e.g. Emzor" />
            <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Analgesics" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Price (₦)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. 500" required />
            <Input label="Quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="e.g. 100" required />
          </div>
          <Input label="Expiry date" type="date" min={new Date().toISOString().split("T")[0]} value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} required />
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Product image (required)</label>
            <input
              type="file"
              accept="image/*"
              required={!editingItem}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => setForm({ ...form, image: reader.result as string });
                reader.readAsDataURL(file);
              }}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--accent-cyan)] file:px-3 file:py-1.5 file:text-white"
            />
            {form.image ? (
              <div className="mt-2 flex items-center gap-2">
                <img src={form.image} alt="Preview" className="h-16 w-16 rounded-lg object-cover" />
                <span className="text-xs text-[var(--text-secondary)]">Image ready</span>
              </div>
            ) : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Description</label>
            <textarea
              className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-cyan)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)]/20"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of the medicine"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setShowFormModal(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving…" : editingItem ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delist medicine">
        {deletingItem ? (
          <div className="space-y-4">
            <p className="text-[var(--text-primary)]">
              Are you sure you want to delist <span className="font-semibold text-[var(--text-primary)]">{deletingItem.name}</span>?
              It will no longer be visible to patients but remains in your records.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Delisting…" : "Delist"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
