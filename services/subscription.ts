import { apiRequest } from './api';

export interface HarnessSubscriptionPaymentRequest {
  planCode?: string;
  amountVnd?: number;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface HarnessSubscriptionPaymentResponse {
  orderCode: number;
  amount: number;
  description: string;
  paymentLinkId?: string;
  checkoutUrl?: string;
  qrCode?: string;
  status?: string;
}

export async function createHarnessSubscriptionPaymentLink(
  payload: HarnessSubscriptionPaymentRequest
): Promise<HarnessSubscriptionPaymentResponse> {
  return apiRequest<HarnessSubscriptionPaymentResponse>('/api/v1/harness-subscriptions/create-payment-link', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
