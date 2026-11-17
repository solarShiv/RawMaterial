import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Api from "../../auth/Api";

const PaymentRequest = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { poData } = location?.state || {};

  const [billpaymentType, setBillpaymentType] = useState("");
  const [percentage, setPercentage] = useState("");
  const [amount, setAmount] = useState("");
  const [lastChanged, setLastChanged] = useState("");
  const [loading, setLoading] = useState(false);

  const subTotal = Number(poData?.subTotal || 0);
  const pendingAmount = Number(poData?.pendingAmount || 0);

  const getBaseAmount = () => {
    if (billpaymentType === "Advance_Payment") return subTotal;
    if (billpaymentType === "Partial_Payment") return pendingAmount;
    if (billpaymentType === "Full_Payment") return pendingAmount;
    if (billpaymentType === "Full_Payment_In_Advance") return pendingAmount; // Changed from subTotal to pendingAmount
    return 0;
  };

  const baseAmount = getBaseAmount();

  useEffect(() => {
    if (lastChanged === "percentage" && percentage !== "" && baseAmount > 0) {
      const pct = Number(percentage);

      if (pct <= 0 || pct > 100) {
        setAmount("");
        return;
      }

      const calculatedAmount = (baseAmount * pct) / 100;
      console.log("Calculated Amount", calculatedAmount);

      const decimalPart = calculatedAmount - Math.floor(calculatedAmount);
      console.log("Decimal Value", decimalPart);

      const roundedValue =
        decimalPart > 0.5
          ? Math.ceil(calculatedAmount)
          : Math.floor(calculatedAmount);
      setAmount(roundedValue);
    }
  }, [percentage, baseAmount, lastChanged]);

  useEffect(() => {
    if (lastChanged === "amount" && amount !== "" && baseAmount > 0) {
      const amt = Number(amount);

      if (amt <= 0 || amt > baseAmount) {
        setPercentage("");
        return;
      }

      const calculatedPercentage = (amt / baseAmount) * 100;
      setPercentage(calculatedPercentage.toFixed(2));
    }
  }, [amount, baseAmount, lastChanged]);

  useEffect(() => {
    setPercentage("");
    setAmount("");
    setLastChanged("");
  }, [billpaymentType]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!billpaymentType) {
      alert("Please select payment type");
      return;
    }

    if (!amount || amount <= 0) {
      alert("Please enter valid percentage or amount");
      return;
    }

    const payload = {
      poId: poData?.poId,
      billpaymentType,
      percentage: percentage ? Number(percentage) : null,
      amount: Number(amount),
      baseAmount,
    };

    try {
      setLoading(true);
      await Api.post("/purchase/purchase-orders/payments/request", payload);
      alert("Payment request sent successfully");
      navigate(-1);
    } catch (error) {
      console.error(error);
      alert("Failed to send payment request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] bg-ink-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-lg shadow-card p-6">
        <h2 className="text-xl font-semibold mb-6 text-ink-800">
          Payment Request
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-600 mb-1">
                PO Number
              </label>
              <input
                type="text"
                value={poData?.poNumber || ""}
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-ink-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-600 mb-1">
                Vendor Name
              </label>
              <input
                type="text"
                value={poData?.vendorName || ""}
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-ink-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-600 mb-1">
                Sub Total
              </label>
              <input
                type="text"
                value={subTotal}
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-ink-100"
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-600 mb-1">
                Pending Amount
              </label>
              <input
                type="text"
                value={pendingAmount}
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-ink-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-600 mb-1">
                Payment Type
              </label>
              <select
                value={billpaymentType}
                onChange={(e) => setBillpaymentType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select Payment Type</option>
                <option value="Advance_Payment">Advance Payment</option>
                <option value="Partial_Payment">Partial Payment</option>
                <option value="Full_Payment">Full Payment</option>
                <option value="Full_Payment_In_Advance">Full Payment In Advance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-600 mb-1">
                Calculation Base
              </label>
              <input
                type="text"
                value={baseAmount}
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-ink-100"
              />
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-600 mb-1">
                Percentage (%)
              </label>
              <input
                type="text"
                value={percentage}
                onChange={(e) => {
                  setPercentage(e.target.value);
                  setLastChanged("percentage");
                }}
                className="w-full px-3 py-2 border rounded-lg"
                min="0"
                max="100"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-600 mb-1">
                Amount
              </label>
              <input
                type="text"
                value={amount}
                onChange={(e) => {
                  const value = Number(e.target.value);

                  if (!isNaN(value)) {
                    const decimalPart = value - Math.floor(value);
                    console.log("Decimal Value", decimalPart);

                    const roundedValue =
                      decimalPart > 0.5 ? Math.ceil(value) : Math.floor(value);

                    setAmount(roundedValue);
                    setLastChanged("amount");
                  }
                }}
                className="w-full px-3 py-2 border rounded-lg"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-brand-400 text-dark px-6 py-2 rounded-lg hover:bg-brand-400 disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Payment Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentRequest;