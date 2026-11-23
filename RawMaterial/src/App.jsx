import React, { lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { UserProvider, useUser } from "./Context/UserContext";

import Layout from "./pages/Layout/Layout";
import Login from "./pages/Login/Login";

// Pages are code-split: each one is downloaded only when its route is opened
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard/AdminDashboard"));
const ItemRequest = lazy(() => import("./pages/ItemRequest/ItemRequest"));
const StoreKeeper = lazy(() => import("./pages/LineWorker/StoreKeeper/StoreKeeper"));
const UserStockData = lazy(() => import("./pages/LineWorker/StoreKeeper/UserStockData/UserStockData"));
const StockUpdate = lazy(() => import("./pages/LineWorker/StoreKeeper/StockUpdate/StockUpdate"));
const StockUpdateHistory = lazy(() => import("./pages/LineWorker/StoreKeeper/StockUpdateHistory/StockUpdateHistory"));
const PurchaseDashboard = lazy(() => import("./pages/Purchase/PurchaseDashboard"));
const AddCompany = lazy(() => import("./pages/Purchase/AddCompany"));
const UpdateCompany = lazy(() => import("./pages/Purchase/UpdateCompany"));
const AddVendor = lazy(() => import("./pages/Purchase/AddVendor"));
const UpdateVendor = lazy(() => import("./pages/Purchase/UpdateVendor"));
const CreatePurchaseOrder = lazy(() => import("./pages/Purchase/CreatePurchaseOrder"));
const ShowPurchaseOrder = lazy(() => import("./pages/Purchase/ShowPurchaseOrder"));
const TransferPurchaseOrder = lazy(() => import("./pages/Purchase/TransferPurchaseOrder"));
const VendorPaymentDetails = lazy(() => import("./pages/Payment/VendorPaymentDetails"));
const ServiceProcessRequest = lazy(() => import("./pages/CreateProcess/ServiceProcessRequest/ServiceProcessRequest"));
const PendingProcess = lazy(() => import("./pages/CreateProcess/PendingProcess/PendingProcess"));
const UserItemStock = lazy(() => import("./pages/CreateProcess/UserItemStock/UserItemStock"));
const ReusableItems = lazy(() => import("./pages/CreateProcess/ReusableItems/ReusableItems"));
const StoreTracking = lazy(() => import("./pages/LineWorker/StoreKeeper/StoreTracking/StoreTracking"));
const RawMaterialStock = lazy(() => import("./pages/RawMaterialStock/RawMaterialStock"));
const RequestItemHistory = lazy(() => import("./pages/LineWorker/getRequestsByUser/RequestItemHistory"));
const UserStock = lazy(() => import("./pages/LineWorker/UserStock/UserStock"));
const ActiveDeactivateVendor = lazy(() => import("./pages/Purchase/ActiveDeactivateVendor"));
const ActiveDeactivateCompany = lazy(() => import("./pages/Purchase/ActiveDeactivateCompany"));
const AddRawMaterial = lazy(() => import("./pages/Purchase/AddRawMaterial"));
const ShowDebitNot = lazy(() => import("./pages/Purchase/ShowDebitNot"));
const ItemDetails = lazy(() => import("./pages/Purchase/ItemDetails"));
const ChangePassword = lazy(() => import("./pages/Purchase/ChangePassword"));
const InstallationStock = lazy(() => import("./pages/Purchase/InstallationStock"));
const SingleOut = lazy(() => import("./pages/LineWorker/StoreKeeper/SingleOut/SingleOut"));
const ReturnMaterial = lazy(() => import("./pages/LineWorker/StoreKeeper/ReturnMaterial/ReturnMaterial"));
const PoStockReceiving = lazy(() => import("./pages/LineWorker/StoreKeeper/PoStockReceiving/PoStockReceiving"));
const ReceivedPurchaseStock = lazy(() => import("./pages/LineWorker/StoreKeeper/PoStockReceiving/ReceivedPurchaseStock"));
const AddContainer = lazy(() => import("./pages/LineWorker/StoreKeeper/AddContainer/AddContainer"));
const ItemWiseContainer = lazy(() => import("./pages/LineWorker/StoreKeeper/ItemWiseContainer/ItemWiseContainer"));
const DirectItemIssueHistory = lazy(() => import("./pages/LineWorker/StoreKeeper/SingleOut/DirectItemIssueHistory"));
const PaymentPending = lazy(() => import("./pages/Payment/PaymentPending"));
const PaymentRequest = lazy(() => import("./pages/Payment/PaymentRequest"));
const PoPaymentDetails = lazy(() => import("./pages/Payment/PoPaymentDetails"));
const PoInvoice = lazy(() => import("./pages/Verification/PoInvoice"));
const PaymentRequestDetails = lazy(() => import("./pages/Verification/PaymentRequestDetails"));
const AccountDetails = lazy(() => import("./pages/Accounts/AccountDetails"));
const PoOrderDetails = lazy(() => import("./pages/Purchase/PoOrderDetails"));
const AddWarehouse = lazy(() => import("./pages/Purchase/AddWarehouse"));
const AddUnit = lazy(() => import("./pages/Purchase/AddUnit"));
const ApprovalPOInvoice = lazy(() => import("./pages/Purchase/ApprovalPOInvoice"));
const InvoicePO = lazy(() => import("./pages/Purchase/InvoicePO"));
const VendorAllDetails = lazy(() => import("./pages/Production/VendorAllDetails"));
const Installation = lazy(() => import("./pages/InstallationData/Installation"));
const PriceComparision = lazy(() => import("./pages/Purchase/PriceComparison"));
const PrePo = lazy(() => import("./pages/Production/PrePo"));
const PrePoRequestHistory = lazy(() => import("./pages/Production/PrePoRequestHistory"));
const RegisterEmployee = lazy(() => import("./pages/auth/RegisterEmployee"));
const ExcelPurchaseOrderUpload = lazy(() => import("./pages/Purchase/ExcelPurchaseOrderUpload"));

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useUser();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-ink-50">
        <div className="h-10 w-10 rounded-full border-4 border-ink-200 border-t-brand-400 animate-spin" />
      </div>;

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="page">
        <div className="card card-body max-w-md mx-auto mt-16 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-brand-100 flex items-center justify-center text-2xl">🔒</div>
          <h2 className="text-lg font-bold text-ink-950">Access Denied</h2>
          <p className="mt-1 text-sm text-ink-500">You don't have permission to access this page.</p>
        </div>
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-ink-50">
        <div className="h-10 w-10 rounded-full border-4 border-ink-200 border-t-brand-400 animate-spin" />
      </div>;

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
          path="add-container"
          element={
            <ProtectedRoute allowedRoles={["Store"]}>
              <AddContainer />
            </ProtectedRoute>
          }
        />

        <Route
          path="item-wise-container"
          element={
            <ProtectedRoute allowedRoles={["Store"]}>
              <ItemWiseContainer />
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
          path="excel-create-purchase-order"
          element={
            <ProtectedRoute allowedRoles={["Purchase"]}>
              <ExcelPurchaseOrderUpload />
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
          path="vendor-payment-details"
          element={
            <ProtectedRoute allowedRoles={["Purchase"]}>
              <VendorPaymentDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="transfer-purchase-order/:poId"
          element={
            <ProtectedRoute allowedRoles={["Purchase", "Admin"]}>
              <TransferPurchaseOrder />
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
            <ProtectedRoute allowedRoles={["Purchase", "Production"]}>
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
          path="return-material"
          element={
            <ProtectedRoute allowedRoles={["Store"]}>
              <ReturnMaterial />
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
