/**
 * MA TRẬN ĐẠO CỤ STUDIO CHUẨN 10 NGÀNH HÀNG ELMICH
 * Định hướng nghệ thuật: European Contemporary High-End Minimalism
 * Phương pháp thị giác: Monochromatic / Tone-sur-tone / Sculptural Still-life
 * Tỉ lệ phân cấp: 70% Hero Appliance - 20% Architectural Plinth & Sensory Art - 10% Minimalist Artifacts
 */

export interface PropPreset {
  id: string;
  title: string;
  description: string;
  plinth: string;
  sensory: string[];
  utensil?: string;
}

export interface ElmichCategoryDefinition {
  id: string;
  numericId: number;
  name: string;
  englishName: string;
  icon: string;
  keywords: string[];
  tone: string; // Tông màu tone-sur-tone chuẩn châu Âu
  lightingMood: string; // Ánh sáng điêu khắc studio chuyên biệt
  plinths: string[]; // 20% Bục & Khối hình học (Architectural Plinth)
  sensory: string[]; // 20% Giác quan & Nghệ thuật ẩm thực (Sensory Art)
  utensils: string[]; // 10% Hiện vật thiết kế tối giản (Design Artifacts)
  negativeRules: string[]; // Bộ lọc loại trừ cấm kỵ (Negative Props)
  presets: PropPreset[];
}

export const ELMICH_ART_DIRECTION = {
  brand: "Elmich",
  philosophy: "European Contemporary High-End Minimalism",
  visual_methodology: "Monochromatic / Tone-sur-tone / Sculptural Still-life",
  ratio_rule: "70% Hero Appliance - 20% Architectural Plinth & Sensory Art - 10% Minimalist Artifacts"
};

