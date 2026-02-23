export interface Parent {
  id: number; // ID PHỤ HUYNH
  name: string; // HỌ TÊN PHỤ HUYNH
  email?: string; // ĐỊA CHỈ EMAIL
  phone?: string; // SỐ ĐIỆN THOẠI
  notes?: string; // GHI CHÚ VỀ PHỤ HUYNH
  studentCount: number; // SỐ LƯỢNG CON EM ĐANG THEO HỌC
  createdAt: string; // NGÀY TẠO BẢN GHI
  updatedAt: string; // NGÀY CẬP NHẬT GẦN NHẤT
}

export interface ParentRequest {
  name: string; // HỌ TÊN PHỤ HUYNH (BẮT BUỘC)
  email?: string; // EMAIL (TÙY CHỌN)
  phone?: string; // SỐ ĐIỆN THOẠI (TÙY CHỌN)
  notes?: string; // GHI CHÚ KÈM THEO
}

export interface Student {
  id: number; // ID HỌC SINH
  name: string; // HỌ TÊN HỌC SINH
  phone?: string; // SỐ ĐIỆN THOẠI RIÊNG
  schedule: string; // LỊCH TRÌNH HỌC (VÍ DỤ: THỨ 2-4-6)
  pricePerHour: number; // HỌC PHÍ TRÊN MỖI GIỜ
  notes?: string; // GHI CHÚ VỀ TÌNH HÌNH HỌC TẬP
  active: boolean; // TRẠNG THÁI ĐANG HỌC HAY ĐÃ NGHỈ
  startMonth: string; // THÁNG BẮT ĐẦU NHẬP HỌC
  lastActiveMonth?: string; // THÁNG CUỐI CÙNG CÒN HOẠT ĐỘNG
  monthsLearned?: number; // TỔNG SỐ THÁNG ĐÃ THEO HỌC
  learningDuration?: string; // THỜI GIAN THEO HỌC (DẠNG CHUỖI MÔ TẢ)
  createdAt: string; // NGÀY TẠO HỒ SƠ
  totalPaid: number; // TỔNG TIỀN ĐÃ THANH TOÁN
  totalUnpaid: number; // TỔNG TIỀN CÒN NỢ (CHƯA ĐÓNG)
  totalUnpaidTaught: number; // TỔNG TIỀN NỢ CHO CÁC BUỔI ĐÃ DẠY
  parent?: Parent; // THÔNG TIN PHỤ HUYNH LIÊN KẾT (OBJECT)
  parentId?: number; // ID CỦA PHỤ HUYNH (FOREIGN KEY)
  parentName?: string; // TÊN PHỤ HUYNH (DÙNG ĐỂ HIỂN THỊ NHANH)
  parentEmail?: string; // EMAIL PHỤ HUYNH (DÙNG ĐỂ GỬI HÓA ĐƠN)
  parentPhone?: string; // SĐT PHỤ HUYNH (DÙNG ĐỂ LIÊN HỆ)
  accountEmail?: string; // EMAIL TÀI KHOẢN ĐĂNG NHẬP
  accountId?: string; // ID TÀI KHOẢN (USER ID)
}

export interface StudentRequest {
  name: string; // TÊN HỌC SINH (BẮT BUỘC)
  phone?: string | null; // SỐ ĐIỆN THOẠI (TÙY CHỌN)
  schedule: string; // THIẾT LẬP LỊCH HỌC
  pricePerHour: number; // MỨC HỌC PHÍ THỎA THUẬN
  notes?: string | null; // GHI CHÚ BAN ĐẦU
  active?: boolean; // THIẾT LẬP TRẠNG THÁI HOẠT ĐỘNG
  startMonth?: string | null; // THÁNG BẮT ĐẦU (ĐỊNH DẠNG YYYY-MM)
  parentId?: number | null; // LIÊN KẾT VỚI ID PHỤ HUYNH CÓ SẴN

  // ✅ THÊM FIELD ACCOUNT
  createAccount?: boolean;
  email?: string | null;
  password?: string | null;
}
