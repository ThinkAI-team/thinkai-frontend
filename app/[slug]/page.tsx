import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import styles from './page.module.css';

type PageSection = {
  title: string;
  body: string[];
};

type PageCard = {
  title: string;
  description: string;
  meta?: string;
};

type FAQItem = {
  question: string;
  answer: string;
};

type InfoPage = {
  title: string;
  summary: string;
  tag: string;
  updatedAt: string;
  keyPoints: string[];
  sections: PageSection[];
  cards?: PageCard[];
  faq?: FAQItem[];
  relatedLinks: Array<{ label: string; href: string }>;
  primaryAction: { label: string; href: string };
  secondaryAction: { label: string; href: string };
};

const STATIC_PAGES: Record<string, InfoPage> = {
  about: {
    title: 'Về ThinkAI',
    summary:
      'ThinkAI tập trung vào một trải nghiệm học tập rõ ràng, nhất quán và có khả năng mở rộng cho học viên, giảng viên và quản trị viên.',
    tag: 'Giới thiệu nền tảng',
    updatedAt: 'Cập nhật: 22/03/2026',
    keyPoints: [
      'UI tối giản theo hướng tập trung và giảm nhiễu thao tác',
      'Luồng Student và Teacher tách biệt, nhưng đồng nhất trải nghiệm',
      'Kiến trúc API-first để mở rộng tính năng nhanh',
    ],
    sections: [
      {
        title: 'Tầm nhìn sản phẩm',
        body: [
          'Chúng tôi xây dựng ThinkAI như một workspace học tập dài hạn, nơi người dùng không chỉ làm bài mà còn quản lý lộ trình phát triển kỹ năng theo mục tiêu cụ thể.',
          'Mọi quyết định UI và kỹ thuật đều ưu tiên tính rõ ràng: mỗi màn hình chỉ phục vụ một mục tiêu chính, giảm tối đa bước chuyển không cần thiết.',
        ],
      },
      {
        title: 'Nguyên tắc thiết kế',
        body: [
          'Thiết kế của ThinkAI theo phong cách Zen hiện đại: bề mặt sáng, tương phản đủ rõ, spacing nhất quán và chuyển động nhẹ để giữ sự tập trung.',
          'Chúng tôi tránh các yếu tố trang trí gây sao nhãng, ưu tiên thông tin có ích trực tiếp cho hành động tiếp theo của người học.',
        ],
      },
      {
        title: 'Hướng phát triển tiếp theo',
        body: [
          'Trong các bản phát hành tới, hệ thống sẽ mở rộng sâu hơn ở calendar, progress intelligence và công cụ hỗ trợ đánh giá theo competency.',
          'Các thay đổi UI sẽ được đóng gói theo design token để cập nhật bảng màu nhanh mà không làm gãy trải nghiệm hiện tại.',
        ],
      },
    ],
    cards: [
      { title: 'Student Workspace', description: 'Học khóa học, làm bài thi, hỏi Bò Trang trong một luồng duy nhất.' },
      { title: 'Teacher Workspace', description: 'Quản lý khóa học, bài thi và question bank với dashboard riêng.' },
      { title: 'Admin Control', description: 'Giám sát người dùng, khóa học và AI prompt từ một trung tâm quản trị.' },
    ],
    relatedLinks: [
      { label: 'FAQ', href: '/faq' },
      { label: 'Trợ giúp', href: '/help' },
      { label: 'Liên hệ', href: '/contact' },
    ],
    primaryAction: { label: 'Vào dashboard', href: '/dashboard' },
    secondaryAction: { label: 'Xem khóa học', href: '/courses' },
  },
  blog: {
    title: 'Blog ThinkAI',
    summary:
      'Khu vực chia sẻ cập nhật sản phẩm, chiến lược học tập và case study triển khai trong môi trường đào tạo thực tế.',
    tag: 'Nội dung chuyên môn',
    updatedAt: 'Cập nhật: 22/03/2026',
    keyPoints: [
      'Tập trung vào bài viết có tính ứng dụng',
      'Mỗi bài gắn với bài toán học tập cụ thể',
      'Cập nhật theo chu kỳ phát hành sản phẩm',
    ],
    sections: [
      {
        title: 'Định hướng nội dung',
        body: [
          'Blog ThinkAI ưu tiên các chủ đề liên quan trực tiếp đến hiệu quả học tập: thiết kế lộ trình, tối ưu thời gian, và phân tích kết quả bài thi.',
          'Chúng tôi cũng chia sẻ các bài viết kỹ thuật về cách xây dựng hệ thống học tập có khả năng mở rộng và đồng bộ dữ liệu theo thời gian thực.',
        ],
      },
      {
        title: 'Lịch xuất bản',
        body: [
          'Nội dung sẽ được phát hành theo nhóm chủ đề theo tháng, bám sát roadmap sản phẩm để người dùng nắm được định hướng cải tiến.',
          'Trong giai đoạn này, blog đang ở chế độ chuẩn bị nội dung và sẽ mở đầy đủ sau khi hoàn tất vòng kiểm thử giao diện cuối.',
        ],
      },
    ],
    cards: [
      {
        title: 'Thiết kế lộ trình TOEIC theo năng lực',
        description: 'Cách chia nhỏ mục tiêu điểm số thành các mốc học tập khả thi trong 8 tuần.',
        meta: 'Sắp phát hành',
      },
      {
        title: 'Tối ưu việc dùng Bò Trang',
        description: 'Framework đặt câu hỏi để nhận phản hồi ngắn, chính xác và dễ áp dụng ngay.',
        meta: 'Sắp phát hành',
      },
      {
        title: 'Kiến trúc dashboard cho giáo dục',
        description: 'Bài học rút ra khi thiết kế luồng học tập đa vai trò trên cùng một hệ thống.',
        meta: 'Sắp phát hành',
      },
    ],
    relatedLinks: [
      { label: 'Về ThinkAI', href: '/about' },
      { label: 'Chính sách bảo mật', href: '/privacy' },
      { label: 'Điều khoản sử dụng', href: '/terms' },
    ],
    primaryAction: { label: 'Vào dashboard', href: '/dashboard' },
    secondaryAction: { label: 'Mở Bò Trang', href: '/ai-tutor' },
  },
  contact: {
    title: 'Liên hệ',
    summary:
      'Kênh tiếp nhận hỗ trợ kỹ thuật, phản hồi trải nghiệm và đề xuất hợp tác đào tạo với ThinkAI.',
    tag: 'Hỗ trợ chính thức',
    updatedAt: 'Cập nhật: 22/03/2026',
    keyPoints: [
      'Ưu tiên xử lý lỗi ảnh hưởng luồng học tập',
      'Phản hồi theo mức độ nghiêm trọng',
      'Hỗ trợ triển khai cho tổ chức giáo dục',
    ],
    sections: [
      {
        title: 'Khi cần hỗ trợ kỹ thuật',
        body: [
          'Để rút ngắn thời gian xử lý, vui lòng cung cấp email tài khoản, vai trò người dùng, mô tả lỗi và bước tái hiện chi tiết.',
          'Nếu lỗi liên quan đến phân quyền Student/Teacher/Admin, hãy đính kèm ảnh màn hình và thời điểm xảy ra để đội kỹ thuật đối chiếu log chính xác.',
        ],
      },
      {
        title: 'Khi cần hợp tác đào tạo',
        body: [
          'ThinkAI hỗ trợ tư vấn triển khai theo nhu cầu tổ chức: quy mô người học, mục tiêu đánh giá và yêu cầu tích hợp.',
          'Đội ngũ sẽ đề xuất phương án phù hợp theo từng bối cảnh để đảm bảo khả năng vận hành thực tế.',
        ],
      },
    ],
    cards: [
      {
        title: 'Email hỗ trợ',
        description: 'support@thinkai.vn',
        meta: 'Giờ phản hồi tiêu chuẩn: 8:00 - 17:30 (T2 - T6)',
      },
      {
        title: 'Kênh hợp tác',
        description: 'partnership@thinkai.vn',
        meta: 'Phù hợp cho trường học, trung tâm và tổ chức đào tạo',
      },
      {
        title: 'Mức ưu tiên sự cố',
        description: 'P1/P2/P3 theo ảnh hưởng hệ thống',
        meta: 'Sự cố chặn luồng học được xử lý trước',
      },
    ],
    relatedLinks: [
      { label: 'Trợ giúp', href: '/help' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Lịch học', href: '/calendar' },
    ],
    primaryAction: { label: 'Vào dashboard', href: '/dashboard' },
    secondaryAction: { label: 'Xem FAQ', href: '/faq' },
  },
  faq: {
    title: 'Câu hỏi thường gặp',
    summary:
      'Các vấn đề phổ biến nhất khi đăng ký, truy cập dashboard, quản lý khóa học và sử dụng Bò Trang.',
    tag: 'FAQ',
    updatedAt: 'Cập nhật: 22/03/2026',
    keyPoints: [
      'Bao phủ các lỗi thường gặp trong thực tế',
      'Tập trung vào luồng Student/Teacher',
      'Có hướng xử lý nhanh trước khi liên hệ support',
    ],
    sections: [
      {
        title: 'Cách dùng trang FAQ',
        body: [
          'Bạn nên kiểm tra theo đúng vai trò tài khoản đang dùng để tránh nhầm luồng. Một số hành động chỉ xuất hiện ở Teacher hoặc Admin.',
          'Nếu đã thử hướng dẫn nhưng chưa xử lý được, hãy chuyển sang trang Liên hệ và gửi thêm thông tin tái hiện lỗi.',
        ],
      },
    ],
    faq: [
      {
        question: 'Đăng ký giảng viên xong nhưng vào dashboard student?',
        answer:
          'Hãy kiểm tra role trả về sau đăng nhập và luồng redirect theo role ở frontend. Với tài khoản TEACHER, đường dẫn đúng là /teacher.',
      },
      {
        question: 'Vì sao tạo khóa học rồi nhưng học viên chưa thấy?',
        answer:
          'Khóa học cần được publish và học viên phải có quyền truy cập phù hợp. Sau khi publish, nên refresh danh sách khóa học để đồng bộ dữ liệu mới.',
      },
      {
        question: 'Bò Trang có lưu lịch sử hội thoại không?',
        answer:
          'Hệ thống hỗ trợ lưu lịch sử theo tài khoản để theo dõi tiến trình hỏi đáp. Chính sách lưu trữ và quyền truy cập được nêu trong trang Privacy.',
      },
      {
        question: 'Không truy cập được dashboard sau khi reset mật khẩu?',
        answer:
          'Đăng xuất hoàn toàn, đăng nhập lại và kiểm tra token/session mới. Nếu vẫn lỗi, gửi thời điểm và ảnh màn hình để support đối chiếu log.',
      },
      {
        question: 'Teacher có bắt buộc dùng cùng UI với student không?',
        answer:
          'Luồng teacher được tách riêng để đủ chức năng quản trị nội dung, nhưng vẫn giữ chung language thiết kế để đồng bộ trải nghiệm.',
      },
      {
        question: 'Có thể dùng trên mobile không?',
        answer:
          'Có. Các màn hình chính đã hỗ trợ responsive, tuy nhiên trải nghiệm tối ưu nhất vẫn là desktop cho các thao tác quản lý nội dung phức tạp.',
      },
    ],
    relatedLinks: [
      { label: 'Trợ giúp', href: '/help' },
      { label: 'Liên hệ', href: '/contact' },
      { label: 'Điều khoản', href: '/terms' },
    ],
    primaryAction: { label: 'Vào dashboard', href: '/dashboard' },
    secondaryAction: { label: 'Liên hệ hỗ trợ', href: '/contact' },
  },
  privacy: {
    title: 'Chính sách bảo mật',
    summary:
      'Quy định về phạm vi thu thập dữ liệu, mục đích sử dụng và trách nhiệm bảo vệ thông tin người dùng trên ThinkAI.',
    tag: 'Privacy',
    updatedAt: 'Cập nhật: 22/03/2026',
    keyPoints: [
      'Thu thập dữ liệu ở mức tối thiểu cần thiết',
      'Chỉ sử dụng dữ liệu cho mục đích dịch vụ',
      'Hỗ trợ yêu cầu kiểm tra và cập nhật dữ liệu',
    ],
    sections: [
      {
        title: 'Phạm vi dữ liệu thu thập',
        body: [
          'ThinkAI có thể thu thập thông tin tài khoản, dữ liệu tiến độ học tập, lịch sử tương tác với hệ thống và các thông tin cần thiết để bảo mật tài khoản.',
          'Dữ liệu được tổ chức theo nguyên tắc tối thiểu hóa, tránh thu thập thông tin không liên quan trực tiếp đến trải nghiệm học tập.',
        ],
      },
      {
        title: 'Mục đích xử lý dữ liệu',
        body: [
          'Dữ liệu được dùng để xác thực người dùng, cá nhân hóa nội dung học, cải thiện chất lượng phản hồi Bò Trang và đảm bảo ổn định hệ thống.',
          'Chúng tôi không sử dụng dữ liệu người dùng cho các mục đích ngoài phạm vi vận hành sản phẩm nếu chưa có sự đồng ý rõ ràng.',
        ],
      },
      {
        title: 'Quyền của người dùng',
        body: [
          'Bạn có quyền yêu cầu kiểm tra, điều chỉnh hoặc xóa dữ liệu cá nhân theo quy trình hỗ trợ chính thức.',
          'Mọi yêu cầu liên quan đến dữ liệu sẽ được xác minh danh tính trước khi xử lý để đảm bảo an toàn thông tin.',
        ],
      },
    ],
    relatedLinks: [
      { label: 'Điều khoản', href: '/terms' },
      { label: 'Liên hệ', href: '/contact' },
      { label: 'Trợ giúp', href: '/help' },
    ],
    primaryAction: { label: 'Vào dashboard', href: '/dashboard' },
    secondaryAction: { label: 'Xem điều khoản', href: '/terms' },
  },
  terms: {
    title: 'Điều khoản sử dụng',
    summary:
      'Các điều kiện áp dụng cho việc sử dụng tài khoản, nội dung và hành vi người dùng trên nền tảng ThinkAI.',
    tag: 'Terms',
    updatedAt: 'Cập nhật: 22/03/2026',
    keyPoints: [
      'Người dùng chịu trách nhiệm với tài khoản của mình',
      'Không sử dụng nền tảng cho mục đích gây hại',
      'ThinkAI có quyền cập nhật điều khoản khi cần thiết',
    ],
    sections: [
      {
        title: 'Tài khoản và phân quyền',
        body: [
          'Người dùng cần cung cấp thông tin chính xác khi đăng ký và chịu trách nhiệm bảo vệ thông tin đăng nhập.',
          'Quyền truy cập được xác định theo vai trò Student, Teacher hoặc Admin; việc sử dụng sai mục đích có thể bị giới hạn hoặc khóa tài khoản.',
        ],
      },
      {
        title: 'Nội dung và hành vi sử dụng',
        body: [
          'Bạn không được đăng tải hoặc phát tán nội dung vi phạm pháp luật, gây hại cho hệ thống hoặc xâm phạm quyền lợi của bên thứ ba.',
          'ThinkAI có thể từ chối hoặc gỡ bỏ nội dung không phù hợp để đảm bảo chất lượng và an toàn cho cộng đồng người dùng.',
        ],
      },
      {
        title: 'Giới hạn trách nhiệm',
        body: [
          'Chúng tôi nỗ lực đảm bảo độ ổn định dịch vụ, tuy nhiên không cam kết hệ thống hoạt động liên tục tuyệt đối trong mọi thời điểm.',
          'Trong trường hợp bảo trì hoặc sự cố ngoài dự kiến, ThinkAI sẽ thông báo và khôi phục dịch vụ sớm nhất có thể.',
        ],
      },
    ],
    relatedLinks: [
      { label: 'Chính sách bảo mật', href: '/privacy' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Liên hệ', href: '/contact' },
    ],
    primaryAction: { label: 'Vào dashboard', href: '/dashboard' },
    secondaryAction: { label: 'Xem privacy', href: '/privacy' },
  },
  help: {
    title: 'Trợ giúp',
    summary:
      'Hướng dẫn thao tác nhanh cho các tình huống phổ biến trong luồng học tập và quản trị nội dung.',
    tag: 'Help Center',
    updatedAt: 'Cập nhật: 22/03/2026',
    keyPoints: [
      'Ưu tiên xử lý theo triệu chứng lỗi',
      'Phân tách rõ luồng Student và Teacher',
      'Tối ưu các bước tự kiểm tra trước khi gửi ticket',
    ],
    sections: [
      {
        title: 'Sự cố đăng nhập và phân quyền',
        body: [
          'Nếu đăng nhập thành công nhưng vào sai dashboard, hãy kiểm tra role hiện tại và đảm bảo frontend redirect đúng theo role đó.',
          'Trường hợp token cũ gây lệch phiên, hãy đăng xuất, xóa session và đăng nhập lại để làm mới trạng thái xác thực.',
        ],
      },
      {
        title: 'Sự cố khóa học và bài thi',
        body: [
          'Nếu nội dung mới tạo chưa hiển thị cho học viên, cần kiểm tra trạng thái publish và quyền truy cập của từng vai trò.',
          'Với bài thi, xác nhận dữ liệu câu hỏi hợp lệ, attempt được khởi tạo thành công và endpoint submit trả về đúng định dạng.',
        ],
      },
      {
        title: 'Sự cố giao diện',
        body: [
          'Khi gặp lỗi hiển thị, hãy thử hard refresh trình duyệt để cập nhật bundle mới nhất và loại bỏ cache cũ.',
          'Nếu vẫn lỗi, gửi ảnh chụp màn hình cùng kích thước thiết bị để đội UI tái hiện và xử lý chính xác.',
        ],
      },
    ],
    relatedLinks: [
      { label: 'FAQ', href: '/faq' },
      { label: 'Liên hệ', href: '/contact' },
      { label: 'Lịch học', href: '/calendar' },
    ],
    primaryAction: { label: 'Vào dashboard', href: '/dashboard' },
    secondaryAction: { label: 'Gửi yêu cầu hỗ trợ', href: '/contact' },
  },
  calendar: {
    title: 'Lịch học',
    summary:
      'Không gian tổng hợp lịch trình học tập, luyện thi và các mốc quan trọng theo mục tiêu cá nhân.',
    tag: 'Study Calendar',
    updatedAt: 'Cập nhật: 22/03/2026',
    keyPoints: [
      'Theo dõi tiến độ học theo tuần',
      'Gắn mốc luyện thi với mục tiêu điểm số',
      'Đồng bộ với khóa học và bài thi',
    ],
    sections: [
      {
        title: 'Trạng thái hiện tại',
        body: [
          'Calendar đang được hoàn thiện để đồng bộ trực tiếp với tiến độ khóa học và lịch bài thi theo từng tài khoản.',
          'Trong giai đoạn này, bạn vẫn có thể theo dõi tiến độ tổng quan ở Dashboard và lập kế hoạch học theo tuần.',
        ],
      },
      {
        title: 'Nội dung sẽ có trong bản tiếp theo',
        body: [
          'Bản nâng cấp sẽ bổ sung timeline theo tuần, nhắc lịch tự động và cảnh báo trễ mốc mục tiêu.',
          'Hệ thống cũng sẽ hỗ trợ phân tách lịch học theo kỹ năng và mức độ ưu tiên để tối ưu thời gian ôn luyện.',
        ],
      },
    ],
    cards: [
      { title: 'Weekly Planner', description: 'Lập kế hoạch học theo ngày với khối lượng cụ thể.' },
      { title: 'Exam Timeline', description: 'Quản lý mốc luyện đề và deadline quan trọng.' },
      { title: 'Progress Checkpoint', description: 'Đánh dấu điểm kiểm tra giữa kỳ theo năng lực.' },
    ],
    relatedLinks: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Khóa học', href: '/courses' },
      { label: 'Bài thi', href: '/exams' },
    ],
    primaryAction: { label: 'Vào dashboard', href: '/dashboard' },
    secondaryAction: { label: 'Xem bài thi', href: '/exams' },
  },
};

export function generateStaticParams() {
  return Object.keys(STATIC_PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = STATIC_PAGES[slug];
  if (!page) {
    return { title: 'ThinkAI' };
  }
  return {
    title: `${page.title} | ThinkAI`,
    description: page.summary,
  };
}

export default async function StaticInfoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = STATIC_PAGES[slug];
  if (!page) notFound();

  return (
    <>
      <Navbar />

      <main className={styles.main}>
        <div className={styles.container}>
          <header className={styles.hero}>
            <div className={styles.heroTop}>
              <span className={styles.tag}>{page.tag}</span>
              <span className={styles.updatedAt}>{page.updatedAt}</span>
            </div>
            <h1>{page.title}</h1>
            <p>{page.summary}</p>
          </header>

          <div className={styles.layout}>
            <section className={styles.primary}>
              {page.sections.map((section) => (
                <article key={section.title} className={styles.sectionCard}>
                  <h2>{section.title}</h2>
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </article>
              ))}

              {page.cards && (
                <section className={styles.cardGrid}>
                  {page.cards.map((card) => (
                    <article key={card.title} className={styles.infoCard}>
                      <h3>{card.title}</h3>
                      <p>{card.description}</p>
                      {card.meta && <span>{card.meta}</span>}
                    </article>
                  ))}
                </section>
              )}

              {page.faq && (
                <section className={styles.faqSection}>
                  <h2>Câu hỏi thường gặp</h2>
                  <div className={styles.faqList}>
                    {page.faq.map((item) => (
                      <details key={item.question} className={styles.faqItem}>
                        <summary>{item.question}</summary>
                        <p>{item.answer}</p>
                      </details>
                    ))}
                  </div>
                </section>
              )}
            </section>

            <aside className={styles.aside}>
              <article className={styles.asideCard}>
                <h3>Điểm chính</h3>
                <ul>
                  {page.keyPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>

              <article className={styles.asideCard}>
                <h3>Trang liên quan</h3>
                <nav className={styles.relatedLinks}>
                  {page.relatedLinks.map((item) => (
                    <Link key={item.href} href={item.href}>
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </article>
            </aside>
          </div>

          <section className={styles.actions}>
            <Link href={page.primaryAction.href} className={styles.primaryAction}>
              {page.primaryAction.label}
            </Link>
            <Link href={page.secondaryAction.href} className={styles.secondaryAction}>
              {page.secondaryAction.label}
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