export const ELMICH_PROP_MATRIX: ElmichCategoryDefinition[] = [
  // 1. NỒI & CHẢO
  {
    id: 'COOKWARE',
    numericId: 1,
    name: 'Nồi & chảo',
    englishName: 'Cookware & Frypans',
    icon: '🍳',
    keywords: ['nồi', 'chảo', 'quánh', 'xương', 'luộc gà', 'chống dính', 'inox 304', 'frypan', 'pot', 'saucepan', 'wok', 'hầm', 'chảo xào', 'nồi lẩu'],
    tone: 'Metallic Silver / Oatmeal Cream / Sage Green',
    lightingMood: 'Large Scrim Linear Gradient / Whisper of steam',
    plinths: [
      'Khối trụ nhôm phay xước mờ',
      'Thạch cao lì pha màu chuẩn Pantone',
      'Đá Carrara honed'
    ],
    sensory: [
      'Khối thăn bò Angus phi-lê lập phương',
      'Chanh vàng sấy thăng hoa',
      'Muối vảy Maldon'
    ],
    utensils: [
      'Bình rót dầu ô liu Borosilicate nón',
      'Cối xay tiêu gỗ sồi trụ trơn',
      'Thìa nếm inox'
    ],
    negativeRules: [
      'Khăn vải nhàu nhĩ',
      'Dầu mỡ cháy dính viền',
      'Xẻng kim loại cào xước lòng chảo'
    ],
    presets: [
      {
        id: 'cookware-angus',
        title: 'Bò Angus & Muối Vảy Maldon',
        description: 'Thăn bò Angus lập phương, muối vảy Maldon trên khối trụ nhôm phay xước mờ',
        plinth: 'Khối trụ nhôm phay xước mờ',
        sensory: [
          'Khối thăn bò Angus phi-lê lập phương',
          'Muối vảy Maldon'
        ],
        utensil: 'Bình rót dầu ô liu Borosilicate nón'
      },
      {
        id: 'cookware-pantone',
        title: 'Thạch Cao Pantone & Chanh Thăng Hoa',
        description: 'Chanh vàng sấy thăng hoa, cối tiêu gỗ sồi trên bục thạch cao lì Pantone',
        plinth: 'Thạch cao lì pha màu chuẩn Pantone',
        sensory: [
          'Chanh vàng sấy thăng hoa',
          'Muối vảy Maldon'
        ],
        utensil: 'Cối xay tiêu gỗ sồi trụ trơn'
      }
    ]
  },

  // 2. BÌNH & HỘP GIỮ NHIỆT, ẤM ĐUN
  {
    id: 'THERMAL',
    numericId: 2,
    name: 'Bình, Hộp giữ nhiệt & Ấm đun',
    englishName: 'Thermal Bottles, Kettles & Food Jars',
    icon: '🧊',
    keywords: ['ấm', 'ấm siêu tốc', 'ấm đun', 'bình đun', 'kettle', 'ấm điện', 'ấm pha trà', 'ấm rót', 'bình giữ nhiệt', 'hộp giữ nhiệt', 'cốc giữ nhiệt', 'phích', 'ly giữ nhiệt', 'thermos', 'tumbler', 'flask', 'bình nước', 'bình pha cà phê', 'bình lọc nước'],
    tone: 'Warm Sand / Smoked Sage / Titanium Silver / Matte Charcoal',
    lightingMood: 'Backlight 5600K trong vắt / Rim light tách lớp / Condensation glow',
    plinths: [
      'Khối Acrylic đục mờ tán sáng',
      'Đá sa thạch sandstone rãnh mỏng',
      'Bục tĩnh điện cùng màu'
    ],
    sensory: [
      'Làn hơi nước mỏng uốn lượn từ miệng vòi',
      'Khối đá pha lê lập phương không bọt',
      'Lát cam sấy mộc',
      'Giọt sương hoàn hảo'
    ],
    utensils: [
      'Tách gốm mộc trơn lòng',
      'Ống hút Borosilicate tối giản',
      'Khay đĩa kim loại dẹt mạ anode',
      'Đế gốm biscuit'
    ],
    negativeRules: [
      'Đá đục bọt khí',
      'Đồ văn phòng lộn xộn',
      'Vết son môi',
      'Thức ăn mỡ màng, dầu mỡ'
    ],
    presets: [
      {
        id: 'thermal-crystal-ice',
        title: 'Đá Pha Lê Không Bọt & Khối Acrylic',
        description: 'Đá pha lê lập phương không bọt, giọt sương hoàn hảo trên khối acrylic tán sáng',
        plinth: 'Khối Acrylic đục mờ tán sáng',
        sensory: [
          'Khối đá pha lê lập phương không bọt',
          'Giọt sương hoàn hảo'
        ],
        utensil: 'Ống hút Borosilicate tối giản'
      },
      {
        id: 'thermal-sandstone-citrus',
        title: 'Sa Thạch Rãnh Mỏng & Cam Sấy Mộc',
        description: 'Lát cam sấy mộc, khay đĩa mạ anode trên đá sa thạch sandstone rãnh mỏng',
        plinth: 'Đá sa thạch sandstone rãnh mỏng',
        sensory: [
          'Lát cam sấy mộc',
          'Giọt sương hoàn hảo'
        ],
        utensil: 'Khay đĩa kim loại dẹt mạ anode'
      }
    ]
  },

  // 3. MÁY XAY, MÁY ÉP TRÁI CÂY
  {
    id: 'BLENDERS_JUICERS',
    numericId: 3,
    name: 'Máy xay, Máy ép trái cây',
    englishName: 'Blenders & Juicers',
    icon: '🍊',
    keywords: ['máy xay', 'máy ép', 'máy làm sữa hạt', 'cối xay', 'blender', 'juicer', 'smoothie', 'máy ép chậm', 'máy vắt'],
    tone: 'Emerald Green / Pure White / Terracotta',
    lightingMood: 'Transmitted Backlight xuyên cối / High-speed freeze',
    plinths: [
      'Bục thạch cao trụ tròn trắng mờ',
      'Đĩa thủy tinh dày',
      'Mặt đá cẩm thạch honed'
    ],
    sensory: [
      'Nửa quả bưởi ruby lộ tép mọng',
      'Cọng cần tây gọt xơ phẳng',
      'Giọt nước ép treo tĩnh'
    ],
    utensils: [
      'Ly thủy tinh 2 lớp không quai',
      'Đũa khuấy thủy tinh đặc',
      'Phễu Borosilicate chóp nón'
    ],
    negativeRules: [
      'Hoa quả dập thâm',
      'Vỏ vụn rác bẩn',
      'Bọt khí đục',
      'Cối dính vân tay'
    ],
    presets: [
      {
        id: 'blender-ruby-grapefruit',
        title: 'Bưởi Ruby Lộ Tép & Thủy Tinh Dày',
        description: 'Nửa quả bưởi ruby lộ tép mọng, giọt nước ép treo tĩnh trên đĩa thủy tinh dày',
        plinth: 'Đĩa thủy tinh dày',
        sensory: [
          'Nửa quả bưởi ruby lộ tép mọng',
          'Giọt nước ép treo tĩnh'
        ],
        utensil: 'Ly thủy tinh 2 lớp không quai'
      },
      {
        id: 'blender-celery-honed',
        title: 'Cần Tây Gọt Xơ & Cẩm Thạch Honed',
        description: 'Cọng cần tây gọt xơ phẳng, đũa khuấy thủy tinh đặc trên mặt đá cẩm thạch honed',
        plinth: 'Mặt đá cẩm thạch honed',
        sensory: [
          'Cọng cần tây gọt xơ phẳng',
          'Giọt nước ép treo tĩnh'
        ],
        utensil: 'Đũa khuấy thủy tinh đặc'
      }
    ]
  },

  // 4. THIẾT BỊ NẤU NƯỚNG
  {
    id: 'COOKING_APPLIANCES',
    numericId: 4,
    name: 'Thiết bị nấu nướng',
    englishName: 'Cooking Appliances',
    icon: '⚡',
    keywords: ['nồi chiên', 'nồi cơm', 'bếp từ', 'lò nướng', 'nồi áp suất', 'air fryer', 'rice cooker', 'induction', 'oven', 'lò vi sóng', 'bếp hồng ngoại'],
    tone: 'Matte Charcoal / Pearl White / Slate Grey',
    lightingMood: 'Architectural Directional Light / Polarizer filter triệt tiêu lóa màn hình LED',
    plinths: [
      'Bục đảo bếp Terrazzo vi mô không mối nối',
      'Tấm đá Slate đen chống chói'
    ],
    sensory: [
      'Muỗng cơm hạt dài điểm vừng đen',
      'Cá hồi áp chảo phẳng lì',
      'Hơi nóng bốc nhẹ từ van'
    ],
    utensils: [
      'Muôi xới gỗ sồi bào phẳng',
      'Bát gốm men lì trũng lòng',
      'Kẹp kim loại xước mờ'
    ],
    negativeRules: [
      'Dây điện lòng thòng',
      'Thức ăn xộc xệch cháy đen',
      'Dụng cụ bếp nhựa rẻ tiền'
    ],
    presets: [
      {
        id: 'cooking-salmon-terrazzo',
        title: 'Cá Hồi Phẳng Lì & Terrazzo Vi Mô',
        description: 'Cá hồi áp chảo phẳng lì, muôi gỗ sồi bào phẳng trên bục Terrazzo vi mô không mối nối',
        plinth: 'Bục đảo bếp Terrazzo vi mô không mối nối',
        sensory: [
          'Cá hồi áp chảo phẳng lì',
          'Hơi nóng bốc nhẹ từ van'
        ],
        utensil: 'Muôi xới gỗ sồi bào phẳng'
      },
      {
        id: 'cooking-rice-slate',
        title: 'Cơm Vừng Đen & Đá Slate Đen',
        description: 'Muỗng cơm hạt dài điểm vừng đen, bát gốm men lì trũng lòng trên tấm đá Slate đen',
        plinth: 'Tấm đá Slate đen chống chói',
        sensory: [
          'Muỗng cơm hạt dài điểm vừng đen',
          'Hơi nóng bốc nhẹ từ van'
        ],
        utensil: 'Bát gốm men lì trũng lòng'
      }
    ]
  },

  // 5. CHĂM SÓC NHÀ CỬA
  {
    id: 'HOME_CARE',
    numericId: 5,
    name: 'Chăm sóc nhà cửa',
    englishName: 'Home Care',
    icon: '✨',
    keywords: ['bàn ủi', 'bàn là', 'hút bụi', 'cây lau', 'lau nhà', 'vacuum', 'iron', 'steamer', 'mop', 'máy hút bụi cầm tay'],
    tone: 'Porcelain White / Warm Grey / Soft Nordic Blue',
    lightingMood: 'High-key Walk-in closet / Rim light làm nổi luồng sương áp suất',
    plinths: [
      'Bục thạch cao vòm cong mềm mại',
      'Phiến đá vôi Travertine trắng ngà'
    ],
    sensory: [
      'Vải lụa tơ tằm là phẳng lì buông nếp lơi',
      'Luồng hơi nước áp suất cao phun ngang',
      'Nhánh bông gòn'
    ],
    utensils: [
      'Móc áo gỗ dẻ gai dáng mảnh tối giản',
      'Khối gốm hình học trưng bày trơn'
    ],
    negativeRules: [
      'Quần áo nhăn nhúm rẻ tiền',
      'Sợi chỉ thừa',
      'Bụi bặm',
      'Dây cắm bừa bộn'
    ],
    presets: [
      {
        id: 'homecare-silk-steam',
        title: 'Lụa Tơ Tằm & Luồng Hơi Áp Suất',
        description: 'Vải lụa tơ tằm buông nếp lơi, luồng hơi áp suất cao và móc áo gỗ dẻ gai dáng mảnh',
        plinth: 'Bục thạch cao vòm cong mềm mại',
        sensory: [
          'Vải lụa tơ tằm là phẳng lì buông nếp lơi',
          'Luồng hơi nước áp suất cao phun ngang'
        ],
        utensil: 'Móc áo gỗ dẻ gai dáng mảnh tối giản'
      },
      {
        id: 'homecare-cotton-travertine',
        title: 'Nhánh Bông Gòn & Travertine Trắng Ngà',
        description: 'Nhánh bông gòn thanh khiết, khối gốm hình học trơn trên phiến đá vôi Travertine',
        plinth: 'Phiến đá vôi Travertine trắng ngà',
        sensory: [
          'Nhánh bông gòn',
          'Vải lụa tơ tằm là phẳng lì buông nếp lơi'
        ],
        utensil: 'Khối gốm hình học trưng bày trơn'
      }
    ]
  },

  // 6. CHĂM SÓC CÁ NHÂN
  {
    id: 'PERSONAL_CARE',
    numericId: 6,
    name: 'Chăm sóc cá nhân',
    englishName: 'Personal Care',
    icon: '🌸',
    keywords: ['máy sấy', 'bàn chải điện', 'rửa mặt', 'hair dryer', 'toothbrush', 'beauty', 'máy tạo kiểu tóc', 'tăm nước'],
    tone: 'Champagne Gold / Dusty Rose / Matte Titanium',
    lightingMood: 'Beauty Softbox cực mềm / Chuyển bóng mượt tôn vinh bề mặt nhám satin',
    plinths: [
      'Khối Acrylic mặt gợn sóng nước',
      'Bục gốm men mờ màu nude',
      'Cẩm thạch bo cong'
    ],
    sensory: [
      'Lọn tóc bóng khỏe uốn lượn mượt',
      'Dao động bọt nước tần số cao',
      'Giọt serum lơ lửng'
    ],
    utensils: [
      'Lọ serum thủy tinh mờ',
      'Khay kim loại mạ satin hình hạt đậu',
      'Lược gỗ sừng răng thưa'
    ],
    negativeRules: [
      'Tóc rụng',
      'Vết nước ố trên gương',
      'Bàn chải tòe lông',
      'Chai lọ mỹ phẩm tạp'
    ],
    presets: [
      {
        id: 'personal-hair-wave',
        title: 'Lọn Tóc Bóng Khỏe & Acrylic Sóng Nước',
        description: 'Lọn tóc bóng khỏe uốn lượn, lược gỗ sừng răng thưa trên khối acrylic gợn sóng',
        plinth: 'Khối Acrylic mặt gợn sóng nước',
        sensory: [
          'Lọn tóc bóng khỏe uốn lượn mượt',
          'Giọt serum lơ lửng'
        ],
        utensil: 'Lược gỗ sừng răng thưa'
      },
      {
        id: 'personal-serum-nude',
        title: 'Dao Động Nước Tần Số Cao & Gốm Nude',
        description: 'Dao động bọt nước tần số cao, khay satin hình hạt đậu trên bục gốm men mờ nude',
        plinth: 'Bục gốm men mờ màu nude',
        sensory: [
          'Dao động bọt nước tần số cao',
          'Giọt serum lơ lửng'
        ],
        utensil: 'Khay kim loại mạ satin hình hạt đậu'
      }
    ]
  },

  // 7. CHĂM SÓC TRẺ EM
  {
    id: 'BABY_CARE',
    numericId: 7,
    name: 'Chăm sóc trẻ em',
    englishName: 'Baby & Kids Care',
    icon: '🍼',
    keywords: ['nấu cháo', 'nấu chậm', 'ăn dặm', 'tiệt trùng', 'hâm sữa', 'baby', 'kids', 'bình thìa', 'nồi cháo'],
    tone: 'Soft Avocado / Butter Milk / Milky White',
    lightingMood: 'Soft Morning Glow 5000K ấm áp / Bóng đổ êm ái như lông vũ',
    plinths: [
      'Khối bục gỗ phong bo tròn an toàn',
      'Khối bục xốp thạch cao pastel mềm'
    ],
    sensory: [
      'Yến mạch hạt dẹt xếp rẻ quạt',
      'Quả bơ cắt hạt lựu 5x5mm đều',
      'Giọt sữa ngần đặc sánh'
    ],
    utensils: [
      'Thìa silicone y tế đúc liền',
      'Bát gốm nhỏ trũng đáy',
      'Khối gỗ mộc Montessori xa mờ'
    ],
    negativeRules: [
      'Đồ chơi nhựa màu sặc sỡ',
      'Bột nhem nhuốc ngoài viền',
      'Bình ố vàng',
      'Vật nhọn'
    ],
    presets: [
      {
        id: 'baby-oats-avocado',
        title: 'Yến Mạch Rẻ Quạt & Gỗ Phong Bo Tròn',
        description: 'Yến mạch hạt dẹt xếp rẻ quạt, quả bơ hạt lựu 5x5mm, thìa silicone y tế trên gỗ phong bo tròn',
        plinth: 'Khối bục gỗ phong bo tròn an toàn',
        sensory: [
          'Yến mạch hạt dẹt xếp rẻ quạt',
          'Quả bơ cắt hạt lựu 5x5mm đều'
        ],
        utensil: 'Thìa silicone y tế đúc liền'
      },
      {
        id: 'baby-milk-pastel',
        title: 'Giọt Sữa Ngần & Thạch Cao Pastel',
        description: 'Giọt sữa ngần đặc sánh, bát gốm nhỏ trũng đáy trên khối bục thạch cao pastel mềm',
        plinth: 'Khối bục xốp thạch cao pastel mềm',
        sensory: [
          'Giọt sữa ngần đặc sánh',
          'Yến mạch hạt dẹt xếp rẻ quạt'
        ],
        utensil: 'Bát gốm nhỏ trũng đáy'
      }
    ]
  },

  // 8. ĐỒ DÙNG SINH HOẠT & PHÒNG NGỦ
  {
    id: 'HOME_LIVING',
    numericId: 8,
    name: 'Đồ dùng sinh hoạt & Phòng ngủ',
    englishName: 'Home Living',
    icon: '🏠',
    keywords: ['hộp đựng', 'thau', 'chậu', 'chăn', 'ga', 'gối', 'móc áo', 'storage', 'organizer', 'hộp bảo quản', 'hộp thủy tinh'],
    tone: 'Smoked Navy / Light Concrete / Transparent Glass',
    lightingMood: 'Cờ đen hai bên kiểm soát phản chiếu nắp Tritan và thân thủy tinh',
    plinths: [
      'Bục kính cường lực mờ tráng gương nhẹ',
      'Khối bê tông mài phẳng lì'
    ],
    sensory: [
      'Các lớp ngũ cốc chia tầng hoàn hảo qua thủy tinh',
      'Lá bạc hà, dâu tây tươi ráo'
    ],
    utensils: [
      'Khay nhôm phay xước mờ chữ nhật',
      'Đèn bàn kiến trúc tối giản làm mờ xa'
    ],
    negativeRules: [
      'Thùng carton',
      'Thức ăn mốc hỏng',
      'Hộp thủy tinh bám vân tay hoặc trầy xước'
    ],
    presets: [
      {
        id: 'homeliving-cereal-glass',
        title: 'Ngũ Cốc Chia Tầng & Kính Tráng Gương',
        description: 'Ngũ cốc chia tầng hoàn hảo qua thủy tinh, khay nhôm phay xước mờ trên bục kính mờ',
        plinth: 'Bục kính cường lực mờ tráng gương nhẹ',
        sensory: [
          'Các lớp ngũ cốc chia tầng hoàn hảo qua thủy tinh',
          'Lá bạc hà, dâu tây tươi ráo'
        ],
        utensil: 'Khay nhôm phay xước mờ chữ nhật'
      },
      {
        id: 'homeliving-berry-concrete',
        title: 'Dâu Tây Tươi Ráo & Bê Tông Mài Phẳng',
        description: 'Dâu tây tươi ráo, đèn bàn kiến trúc tối giản làm mờ xa trên khối bê tông mài phẳng lì',
        plinth: 'Khối bê tông mài phẳng lì',
        sensory: [
          'Lá bạc hà, dâu tây tươi ráo',
          'Các lớp ngũ cốc chia tầng hoàn hảo qua thủy tinh'
        ],
        utensil: 'Đèn bàn kiến trúc tối giản làm mờ xa'
      }
    ]
  },

  // 9. PHỤ KIỆN BẾP & BÀN ĂN
  {
    id: 'KITCHEN_ACCESSORIES',
    numericId: 9,
    name: 'Phụ kiện Bếp & Bàn ăn',
    englishName: 'Kitchen Accessories',
    icon: '🔪',
    keywords: ['dao', 'thớt', 'kéo', 'đũa', 'thìa', 'muôi', 'dụng cụ gọt', 'knife', 'cutting board', 'scissors', 'bộ dao', 'cây cắm dao'],
    tone: 'Deep Slate / Dark Walnut / Satin Stainless',
    lightingMood: 'Low-key Chiaroscuro / Side raking light làm nổi bật góc vát lưỡi dao',
    plinths: [
      'Thớt gỗ đầu cây (End-grain) nguyên khối',
      'Phiến đá Slate đen nhám chống chói'
    ],
    sensory: [
      'Quả cà chua bổ đôi vết cắt phẳng lì',
      'Ớt chỉ thiên cắt vát 45 độ bén ngót',
      'Muối thô'
    ],
    utensils: [
      'Thanh liếc mài kim cương',
      'Khối cắm dao gỗ óc chó nghiêng',
      'Kẹp nhọn chef inox'
    ],
    negativeRules: [
      'Thớt nhựa cũ trầy bẩn',
      'Lưỡi dao phản chiếu bóng người',
      'Rau củ dập rỉ nước'
    ],
    presets: [
      {
        id: 'knife-tomato-endgrain',
        title: 'Cà Chua Cắt Phẳng Lì & Thớt End-Grain',
        description: 'Quả cà chua bổ đôi phẳng lì, thanh liếc mài kim cương trên thớt gỗ đầu cây nguyên khối',
        plinth: 'Thớt gỗ đầu cây (End-grain) nguyên khối',
        sensory: [
          'Quả cà chua bổ đôi vết cắt phẳng lì',
          'Muối thô'
        ],
        utensil: 'Thanh liếc mài kim cương'
      },
      {
        id: 'knife-chili-slate',
        title: 'Ớt Vát 45 Độ & Slate Đen Nhám',
        description: 'Ớt chỉ thiên cắt vát 45 độ bén ngót, kẹp nhọn chef inox trên phiến đá Slate đen chống chói',
        plinth: 'Phiến đá Slate đen nhám chống chói',
        sensory: [
          'Ớt chỉ thiên cắt vát 45 độ bén ngót',
          'Muối thô'
        ],
        utensil: 'Kẹp nhọn chef inox'
      }
    ]
  },

  // 10. PHA LÊ & THUỶ TINH
  {
    id: 'GLASS_CRYSTAL',
    numericId: 10,
    name: 'Pha Lê & Thuỷ tinh',
    englishName: 'Glass & Crystal',
    icon: '🍷',
    keywords: ['pha lê', 'thủy tinh', 'ly rượu', 'ly vang', 'cốc uống nước', 'bình thủy tinh', 'bohemia', 'crystal', 'wine glass', 'ly cocktail', 'decanter', 'thố pha lê'],
    tone: 'Liquid Black / Burgundy Red / Amber Gold',
    lightingMood: 'Edge-lit Glass (Dual Rim Lighting) tạo viền sáng kim cương trên nền đen',
    plinths: [
      'Khối đá Granite đen tuyền bóng mờ',
      'Bục kính quang học',
      'Thạch cao đen lì'
    ],
    sensory: [
      'Dải rượu vang đỏ mềm mại khi rót vào decanter',
      'Vệt chân rượu sánh',
      'Nho đen phủ phấn'
    ],
    utensils: [
      'Khui vang kim loại titan đen mờ',
      'Nút đậy decanter pha lê cầu trong suốt'
    ],
    negativeRules: [
      'Bụi bám trên ly',
      'Vết giọt nước khô',
      'Dấu vân tay',
      'Ly thủy tinh dày viền bọt khí'
    ],
    presets: [
      {
        id: 'crystal-wine-granite',
        title: 'Dải Vang Đỏ Rót & Granite Đen Tuyền',
        description: 'Dải rượu vang đỏ mềm mại rót vào decanter, khui vang titan đen mờ trên đá Granite đen bóng mờ',
        plinth: 'Khối đá Granite đen tuyền bóng mờ',
        sensory: [
          'Dải rượu vang đỏ mềm mại khi rót vào decanter',
          'Vệt chân rượu sánh'
        ],
        utensil: 'Khui vang kim loại titan đen mờ'
      },
      {
        id: 'crystal-grapes-optical',
        title: 'Nho Đen Phủ Phấn & Kính Quang Học',
        description: 'Nho đen phủ phấn, nút đậy decanter pha lê cầu trong suốt trên bục kính quang học',
        plinth: 'Bục kính quang học',
        sensory: [
          'Nho đen phủ phấn',
          'Vệt chân rượu sánh'
        ],
        utensil: 'Nút đậy decanter pha lê cầu trong suốt'
      }
    ]
  }
];

