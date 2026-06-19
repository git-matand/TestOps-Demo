import { useState, useEffect } from "react";
import { Asset, DATA } from "../data";

interface AssetFormProps {
  mode: "create" | "edit";
  asset?: Asset;
  assets: Asset[];
  open: boolean;
  onClose: () => void;
  onSave: (asset: Asset) => void;
  addToast: (t: string, s?: string, type?: string) => void;
}

const STATUS_OPTIONS = ["ready", "deployed", "investigating", "archived"] as const;
const STATUS_LABELS: Record<string, string> = {
  ready: "Ready to Deploy",
  deployed: "Deployed",
  investigating: "Investigating",
  archived: "Archived",
};

function nextAutoTag(assets: Asset[]): string {
  const m = assets.reduce((x, a) => Math.max(x, parseInt(a.tag) || 0), 0);
  return String(m + 1).padStart(5, "0");
}

export function AssetForm({ mode, asset, assets, open, onClose, onSave, addToast }: AssetFormProps) {
  const [tag, setTag] = useState("");
  const [serial, setSerial] = useState("");
  const [model, setModel] = useState(DATA.models[0].name);
  const [cat, setCat] = useState(DATA.categories[0].name);
  const [status, setStatus] = useState<Asset["status"]>("ready");
  const [location, setLocation] = useState(DATA.locations[0]);
  const [requestable, setRequestable] = useState(false);
  const [tnum, setTnum] = useState("");
  const [hash, setHash] = useState("");
  const [assetType, setAssetType] = useState("");
  const [star, setStar] = useState("");
  const [sample, setSample] = useState("");
  const [sw, setSw] = useState("");
  const [variant, setVariant] = useState("");
  const [market, setMarket] = useState("");
  const [assetName, setAssetName] = useState("");
  const [warranty, setWarranty] = useState("");
  const [checkinDate, setCheckinDate] = useState("");
  const [auditDate, setAuditDate] = useState("");
  const [notes, setNotes] = useState("");

  const [tagError, setTagError] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [discardPrompt, setDiscardPrompt] = useState(false);

  // Initialize form on open
  useEffect(() => {
    if (!open) return;
    setDirty(false);
    setDiscardPrompt(false);
    setTagError("");
    if (mode === "create") {
      setTag(nextAutoTag(assets));
      setSerial("");
      setModel(DATA.models[0].name);
      setCat(DATA.categories[0].name);
      setStatus("ready");
      setLocation(DATA.locations[0]);
      setRequestable(false);
      setTnum(""); setHash(""); setAssetType(""); setStar(""); setSample("");
      setSw(""); setVariant(""); setMarket("");
      setAssetName(""); setWarranty(""); setCheckinDate(""); setAuditDate(""); setNotes("");
    } else if (asset) {
      setTag(asset.tag);
      setSerial(asset.serial === "—" ? "" : asset.serial);
      setModel(asset.model);
      setCat(asset.cat);
      setStatus(asset.status);
      setLocation(asset.location);
      setRequestable(false);
      setTnum(asset.cf.tnum === "—" ? "" : asset.cf.tnum);
      setHash("");
      setAssetType("");
      setStar(asset.cf.star === "—" ? "" : asset.cf.star);
      setSample(asset.cf.sample === "—" ? "" : asset.cf.sample);
      setSw(asset.cf.sw === "none" ? "" : asset.cf.sw);
      setVariant(asset.cf.variant === "—" ? "" : asset.cf.variant);
      setMarket(asset.cf.market === "—" ? "" : asset.cf.market);
      setAssetName(asset.name !== "—" ? asset.name : "");
      setWarranty("");
      setCheckinDate("");
      setAuditDate(asset.audit?.date && asset.audit.date !== "—" ? asset.audit.date : "");
      setNotes("");
    }
  }, [open, mode, asset?.tag]);

  const markDirty = () => setDirty(true);

  const isDuplicateTag = mode === "create" && assets.some(a => a.tag === tag);

  const handleClose = () => {
    if (dirty) {
      setDiscardPrompt(true);
    } else {
      onClose();
    }
  };

  const handleDiscard = () => {
    setDirty(false);
    setDiscardPrompt(false);
    onClose();
  };

  const handleSave = async () => {
    // Validation
    if (!tag.trim()) {
      setTagError("Asset tag is required");
      return;
    }
    if (isDuplicateTag) {
      setTagError("Tag already exists");
      return;
    }
    setTagError("");
    setSaving(true);

    await new Promise(r => setTimeout(r, 400)); // simulate async

    const newAsset: Asset = {
      tag: tag.trim(),
      name: assetName || "—",
      serial: serial || "—",
      model,
      cat,
      status,
      assignee: mode === "edit" && asset ? asset.assignee : null,
      location,
      cost: mode === "edit" && asset ? asset.cost : "—",
      value: mode === "edit" && asset ? asset.value : "—",
      audit: {
        due: !!auditDate && new Date(auditDate) <= new Date(Date.now() + 30 * 86400000),
        date: auditDate || "—",
      },
      cf: {
        tnum: tnum || "—",
        star: star || "—",
        sample: sample || "—",
        sw: sw || "none",
        variant: variant || "—",
        market: market || "—",
      },
    };

    setSaving(false);
    onSave(newAsset);
    addToast(
      mode === "create" ? "Asset registered" : "Asset updated",
      `#${newAsset.tag} · ${newAsset.model}`
    );
  };

  if (!open) return null;

  return (
    <>
      {/* Scrim */}
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 49 }}
        onClick={handleClose}
      />

      <div className={`to-drawer-wide ${open ? "open" : ""}`}>
        {/* Header */}
        <div className="to-drawer-h" style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              {mode === "create" ? "Create asset" : `Edit asset #${asset?.tag}`}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 3 }}>
              Fill in the details below. Fields marked <span style={{ color: "var(--bad)" }}>*</span> are required.
            </div>
          </div>
          <button className="to-drawer-x" onClick={handleClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        {/* Discard prompt banner */}
        {discardPrompt && (
          <div style={{
            background: "var(--warn-dim)", border: "1px solid rgba(242,201,76,.3)",
            borderRadius: 0, padding: "10px 20px", display: "flex", alignItems: "center", gap: 12,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="1.8">
              <path d="M10.3 3.3l-8.3 14.4A1 1 0 0 0 2.9 19H20.1a1 1 0 0 0 .9-1.3L12.8 3.3a1 1 0 0 0-1.6 0z" />
              <path d="M12 9v5M12 16h.01" />
            </svg>
            <span style={{ fontSize: 13, color: "var(--ink)", flex: 1 }}>You have unsaved changes. Discard?</span>
            <button className="to-btn ghost sm" onClick={() => setDiscardPrompt(false)}>Keep editing</button>
            <button className="to-btn danger sm" onClick={handleDiscard}>Discard</button>
          </div>
        )}

        {/* Body */}
        <div className="to-drawer-b" style={{ overflowY: "auto", flex: 1, padding: "20px" }}>

          {/* Section: Identity */}
          <div className="to-form-section">
            <div className="to-form-section-title">Identity</div>
            <div className="to-field-row">
              <div className="to-field">
                <label>Asset tag <span style={{ color: "var(--bad)" }}>*</span></label>
                <input
                  value={tag}
                  onChange={e => { setTag(e.target.value); markDirty(); setTagError(""); }}
                  placeholder="e.g. 00523"
                />
                {tagError && <div style={{ fontSize: 11, color: "var(--bad)", marginTop: 4 }}>⚠ {tagError}</div>}
                {isDuplicateTag && !tagError && (
                  <div style={{ fontSize: 11, color: "var(--warn)", marginTop: 4 }}>⚠ Duplicate tag — this tag already exists</div>
                )}
              </div>
              <div className="to-field">
                <label>Serial</label>
                <input value={serial} onChange={e => { setSerial(e.target.value); markDirty(); }} placeholder="Serial number" />
              </div>
            </div>
            <div className="to-field-row">
              <div className="to-field">
                <label>Model <span style={{ color: "var(--bad)" }}>*</span></label>
                <select value={model} onChange={e => { setModel(e.target.value); markDirty(); }}>
                  {DATA.models.map(m => <option key={m.name}>{m.name}</option>)}
                  <option value="__new__">＋ Add new…</option>
                </select>
              </div>
              <div className="to-field">
                <label>Category <span style={{ color: "var(--bad)" }}>*</span></label>
                <select value={cat} onChange={e => { setCat(e.target.value); markDirty(); }}>
                  {DATA.categories.map(c => <option key={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="to-field">
              <label>Status <span style={{ color: "var(--bad)" }}>*</span></label>
              <select value={status} onChange={e => { setStatus(e.target.value as Asset["status"]); markDirty(); }}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>

          {/* Section: Assignment */}
          <div className="to-form-section">
            <div className="to-form-section-title">Assignment</div>
            <div className="to-field">
              <label>Default location</label>
              <select value={location} onChange={e => { setLocation(e.target.value); markDirty(); }}>
                {DATA.locations.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="to-field" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <input
                type="checkbox"
                id="requestable"
                checked={requestable}
                onChange={e => { setRequestable(e.target.checked); markDirty(); }}
                style={{ width: 16, height: 16 }}
              />
              <label htmlFor="requestable" style={{ cursor: "pointer", fontSize: 13 }}>Requestable — allow testers to self-checkout this asset</label>
            </div>
          </div>

          {/* Section: Custom fields */}
          <div className="to-form-section">
            <div className="to-form-section-title">Custom fields</div>
            <div className="to-field-row">
              <div className="to-field">
                <label>T Number</label>
                <input value={tnum} onChange={e => { setTnum(e.target.value); markDirty(); }} placeholder="e.g. T-2207" />
              </div>
              <div className="to-field">
                <label>Hash Number</label>
                <input value={hash} onChange={e => { setHash(e.target.value); markDirty(); }} placeholder="e.g. #4812" />
              </div>
            </div>
            <div className="to-field-row">
              <div className="to-field">
                <label>Type</label>
                <input value={assetType} onChange={e => { setAssetType(e.target.value); markDirty(); }} placeholder="e.g. Prototype" />
              </div>
              <div className="to-field">
                <label>STAR</label>
                <input value={star} onChange={e => { setStar(e.target.value); markDirty(); }} placeholder="e.g. I2" />
              </div>
            </div>
            <div className="to-field-row">
              <div className="to-field">
                <label>Sample</label>
                <input value={sample} onChange={e => { setSample(e.target.value); markDirty(); }} placeholder="e.g. D21" />
              </div>
              <div className="to-field">
                <label>SW Version</label>
                <input value={sw} onChange={e => { setSw(e.target.value); markDirty(); }} placeholder="e.g. v3.1.2" />
              </div>
            </div>
            <div className="to-field-row">
              <div className="to-field">
                <label>Variant</label>
                <input value={variant} onChange={e => { setVariant(e.target.value); markDirty(); }} placeholder="e.g. Premiumplus" />
              </div>
              <div className="to-field">
                <label>Market</label>
                <input value={market} onChange={e => { setMarket(e.target.value); markDirty(); }} placeholder="e.g. USA" />
              </div>
            </div>
          </div>

          {/* Section: Optional info */}
          <div className="to-form-section">
            <div className="to-form-section-title">Optional info</div>
            <div className="to-field">
              <label>Asset name</label>
              <input value={assetName} onChange={e => { setAssetName(e.target.value); markDirty(); }} placeholder="e.g. 7413" />
            </div>
            <div className="to-field-row">
              <div className="to-field">
                <label>Warranty (months)</label>
                <input type="number" value={warranty} onChange={e => { setWarranty(e.target.value); markDirty(); }} placeholder="e.g. 24" />
              </div>
              <div className="to-field">
                <label>Expected checkin date</label>
                <input type="date" value={checkinDate} onChange={e => { setCheckinDate(e.target.value); markDirty(); }} />
              </div>
            </div>
            <div className="to-field">
              <label>Next audit date</label>
              <input type="date" value={auditDate} onChange={e => { setAuditDate(e.target.value); markDirty(); }} />
            </div>
          </div>

          {/* Section: Notes */}
          <div className="to-form-section">
            <div className="to-form-section-title">Notes</div>
            <div className="to-field">
              <textarea
                rows={4}
                value={notes}
                onChange={e => { setNotes(e.target.value); markDirty(); }}
                placeholder="Optional notes about this asset…"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="to-modal-f" style={{ borderTop: "1px solid var(--line)", padding: "14px 20px" }}>
          <button className="to-btn ghost sm" onClick={handleClose}>Cancel</button>
          <button
            className="to-btn primary sm"
            onClick={handleSave}
            disabled={saving || isDuplicateTag}
            style={{ opacity: saving || isDuplicateTag ? 0.6 : 1 }}
          >
            {saving ? "Saving…" : mode === "create" ? "Register asset" : "Save changes"}
          </button>
        </div>
      </div>
    </>
  );
}
