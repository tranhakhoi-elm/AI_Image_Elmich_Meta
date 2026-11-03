// Người dùng tự chọn "tầng" model tạo ảnh cho mỗi lượt tạo/sửa ảnh:
// FLASH = gemini-3.1-flash-image (rẻ, nhanh), PRO = gemini-3-pro-image (đắt hơn, chất lượng cao hơn).
export type ImageModelTier = "FLASH" | "PRO";
export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9" | "1:4" | "4:1";
export type ImageSize = "1K" | "2K" | "4K";
export type VisualStyle = "CONCEPT" | "TECH_PS" | "COLOR_CHANGE" | "PACKAGING_MOCKUP" | "TECH_EFFECTS" | "WHITE_BG_RETOUCH" | "SCENE_STAGING" | "STUDIO" | "TRACK_SOCKET_STAGING" | "LINE_ART" | "3D_TO_REAL_WHITE_BG" | "BARCODE_QR_GENERATOR" | "PACKAGING_CHECK" | "TRACING_ASSISTANT" | "TRANSLATE_PACKAGING";

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  imageUrl?: string;
  uploadedImageUrl?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
}

export interface CameraSettings {
  angle: number; // -15 to 90
  focalLength: number; // 12 to 200
  aperture: string;
  iso: string;
  isMacro: boolean;
}

export type SurfaceFinish = 'MATTE' | 'GLOSSY' | 'METALLIC' | 'SATIN' | 'INOX_POLISHED' | 'INOX_BRUSHED';

export interface ColorChangeEntry {
  id?: string;
  partName: string;
  targetRgb?: { r: number; g: number; b: number };
  targetHex?: string;
  finish?: SurfaceFinish;
  description?: string;
  pin?: { x: number; y: number }; // Percentage (0 - 100) on product image
  region?: { x: number; y: number; width: number; height: number }; // Bounding box percentage (0 - 100)
  sampleImage?: string;
  pantoneCode?: string;
}

export interface ProductDimensions {
  length: string;
  width: string;
  height: string;
}

// Packaging specific types
export type PackagingMaterial = "COLOR_BOX" | "CARTON_BW";
export type PackagingDesignType = "FLAT_DESIGN" | "FACES_DESIGN";
export type PackagingOutputStyle = "WHITE_BG_ROTATED" | "CONTEXTUAL";
export type PackagingHandleType = "PLASTIC_CLEAR" | "PLASTIC_OPAQUE" | "ROPE_RIBBON" | "NONE";
export type PackagingMockupLayout = "SEPARATE_VIEWS" | "DUAL_FRONT_BACK" | "FRONT_ONLY" | "BACK_ONLY";
export type PackagingPaperSubstrate = "IVORY_DUPLEX_COATED" | "KRAFT_CORRUGATED" | "MATTE_ART_PAPER";

export interface DielineStructureAnalysis {
  boxType?: string;
  frontPanelDescription?: string;
  backPanelDescription?: string;
  sidePanelsDescription?: string;
  topPanelDescription?: string;
  hasHandleSlots?: boolean;
  detectedHandleType?: PackagingHandleType;
  foldingGuidance?: string;
  detectedPanels?: string[];
  confidenceScore?: number;
}

export interface FaceRegionRect {
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  width: number; // percentage (0 - 100)
  height: number; // percentage (0 - 100)
}

export interface PackagingFaceRegions {
  front?: FaceRegionRect;
  back?: FaceRegionRect;
  left?: FaceRegionRect;
  right?: FaceRegionRect;
  top?: FaceRegionRect;
}

export interface PackagingFaces {
  flat?: string;
  front?: string;
  back?: string;
  left?: string;
  right?: string;
  top?: string;
}

// Tech Effects specific types
export type TechEffectType = "REMOVE_SIGNATURE" | "SEA_TECH_GENERATION";

// New White BG Retouch specific types
export type ProductMaterial = "MATTE" | "GLASS" | "STAINLESS_STEEL" | "GLOSSY";

export type EmptySpacePosition = "TOP" | "BOTTOM" | "LEFT" | "RIGHT" | "NONE";

