// eSewa Payment Gateway Integration
// Documentation: https://developer.esewa.com.np/
// 
// Integration Flow:
// 1. User selects eSewa payment at checkout
// 2. Order is created with status 'awaiting_payment'
// 3. User is redirected to eSewa payment page
// 4. After payment, eSewa redirects to success_url with 'data' parameter (base64 encoded)
// 5. Frontend verifies payment with backend
// 6. Backend decodes data, verifies transaction, updates order status to 'pending'
// 7. User is redirected to orders page

interface EsewaPaymentParams {
  amount: number;
  tax_amount?: number;
  total_amount: number;
  transaction_uuid: string;
  product_code: string;
  product_service_charge?: number;
  product_delivery_charge?: number;
  success_url: string;
  failure_url: string;
}

export const initiateEsewaPayment = (params: EsewaPaymentParams) => {
  const {
    amount,
    tax_amount = 0,
    total_amount,
    transaction_uuid,
    product_code,
    product_service_charge = 0,
    product_delivery_charge = 0,
    success_url,
    failure_url,
  } = params;

  // eSewa payment URL (configured via environment variable)
  const esewaUrl = import.meta.env.VITE_ESEWA_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';

  // Create form
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = esewaUrl;

  // Add form fields
  const fields = {
    amount: amount.toString(),
    tax_amount: tax_amount.toString(),
    total_amount: total_amount.toString(),
    transaction_uuid,
    product_code,
    product_service_charge: product_service_charge.toString(),
    product_delivery_charge: product_delivery_charge.toString(),
    success_url,
    failure_url,
  };

  Object.entries(fields).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  // Append form to body and submit
  document.body.appendChild(form);
  form.submit();
};

export const verifyEsewaPayment = async (data: string): Promise<boolean> => {
  try {
    // Decode base64 data
    const decodedData = atob(data);
    const jsonData = JSON.parse(decodedData);
    
    // Check transaction status
    return jsonData.status === 'COMPLETE' && jsonData.transaction_code;
  } catch (error) {
    console.error('eSewa verification error:', error);
    return false;
  }
};
