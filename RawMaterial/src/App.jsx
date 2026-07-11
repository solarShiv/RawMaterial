import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { UserProvider, useUser } from "./Context/UserContext";

import Layout from "./pages/Layout/Layout";
import AdminDashboard from "./pages/Admin/AdminDashboard/AdminDashboard";
import Login from "./pages/Login/Login";
import ItemRequest from "./pages/ItemRequest/ItemRequest";
import StoreKeeper from "./pages/LineWorker/StoreKeeper/StoreKeeper";
import UserStockData from "./pages/LineWorker/StoreKeeper/UserStockData/UserStockData";
import StockUpdate from "./pages/LineWorker/StoreKeeper/StockUpdate/StockUpdate";
import StockUpdateHistory from "./pages/LineWorker/StoreKeeper/StockUpdateHistory/StockUpdateHistory";
import PurchaseDashboard from "./pages/Purchase/PurchaseDashboard";
import AddCompany from "./pages/Purchase/AddCompany";
import UpdateCompany from "./pages/Purchase/UpdateCompany";
import AddVendor from "./pages/Purchase/AddVendor";
import UpdateVendor from "./pages/Purchase/UpdateVendor";
import CreatePurchaseOrder from "./pages/Purchase/CreatePurchaseOrder";
import ShowPurchaseOrder from "./pages/Purchase/ShowPurchaseOrder";
import ServiceProcessRequest from "./pages/CreateProcess/ServiceProcessRequest/ServiceProcessRequest";
import PendingProcess from "./pages/CreateProcess/PendingProcess/PendingProcess";
import UserItemStock from "./pages/CreateProcess/UserItemStock/UserItemStock";
import ReusableItems from "./pages/CreateProcess/ReusableItems/ReusableItems";
import StoreTracking from "./pages/LineWorker/StoreKeeper/StoreTracking/StoreTracking";
import RawMaterialStock from "./pages/RawMaterialStock/RawMaterialStock";
import RequestItemHistory from "./pages/LineWorker/getRequestsByUser/RequestItemHistory";
import UserStock from "./pages/LineWorker/UserStock/UserStock";
import ActiveDeactivateVendor from "./pages/Purchase/ActiveDeactivateVendor";
import ActiveDeactivateCompany from "./pages/Purchase/ActiveDeactivateCompany";
import AddRawMaterial from "./pages/Purchase/AddRawMaterial";
import ShowDebitNot from "./pages/Purchase/ShowDebitNot";
import ItemDetails from "./pages/Purchase/ItemDetails";
import ChangePassword from "./pages/Purchase/ChangePassword";
import InstallationStock from "./pages/Purchase/InstallationStock";
import SingleOut from "./pages/LineWorker/StoreKeeper/SingleOut/SingleOut";
import PoStockReceiving from "./pages/LineWorker/StoreKeeper/PoStockReceiving/PoStockReceiving";
import ReceivedPurchaseStock from "./pages/LineWorker/StoreKeeper/PoStockReceiving/ReceivedPurchaseStock";
import DirectItemIssueHistory from "./pages/LineWorker/StoreKeeper/SingleOut/DirectItemIssueHistory";
import PaymentPending from "./pages/Payment/PaymentPending";
import PaymentRequest from "./pages/Payment/PaymentRequest";
import PoPaymentDetails from "./pages/Payment/PoPaymentDetails";
import PoInvoice from "./pages/Verification/PoInvoice";
import PaymentRequestDetails from "./pages/Verification/PaymentRequestDetails";
import AccountDetails from "./pages/Accounts/AccountDetails";
import PoOrderDetails from "./pages/Purchase/PoOrderDetails";
import AddWarehouse from "./pages/Purchase/AddWarehouse";
import AddUnit from "./pages/Purchase/AddUnit";
import ApprovalPOInvoice from "./pages/Purchase/ApprovalPOInvoice";
import InvoicePO from "./pages/Purchase/InvoicePO";
import VendorAllDetails from "./pages/Production/VendorAllDetails";
import Installation from "./pages/InstallationData/Installation";
import PriceComparision from "./pages/Purchase/PriceComparison";
import PrePo from "./pages/Production/PrePo";
import PrePoRequestHistory from "./pages/Production/PrePoRequestHistory";
import RegisterEmployee from "./pages/auth/RegisterEmployee";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useUser();
  if (loading) return <div className="loading">Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  return children;
};