/** Tự động nhận diện ngành hàng Elmich từ tên sản phẩm */
export const detectElmichCategory = (productName: string = ''): ElmichCategoryDefinition => {
  const lower = productName.toLowerCase();
  for (const cat of ELMICH_PROP_MATRIX) {
    if (cat.keywords.some(kw => lower.includes(kw))) {
      return cat;
    }
  }
  // Mặc định trả về ngành Nồi & Chảo
  return ELMICH_PROP_MATRIX[0];
};

/** Lấy toàn bộ thông tin đạo cụ studio theo tên sản phẩm */
export const getElmichStudioProps = (productName: string = '') => {
  const cat = detectElmichCategory(productName);
  return {
    category: cat,
    tone: cat.tone,
    lightingMood: cat.lightingMood,
    plinths: cat.plinths,
    sensory: cat.sensory,
    utensils: cat.utensils,
    negativeRules: cat.negativeRules,
    presets: cat.presets
  };
};

/** Kiểm tra xem một đạo cụ có phải là Bục/Khối kiến trúc không */
export const isPlinthProp = (name: string = ''): boolean => {
  const lower = name.toLowerCase();
  return lower.includes('bục') || lower.includes('khối') || lower.includes('bậc') || 
         lower.includes('đá carrara') || lower.includes('đá slate') || lower.includes('thạch cao') || 
         lower.includes('terrazzo') || lower.includes('trụ') || lower.includes('plinth') || 
         lower.includes('bê tông') || lower.includes('travertine') || lower.includes('acrylic') ||
         lower.includes('cẩm thạch') || lower.includes('đá granite') || lower.includes('bục kính');
};

