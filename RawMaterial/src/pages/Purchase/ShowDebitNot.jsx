import React, { useEffect, useState } from "react";
import Api from "../../auth/Api";

const ShowDebitNot = () => {
  const [companies, setCompanies] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [debitNotes, setDebitNotes] = useState([]);

  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedPO, setSelectedPO] = useState("");
  const [selectedDebitNote, setSelectedDebitNote] = useState("");

  const [debitNoteDetails, setDebitNoteDetails] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ================= FETCH COMPANIES ================= */
  useEffect(() => {
    Api.get("/purchase/companies")
      .then(res => setCompanies(res?.data?.data || []))
      .catch(() => setError("Failed to load companies"));
  }, []);

  /* ================= FETCH VENDORS ================= */
  useEffect(() => {
    Api.get("/purchase/vendors")
      .then(res => setVendors(res?.data?.data || []))
      .catch(() => setError("Failed to load vendors"));
  }, []);

  /* ================= FETCH PO ================= */
  useEffect(() => {
    if (!selectedCompany) return;

    Api.get(`/purchase/purchase-orders/company/${selectedCompany}`)
      .then(res => setPurchaseOrders(res?.data?.data || []))
      .catch(() => setError("Failed to load purchase orders"));
  }, [selectedCompany]);

  /* ================= FETCH DEBIT NOTES ================= */
  useEffect(() => {
    if (!selectedPO) return;

    Api.get(`/purchase/${selectedPO}/debit-note`)
      .then(res => setDebitNotes(res?.data?.data || []))
      .catch(() => setError("Failed to load debit notes"));
  }, [selectedPO]);

  /* ================= FETCH DEBIT NOTE DETAILS ================= */
  useEffect(() => {
    if (!selectedDebitNote) {
      setDebitNoteDetails(null);
      return;
    }

    Api.get(`/purchase/debit-note/details/${selectedDebitNote}`)
      .then(res => setDebitNoteDetails(res?.data?.data))
      .catch(() => setError("Failed to load debit note details"));
  }, [selectedDebitNote]);

  /* ================= DOWNLOAD ================= */
  const handleDownloadDebitNote = async () => {
    try {
      setLoading(true);

      const response = await Api.post(
        `/purchase/${selectedPO}/debit-note/download/${selectedDebitNote}`,
        {},
        { responseType: "blob" }
      );

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "DebitNote.pdf";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Download failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6 bg-white rounded-xl shadow space-y-6">
      <h2 className="text-xl font-semibold">Debit Note Viewer</h2>

      {/* DROPDOWNS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <select onChange={e => setSelectedCompany(e.target.value)} className="border p-2 rounded">
          <option value="">Company</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
        </select>

        <select onChange={e => setSelectedPO(e.target.value)} className="border p-2 rounded">
          <option value="">Purchase Order</option>
          {purchaseOrders.map(po => <option key={po.id} value={po.id}>{po.poNumber}</option>)}
        </select>

        <select className="border p-2 rounded">
          <option value="">Vendor</option>
          {vendors.map(v => <option key={v.id} value={v.id}>{v.displayName}</option>)}
        </select>

        <select onChange={e => setSelectedDebitNote(e.target.value)} className="border p-2 rounded">
          <option value="">Debit Note</option>
          {debitNotes.map(dn => <option key={dn.id} value={dn.id}>{dn.debitNoteNo}</option>)}
        </select>
      </div>

      {/* DOWNLOAD */}
      <button
        onClick={handleDownloadDebitNote}
        disabled={!selectedDebitNote}
        className="bg-ink-950 text-white px-6 py-2 rounded"
      >
        {loading ? "Downloading..." : "Download Debit Note"}
      </button>

      {/* DETAILS FORM */}
      {debitNoteDetails && (
        <>
          <h3 className="text-lg font-semibold mt-6">Debit Note Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries({
              "Debit Note No": debitNoteDetails.debitNoteNo,
              "Company": debitNoteDetails.companyName,
              "Vendor": debitNoteDetails.vendorName,
              "Status": debitNoteDetails.status,
              "GST Type": debitNoteDetails.gstType,
              "GST Rate": debitNoteDetails.gstRate,
              "Currency": debitNoteDetails.currency,
              "Grand Total": debitNoteDetails.grandTotal,
              "Invoice No": debitNoteDetails.orgInvoiceNo,
              "Transport": debitNoteDetails.transport,
              "Station": debitNoteDetails.station
            }).map(([label, value]) => (
              <div key={label}>
                <label className="text-sm text-ink-500">{label}</label>
                <input value={value || ""} readOnly className="w-full border p-2 rounded bg-ink-100" />
              </div>
            ))}
          </div>

          {/* DAMAGED STOCK TABLE */}
          <h3 className="text-lg font-semibold mt-6">Damaged Stock</h3>
          <div className="overflow-x-auto">
            <table className="w-full border mt-2">
              <thead className="bg-ink-100">
                <tr>
                  <th className="border p-2">Item</th>
                  <th className="border p-2">Model</th>
                  <th className="border p-2">Unit</th>
                  <th className="border p-2">Qty</th>
                  <th className="border p-2">Rate</th>
                  <th className="border p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {debitNoteDetails.damagedStock.map(item => (
                  <tr key={item.id}>
                    <td className="border p-2">{item.itemName}</td>
                    <td className="border p-2">{item.modelNumber}</td>
                    <td className="border p-2">{item.unit}</td>
                    <td className="border p-2">{item.quantity}</td>
                    <td className="border p-2">{item.rate}</td>
                    <td className="border p-2">{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
};

export default ShowDebitNot;
