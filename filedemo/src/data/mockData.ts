import { DaySection, Slide } from '../types';

export const INSTRUCTOR_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuD2E7--Fa8s8QZy6AbzAbm4RGO1H4lI71BybbwGPpaL0LR217q3zRf5eHwbZnrXk7_gp5bGO1j2HLeqoe7G9CyIdf4dhPY1MFYFpSw1JGGLl-96Is0VP5dcKKf2wxiA1ejRPnw4c-Yu2OVnFXBheKpVR1Lzj62Rx00zR-_KemjFKwdT47lNBpdNPJidB4x1HE135_9_WowpzB6Q95EHgzr64ADSRogaSKTMIkxAAMiIeveHalGslV7r";

export const SAMPLE_SLIDES: Slide[] = [
  {
    pageNumber: 1,
    title: "Thiết kế sản phẩm AI cho sự không chắc chắn",
    subtitle: "Từ khả năng của model đến trải nghiệm đáng tin cậy của người dùng",
    category: "AI IN ACTION - NGÀY 5",
    bgType: "sage",
    contentLines: [
      "Instructor: Mai Anh Nguyen (Blue) · VinUniversity · Day 5 - 2026",
      "Môn học COMP2010 - Thiết kế & Phát triển Sản phẩm Công nghệ",
      "Khái niệm Tính không chắc chắn (Uncertainty) trong AI UX/UI"
    ],
    notesCount: 1,
  },
  {
    pageNumber: 2,
    title: "Instructor",
    subtitle: "Giới thiệu giảng viên & Kinh nghiệm thực tế",
    bgType: "white",
    instructorInfo: {
      name: "Mai Anh Nguyen (Blue)",
      role: "Generalist Product Builder",
      bioPoints: [
        "2026 FPT Long Châu (PM - Healthcare Product)",
        "2025 Thongtincuuho.org (Co-founder)",
        "Giảng viên thỉnh giảng & Cố vấn thiết kế AI UX"
      ],
      avatarUrl: INSTRUCTOR_AVATAR,
    },
    notesCount: 0,
  },
  {
    pageNumber: 3,
    title: "Bản chất của Mô hình AI: Xác suất vs. Xác định",
    subtitle: "Tại sao sản phẩm AI khác với phần mềm truyền thống?",
    category: "CHƯƠNG 1: ĐẶC TÍNH AI",
    bgType: "card",
    contentLines: [
      "1. Phần mềm truyền thống (Deterministic): Cùng 1 input A luôn ra output B.",
      "2. Hệ thống AI (Probabilistic): Với input A, output có thể là B1, B2 hoặc B3 tùy thuộc vào độ tin cậy (confidence score).",
      "3. Thách thức cho Designer: Thiết kế giao diện hỗ trợ trường hợp AI dự đoán sai hoặc chưa chắc chắn.",
      "4. Nguyên tắc cốt lõi: 'Design for Failure & Delight on Success'."
    ],
    keyTakeaway: "Đừng bao giờ thiết kế ứng dụng AI như một hệ thống hoàn hảo 100%. Luôn cung cấp lối thoát cho người dùng.",
    notesCount: 2,
  },
  {
    pageNumber: 4,
    title: "4 Cấp độ Khả năng của Model & Trải nghiệm Người dùng",
    subtitle: "Khung đánh giá từ Rủi ro thấp đến Rủi ro cao",
    category: "CHƯƠNG 2: MENTAL MODEL",
    bgType: "white",
    contentLines: [
      "• Level 1: Auto-Suggest (Gợi ý tự động - như autocomplete, tìm kiếm)",
      "• Level 2: Assistive (Trợ lý hỗ trợ - như VLearn Tutor, tóm tắt văn bản)",
      "• Level 3: Semi-Autonomous (Bán tự động - người dùng kiểm duyệt trước khi thực thi)",
      "• Level 4: Fully Autonomous (Tự động hoàn toàn - cần độ an toàn và giám sát cực cao)"
    ],
    keyTakeaway: "Độ không chắc chắn càng cao thì quyền kiểm soát (Control) của người dùng phải càng lớn.",
    notesCount: 0,
  },
  {
    pageNumber: 5,
    title: "Case Study: Trợ lý Sức khỏe FPT Long Châu",
    subtitle: "Quản lý kỳ vọng & Thiết kế Disclaimer an toàn y tế",
    category: "CHƯƠNG 3: CASE STUDY",
    bgType: "white",
    contentLines: [
      "1. Vấn đề: Bệnh nhân hỏi triệu chứng y tế phức tạp.",
      "2. Giải pháp UI: Hiển thị nguồn tham khảo dược thư, thêm nhãn 'Tham khảo ý kiến bác sĩ'.",
      "3. Cơ chế feedback: Nút bấm Like/Dislike + Báo cáo thông tin không chính xác.",
      "4. Giới hạn phản hồi: Tự động chuyển hướng sang Dược sĩ tư vấn trực tiếp khi độ tin cậy < 80%."
    ],
    notesCount: 1,
  },
  {
    pageNumber: 6,
    title: "Tối ưu hóa VLearn Tutor cho Học viên",
    subtitle: "Tương tác theo ngữ cảnh trực tiếp trên slide bài giảng",
    category: "CHƯƠNG 4: THỰC HÀNH",
    bgType: "sage",
    contentLines: [
      "• Bôi đen văn bản trên slide -> Tự động trích xuất ngữ cảnh đưa vào AI Chat Panel.",
      "• Giới hạn Quota hàng ngày giúp sinh viên rèn luyện tư duy đặt câu hỏi chất lượng.",
      "• Tích hợp cơ chế BYOK (Bring Your Own Key) mở rộng tính năng không giới hạn."
    ],
    keyTakeaway: "Học tập hiệu quả hơn khi AI đóng vai trò người phản biện (Socratic Tutor) thay vì cho ngay đáp án.",
    notesCount: 0,
  }
];

