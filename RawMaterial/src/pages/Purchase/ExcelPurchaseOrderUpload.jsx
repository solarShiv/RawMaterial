// components/Purchase/ExcelPurchaseOrderUpload.jsx

import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import Api from '../../auth/Api';

const ExcelPurchaseOrderUpload = ({ 
  onSuccess, 
  onClose, 
  vendorList, 
  companyList, 
  warehouseList, 
  itemList,
  onAutoFill 
}) => {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState([]);
  const [step, setStep] = useState(1);
  const [results, setResults] = useState(null);
  const [groupedData, setGroupedData] = useState([]);

  // Download template with multi-item support
  const downloadTemplate = useCallback(() => {
    const template = [
      {
        'PO Reference': 'PO-001',
        'Company Name': 'ABC Corp',
        'Vendor Name': 'Supplier Ltd',
        'GST Type': 'IGST_18',
        'Currency': 'INR',
        'Exchange Rate': '1.00',
        'Warehouse Name': 'Main Warehouse',
        'Expected Delivery Date': '2026-09-01',
        'Payment Terms': '60 Days Credit',
        'Delivery Terms': 'Immediate',
        'Warranty': '1 Year',
        'Contact Person': 'John Doe',
        'Contact Number': '9876543210',
        'Item Name': 'Panel Main Tube',
        'HSN Code': '12345678',
        'Model Number': 'MODEL001',
        'Unit': 'KG',
        'Quantity': '100',
        'Rate': '500.00',
        'GST Rate (%)': '18',
        'Item Description': 'High quality raw material'
      },
      {
        'PO Reference': 'PO-001',
        'Company Name': 'ABC Corp',
        'Vendor Name': 'Supplier Ltd',
        'GST Type': 'IGST_18',
        'Currency': 'INR',
        'Exchange Rate': '1.00',
        'Warehouse Name': 'Main Warehouse',
        'Expected Delivery Date': '2026-09-01',
        'Payment Terms': '60 Days Credit',
        'Delivery Terms': 'Immediate',
        'Warranty': '1 Year',
        'Contact Person': 'John Doe',
        'Contact Number': '9876543210',
        'Item Name': 'Panel Purlin (HDG)',
        'HSN Code': '87654321',
        'Model Number': 'MODEL002',
        'Unit': 'KG',
        'Quantity': '101',
        'Rate': '500.01',
        'GST Rate (%)': '18',
        'Item Description': 'Premium quality material'
      },
      {
        'PO Reference': 'PO-001',
        'Company Name': 'ABC Corp',
        'Vendor Name': 'Supplier Ltd',
        'GST Type': 'IGST_18',
        'Currency': 'INR',
        'Exchange Rate': '1.00',
        'Warehouse Name': 'Main Warehouse',
        'Expected Delivery Date': '2026-09-01',
        'Payment Terms': '60 Days Credit',
        'Delivery Terms': 'Immediate',
        'Warranty': '1 Year',
        'Contact Person': 'John Doe',
        'Contact Number': '9876543210',
        'Item Name': 'Panel Side Tube',
        'HSN Code': '12345600',
        'Model Number': 'MODEL003',
        'Unit': 'KG',
        'Quantity': '102',
        'Rate': '500.02',
        'GST Rate (%)': '18',
        'Item Description': 'Side tube material'
      },
      {
        'PO Reference': 'PO-001',
        'Company Name': 'ABC Corp',
        'Vendor Name': 'Supplier Ltd',
        'GST Type': 'IGST_18',
        'Currency': 'INR',
        'Exchange Rate': '1.00',
        'Warehouse Name': 'Main Warehouse',
        'Expected Delivery Date': '2026-09-01',
        'Payment Terms': '60 Days Credit',
        'Delivery Terms': 'Immediate',
        'Warranty': '1 Year',
        'Contact Person': 'John Doe',
        'Contact Number': '9876543210',
        'Item Name': '14mm Rope - 103M',
        'HSN Code': '54816851',
        'Model Number': 'MODEL004',
        'Unit': 'KG',
        'Quantity': '103',
        'Rate': '500.03',
        'GST Rate (%)': '18',
        'Item Description': 'Rope material'
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    
    // Set column widths
    const colWidths = [
      { wch: 15 }, // PO Reference
      { wch: 20 }, // Company Name
      { wch: 20 }, // Vendor Name
      { wch: 15 }, // GST Type
      { wch: 12 }, // Currency
      { wch: 15 }, // Exchange Rate
      { wch: 20 }, // Warehouse Name
      { wch: 22 }, // Expected Delivery Date
      { wch: 18 }, // Payment Terms
      { wch: 15 }, // Delivery Terms
      { wch: 15 }, // Warranty
      { wch: 18 }, // Contact Person
      { wch: 18 }, // Contact Number
      { wch: 30 }, // Item Name
      { wch: 15 }, // HSN Code
      { wch: 18 }, // Model Number
      { wch: 12 }, // Unit
      { wch: 12 }, // Quantity
      { wch: 15 }, // Rate
      { wch: 15 }, // GST Rate (%)
      { wch: 40 }, // Item Description
    ];

    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Purchase Orders');
    XLSX.writeFile(wb, 'purchase_order_template.xlsx');
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback((event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
      alert('Please upload a valid Excel or CSV file');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('File size should be less than 10MB');
      return;
    }

    setFile(selectedFile);
    readExcelFile(selectedFile);
  }, []);

  // Read Excel file
  const readExcelFile = useCallback((file) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        if (jsonData.length === 0) {
          alert('The Excel file is empty');
          return;
        }

        // Validate headers
        const headers = Object.keys(jsonData[0]);
        const requiredHeaders = [
          'Company Name', 'Vendor Name', 'GST Type', 'Item Name',
          'Unit', 'Quantity', 'Rate'
        ];

        const missingHeaders = requiredHeaders.filter(
          header => !headers.some(h => h.trim() === header)
        );

        if (missingHeaders.length > 0) {
          alert(`Missing required columns: ${missingHeaders.join(', ')}`);
          return;
        }

        // Map and validate data
        const mappedData = jsonData.map((row, index) => {
          const company = companyList?.find(c =>
            c.companyName?.toLowerCase() === row['Company Name']?.toLowerCase()
          );
          const vendor = vendorList?.find(v =>
            v.displayName?.toLowerCase() === row['Vendor Name']?.toLowerCase()
          );
          const warehouse = warehouseList?.find(w =>
            w.label?.toLowerCase() === row['Warehouse Name']?.toLowerCase()
          );
          const item = itemList?.find(i =>
            i.name?.toLowerCase() === row['Item Name']?.toLowerCase()
          );

          return {
            rowIndex: index + 2,
            poReference: row['PO Reference'] || `PO-${Date.now()}-${index}`,
            companyId: company?.id || '',
            companyName: row['Company Name'] || '',
            vendorId: vendor?.id || '',
            vendorName: row['Vendor Name'] || '',
            gstType: row['GST Type'] || '',
            currency: row['Currency'] || 'INR',
            exchangeRate: row['Exchange Rate'] || '1.00',
            warehouseId: warehouse?.value || '',
            warehouseName: row['Warehouse Name'] || '',
            expectedDeliveryDate: row['Expected Delivery Date'] || '',
            paymentTerms: row['Payment Terms'] || '',
            deliveryTerms: row['Delivery Terms'] || '',
            warranty: row['Warranty'] || '',
            contactPerson: row['Contact Person'] || '',
            cellNo: row['Contact Number'] || '',
            itemId: item?.id || '',
            itemName: row['Item Name'] || '',
            hsnCode: row['HSN Code'] || '',
            modelNumber: row['Model Number'] || '',
            unit: row['Unit'] || '',
            quantity: row['Quantity'] || '',
            rate: row['Rate'] || '',
            gstRate: row['GST Rate (%)'] || '',
            itemDetail: row['Item Description'] || '',
            _raw: row
          };
        });

        // Group by PO Reference
        const grouped = groupByPOReference(mappedData);
        setGroupedData(grouped);
        setPreviewData(mappedData);
        setStep(2);
        setErrors([]);
      } catch (error) {
        console.error('Error reading Excel file:', error);
        alert('Error reading Excel file. Please check the format.');
      }
    };

    reader.readAsArrayBuffer(file);
  }, [companyList, vendorList, warehouseList, itemList]);

  // Group data by PO Reference
  const groupByPOReference = (data) => {
    const groups = {};
    
    data.forEach(row => {
      const key = row.poReference;
      if (!groups[key]) {
        groups[key] = {
          poReference: key,
          rows: [],
          companyId: row.companyId,
          companyName: row.companyName,
          vendorId: row.vendorId,
          vendorName: row.vendorName,
          gstType: row.gstType,
          currency: row.currency,
          exchangeRate: row.exchangeRate,
          warehouseId: row.warehouseId,
          warehouseName: row.warehouseName,
          expectedDeliveryDate: row.expectedDeliveryDate,
          paymentTerms: row.paymentTerms,
          deliveryTerms: row.deliveryTerms,
          warranty: row.warranty,
          contactPerson: row.contactPerson,
          cellNo: row.cellNo,
          isValid: true,
          errors: []
        };
      }
      groups[key].rows.push(row);
    });

    // Validate each group
    Object.values(groups).forEach(group => {
      const errors = validateGroup(group);
      if (errors.length > 0) {
        group.isValid = false;
        group.errors = errors;
      }
    });

    return Object.values(groups);
  };

  // Validate a group (PO)
  const validateGroup = (group) => {
    const errors = [];

    // Check header fields
    if (!group.companyId && !group.companyName) {
      errors.push('Company is required');
    } else if (!group.companyId && group.companyName) {
      errors.push(`Company "${group.companyName}" not found in system`);
    }

    if (!group.vendorId && !group.vendorName) {
      errors.push('Vendor is required');
    } else if (!group.vendorId && group.vendorName) {
      errors.push(`Vendor "${group.vendorName}" not found in system`);
    }

    if (!group.gstType) {
      errors.push('GST Type is required');
    }

    if (!group.expectedDeliveryDate) {
      errors.push('Expected delivery date is required');
    }

    // Check items
    if (group.rows.length === 0) {
      errors.push('At least one item is required');
    }

    group.rows.forEach((row, index) => {
      if (!row.itemId && !row.itemName) {
        errors.push(`Row ${index + 1}: Item name is required`);
      } else if (!row.itemId && row.itemName) {
        errors.push(`Row ${index + 1}: Item "${row.itemName}" not found in system`);
      }

      if (!row.unit) {
        errors.push(`Row ${index + 1}: Unit is required`);
      }

      const quantity = parseFloat(row.quantity);
      if (!row.quantity || isNaN(quantity) || quantity <= 0) {
        errors.push(`Row ${index + 1}: Valid quantity is required`);
      }

      const rate = parseFloat(row.rate);
      if (!row.rate || isNaN(rate) || rate <= 0) {
        errors.push(`Row ${index + 1}: Valid rate is required`);
      }
    });

    return errors;
  };

  // Auto-fill form with grouped data (single PO with multiple items)
  const autoFillForm = (group) => {
    if (!group || !group.isValid) {
      alert('This PO has validation errors. Please fix them first.');
      return;
    }

    // Prepare data for auto-fill
    const autoFillData = {
      // Header information
      companyId: group.companyId,
      vendorId: group.vendorId,
      gstType: group.gstType,
      currency: group.currency || 'INR',
      exchangeRate: group.exchangeRate || '1.00',
      warehouseId: group.warehouseId,
      expectedDeliveryDate: group.expectedDeliveryDate,
      paymentTerms: group.paymentTerms || '',
      deliveryTerms: group.deliveryTerms || '',
      warranty: group.warranty || '',
      contactPerson: group.contactPerson || '',
      cellNo: group.cellNo || '',
      // Items
      items: group.rows.map(row => ({
        id: row.itemId,
        name: row.itemName,
        hsnCode: row.hsnCode || '',
        modelNumber: row.modelNumber || '',
        unit: row.unit || '',
        quantity: row.quantity || '',
        rate: row.rate || '',
        gstRate: row.gstRate || '',
        itemDetail: row.itemDetail || '',
      }))
    };

    // Call the onAutoFill callback
    if (onAutoFill) {
      onAutoFill(autoFillData);
    }

    // Close the modal
    onClose();
  };

  // Process all grouped data and create multiple POs
  const processAllGroups = async () => {
    const validGroups = groupedData.filter(group => group.isValid);
    
    if (validGroups.length === 0) {
      alert('No valid PO groups found to process');
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setStep(3);

    try {
      let successCount = 0;
      let failCount = 0;
      const failedGroups = [];

      for (let i = 0; i < validGroups.length; i++) {
        const group = validGroups[i];
        try {
          const poData = {
            companyId: group.companyId,
            vendorId: group.vendorId,
            gstType: group.gstType,
            currency: group.currency || 'INR',
            exchangeRate: group.exchangeRate || '1.00',
            paymentTerms: group.paymentTerms || '',
            deliveryTerms: group.deliveryTerms || '',
            warranty: group.warranty || '',
            contactPerson: group.contactPerson || '',
            cellNo: group.cellNo || '',
            warehouseId: group.warehouseId,
            expectedDeliveryDate: group.expectedDeliveryDate,
            items: group.rows.map(row => ({
              id: row.itemId,
              name: row.itemName,
              hsnCode: row.hsnCode || '',
              modelNumber: row.modelNumber || '',
              itemDetail: row.itemDetail || '',
              unit: row.unit,
              quantity: row.quantity.toString(),
              rate: row.rate.toString(),
              ...(row.gstRate ? { gstRate: row.gstRate.toString() } : {})
            })),
            otherCharges: []
          };

          const response = await Api.post('/purchase/purchase-orders/create', poData);
          
          if (response.data.success) {
            successCount++;
          } else {
            failCount++;
            failedGroups.push({
              poReference: group.poReference,
              error: response.data.message || 'Failed to create PO'
            });
          }
        } catch (error) {
          failCount++;
          failedGroups.push({
            poReference: group.poReference,
            error: error?.response?.data?.message || error.message
          });
        }

        const progress = ((i + 1) / validGroups.length) * 100;
        setUploadProgress(Math.round(progress));
      }

      // Show results
      const resultData = {
        total: validGroups.length,
        successful: successCount,
        failed: failCount,
        failedGroups
      };

      setResults(resultData);
      setStep(4);

      let message = `✅ Processed ${validGroups.length} PO(s)\n`;
      message += `✅ Success: ${successCount}\n`;
      message += `❌ Failed: ${failCount}`;
      
      if (failedGroups.length > 0) {
        message += '\n\nFailed PO Groups:\n';
        failedGroups.forEach(f => {
          message += `${f.poReference}: ${f.error}\n`;
        });
      }
      
      alert(message);

      if (successCount > 0) {
        onSuccess?.(resultData);
      }

    } catch (error) {
      console.error('Error processing groups:', error);
      alert('Error processing data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Render upload step
  const renderUploadStep = () => (
    <div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-800 mb-2">📋 Instructions:</h3>
        <ul className="text-sm text-blue-700 list-disc pl-5 space-y-1">
          <li>Use <strong>PO Reference</strong> to group items into one PO</li>
          <li>Rows with the same PO Reference will be combined into one PO</li>
          <li>Fill in all required fields (marked with *)</li>
          <li>Supported formats: .xlsx, .xls, .csv</li>
          <li>Maximum file size: 10MB</li>
        </ul>
      </div>

      <button
        onClick={downloadTemplate}
        className="mb-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Download Template
      </button>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          className="hidden"
          id="excelFileUpload"
        />
        <label htmlFor="excelFileUpload" className="cursor-pointer block">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-gray-600 font-medium">Click to upload or drag and drop</p>
          <p className="text-sm text-gray-400 mt-1">Excel or CSV files only</p>
        </label>
      </div>

      {file && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-700">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
          </div>
          <button
            onClick={() => {
              setFile(null);
              setPreviewData([]);
              setGroupedData([]);
            }}
            className="text-red-600 hover:text-red-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );

  // Render preview step
  const renderPreviewStep = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Preview Data ({groupedData.length} PO(s), {previewData.length} items)
          </h3>
          <p className="text-sm text-gray-500">
            Review the data. Click "Auto-fill Form" to fill the form with selected PO data.
          </p>
        </div>
        {/* <div className="space-x-2">
          <button
            onClick={() => {
              setStep(1);
              setFile(null);
              setPreviewData([]);
              setGroupedData([]);
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back
          </button>
          <button
            onClick={processAllGroups}
            disabled={loading || groupedData.filter(g => g.isValid).length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Process All POs
          </button>
        </div> */}
      </div>

      {loading && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Processing...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Grouped PO Cards */}
      <div className="space-y-6 max-h-96 overflow-y-auto">
        {groupedData.map((group, index) => (
          <div key={index} className={`border rounded-lg p-4 ${group.isValid ? 'border-gray-200' : 'border-red-300 bg-red-50'}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-gray-800">
                  PO: {group.poReference}
                </h4>
                <p className="text-sm text-gray-500">
                  {group.rows.length} item(s) | 
                  Company: {group.companyName || '⚠️'} | 
                  Vendor: {group.vendorName || '⚠️'}
                </p>
              </div>
              <div className="flex space-x-2">
                {group.isValid ? (
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    Valid
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                    Invalid
                  </span>
                )}
                {group.isValid && (
                  <button
                    onClick={() => autoFillForm(group)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Auto-fill Form
                  </button>
                )}
              </div>
            </div>

            {!group.isValid && group.errors.length > 0 && (
              <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded">
                {group.errors.map((error, idx) => (
                  <p key={idx} className="text-xs text-red-700">• {error}</p>
                ))}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">HSN</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {group.rows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-500">{idx + 1}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-900">{row.itemName}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-500">{row.hsnCode || '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-900">{row.quantity}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-900">{row.rate}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-500">{row.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <span className="font-semibold">Summary:</span>{' '}
          {groupedData.filter(g => g.isValid).length} valid PO(s),
          {groupedData.filter(g => !g.isValid).length} invalid PO(s),
          Total items: {previewData.length}
        </p>
      </div>
    </div>
  );

  // Render success step
  const renderSuccessStep = () => (
    <div className="text-center py-8">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-2">Upload Complete!</h3>
      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-2xl font-bold text-gray-800">{results?.total || 0}</p>
          <p className="text-sm text-gray-500">Total POs</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-2xl font-bold text-green-600">{results?.successful || 0}</p>
          <p className="text-sm text-green-600">Successful</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-2xl font-bold text-red-600">{results?.failed || 0}</p>
          <p className="text-sm text-red-600">Failed</p>
        </div>
      </div>

      {results?.failedGroups?.length > 0 && (
        <div className="mb-6 text-left">
          <h4 className="font-semibold text-red-800 mb-2">Failed POs:</h4>
          <div className="max-h-40 overflow-y-auto bg-red-50 p-4 rounded-lg border border-red-200">
            {results.failedGroups.map((failed, index) => (
              <div key={index} className="text-sm text-red-700 mb-1">
                {failed.poReference}: {failed.error}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center space-x-3">
        <button
          onClick={() => {
            setStep(1);
            setFile(null);
            setPreviewData([]);
            setGroupedData([]);
            setResults(null);
          }}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Upload More
        </button>
        <button
          onClick={() => {
            onSuccess?.(results);
            onClose();
          }}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Bulk Upload Purchase Orders
        </h2>
        {step !== 4 && !loading && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {[
            { step: 1, label: 'Upload' },
            { step: 2, label: 'Preview' },
            { step: 3, label: 'Processing' },
            { step: 4, label: 'Complete' }
          ].map((item, index) => (
            <React.Fragment key={item.step}>
              <div className="flex flex-col items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step === item.step ? 'bg-blue-600 text-white' :
                    step > item.step ? 'bg-green-500 text-white' :
                    'bg-gray-200 text-gray-600'}
                `}>
                  {step > item.step ? '✓' : item.step}
                </div>
                <span className={`text-xs mt-1 ${step === item.step ? 'font-medium text-blue-600' : 'text-gray-500'}`}>
                  {item.label}
                </span>
              </div>
              {index < 3 && (
                <div className={`flex-1 h-0.5 ${step > index + 1 ? 'bg-green-500' : 'bg-gray-300'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      {step === 1 && renderUploadStep()}
      {step === 2 && renderPreviewStep()}
      {step === 3 && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Processing purchase orders...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait</p>
        </div>
      )}
      {step === 4 && renderSuccessStep()}
    </div>
  );
};

export default ExcelPurchaseOrderUpload;