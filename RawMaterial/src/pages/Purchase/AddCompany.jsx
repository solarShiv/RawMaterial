import React, { useState, useMemo, useEffect, useRef } from 'react';
import Api from '../../auth/Api';

const AddCompany = () => {
  const [companyData, setCompanyData] = useState({
    name: '',
    companyCode: '',
    gstNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'INDIA',
    contactNumber: '',
    alternateNumber: '',
    email: '',
    currency: 'INR'
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const countries = useMemo(() => [
    'AFGHANISTAN', 'ALBANIA', 'ALGERIA', 'ANDORRA', 'ANGOLA', 'ANTIGUA AND BARBUDA', 
    'ARGENTINA', 'ARMENIA', 'AUSTRALIA', 'AUSTRIA', 'AZERBAIJAN', 'BAHAMAS', 
    'BAHRAIN', 'BANGLADESH', 'BARBADOS', 'BELARUS', 'BELGIUM', 'BELIZE', 'BENIN', 
    'BHUTAN', 'BOLIVIA', 'BOSNIA AND HERZEGOVINA', 'BOTSWANA', 'BRAZIL', 'BRUNEI', 
    'BULGARIA', 'BURKINA FASO', 'BURUNDI', 'CABO VERDE', 'CAMBODIA', 'CAMEROON', 
    'CANADA', 'CENTRAL AFRICAN REPUBLIC', 'CHAD', 'CHILE', 'CHINA', 'COLOMBIA', 
    'COMOROS', 'CONGO', 'COSTA RICA', 'CROATIA', 'CUBA', 'CYPRUS', 'CZECHIA', 
    'DENMARK', 'DJIBOUTI', 'DOMINICA', 'DOMINICAN REPUBLIC', 'ECUADOR', 'EGYPT', 
    'EL SALVADOR', 'EQUATORIAL GUINEA', 'ERITREA', 'ESTONIA', 'ESWATINI', 'ETHIOPIA', 
    'FIJI', 'FINLAND', 'FRANCE', 'GABON', 'GAMBIA', 'GEORGIA', 'GERMANY', 'GHANA', 
    'GREECE', 'GRENADA', 'GUATEMALA', 'GUINEA', 'GUINEA-BISSAU', 'GUYANA', 'HAITI', 
    'HONDURAS', 'HUNGARY', 'ICELAND', 'INDIA', 'INDONESIA', 'IRAN', 'IRAQ', 
    'IRELAND', 'ISRAEL', 'ITALY', 'JAMAICA', 'JAPAN', 'JORDAN', 'KAZAKHSTAN', 
    'KENYA', 'KIRIBATI', 'KOREA, NORTH', 'KOREA, SOUTH', 'KOSOVO', 'KUWAIT', 
    'KYRGYZSTAN', 'LAOS', 'LATVIA', 'LEBANON', 'LESOTHO', 'LIBERIA', 'LIBYA', 
    'LIECHTENSTEIN', 'LITHUANIA', 'LUXEMBOURG', 'MADAGASCAR', 'MALAWI', 'MALAYSIA', 
    'MALDIVES', 'MALI', 'MALTA', 'MARSHALL ISLANDS', 'MAURITANIA', 'MAURITIUS', 
    'MEXICO', 'MICRONESIA', 'MOLDOVA', 'MONACO', 'MONGOLIA', 'MONTENEGRO', 
    'MOROCCO', 'MOZAMBIQUE', 'MYANMAR', 'NAMIBIA', 'NAURU', 'NEPAL', 
    'NETHERLANDS', 'NEW ZEALAND', 'NICARAGUA', 'NIGER', 'NIGERIA', 'NORTH MACEDONIA', 
    'NORWAY', 'OMAN', 'PAKISTAN', 'PALAU', 'PALESTINE', 'PANAMA', 'PAPUA NEW GUINEA', 
    'PARAGUAY', 'PERU', 'PHILIPPINES', 'POLAND', 'PORTUGAL', 'QATAR', 'ROMANIA', 
    'RUSSIA', 'RWANDA', 'SAINT KITTS AND NEVIS', 'SAINT LUCIA', 
    'SAINT VINCENT AND THE GRENADINES', 'SAMOA', 'SAN MARINO', 'SAO TOME AND PRINCIPE', 
    'SAUDI ARABIA', 'SENEGAL', 'SERBIA', 'SEYCHELLES', 'SIERRA LEONE', 'SINGAPORE', 
    'SLOVAKIA', 'SLOVENIA', 'SOLOMON ISLANDS', 'SOMALIA', 'SOUTH AFRICA', 
    'SOUTH SUDAN', 'SPAIN', 'SRI LANKA', 'SUDAN', 'SURINAME', 'SWEDEN', 
    'SWITZERLAND', 'SYRIA', 'TAIWAN', 'TAJIKISTAN', 'TANZANIA', 'THAILAND', 
    'TIMOR-LESTE', 'TOGO', 'TONGA', 'TRINIDAD AND TOBAGO', 'TUNISIA', 'TURKEY', 
    'TURKMENISTAN', 'TUVALU', 'UGANDA', 'UKRAINE', 'UNITED ARAB EMIRATES', 
    'UNITED KINGDOM', 'UNITED STATES', 'URUGUAY', 'UZBEKISTAN', 'VANUATU', 
    'VATICAN CITY', 'VENEZUELA', 'VIETNAM', 'YEMEN', 'ZAMBIA', 'ZIMBABWE'
  ], []);

  const filteredCountries = useMemo(() => {
    if (!countrySearch) return countries;
    return countries.filter(country => 
      country.toLowerCase().includes(countrySearch.toLowerCase())
    );
  }, [countries, countrySearch]);

  // Auto-clear success message
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Auto-detect Indian state from pincode
  useEffect(() => {
    const detectIndianState = async () => {
      if (companyData.pincode.length === 6 && /^[1-9][0-9]{5}$/.test(companyData.pincode)) {
        try {
          const response = await fetch(`https://api.postalpincode.in/pincode/${companyData.pincode}`);
          const data = await response.json();
          if (data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
            const postOffice = data[0].PostOffice[0];
            setCompanyData(prev => ({
              ...prev,
              state: postOffice.State,
              country: 'INDIA',
              city: postOffice.District || prev.city
            }));
          }
        } catch (error) {
          console.error('Error detecting state from pincode:', error);
        }
      }
    };

    detectIndianState();
  }, [companyData.pincode]);

  // Handle clicks outside dropdown and focus search input
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
        setCountrySearch('');
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && showCountryDropdown) {
        setShowCountryDropdown(false);
        setCountrySearch('');
      }
    };

    if (showCountryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      // Focus search input when dropdown opens
      if (searchInputRef.current) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showCountryDropdown]);

  const formatGSTNumber = (value) => {
    const cleaned = value.toUpperCase().replace(/[^0-9A-Z]/g, '');
    return cleaned.slice(0, 15);
  };

  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    return cleaned.slice(0, 10);
  };

  const formatEmail = (value) => {
    return value.replace(/\s/g, '');
  };

  const validateForm = () => {
    const errors = {};
    
    if (!companyData.name.trim()) errors.name = 'Company name is required';
    if (!companyData.companyCode.trim()) errors.companyCode = 'Company code is required';
    
    if (!companyData.gstNumber.trim()) {
      errors.gstNumber = 'GST number is required';
    } else if (!/^[0-9A-Z]{15}$/.test(companyData.gstNumber)) {
      errors.gstNumber = 'GST number must be 15 characters (numbers and uppercase letters)';
    }
    
    if (!companyData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyData.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (!companyData.contactNumber.trim()) {
      errors.contactNumber = 'Contact number is required';
    } else if (!/^[0-9]{10}$/.test(companyData.contactNumber)) {
      errors.contactNumber = 'Contact number must be 10 digits';
    }
    
    if (companyData.alternateNumber && !/^[0-9]{10}$/.test(companyData.alternateNumber)) {
      errors.alternateNumber = 'Alternate number must be 10 digits';
    }
    
    if (!companyData.address.trim()) errors.address = 'Address is required';
    if (!companyData.city.trim()) errors.city = 'City is required';
    if (!companyData.state.trim()) errors.state = 'State is required';
    
    if (!companyData.pincode.trim()) {
      errors.pincode = 'Pincode is required';
    } else if (!/^[1-9][0-9]{5}$/.test(companyData.pincode)) {
      errors.pincode = 'Invalid pincode format';
    }

    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === 'gstNumber') {
      processedValue = formatGSTNumber(value);
    } else if (name === 'contactNumber' || name === 'alternateNumber') {
      processedValue = formatPhoneNumber(value);
    } else if (name === 'pincode') {
      processedValue = value.replace(/[^0-9]/g, '').slice(0, 6);
    } else if (name === 'email') {
      processedValue = formatEmail(value);
    }

    setCompanyData(prevState => ({
      ...prevState,
      [name]: processedValue
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCountrySelect = (country) => {
    setCompanyData(prevState => ({
      ...prevState,
      country: country
    }));
    setShowCountryDropdown(false);
    setCountrySearch('');
  };

  const handleCountryDropdownToggle = () => {
    const newState = !showCountryDropdown;
    setShowCountryDropdown(newState);
    setCountrySearch('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fix the errors in the form');
      return;
    }

    setFieldErrors({});
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await Api.post(
        '/purchase/companies',
        companyData,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.status === 200 || response.status === 201) {
        setMessage('Company added successfully!');
        alert('Company added successfully!', response?.data?.message);
        setCompanyData({
          name: '',
          companyCode: '',
          gstNumber: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          country: 'INDIA',
          contactNumber: '',
          alternateNumber: '',
          email: '',
          currency: 'INR'
        });
      }
    } catch (err) {
      console.error('Error adding company:', err);
      setError(
        err.response?.data?.message || 
        err.response?.data?.error || 
        'Failed to add company. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      companyData.name.trim() &&
      companyData.companyCode.trim() &&
      companyData.gstNumber.trim() &&
      companyData.address.trim() &&
      companyData.city.trim() &&
      companyData.state.trim() &&
      companyData.pincode.trim() &&
      companyData.contactNumber.trim() &&
      companyData.email.trim()
    );
  };

  const clearForm = () => {
    setCompanyData({
      name: '',
      companyCode: '',
      gstNumber: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      country: 'INDIA',
      contactNumber: '',
      alternateNumber: '',
      email: '',
      currency: 'INR'
    });
    setFieldErrors({});
    setError('');
    setMessage('');
    setCountrySearch('');
    setShowCountryDropdown(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">

          {message && (
            <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-start">
              <span className="text-green-600 mr-3">✓</span>
              <div>
                <strong className="font-semibold text-green-800">Success!</strong>
                <p className="text-green-700 ml-1 inline">{message}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start">
              <span className="text-red-600 mr-3">⚠</span>
              <div>
                <strong className="font-semibold text-red-800">Error!</strong>
                <p className="text-red-700 ml-1 inline">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={companyData.name}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${fieldErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter company legal name"
                  />
                  {fieldErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    GST Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="gstNumber"
                    name="gstNumber"
                    value={companyData.gstNumber}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${fieldErrors.gstNumber ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter 15-character GST number"
                    maxLength="15"
                  />
                  {fieldErrors.gstNumber && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.gstNumber}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="companyCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Company Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="companyCode"
                    name="companyCode"
                    value={companyData.companyCode}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${fieldErrors.companyCode ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Unique company code"
                  />
                  {fieldErrors.companyCode && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.companyCode}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                    Currency <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={companyData.currency}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  >
                    <option value="INR">Indian Rupee (INR)</option>
                    <option value="USD">US Dollar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="GBP">British Pound (GBP)</option>
                    <option value="AUD">Australian Dollar (AUD)</option>
                    <option value="CAD">Canadian Dollar (CAD)</option>
                    <option value="SGD">Singapore Dollar (SGD)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Address Details */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">Address Details</h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Complete Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={companyData.address}
                    onChange={handleChange}
                    rows="3"
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${fieldErrors.address ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter complete street address"
                  />
                  {fieldErrors.address && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.address}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={companyData.city}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${fieldErrors.city ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Enter city"
                    />
                    {fieldErrors.city && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.city}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={companyData.state}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${fieldErrors.state ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Enter state"
                    />
                    {fieldErrors.state && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.state}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-2">
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="pincode"
                      name="pincode"
                      value={companyData.pincode}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${fieldErrors.pincode ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Enter 6-digit postal code"
                      maxLength="6"
                    />
                    {fieldErrors.pincode && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.pincode}</p>
                    )}
                  </div>

                  <div className="relative" ref={dropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={handleCountryDropdownToggle}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition flex justify-between items-center"
                        aria-expanded={showCountryDropdown}
                      >
                        <span className="truncate">{companyData.country}</span>
                        <span className="ml-2">
                          {showCountryDropdown ? '▲' : '▼'}
                        </span>
                      </button>
                      
                      {showCountryDropdown && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
                          <div className="p-2 border-b">
                            <input
                              ref={searchInputRef}
                              type="text"
                              placeholder="Search countries..."
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                          </div>
                          <div className="max-h-60 overflow-y-auto">
                            {filteredCountries.length > 0 ? (
                              filteredCountries.map((country) => (
                                <button
                                  type="button"
                                  key={country}
                                  className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${companyData.country === country ? 'bg-blue-50 text-blue-700' : ''}`}
                                  onClick={() => handleCountrySelect(country)}
                                >
                                  {country}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-gray-500 text-center">
                                No countries found
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="contactNumber"
                    name="contactNumber"
                    value={companyData.contactNumber}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${fieldErrors.contactNumber ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter 10-digit contact number"
                    maxLength="10"
                  />
                  {fieldErrors.contactNumber && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.contactNumber}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="alternateNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Alternate Number
                  </label>
                  <input
                    type="tel"
                    id="alternateNumber"
                    name="alternateNumber"
                    value={companyData.alternateNumber}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${fieldErrors.alternateNumber ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Optional 10-digit alternate number"
                    maxLength="10"
                  />
                  {fieldErrors.alternateNumber && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.alternateNumber}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={companyData.email}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="company@example.com"
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-6 border-t">
              <button 
                type="submit" 
                className="w-full md:w-auto px-8 py-3 bg-yellow-400 text-dark font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
                disabled={loading || !isFormValid()}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding Company...
                  </>
                ) : (
                  'Add Company'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddCompany;