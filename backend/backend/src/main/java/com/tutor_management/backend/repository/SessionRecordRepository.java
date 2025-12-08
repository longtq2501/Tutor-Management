package com.tutor_management.backend.repository;

import com.tutor_management.backend.entity.SessionRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SessionRecordRepository extends JpaRepository<SessionRecord, Long> {

    // Phương thức cần cho StudentService (tìm records theo StudentId)
    List<SessionRecord> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    // Lấy tất cả các bản ghi, sắp xếp theo thời gian tạo giảm dần
    List<SessionRecord> findAllByOrderByCreatedAtDesc();

    // Lấy các bản ghi theo tháng, sắp xếp theo thời gian tạo giảm dần
    List<SessionRecord> findByMonthOrderByCreatedAtDesc(String month);

    // Lấy danh sách các tháng duy nhất (BẮT BUỘC phải dùng @Query)
    @Query("SELECT DISTINCT sr.month FROM SessionRecord sr ORDER BY sr.month DESC")
    List<String> findDistinctMonths();

    // --- CÁC HÀM TÍNH TỔNG ĐÃ SỬA LỖI BẰNG CÁCH DÙNG @Query ---

    // Tính tổng số tiền đã thanh toán (Paid) cho toàn bộ thời gian.
    @Query("SELECT COALESCE(SUM(sr.totalAmount), 0) FROM SessionRecord sr WHERE sr.paid = true")
    Long sumTotalPaid();

    // Tính tổng số tiền chưa thanh toán (Unpaid) cho toàn bộ thời gian.
    @Query("SELECT COALESCE(SUM(sr.totalAmount), 0) FROM SessionRecord sr WHERE sr.paid = false")
    Long sumTotalUnpaid();

    // Tính tổng số tiền đã thanh toán (Paid) theo tháng.
    @Query("SELECT COALESCE(SUM(sr.totalAmount), 0) FROM SessionRecord sr WHERE sr.month = :month AND sr.paid = true")
    Long sumTotalPaidByMonth(String month);

    // Tính tổng số tiền chưa thanh toán (Unpaid) theo tháng.
    @Query("SELECT COALESCE(SUM(sr.totalAmount), 0) FROM SessionRecord sr WHERE sr.month = :month AND sr.paid = false")
    Long sumTotalUnpaidByMonth(String month);

    // Tính tổng số buổi học (Sessions) theo tháng.
    @Query("SELECT COALESCE(SUM(sr.sessions), 0) FROM SessionRecord sr WHERE sr.month = :month")
    Integer sumSessionsByMonth(String month);
}