const getRedirectPath = (role) => {
  if (["Admin", "SuperAdmin", "Superadmin"].includes(role)) {
    return "/purchase-dashboard";
  }
  if (role === "Store") return "/store-keeper";
  if (role === "Purchase") return "/purchase-dashboard";
  if (role === "Verification") return "/po-invoice";
  if (role === "Accounts") return "/payment-request-details";
  if (role === "Production") return "/po-order-details";


  if (
    [
      "SFG Work",
      "Assemble",
      // "Disassemble",
      "Stamping",
      "Winding",
      "Winding Connection",
    ].includes(role)
  ) {
    return "/Item-Request";
  }

  if (["SFG Work", "Disassemble"].includes(role)) {
    return "/service-process-request";
  }

  if (["Store", "Purchase", "Admin"].includes(role)) {
    return "/raw-material-stock";
  }

  if (role === "Testing") return "/pending-process";
  if (role === "PrePurchase") return "/pre-po";
  return "/login";
};



const AppRoutes = () => {
  const { user, loading } = useUser();

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <Routes>
      {/* Login Route */}
      <Route
        path="/login"
        element={
          !user ? (
            <Login />
          ) : (
            <Navigate to={getRedirectPath(user.role)} replace />
          )
        }
      />

      <Route path="/" element={<Layout />}>
        {/* Root Redirect */}
        <Route
          index
          element={
            user ? (
              <Navigate to={getRedirectPath(user.role)} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Admin Routes */}
        <Route
          path="admin-dashboard"
          element={
            <ProtectedRoute
              allowedRoles={["Admin", "SuperAdmin", "Superadmin", "Testing"]}
            >
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Store Keeper */}
        <Route
          path="store-keeper"
          element={
            <ProtectedRoute allowedRoles={["Store"]}>
              <StoreKeeper />
            </ProtectedRoute>
          }
        />

        <Route
          path="user-stock-data"
          element={
            <ProtectedRoute allowedRoles={["Store", "Production"]}>
              <UserStockData />
            </ProtectedRoute>
          }
        />

        <Route
          path="stock-update"
          element={
            <ProtectedRoute allowedRoles={["Store"]}>
              <StockUpdate />
            </ProtectedRoute>
          }
        />

        <Route
          path="po-stock-receiving"
          element={
            <ProtectedRoute allowedRoles={["Store"]}>
              <PoStockReceiving />
            </ProtectedRoute>
          }
        />

        <Route
          path="store-tracking"
          element={
            <ProtectedRoute allowedRoles={["Store", "Production", "Admin"]}>
              <StoreTracking />
            </ProtectedRoute>
          }
        />

        <Route
          path="stock-update-history"
          element={
            <ProtectedRoute allowedRoles={["Store"]}>
              <StockUpdateHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="received-purchase-stock"
          element={
            <ProtectedRoute allowedRoles={["Store"]}>
              <ReceivedPurchaseStock />
            </ProtectedRoute>
          }
        />

        <Route
          path="direct-item-issue-history"
          element={
            <ProtectedRoute allowedRoles={["Store", "Production"]}>
              <DirectItemIssueHistory />
            </ProtectedRoute>
          }
        />

        {/* Line Worker Routes */}
        <Route
          path="Item-Request"
          element={
            <ProtectedRoute
              allowedRoles={[
                "SFG Work",
                "Assemble",
                "Disassemble",
                "Stamping",
                "Winding",
                "Winding Connection",
              ]}
            >
              <ItemRequest />
            </ProtectedRoute>
          }
        />

        <Route
          path="Item-Request-history"
          element={
            <ProtectedRoute
              allowedRoles={[
                "SFG Work",
                "Assemble",
                "Disassemble",
                "Stamping",
                "Winding",
                "Winding Connection",
              ]}
            >
              <RequestItemHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="user-stock"
          element={
            <ProtectedRoute
              allowedRoles={[
                "SFG Work",
                "Assemble",
                "Disassemble",
                "Stamping",
                "Winding",
                "Winding Connection",
              ]}
            >
              <UserStock />
            </ProtectedRoute>
          }
        />

        <Route
          path="reusable-Items"
          element={
            <ProtectedRoute allowedRoles={["Disassemble"]}>
              <ReusableItems />
            </ProtectedRoute>
          }
        />

        {/* Purchase Section */}
        <Route
          path="purchase-dashboard"
          element={
            <ProtectedRoute allowedRoles={["Purchase", "Admin"]}>
              <PurchaseDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="change-password"
          element={
            <ProtectedRoute
              allowedRoles={["Purchase", "Verification", "Accounts", "Admin"]}
            >
              <ChangePassword />
            </ProtectedRoute>
          }
        />

        <Route
          path="add-company"
          element={
            <ProtectedRoute allowedRoles={["Purchase"]}>
              <AddCompany />
            </ProtectedRoute>
          }
        />

        <Route
          path="approval-po-invoice"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <ApprovalPOInvoice />
            </ProtectedRoute>
          }
        />

        <Route
          path="update-company"
          element={
            <ProtectedRoute allowedRoles={["Purchase"]}>
              <UpdateCompany />
            </ProtectedRoute>
          }
        />

        <Route
          path="add-vendor"
          element={
            <ProtectedRoute allowedRoles={["Purchase", "PrePurchase", "Production"]}>
              <AddVendor />
            </ProtectedRoute>
          }
        />

        <Route
          path="update-vendor"
          element={
            <ProtectedRoute allowedRoles={["Purchase", "PrePurchase", "Production"]}>
              <UpdateVendor />
            </ProtectedRoute>
          }
        />

        <Route
          path="create-purchase-order"
          element={
            <ProtectedRoute allowedRoles={["Purchase"]}>
              <CreatePurchaseOrder />
            </ProtectedRoute>
          }
        />

        <Route
          path="show-purchase-orders"
          element={
            <ProtectedRoute allowedRoles={["Purchase", "Admin"]}>
              <ShowPurchaseOrder />
            </ProtectedRoute>
          }
        />

        <Route
          path="pre-po"
          element={
            <ProtectedRoute allowedRoles={["PrePurchase", "Production"]}>
              <PrePo />
            </ProtectedRoute>
          }
        />

        <Route
          path="po-order-details"
          element={
            <ProtectedRoute allowedRoles={["Purchase", "Production", "Admin"]}>
              <PoOrderDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="add-raw-material"
          element={
            <ProtectedRoute allowedRoles={["Purchase"]}>
              <AddRawMaterial />
            </ProtectedRoute>
          }
        />

        <Route
          path="show-debit-not"
          element={
            <ProtectedRoute allowedRoles={["Purchase"]}>
              <ShowDebitNot />
            </ProtectedRoute>
          }
        />

        <Route
          path="active-deactivate-vendor"
          element={
            <ProtectedRoute allowedRoles={["Purchase", "PrePurchase", "Production"]}>
              <ActiveDeactivateVendor />
            </ProtectedRoute>
          }
        />

        <Route
          path="active-deactivate-company"
          element={
            <ProtectedRoute allowedRoles={["Purchase"]}>
              <ActiveDeactivateCompany />
            </ProtectedRoute>
          }
        />

        <Route
          path="item-details"
          element={
            <ProtectedRoute allowedRoles={["Purchase"]}>
              <ItemDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="installation-stock"
          element={
            <ProtectedRoute allowedRoles={["Purchase", "Admin", "Production", "Store"]}>
              <InstallationStock />
            </ProtectedRoute>
          }
        />

        <Route
          path="payment-pending"
          element={
            <ProtectedRoute allowedRoles={["Purchase"]}>
              <PaymentPending />
            </ProtectedRoute>
          }
        />

        <Route
          path="payment-request"
          element={
            <ProtectedRoute allowedRoles={["Purchase"]}>
              <PaymentRequest />
            </ProtectedRoute>
          }
        />

        <Route
          path="po-payment-details"
          element={
            <ProtectedRoute allowedRoles={["Purchase", "Admin"]}>
              <PoPaymentDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="add-warehouse"
          element={
            <ProtectedRoute allowedRoles={["Purchase"]}>
              <AddWarehouse />
            </ProtectedRoute>
          }
        />

        <Route
          path="add-unit"
          element={
            <ProtectedRoute allowedRoles={["Purchase"]}>
              <AddUnit />
            </ProtectedRoute>
          }
        />

        <Route
          path="invoice-po"
          element={
            <ProtectedRoute allowedRoles={["Purchase"]}>
              <InvoicePO />
            </ProtectedRoute>
          }
        />

        <Route
          path="register-employee"
          element={
            <ProtectedRoute allowedRoles={["Production"]}>
              <RegisterEmployee />
            </ProtectedRoute>
          }
        />

        <Route
          path="po-invoice"
          element={
            <ProtectedRoute allowedRoles={["Verification", "Admin", "Accounts"]}>
              <PoInvoice />
            </ProtectedRoute>
          }
        />
        <Route
          path="payment-request-details"
          element={
            <ProtectedRoute allowedRoles={["Verification", "Accounts"]}>
              <PaymentRequestDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="account-details"
          element={
            <ProtectedRoute allowedRoles={["Accounts"]}>
              <AccountDetails />
            </ProtectedRoute>
          }
        />

        {/* Service Process */}
        <Route
          path="service-process-request"
          element={
            <ProtectedRoute allowedRoles={["SFG Work", "Disassemble"]}>
              <ServiceProcessRequest />
            </ProtectedRoute>
          }
        />

        {/* Pending Process - FIXED */}
        <Route
          path="pending-process"
          element={
            <ProtectedRoute
              allowedRoles={[
                "SFG Work",
                "Assemble",
                "Disassemble",
                "Stamping",
                "Testing",
                "Winding",
                "Winding Connection",
              ]}
            >
              <PendingProcess />
            </ProtectedRoute>
          }
        />

        <Route
          path="Item-Request-history"
          element={
            <ProtectedRoute
              allowedRoles={[
                "SFG Work",
                "Assemble",
                "Disassemble",
                "Stamping",
                "Testing",
                "Winding",
                "Winding Connection",
              ]}
            >
              <RequestItemHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="raw-material-stock"
          element={
            <ProtectedRoute allowedRoles={["Store", "Purchase", "Production", "Admin"]}>
              <RawMaterialStock />
            </ProtectedRoute>
          }
        />

        <Route
          path="installation"
          element={
            <ProtectedRoute allowedRoles={["Store", "Purchase", "Production", "Admin"]}>
              <Installation />
            </ProtectedRoute>
          }
        />

        <Route
          path="single-out"
          element={
            <ProtectedRoute allowedRoles={["Store"]}>
              <SingleOut />
            </ProtectedRoute>
          }
        />

        <Route
          path="vendor-all-details"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Production"]}>
              <VendorAllDetails />
            </ProtectedRoute>
          }
        />

         <Route
          path="pre-po-request-history"
          element={
            <ProtectedRoute allowedRoles={["PrePurchase", "Purchase", "Production"]}>
              <PrePoRequestHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="user-Item-stock"
          element={
            <ProtectedRoute
              allowedRoles={[
                "SFG Work",
                "Assemble",
                "Disassemble",
                "Stamping",
                "Testing",
                "Winding",
                "Winding Connection",
              ]}
            >
              <UserItemStock />
            </ProtectedRoute>
          }
        />

        <Route
          path="price-comparision"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Purchase"]}>
              <PriceComparision />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <UserProvider>
      <Router>
        <AppRoutes />
      </Router>
    </UserProvider>
  );
};

export default App;
