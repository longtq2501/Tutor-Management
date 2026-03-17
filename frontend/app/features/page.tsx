import Image from 'next/image';
import Link from 'next/link';

const features = [
    {
        title: 'Live Teaching',
        description: 'Lớp học trực tuyến tập trung, giảm thao tác phân tán qua nhiều nền tảng.',
        screenshot: '/screenshots/live-teaching.png',
        alt: 'Live Teaching screenshot',
        metrics: ['Độ trễ thao tác < 800ms', 'Giảm chuyển đổi tab trong buổi học'],
    },
    {
        title: 'Calendar',
        description: 'Quản lý lịch dạy theo ngày/tuần, ưu tiên sự ổn định và tránh trùng lịch.',
        screenshot: '/screenshots/calendar-view.png',
        alt: 'Calendar screenshot',
        metrics: ['Theo dõi lịch dạy trong một màn hình', 'Cảnh báo xung đột lịch để xử lý sớm'],
    },
    {
        title: 'Lesson Lobby',
        description: 'Quản lý bài giảng theo chương/buổi, để truy cập nội dung dạy học nhanh và nhất quán.',
        screenshot: '/screenshots/lesson-lobby-view.png',
        alt: 'Lesson lobby screenshot',
        metrics: ['Tổ chức bài giảng theo lộ trình', 'Giảm thời gian tìm kiếm nội dung cần dạy'],
    },
    {
        title: 'Assessment',
        description: 'Tổng hợp kết quả học tập để theo dõi tiến độ và điều chỉnh mục tiêu học sinh.',
        screenshot: '/screenshots/assessment-view.png',
        alt: 'Assessment screenshot',
        metrics: ['Đánh giá theo buổi học và theo giai đoạn', 'Theo dõi tiến bộ rõ ràng hơn cho từng học sinh'],
    },
    {
        title: 'Finance',
        description: 'Theo dõi học phí, công nợ và doanh thu theo chu kỳ để quản lý dòng tiền minh bạch.',
        screenshot: '/screenshots/finance-view.png',
        alt: 'Finance screenshot',
        metrics: ['Nhìn nhanh trạng thái thu phí', 'Tổng hợp doanh thu theo tháng'],
    },
    {
        title: 'Storage',
        description: 'Lưu trữ tài liệu học tập tập trung để tìm kiếm và chia sẻ nhanh hơn.',
        screenshot: '/screenshots/storage-view.png',
        alt: 'Storage screenshot',
        metrics: ['Tập trung dữ liệu tại một nơi', 'Giảm thất lạc tài liệu trong quá trình dạy'],
    },
];

export default function FeaturesPage() {
    return (
        <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef8ff_100%)] px-4 py-16 text-slate-900 md:px-6">
            <div className="mx-auto max-w-6xl">
                <h1 className="mb-4 text-4xl font-black md:text-6xl">Tính năng Tutor Pro</h1>
                <p className="mb-12 max-w-2xl text-slate-600">
                    Tổng hợp các module cốt lõi đang được sử dụng trong quá trình vận hành gia sư 1-1.
                </p>

                <div className="space-y-8">
                    {features.map((feature) => (
                        <article
                            key={feature.title}
                            className="grid grid-cols-1 gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] md:grid-cols-2 md:gap-8 md:p-8"
                        >
                            <div className="aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                <Image src={feature.screenshot} alt={feature.alt} width={1400} height={840} className="h-full w-full object-cover object-top" />
                            </div>
                            <div className="flex flex-col justify-center">
                                <h2 className="mb-3 text-2xl font-black text-slate-900">{feature.title}</h2>
                                <p className="mb-4 text-slate-600">{feature.description}</p>
                                <ul className="space-y-2 text-slate-700">
                                    {feature.metrics.map((metric) => (
                                        <li key={metric} className="flex items-start gap-2">
                                            <span className="mt-1 text-emerald-500">✓</span>
                                            <span>{metric}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </article>
                    ))}
                </div>

                <div className="mt-12">
                    <Link
                        href="/register"
                        className="inline-flex rounded-xl bg-[#4a9eff] px-6 py-3 text-sm font-black uppercase tracking-wide text-white shadow-[0_16px_40px_rgba(74,158,255,0.35)]"
                    >
                        Dùng thử miễn phí
                    </Link>
                </div>
            </div>
        </main>
    );
}
