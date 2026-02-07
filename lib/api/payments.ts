import apiClient, { handleApiError } from './client';
import type { 
  PaymentRequest,
  PaymentResponse,
  Plan,
  ApiResponse 
} from '../types';

interface PaymentHistory {
  id: number;
  transactionId: string;
  amount: number;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED';
  method: 'CARD' | 'QR' | 'WALLET';
  planName: string;
  createdAt: string;
}

/**
 * Payments API endpoints
 */
export const paymentsApi = {
  /**
   * Get available plans
   */
  getPlans: async (): Promise<Plan[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Plan[]>>('/api/payments/plans');
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Create payment
   */
  createPayment: async (data: PaymentRequest): Promise<PaymentResponse> => {
    try {
      const response = await apiClient.post<ApiResponse<PaymentResponse>>(
        '/api/payments/create',
        data
      );
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Verify payment (after redirect back from payment gateway)
   */
  verifyPayment: async (transactionId: string): Promise<PaymentResponse> => {
    try {
      const response = await apiClient.post<ApiResponse<PaymentResponse>>(
        '/api/payments/verify',
        { transactionId }
      );
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Apply coupon code
   */
  applyCoupon: async (code: string, planId: number): Promise<{
    valid: boolean;
    discount: number;
    newPrice: number;
  }> => {
    try {
      const response = await apiClient.post<ApiResponse<{
        valid: boolean;
        discount: number;
        newPrice: number;
      }>>('/api/payments/coupon', { code, planId });
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get payment history
   */
  getPaymentHistory: async (): Promise<PaymentHistory[]> => {
    try {
      const response = await apiClient.get<ApiResponse<PaymentHistory[]>>('/api/payments/history');
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get current subscription
   */
  getCurrentSubscription: async (): Promise<{
    plan: Plan;
    expiresAt: string;
    autoRenew: boolean;
  } | null> => {
    try {
      const response = await apiClient.get<ApiResponse<{
        plan: Plan;
        expiresAt: string;
        autoRenew: boolean;
      } | null>>('/api/payments/subscription');
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Cancel subscription
   */
  cancelSubscription: async (): Promise<void> => {
    try {
      await apiClient.post('/api/payments/subscription/cancel');
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default paymentsApi;
