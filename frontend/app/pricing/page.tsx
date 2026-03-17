export default function PricingPage() {
    return (
        <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ecfeff_100%)] px-4 py-16 text-slate-900 md:px-6">
            <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.1)] md:p-12">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-sky-600">Pricing</p>
                <h1 className="mb-4 text-4xl font-black md:text-5xl">Bảng giá đang cập nhật</h1>
                <p className="mb-8 text-slate-600">
                    Tutor Pro hiện tại đang hoạt động theo mô hình miễn phí trong giai đoạn phát triển. Bảng giá chi tiết cho các gói sẽ được công bố sớm.
                </p>

                <form className="space-y-4" action="#" method="post">
                    <label className="block text-sm font-semibold text-slate-700" htmlFor="pricing-email">
                        Đăng ký nhận thông báo khi có bảng giá chính thức
                    </label>
                    <input
                        id="pricing-email"
                        name="email"
                        type="email"
                        required
                        placeholder="email@example.com"
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
                    />
                    <button
                        type="submit"
                        className="rounded-xl bg-sky-500 px-6 py-3 text-sm font-black uppercase tracking-wide text-white shadow-[0_16px_40px_rgba(14,165,233,0.3)] transition-colors hover:bg-sky-600"
                    >
                        Nhận thông báo
                    </button>
                </form>
            </div>
        </main>
    );
}
