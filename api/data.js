/**
 * !!! FILE ĐƯỢC SINH TỰ ĐỘNG — KHÔNG SỬA TAY !!!
 * Sinh bởi scripts/build-data.js từ assets/json/*.json
 * Sửa dữ liệu qua add-data.html, KHÔNG sửa trực tiếp file này.
 *
 * Vercel Edge Function — Data câu hỏi/đáp án
 * Thay cho việc để file JSON tĩnh public trong /assets/json/
 *
 * URL: /api/data?cat=HHT
 *      /api/data?cat=LLCT
 *
 * Bảo vệ nhẹ: chỉ trả data khi Referer/Origin cùng host với site
 * (chặn được truy cập trực tiếp/curl thô, không chặn được scraper cố ý
 *  giả header — với web tĩnh trên browser không có cách nào chặn tuyệt đối)
 */

export const config = { runtime: 'edge' };

const DATASETS = {
  "HHT": [
    {
      "id": 1,
      "question": "Hà Huy Tập bị xử bắn cùng với những ai?",
      "answer": "Tất cả các đáp án trên (Nguyễn Văn Cừ, Võ Văn Tần, Nguyễn Thị Minh Khai)."
    },
    {
      "id": 2,
      "question": "Trong Ban Chỉ huy ở ngoài của Đảng, đồng chí Hà Huy Tập tham gia phụ trách lĩnh vực nào?",
      "answer": "Tuyên truyền và lý luận."
    },
    {
      "id": 3,
      "question": "Đồng chí Hà Huy Tập giữ chức Tổng Bí thư trong khoảng thời gian nào?",
      "answer": "1936 – 1938."
    },
    {
      "id": 4,
      "question": "Những năm hoạt động tại Sài Gòn, đồng chí Hà Huy Tập đã tham gia dạy học tại trường nào?",
      "answer": "An Nam học đường."
    },
    {
      "id": 5,
      "question": "Đồng chí Hà Huy Tập từng dạy học tại trường học nào ở Vinh (nay là phường Thành Vinh, tỉnh Nghệ An)?",
      "answer": "Cao Xuân Dục."
    },
    {
      "id": 6,
      "question": "Trong thời kỳ 1936 – 1938, đồng chí Hà Huy Tập trực tiếp chỉ đạo hoạt động cơ quan ngôn luận nào của Đảng?",
      "answer": "Báo L’Avant và Le Peuple."
    },
    {
      "id": 7,
      "question": "Ngày 26/7/1936, đồng chí Hà Huy Tập cùng Lê Hồng Phong đồng chủ trì Hội nghị lần thứ 2 Trung ương Đảng tại địa điểm nào?",
      "answer": "Thượng Hải (Trung Quốc)."
    },
    {
      "id": 8,
      "question": "Ban Chỉ huy ở ngoài của Đảng Cộng sản Đông Dương được thành lập gồm những đồng chí nào?",
      "answer": "Lê Hồng Phong, Hà Huy Tập, Nguyễn Văn Dựt."
    },
    {
      "id": 9,
      "question": "Ngày 02/5/1941, đồng chí Hà Huy Tập viết gì gửi gia đình?",
      "answer": "Thư vĩnh biệt."
    },
    {
      "id": 10,
      "question": "Trong thời gian hoạt động ở nước ngoài, Hà Huy Tập chủ yếu nghiên cứu vấn đề gì?",
      "answer": "Vấn đề dân tộc và thuộc địa."
    },
    {
      "id": 11,
      "question": "Chi tiết nào dưới đây cho thấy đồng chí Hà Huy Tập không chỉ là nhà hoạt động thực tiễn mà còn là một nhà lý luận của Đảng?",
      "answer": "Nghiên cứu sâu lý luận Mác – Lênin, dự thảo văn kiện của Đảng và viết nhiều tác phẩm lý luận."
    },
    {
      "id": 12,
      "question": "Năm 1919, đồng chí Hà Huy Tập thi đậu vào trường nào?",
      "answer": "Quốc học Huế."
    },
    {
      "id": 13,
      "question": "Sự hy sinh của Hà Huy Tập có ý nghĩa gì đối với cách mạng Việt Nam?",
      "answer": "Cổ vũ tinh thần đấu tranh và củng cố niềm tin cách mạng."
    },
    {
      "id": 14,
      "question": "Khu mộ đồng chí hiện được đặt trên đồi nào của Hà Tĩnh?",
      "answer": "Đồi Đồng Lem."
    },
    {
      "id": 15,
      "question": "Đóng góp quan trọng của Hà Huy Tập đối với Đảng là gì?",
      "answer": "Củng cố tổ chức và hệ thống lý luận của Đảng."
    },
    {
      "id": 16,
      "question": "Cuốn “Sơ thảo lịch sử phong trào Cộng sản ở Đông Dương” được đồng chí Hà Huy Tập tập trung viết trong thời gian nào?",
      "answer": "Sau khi quay trở lại Liên Xô năm 1932."
    },
    {
      "id": 17,
      "question": "Đại hội Đảng lần thứ I có bao nhiêu đại biểu tham dự Đại hội?",
      "answer": "13."
    },
    {
      "id": 18,
      "question": "Hài cốt đồng chí được đưa về an táng tại tỉnh nào?",
      "answer": "Hà Tĩnh."
    },
    {
      "id": 19,
      "question": "Ngày 12/10/1936, tại Hội nghị cán bộ Trung ương, đồng chí Hà Huy Tập được bầu giữ chức vụ gì?",
      "answer": "Tổng Bí thư."
    },
    {
      "id": 20,
      "question": "Trong bức thư vĩnh biệt gửi gia đình và bạn hữu trước khi hy sinh, đồng chí Hà Huy Tập đã nhắn nhủ điều gì về tâm thế của người cộng sản",
      "answer": "Nên xem tôi như người còn sống nhưng đi vắng vô hạn."
    },
    {
      "id": 21,
      "question": "Việc đồng chí Hà Huy Tập vừa hoạt động trong nước vừa liên hệ với Quốc tế Cộng sản cho thấy đặc điểm nào của cách mạng Việt Nam thời kỳ này?",
      "answer": "Có sự kết hợp giữa yếu tố trong nước và quốc tế."
    },
    {
      "id": 22,
      "question": "Thực dân Pháp kết án tử hình Hà Huy Tập với lý do gì?",
      "answer": "Có trách nhiệm tinh thần với cuộc khởi nghĩa Nam Kỳ."
    },
    {
      "id": 23,
      "question": "Ý nghĩa lớn nhất của việc khôi phục tổ chức Đảng sau giai đoạn 1931–1935 là gì?",
      "answer": "Tạo điều kiện cho cách mạng tiếp tục phát triển."
    },
    {
      "id": 24,
      "question": "Đồng chí Hà Huy Tập sinh ra trong gia đình thuộc tầng lớp nào?",
      "answer": "Gia đình nhà Nho yêu nước."
    },
    {
      "id": 25,
      "question": "Năm 1929, đồng chí Hà Huy Tập đã đi sang nước nào để tham gia học tập?",
      "answer": "Liên Xô."
    },
    {
      "id": 26,
      "question": "Cuốn “Sơ thảo lịch sử phong trào Cộng sản ở Đông Dương” được viết bằng ngôn ngữ nào?",
      "answer": "Tiếng Pháp."
    },
    {
      "id": 27,
      "question": "Ngay sau khi về nước đầu tháng 8/1936, đồng chí Hà Huy Tập đã quyết định chuyển trụ sở của Đảng về địa điểm nào?",
      "answer": "Bà Điểm – Hóc Môn."
    },
    {
      "id": 28,
      "question": "Phong trào dân chủ 1936–1939 ở Đông Dương chịu ảnh hưởng của phong trào nào trên thế giới?",
      "answer": "Phong trào chống phát xít."
    },
    {
      "id": 29,
      "question": "Hội nghị Trung ương vào tháng 7/1936 do đồng chí Hà Huy Tập cùng đồng chí Lê Hồng Phong chủ trì đã xác định nhiệm vụ trước mắt của cách mạng Đông Dương là gì?",
      "answer": "Đấu tranh đòi dân sinh dân chủ."
    },
    {
      "id": 30,
      "question": "Trong giai đoạn 1936 - 1938, Trung ương Đảng chủ trương đấu tranh theo hình thức nào?",
      "answer": "Công khai, hợp pháp và nửa hợp pháp."
    },
    {
      "id": 31,
      "question": "Trong thời gian học tập ở Liên Xô, đồng chí Hà Huy Tập nghiên cứu sâu lý luận của ai về vấn đề dân tộc và thuộc địa?",
      "answer": "Vladimir Lenin."
    },
    {
      "id": 32,
      "question": "Ngày 30/3/1940, đồng chí Hà Huy Tập bị quân địch giam cầm tại đâu?",
      "answer": "Khám Lớn Sài Gòn."
    },
    {
      "id": 33,
      "question": " Ngày 01/5/1938, đồng chí Hà Huy Tập bị bắt trong hoàn cảnh nào?",
      "answer": "Khi chỉ đạo phong trào đấu tranh nhân ngày Quốc tế Lao động."
    },
    {
      "id": 34,
      "question": "Đồng chí Hà Huy Tập đã học tại trường nào của Quốc tế Cộng sản?",
      "answer": "Đại học Phương Đông."
    },
    {
      "id": 35,
      "question": "Một trong những ý nghĩa lớn của phong trào 1936 -1939 mà Hà Huy Tập tham gia lãnh đạo là gì?",
      "answer": "Mở rộng lực lượng cách mạng và nâng cao nhận thức quần chúng."
    },
    {
      "id": 36,
      "question": "Đầu năm 1932, Quốc tế Cộng sản đã giao nhiệm vụ cho đồng chí Hà Huy Tập và các thành viên dự thảo văn kiện quan trọng nào?",
      "answer": "Chương trình hành động của Đảng Cộng sản Đông Dương."
    },
    {
      "id": 37,
      "question": "Sau khi ra tù năm 1939, đồng chí Hà Huy Tập bị đưa về đâu để quản thúc?",
      "answer": "Nghệ Tĩnh."
    },
    {
      "id": 38,
      "question": "Hài cốt của đồng chí Hà Huy Tập đã được tìm thấy tại đâu?",
      "answer": "Hóc Môn, Thành phố Hồ Chí Minh."
    },
    {
      "id": 39,
      "question": "Trước tòa án thực dân, đồng chí Hà Huy Tập đã tuyên bố điều gì?",
      "answer": "Tôi chẳng có gì phải hối tiếc. Nếu còn sống, tôi vẫn tiếp tục hoạt động."
    },
    {
      "id": 40,
      "question": "Mùa thu năm 1925, đồng chí Hà Huy Tập gia nhập tổ chức nào?",
      "answer": "Hội Phục Việt."
    },
    {
      "id": 41,
      "question": "Tác phẩm nào của đồng chí Nguyễn Ái Quốc có ảnh hưởng lớn đến tư tưởng và tinh thần cách mạng của đồng chí Hà Huy Tập?",
      "answer": "Đường Kách Mệnh."
    },
    {
      "id": 42,
      "question": "Việc đồng chí Hà Huy Tập mở lớp học cho công nhân, nông dân và tiểu tư sản nhưng thực chất là tuyên truyền cách mạng cho thấy điều gì?",
      "answer": "Sự linh hoạt, sáng tạo trong phương thức vận động quần chúng."
    },
    {
      "id": 43,
      "question": "Ngày 26/7/1936, đồng chí Hà Huy Tập cùng Lê Hồng Phong đồng chủ trì Hội nghị lần thứ 2 Trung ương Đảng tại Thượng Hải (Trung Quốc), quyết định nội dung gì?",
      "answer": "Những vấn đề cơ bản chỉ đạo chiến lược và sách lược mới của Đảng trong thời kỳ mới."
    },
    {
      "id": 44,
      "question": "Tháng 3/1938, ai được bầu làm Tổng Bí thư thay đồng chí Hà Huy Tập?",
      "answer": "Nguyễn Văn Cừ."
    },
    {
      "id": 45,
      "question": "Đại hội Đảng lần thứ I được tổ chức ở đâu?",
      "answer": "Ma Cao."
    },
    {
      "id": 46,
      "question": "Bút danh của đồng chí Hà Huy Tập khi viết cuốn “Sơ thảo lịch sử phong trào Cộng sản ở Đông Dương” là gì?",
      "answer": "Hồng Thế Công."
    },
    {
      "id": 47,
      "question": "Đóng góp to lớn của đồng chí Hà Huy Tập đối với Đảng trong giai đoạn 1931 - 1935 là gì?",
      "answer": "Trực tiếp chỉ đạo và chuẩn bị các văn kiện để khôi phục hệ thống tổ chức Đảng sau thời kỳ thoái trào, tổ chức thành công Đại hội I của Đảng."
    },
    {
      "id": 48,
      "question": "Trong bức thư vĩnh biệt gửi gia đình và bạn hữu trước khi hy sinh, đồng chí Hà Huy Tập đã nhắn nhủ điều gì về tâm thế của người cộng sản?",
      "answer": "Nên xem tôi như người còn sống nhưng đi vắng vô hạn."
    },
    {
      "id": 49,
      "question": "Từ ngày 13 đến 14/3/1937, đồng chí Hà Huy Tập đã chủ trì Hội nghị BCH Trung ương lần thứ mấy?",
      "answer": "Lần thứ hai."
    },
    {
      "id": 50,
      "question": "Cuối tháng 12/1928, Hà Huy Tập rời Sài Gòn sang Quảng Châu và tìm cách bắt liên lạc với tổ chức nào để bàn việc hợp nhất?",
      "answer": "Hội Việt Nam Cách mạng Thanh niên."
    },
    {
      "id": 51,
      "question": "Sau khi tốt nghiệp năm 1923, đồng chí Hà Huy Tập đã dạy học ở đâu?",
      "answer": "Nha Trang."
    },
    {
      "id": 52,
      "question": " Ngày 28/8/1941, đồng chí Hà Huy Tập bị xử bắn tại địa điểm nào?",
      "answer": "Hóc Môn."
    },
    {
      "id": 53,
      "question": "Khi đối mặt với án tử hình tại pháp trường Ngã tư Giếng Nước vào ngày 28/8/1941, đồng chí vẫn giữ vững khí tiết, hô vang khẩu hiệu nào?",
      "answer": "Cách mạng muôn năm!"
    },
    {
      "id": 54,
      "question": "Ban Chỉ huy ở ngoài của Đảng Cộng sản Đông Dương được thành lập năm nào?",
      "answer": "1934."
    },
    {
      "id": 55,
      "question": "Đại hội Đảng lần thứ I tổ chức năm nào?",
      "answer": "1935."
    },
    {
      "id": 56,
      "question": "Đồng chí Hà Huy Tập sinh ngày tháng năm nào?",
      "answer": "24/4/1906."
    }
  ],
  "LLCT": [
    {
      "id": 1,
      "question": "Tư tưởng Hồ Chí Minh là “kết quả của sự vận dụng và phát triển sáng tạo … vào điều kiện cụ thể của nước ta”. Hãy điền vào chỗ trống.",
      "answer": "Chủ nghĩa Mác – Lênin."
    },
    {
      "id": 2,
      "question": "Phong trào “Ba sẵn sàng” và “Năm xung phong” được phát động, triển khai trong nhiệm kỳ Đại hội Đoàn toàn quốc lần thứ mấy?",
      "answer": "Đại hội III."
    },
    {
      "id": 3,
      "question": "Theo Hồ Chí Minh, Nhà nước mà chúng ta xây dựng là Nhà nước nào?",
      "answer": "Nhà nước pháp quyền của dân, do dân và vì dân."
    },
    {
      "id": 4,
      "question": "Điền vào chỗ trống để thấy được mối quan hệ của Đoàn đối với Đảng: Đoàn là … của Đảng, đội quân xung kích cách mạng phấn đấu vì mục tiêu lý tưởng của Đảng.",
      "answer": "Đội dự bị tin cậy."
    },
    {
      "id": 5,
      "question": "Đoàn TNCS Hồ Chí Minh được thành lập vào ngày tháng năm nào?",
      "answer": "26/3/1931."
    },
    {
      "id": 6,
      "question": "Thực dân Pháp nổ súng xâm lược nước ta vào thời gian nào?",
      "answer": "Ngày 1 – 9 – 1858."
    },
    {
      "id": 7,
      "question": "Hội Việt Nam cách mạng Thanh niên được thành lập vào thời gian nào?",
      "answer": "Tháng 6/1925."
    },
    {
      "id": 8,
      "question": "Trong hệ thống chính trị Việt Nam, Đoàn TNCS Hồ Chí Minh giữ vị trí như thế nào?",
      "answer": "Là thành viên của hệ thống chính trị."
    },
    {
      "id": 9,
      "question": "Bí thư thứ nhất đầu tiên của Đoàn TNCS Hồ Chí Minh là đồng chí nào?",
      "answer": "Đồng chí Nguyễn Lam."
    },
    {
      "id": 10,
      "question": "Điền vào chỗ trống từ còn thiếu: “Đoàn bao gồm những thanh niên …, phấn đấu vì mục đích, lý tưởng của Đảng là độc lập dân tộc gắn liền với chủ nghĩa xã hội, dân giàu, nước mạnh, dân chủ, công bằng, văn minh”.",
      "answer": "Tiên tiến."
    },
    {
      "id": 11,
      "question": "Theo Hồ Chí Minh, tổ chức lực lượng vũ trang gồm các thứ quân?",
      "answer": "Cả 3 đáp án đều đúng."
    },
    {
      "id": 12,
      "question": "Phong trào đấu tranh giải phóng dân tộc Việt Nam của Đội Cấn đại diện cho giai cấp, tầng lớp nào trong xã hội Việt Nam lúc bấy giờ?",
      "answer": "Binh sỹ."
    },
    {
      "id": 13,
      "question": "Một trong những nguyên tắc đổi mới hệ thống chính trị Việt Nam trong giai đoạn hiện nay là?",
      "answer": "Phải bảo đảm ổn định chính trị, phát triển kinh tế - xã hội bền vững."
    },
    {
      "id": 14,
      "question": "Bài ca chính thức của Đoàn có tên là gì?",
      "answer": "Thanh niên làm theo lời Bác."
    },
    {
      "id": 15,
      "question": "Nguồn gốc quan trọng nhất hình thành tư tưởng Hồ Chí Minh là?",
      "answer": "Chủ nghĩa Mác – Lênin."
    },
    {
      "id": 16,
      "question": "Nguyễn Ái Quốc tham gia Đảng Xã hội Pháp, một chính đảng tiến bộ ở Pháp lúc đó vào thời gian nào?",
      "answer": "Năm 1919."
    },
    {
      "id": 17,
      "question": "Theo chủ nghĩa Mác - Lênin, sứ mệnh lịch sử toàn thế giới của giai cấp công nhân là gì?",
      "answer": "Lật đổ chủ nghĩa tư bản xây dựng xã hội mới - xã hội chủ nghĩa."
    },
    {
      "id": 18,
      "question": "Điều lệ vắn tắt của Đảng Cộng sản Việt Nam được thông qua tại hội nghị nào của Đảng?",
      "answer": "Hội nghị hợp nhất ba tổ chức cộng sản năm 1930."
    },
    {
      "id": 19,
      "question": "Bộ phận nào cấu thành của chủ nghĩa Mác - Lênin?",
      "answer": "Cả 3 đáp án đều đúng."
    },
    {
      "id": 20,
      "question": "Đoàn TNCS Hồ Chí Minh tổ chức và hoạt động theo nguyên tắc nào?",
      "answer": "Tập trung dân chủ."
    },
    {
      "id": 21,
      "question": "Sự kiện nào đánh dấu nhân dân ta đã kết thúc cuộc kháng chiến chống Mỹ cứu nước giải phóng miền Nam, thống nhất đất nước?",
      "answer": "Cuộc Tổng tiến công nổi dậy mùa xuân 1975 với chiến dịch Hồ Chí Minh lịch sử năm 1975."
    },
    {
      "id": 22,
      "question": "Đoàn TNCS Hồ Chí Minh giữ vai trò như thế nào trong tổ chức và hoạt động của Hội LHTN Việt Nam, Hội Sinh viên Việt Nam",
      "answer": "Nòng cốt chính trị."
    },
    {
      "id": 23,
      "question": "Phong trào “Tuổi trẻ sáng tạo” được phát động tại Đại hội Đoàn toàn quốc lần thứ mấy?",
      "answer": "Lần thứ XI."
    },
    {
      "id": 24,
      "question": "Tháng 3/1929, tại Việt Nam đã diễn ra sự kiện tiêu biểu nào?",
      "answer": "Chi bộ Cộng sản đầu tiên ở Việt Nam ra đời."
    },
    {
      "id": 25,
      "question": "Điền vào chỗ trống để hoàn thiện câu thơ sau của Hồ Chí Minh: “Gốc có vững cây mới bền/Xây lầu thắng lợi trên nền …”",
      "answer": "Nhân dân."
    },
    {
      "id": 26,
      "question": "Sự kiện nào đánh dấu mở ra kỷ nguyên độc lập, tự do, tiến lên chủ nghĩa xã hội của dân tộc ta?",
      "answer": "Cách mạng tháng Tám 1945 thành công, Nhà nước Việt Nam Dân chủ cộng hòa ra đời."
    },
    {
      "id": 27,
      "question": "Dưới tác động của chính sách khai thác thuộc địa của thực dân Pháp, về tính chất xã hội, xã hội Việt Nam đã có biến chuyển sâu sắc gì?",
      "answer": "Từ xã hội phong kiến thành xã hội thuộc địa nửa phong kiến."
    },
    {
      "id": 28,
      "question": "Thành tố nào là hạt nhân lãnh đạo trong hệ thống chính trị Việt Nam?",
      "answer": "Đảng Cộng sản Việt Nam."
    },
    {
      "id": 29,
      "question": "Hội nghị hợp nhất ba tổ chức cộng sản (Đông Dương Cộng sản Đảng, An Nam Cộng sản Đảng và Đông Dương Cộng sản Liên đoàn) dưới sự chỉ trì của Lãnh tụ Nguyễn Ái Quốc diễn ra vào thời gian nào?",
      "answer": "Từ ngày 6/1/1930 đến ngày 7/2/1930."
    },
    {
      "id": 30,
      "question": "Sự ra đời của Đảng Cộng sản Việt Nam gắn liền với tên tuổi của lãnh tụ nào (người sáng lập, lãnh đạo và rèn luyện Đảng ta)?",
      "answer": "Nguyễn Ái Quốc - Hồ Chí Minh."
    },
    {
      "id": 31,
      "question": " Trong giai đoạn 1936-1939, Đoàn mang tên gọi là gì?",
      "answer": "Đoàn Thanh niên Dân chủ Đông Dương."
    },
    {
      "id": 32,
      "question": "Người đứng đầu Chính phủ là ai?",
      "answer": "Thủ tướng Chính phủ."
    },
    {
      "id": 33,
      "question": "Phong trào đấu tranh giải phóng dân tộc Việt Nam của Hoàng Hoa Thám đại diện cho giai cấp, tầng lớp nào trong xã hội Việt Nam lúc bấy giờ?",
      "answer": "Nông dân."
    },
    {
      "id": 34,
      "question": "",
      "answer": ""
    },
    {
      "id": 35,
      "question": "",
      "answer": ""
    },
    {
      "id": 36,
      "question": "",
      "answer": ""
    },
    {
      "id": 37,
      "question": "",
      "answer": ""
    }
  ]
};

function isSameOrigin(req, host) {
    const referer = req.headers.get('referer') || '';
    const origin  = req.headers.get('origin')  || '';
    try {
        if (referer && new URL(referer).host === host) return true;
    } catch {}
    try {
        if (origin && new URL(origin).host === host) return true;
    } catch {}
    return false;
}

export default async function handler(req) {
    const url = new URL(req.url);
    const cat = (url.searchParams.get('cat') || '').toUpperCase();

    const headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
    };

    if (!isSameOrigin(req, url.host)) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers });
    }

    if (!DATASETS[cat]) {
        return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
    }

    return new Response(JSON.stringify(DATASETS[cat]), { status: 200, headers });
}