/** Kiểm tra xem một đạo cụ có phải là Hiện vật thiết kế / Dụng cụ không */
export const isUtensilProp = (name: string = ''): boolean => {
  const lower = name.toLowerCase();
  return lower.includes('bình rót') || lower.includes('cối xay') || lower.includes('thìa') || 
         lower.includes('muỗng') || lower.includes('muôi') || lower.includes('kẹp') || 
         lower.includes('ống hút') || lower.includes('khay') || lower.includes('đĩa') || 
         lower.includes('ly') || lower.includes('cốc') || lower.includes('tách') || 
         lower.includes('đũa') || lower.includes('móc') || lower.includes('lọ') || 
         lower.includes('lược') || lower.includes('thanh liếc') || lower.includes('khui') || 
         lower.includes('bát') || lower.includes('dụng cụ') || lower.includes('nút đậy') ||
         lower.includes('đèn bàn');
};

/**
 * Thuật toán chọn lọc tự động đạo cụ chuẩn Châu Âu Tối Giản (Quy tắc 70 - 20 - 10)
 * BẢO ĐẢM TUYỆT ĐỐI:
 * - Tối đa đúng 1 Bục kiến trúc duy nhất (CẤM chọn 2 hoặc 3 bục)
 * - 1 đến 2 Đạo cụ Giác quan / Ẩm thực (hơi nước, thảo mộc, chanh, giọt sương...)
 * - 0 đến 1 Hiện vật thiết kế (tách gốm, ly, muỗng gỗ...)
 */