export interface TrackSocketConfig {
  id: string;
  image: string;
  quantity: number;
  applianceNote: string;
}

export interface PropConfig {
  name: string;
  size?: 'small' | 'medium' | 'large' | 'auto';
  position?: 'left' | 'right' | 'front' | 'back' | 'background' | 'foreground' | 'auto';
  rotation?: 'tilted' | 'upright' | 'flat' | 'auto';
  amount?: string | number;
}

export interface SuccessfulPrompt {
  id: string;
  imageSettings: GenerationSettings;
  timestamp: number;
}

export interface GenerationSettings {
  productName: string;
  productCode?: string;
  productImages: string[];
  referenceImage: string | null; // Hình ảnh gợi ý (Style Ref) hoặc ảnh gốc cho Tech Effect
  visualStyle: VisualStyle;
  techDescription: string;
  colorChanges: ColorChangeEntry[];
  dimensions: ProductDimensions;
  
  // Packaging specific fields
  packagingMaterial: PackagingMaterial;
  packagingDesignType: PackagingDesignType;
  packagingOutputStyle: PackagingOutputStyle;
  packagingFaces: PackagingFaces;
  packagingHandleType?: PackagingHandleType;
  packagingMockupLayout?: PackagingMockupLayout;
  packagingPaperSubstrate?: PackagingPaperSubstrate;
  dielineAnalysis?: DielineStructureAnalysis;
  packagingFaceRegions?: PackagingFaceRegions;

  // Tech Effects specific fields
  techEffectType: TechEffectType;
  techTitle: string; // Tiêu đề để lên ảnh
  selectedTechConcept: string; // Concept công nghệ đã chọn

  // White BG Retouch specific fields
  whiteBGCategory?: 'METAL' | 'PLASTIC' | 'GLASS' | 'CERAMIC' | 'METAL_AND_PLASTIC';
  whiteBGSelectedCategories?: string[];
  whiteBGMaterialsDescription?: string;
  whiteBGPriorityAdjustments?: string;
  whiteBGMetalConfig?: { type: string, highlight: string, shape: string };
  whiteBGPlasticConfig?: { type: string, color?: string, lighting: string };
  whiteBGGlassConfig?: { type: string, lighting: string, content: string };
  whiteBGCeramicConfig?: { surface: string, lighting: string };
  whiteBGMetalAndPlasticConfig?: { metalParts: string, plasticParts: string, lighting: string };
  
  productMaterial: ProductMaterial;

  // Studio specific fields
  emptySpacePosition: EmptySpacePosition[];

  // Track & Socket specific fields
  trackImage?: string;
  sockets?: TrackSocketConfig[];
  trackSocketMode?: 'CREATIVE' | 'REFERENCE';

  conceptTitle?: string;
  concept: string; // Ý tưởng đã chốt
  placement: string; // Vị trí và tỷ lệ sản phẩm
  location: string; // (Vẫn giữ cho các mode khác, nhưng Concept sẽ dùng logic riêng)
  camera: CameraSettings;
  props: PropConfig[]; // Đạo cụ đã chọn
  tone: string;
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  imageModel: ImageModelTier;
  numImages: number;
}

export interface ConceptSuggestion {
  title: string;
  prompt: string;
  props?: string[];
  placement?: string;
}

export interface AIConceptAnalysis {
  concepts: ConceptSuggestion[]; // 5 ý tưởng
  suggestedCamera: CameraSettings; // Gợi ý camera dựa trên sản phẩm
}

export interface AISuggestions {
  concepts: ConceptSuggestion[];
  locations: string[];
  props: string[];
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  settings: GenerationSettings;
  variant: number;
}

export enum AppState {
  READY = 'READY',
  GENERATING = 'GENERATING',
  ANALYZING = 'ANALYZING'
}
export interface PackagingStandardParam {
  key: string;
  value: string;
}

export interface PackagingCheckResult {
  key: string;
  expected: string;
  actual: string;
  match: boolean;
  notes: string;
}

export interface QrCheckResult {
  detectedUrl: string;
  isValid: boolean;
  expectedSku: string;
}