// Generate standard set up to page 62 to match slide total
export const FULL_SLIDES: Slide[] = Array.from({ length: 62 }, (_, i) => {
  const pageNumber = i + 1;
  if (pageNumber <= SAMPLE_SLIDES.length) {
    return SAMPLE_SLIDES[pageNumber - 1];
  }
  return {
    pageNumber,
    title: `Chương ${Math.floor(pageNumber / 10) + 1}: Chủ đề nâng cao ${pageNumber}`,
    subtitle: `Phân tích chuyên sâu & Thực hành thiết kế hệ thống AI - Trang ${pageNumber}`,
    category: `SLA BÀI GIẢNG - PHẦN ${Math.ceil(pageNumber / 5)}`,
    bgType: pageNumber % 3 === 0 ? "sage" : "white",
    contentLines: [
      `• Điểm trọng tâm thứ 1 của bài học trang ${pageNumber}`,
      `• Phân tích mô hình kiến trúc và giao diện phản hồi người dùng`,
      `• Các trường hợp kiểm thử (Edge cases) đối với đầu ra ngẫu nhiên của LLM`,
      `• Thực hành trực tiếp trên VLearn Tutor`
    ],
    keyTakeaway: `Ghi nhớ trọng tâm trang ${pageNumber}: Luôn cho phép người dùng sửa đổi kết quả do AI tạo ra.`,
    notesCount: pageNumber === 12 || pageNumber === 25 ? 1 : 0,
  };
});

export const INITIAL_DAY_SECTIONS: DaySection[] = [
  {
    id: "day1",
    title: "Day 1",
    docCount: 2,
    isActive: false,
    documents: [
      {
        id: "day01-intro",
        name: "day01-tong-quan-nhap-mon.pdf",
        pageCount: 28,
        courseCode: "COMP2010",
        materialRef: "Lecture_material_day01",
        slides: FULL_SLIDES.slice(0, 28),
      },
      {
        id: "day01-syllabus",
        name: "day01-de-cuong-chi-tiet.pdf",
        pageCount: 12,
        courseCode: "COMP2010",
        materialRef: "Syllabus_COMP2010",
        slides: FULL_SLIDES.slice(0, 12),
      },
    ],
  },
  {
    id: "day2",
    title: "Day 2",
    docCount: 1,
    isActive: false,
    documents: [
      {
        id: "day02-product-discovery",
        name: "day02-nghien-cuu-nguoi-dung-uiux.pdf",
        pageCount: 35,
        courseCode: "COMP2010",
        materialRef: "Lecture_material_day02",
        slides: FULL_SLIDES.slice(0, 35),
      },
    ],
  },
  {
    id: "day5",
    title: "Day 5",
    docCount: 3,
    isActive: true,
    isStudying: true,
    documents: [
      {
        id: "doc1",
        name: "day05-ai-product-thinking-re...",
        pageCount: 44,
        courseCode: "COMP2010",
        materialRef: "Lecture_material_ms5rpr5o_wgl8wy",
        slides: FULL_SLIDES.slice(0, 44),
      },
      {
        id: "doc2",
        name: "day05-lecture-slides-batch03...",
        pageCount: 39,
        courseCode: "COMP2010",
        materialRef: "Lecture_material_ms5rpr5o_wgl8wy",
        slides: FULL_SLIDES.slice(0, 39),
      },
      {
        id: "doc3",
        name: "day05-slide-batch03-C401.pdf",
        pageCount: 62,
        courseCode: "COMP2010",
        materialRef: "Lecture_material_ms5rpr5o_wgl8wy",
        isStudying: true,
        slides: FULL_SLIDES,
      },
    ],
  },
  {
    id: "day6",
    title: "Day 6",
    docCount: 1,
    isActive: false,
    documents: [
      {
        id: "day06-evaluation",
        name: "day06-danh-gia-kiem-thu-san-pham.pdf",
        pageCount: 50,
        courseCode: "COMP2010",
        materialRef: "Lecture_material_day06",
        slides: FULL_SLIDES.slice(0, 50),
      },
    ],
  },
];