export const selectBalancedStudioProps = (availableProps: string[] = []): string[] => {
  if (!availableProps || availableProps.length === 0) return [];
  
  const plinths: string[] = [];
  const utensils: string[] = [];
  const sensory: string[] = [];

  for (const p of availableProps) {
    if (isPlinthProp(p)) {
      plinths.push(p);
    } else if (isUtensilProp(p)) {
      utensils.push(p);
    } else {
      sensory.push(p);
    }
  }

  const selected: string[] = [];

  // 1. Chỉ chọn duy nhất 1 Bục kiến trúc (nếu có)
  if (plinths.length > 0) {
    selected.push(plinths[0]);
  }

  // 2. Chọn 1 đến 2 Đạo cụ Giác quan / Ẩm thực tươi mới
  if (sensory.length > 0) {
    selected.push(sensory[0]);
    if (sensory.length > 1 && selected.length < 2) {
      selected.push(sensory[1]);
    }
  }

  // 3. Chọn 0 đến 1 Hiện vật thiết kế
  if (utensils.length > 0 && selected.length < 3) {
    selected.push(utensils[0]);
  }

  // 4. Nếu vẫn chưa đủ 2-3 món (do danh sách ít mục), bổ sung từ sensory còn lại, TUYỆT ĐỐI KHÔNG lấy thêm bục
  for (const s of sensory) {
    if (selected.length >= 3) break;
    if (!selected.includes(s)) {
      selected.push(s);
    }
  }

  // 5. Nếu vẫn thiếu và có utensil, lấy thêm utensil
  for (const u of utensils) {
    if (selected.length >= 3) break;
    if (!selected.includes(u)) {
      selected.push(u);
    }
  }

  // Fallback an toàn: nếu chỉ có plinths trong mảng đầu vào, chỉ lấy DUY NHẤT 1 plinth
  if (selected.length === 0 && plinths.length > 0) {
    selected.push(plinths[0]);
  }

  return selected.slice(0, 3);
};

