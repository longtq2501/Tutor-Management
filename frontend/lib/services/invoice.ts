import api from './axios-instance';
import type { InvoiceRequest, InvoiceResponse, ApiResponse } from '../types';


export const invoicesApi = {
  /** * TẠO DỮ LIỆU HÓA ĐƠN (XEM TRƯỚC)
   * @param {InvoiceRequest} request - Thông tin yêu cầu tạo hóa đơn
   * @returns {Promise<InvoiceResponse>} Dữ liệu hóa đơn chi tiết
   */
  generateInvoice: async (request: InvoiceRequest): Promise<InvoiceResponse> => {
    const response = await api.post('/invoices/generate', request);
    return response.data.data;
  },

  /** * TẢI XUỐNG FILE PDF HÓA ĐƠN CHO MỘT ĐỐI TƯỢNG CỤ THỂ
   * @param {InvoiceRequest} request - Thông tin yêu cầu (tháng, ID học sinh...)
   * @returns {Promise<Blob>} Dữ liệu nhị phân của file PDF
   */
  downloadInvoicePDF: async (request: InvoiceRequest): Promise<Blob> => {
    const response = await api.post('/invoices/download-pdf', request, {
      responseType: 'blob',
    });
    return response.data;
  },

  /** * TẢI XUỐNG FILE PDF HÓA ĐƠN TỔNG HỢP CẢ THÁNG (CÁCH 1)
   * @param {string} month - Tháng cần tải (Ví dụ: "2023-12")
   * @returns {Promise<Blob>} Dữ liệu nhị phân của file PDF tổng hợp
   */
  downloadMonthlyInvoicePDF: async (month: string): Promise<Blob> => {
    const response = await api.post('/invoices/download-monthly-pdf', null, {
      params: { month },
      responseType: 'blob',
    });
    return response.data;
  },

  /** * TẢI XUỐNG FILE PDF HÓA ĐƠN TỔNG HỢP CẢ THÁNG (CÁCH 2 - ALTERNATIVE)
   * @param {string} month - Tháng cần tải
   * @returns {Promise<Blob>}
   */
  downloadMonthlyInvoicePDFAlt: async (month: string): Promise<Blob> => {
    const response = await api.post('/invoices/download-pdf', {
      month,
      allStudents: true
    }, {
      responseType: 'blob',
    });
    return response.data;
  },

  /** * GỬI EMAIL HÓA ĐƠN CHO MỘT PHỤ HUYNH CỤ THỂ
   * @param {InvoiceRequest} request - Thông tin yêu cầu gửi email
   * @returns {Promise<ApiResponse<void>>} Kết quả gửi email thành công/thất bại
   */
  sendInvoiceEmail: async (request: InvoiceRequest): Promise<ApiResponse<void>> => {
    const response = await api.post('/invoices/send-email', request);
    return response.data;
  },

  /** * GỬI EMAIL HÓA ĐƠN HÀNG LOẠT THEO DANH SÁCH CHỈ ĐỊNH
   * @param {InvoiceRequest} request - Chứa danh sách các ID học sinh cụ thể
   * @returns {Promise<ApiResponse<void>>}
   */
  sendInvoiceEmailBatch: async (request: InvoiceRequest): Promise<ApiResponse<void>> => {
    const response = await api.post('/invoices/send-email-batch', request);
    return response.data;
  },

  /** * GỬI EMAIL HÓA ĐƠN CHO TOÀN BỘ PHỤ HUYNH TRONG THÁNG
   * @param {InvoiceRequest} request - Chứa thông tin tháng cần gửi
   * @returns {Promise<ApiResponse<void>>}
   */
  sendInvoiceEmailAll: async (request: InvoiceRequest): Promise<ApiResponse<void>> => {
    const response = await api.post('/invoices/send-email-all', request);
    return response.data;
  },
};