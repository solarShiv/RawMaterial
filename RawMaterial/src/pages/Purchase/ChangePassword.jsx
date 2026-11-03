import React, { useState } from "react";
import Api from "../../auth/Api";
import { useNavigate } from "react-router-dom"; // Assuming you're using React Router

const ChangePassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const navigate = useNavigate(); // Hook for navigation

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (
      !formData.currentPassword ||
      !formData.newPassword ||
      !formData.confirmPassword
    ) {
      setMessage({ text: "All fields are required", type: "error" });
      return false;
    }

    if (formData.newPassword.length < 6) {
      setMessage({
        text: "New password must be at least 6 characters",
        type: "error",
      });
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({
        text: "New password and confirm password do not match",
        type: "error",
      });
      return false;
    }

    if (formData.currentPassword === formData.newPassword) {
      setMessage({
        text: "New password must be different from current password",
        type: "error",
      });
      return false;
    }

    return true;
  };

  const logoutAndRedirect = () => {
    // Clear any authentication tokens from storage
    localStorage.removeItem("token"); // or sessionStorage, depending on your setup
    localStorage.removeItem("userData");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("roleName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("warehouseId");

    
    // Clear any API authentication headers if needed
    Api.defaults.headers.common["Authorization"] = "";
    
    // Redirect to login page
    navigate("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setMessage({ text: "", type: "" });
    console.log("Submitting password change:", formData);

    try {
      
      const response = await Api.put(
        "/user/password",
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      console.log("Password change response:", response.data);

      if (response.data.success) {
        // Check if shouldLogout is true in the response
        if (response.data.shouldLogout) {
          setMessage({ 
            text: "Password changed successfully! Please login again.", 
            type: "success" 
          });
          // Delay logout slightly so user can see the message
            logoutAndRedirect();
        } else {
          setMessage({ 
            text: "Password changed successfully!", 
            type: "success" 
          });
          setFormData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
        }
      } else {
        setMessage({
          text: response.data.message || "Failed to change password",
          type: "error",
        });
      }
    } catch (error) {
      console.error(error.response?.data || error.message);
      
      // Check if error response contains shouldLogout flag
      if (error.response?.data?.shouldLogout) {
        setMessage({
          text: "Session expired. Please login again.",
          type: "error",
        });
        setTimeout(() => {
          logoutAndRedirect();
        }, 1500);
      } else {
        setMessage({
          text: error.response?.data?.message || "Something went wrong",
          type: "error",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">

      {message.text && (
        <div
          className={`mb-4 p-3 rounded ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Current Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">New Password</label>
          <input
            type={showPassword ? "text" : "password"}
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Confirm New Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={showPassword}
            onChange={() => setShowPassword(!showPassword)}
            className="mr-2"
          />
          <span className="text-sm">Show passwords</span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded text-black ${
            loading ? "bg-gray-400" : "bg-yellow-300 hover:bg-yellow-400"
          }`}
        >
          {loading ? "Changing..." : "Change Password"}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;