/** Lấy fallback props cho studio hoặc lifestyle chuẩn hóa theo 10 ngành hàng */
export const getFallbackPropsByProduct = (productName: string = '', mode: 'STUDIO' | 'LIFESTYLE' = 'STUDIO'): string[] => {
  const cat = detectElmichCategory(productName);
  const lower = productName.toLowerCase();

  // Xử lý đặc thù logic công năng cho Ấm siêu tốc / Bình đun nước
  if (lower.includes('ấm') || lower.includes('kettle') || lower.includes('bình đun')) {
    if (mode === 'STUDIO') {
      return [
        'Khối Acrylic đục mờ tán sáng',
        'Làn hơi nước mỏng uốn lượn từ miệng vòi',
        'Lát chanh vàng tươi mọng nước',
        'Tách gốm mộc trơn lòng',
        'Vài lá trà xanh đọng sương',
        'Giọt sương ngưng tụ thanh khiết'
      ];
    } else {
      return [
        'Mặt bàn đá thạch anh trắng mờ',
        'Làn hơi nước mỏng bốc lên từ vòi',
        'Tách trà sứ mộc bốc khói nhẹ',
        'Vài nhánh hoa cúc khô bên cạnh',
        'Ánh sáng ban mai 5000K dịu nhẹ rọi qua khung cửa sổ'
      ];
    }
  }

  if (mode === 'STUDIO') {
    return [
      cat.plinths[0] || 'Khối trụ nhôm phay xước mờ',
      ...cat.sensory,
      ...cat.utensils
    ];
  } else {
    return [
      `Mặt bàn kiến trúc phù hợp với ${cat.name}`,
      ...cat.sensory,
      ...cat.utensils,
      'Ánh sáng tự nhiên nhẹ nhàng rọi qua khung cửa sổ'
    ];
  }
};

/** Kiểm tra và đánh giá lựa chọn đạo cụ theo chuẩn European Minimalism (70% Hero - 20% Plinth & Sensory - 10% Artifacts) */
export const evaluatePropSelection = (selectedPropsCount: number): {
  isOptimal: boolean;
  statusText: string;
  badgeColor: string;
} => {
  if (selectedPropsCount === 0) {
    return {
      isOptimal: false,
      statusText: 'Chưa chọn đạo cụ (Nên chọn 1 Bục + 1-2 Giác quan)',
      badgeColor: 'text-gray-400 bg-gray-800/60 border-gray-700'
    };
  }
  if (selectedPropsCount <= 3) {
    return {
      isOptimal: true,
      statusText: `Đạt chuẩn Châu Âu Tối Giản (${selectedPropsCount}/3 đạo cụ)`,
      badgeColor: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/40'
    };
  }
  return {
    isOptimal: false,
    statusText: `Cảnh báo: ${selectedPropsCount}/3 đạo cụ (Có thể làm loãng tiêu điểm sản phẩm)`,
    badgeColor: 'text-amber-400 bg-amber-950/40 border-amber-500/40'
  };
};
