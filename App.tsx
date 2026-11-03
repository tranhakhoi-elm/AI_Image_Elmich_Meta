import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import jsQR from 'jsqr';
import { 
  Eye,
  Download,
  Camera, 
  Palette, 
  Box, 
  Zap, 
  Image as ImageIcon, 
  Eraser, 
  Sparkles, 
  Plug, 
  ChevronRight, 
  ChevronLeft,
  Check,
  Layout,
  Layers,
  Settings,
  ArrowLeft,
  Wand2,
  Loader2,
  PenTool,
  Undo2,
  Redo2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  MessageCircle,
  Send,
  X,
  ChevronDown,
  Trash2,
  QrCode,
  AlertCircle, Languages,
  BookOpen,
  Plus
} from 'lucide-react';
import { AppState, GenerationSettings, GeneratedImage, AspectRatio, ImageSize, ImageModelTier, AISuggestions, ConceptSuggestion, VisualStyle, ColorChangeEntry, CameraSettings, PackagingFaces, PropConfig, ChatMessage, SuccessfulPrompt } from './types';
import { BarcodeGenerator } from './src/components/BarcodeGenerator';
import { PackagingCheckWorkflow } from './src/components/workflows/PackagingCheckWorkflow';
import { TranslatePackagingWorkflow } from './src/components/workflows/TranslatePackagingWorkflow';
import { LineArtWorkflow } from './src/components/workflows/LineArtWorkflow';
import { PackagingMockupWorkflow } from './src/components/workflows/PackagingMockupWorkflow';
import { TechEffectsWorkflow } from './src/components/workflows/TechEffectsWorkflow';
import { Render3DToPhotoWorkflow } from './src/components/workflows/Render3DToPhotoWorkflow';
import { ColorChangeWorkflow } from './src/components/workflows/ColorChangeWorkflow';
import { WhiteBgRetouchWorkflow } from './src/components/workflows/WhiteBgRetouchWorkflow';
import { TrackSocketWorkflow } from './src/components/workflows/TrackSocketWorkflow';
import { ConceptWorkflow } from './src/components/workflows/ConceptWorkflow';
import { StudioWorkflow } from './src/components/workflows/StudioWorkflow';
import { ChatView } from './src/components/chat/ChatView';
import { HandbookModal } from './src/components/common/HandbookModal';
import { ProviderSettingsButton } from './src/components/common/ProviderSettings';
import { LockScreen } from './src/components/common/LockScreen';
import { LoadingModal } from './src/components/common/LoadingModal';
import { GalleryRail } from './src/components/common/GalleryRail';
import { FileDropzone } from './src/components/common/FileDropzone';
import { ModelSelection } from './src/components/common/ModelSelection';
import { AppHomeScreen, AppTile } from './src/components/common/AppHomeScreen';
import { HistoryView } from './src/components/history/HistoryView';
import {
  CAMERA_APERTURES,
  CAMERA_ISO,
  TONE_STYLES
} from './constants';
import { analyzePackagingContent, extractStandardParamsWithAI, generateProductImage, editProductImage, analyzeProductMaterials, getAiSuggestions, analyzeConceptAndCamera, analyzeTechConceptAndCamera, suggestPropsForConcept, getFallbackProps, suggestTechVisuals, suggestTechConcepts, analyzeStagingScene, analyzeStudioConcept, generateImageForChat, chatWithAI } from './services/geminiService';
import { logGeneratedImage, rateGeneratedImage, fetchCategoryGuidance, fetchChatHistory, deleteChatHistorySession } from './services/historyService';

// Danh sách công cụ hiển thị trên màn hình chọn công cụ (AppHomeScreen) —
// mỗi công cụ là 1 icon vuông màu đặc, giống springboard iPhone.
const APP_TOOLS: AppTile[] = [
  // Thứ tự 1-5 cố định theo yêu cầu, các phần sau tự do sắp xếp.
  { id: 'WHITE_BG_RETOUCH', icon: <ImageIcon size={30} />, title: 'Ảnh nền trắng', color: 'bg-blue-500' },
  { id: 'STUDIO', icon: <Camera size={30} />, title: 'Ảnh studio nền trơn', color: 'bg-emerald-500' },
  { id: 'CONCEPT', icon: <Layout size={30} />, title: 'Ảnh phối cảnh', color: 'bg-cyan-500' },
  { id: 'COLOR_CHANGE', icon: <Palette size={30} />, title: 'Làm màu sản phẩm', color: 'bg-purple-500' },
  { id: 'BARCODE_QR_GENERATOR', icon: <QrCode size={30} />, title: 'Tạo QR & Barcode', color: 'bg-teal-500' },
  { id: 'TRACING_ASSISTANT', icon: <PenTool size={30} />, title: 'Trợ lý Tracing', color: 'bg-amber-500' },
  { id: '3D_TO_REAL_WHITE_BG', icon: <Box size={30} />, title: 'Ảnh 3D - Ảnh chụp', color: 'bg-indigo-500' },
  { id: 'LINE_ART', icon: <PenTool size={30} />, title: 'Chuyển thành Line Art', color: 'bg-slate-500' },
  { id: 'PACKAGING_MOCKUP', icon: <Box size={30} />, title: 'Mockup bao bì', color: 'bg-orange-500' },
  { id: 'TRANSLATE_PACKAGING', icon: <Languages size={30} />, title: 'Dịch bao bì tự động', color: 'bg-green-500' },
  { id: 'PACKAGING_CHECK', icon: <Check size={30} />, title: 'Kiểm tra bao bì', color: 'bg-rose-500' },
];

const initialSettings: GenerationSettings = {
  productName: '',
  productImages: [],
  referenceImage: null,
  visualStyle: 'CONCEPT',
  techDescription: '',
  colorChanges: [],
  dimensions: { length: '', width: '', height: '' },
  packagingMaterial: 'COLOR_BOX',
  packagingDesignType: 'FLAT_DESIGN',
  packagingOutputStyle: 'WHITE_BG_ROTATED',
  packagingHandleType: 'PLASTIC_CLEAR',
  packagingMockupLayout: 'SEPARATE_VIEWS',
  packagingPaperSubstrate: 'IVORY_DUPLEX_COATED',
  packagingFaces: {},
  packagingFaceRegions: {},
  techEffectType: 'REMOVE_SIGNATURE',
  techTitle: '',
  selectedTechConcept: '',
  productMaterial: 'MATTE',
  whiteBGCategory: 'METAL',
  whiteBGSelectedCategories: ['METAL'],
  whiteBGMaterialsDescription: '',
  whiteBGMetalConfig: { type: 'Brushed Stainless Steel', highlight: 'sharp longitudinal highlights', shape: 'cylindrical' },
  whiteBGPlasticConfig: { type: 'Matte', color: 'White', lighting: 'Softbox' },
  whiteBGGlassConfig: { type: 'Borosilicate Glass', lighting: 'Rim lighting', content: '' },
  whiteBGCeramicConfig: { surface: 'Ceramic finish', lighting: '45-degree side lighting' },
  whiteBGMetalAndPlasticConfig: { metalParts: 'Inox xước, thép không gỉ sáng bóng', plasticParts: 'Nhựa ABS phủ mờ màu sáng hoặc tối', lighting: 'Softbox cường độ vừa phải kết hợp phản xạ dịu trên kim loại' },
  emptySpacePosition: [],
  sockets: [],
  trackSocketMode: 'CREATIVE',
  concept: '',
  placement: '',
  location: '',
  camera: { focalLength: 50, aperture: 'f/2.8', iso: '100', isMacro: false, angle: 0 },
  props: [],
  tone: TONE_STYLES[0],
  aspectRatio: '1:1',
  imageSize: '1K',
  imageModel: 'FLASH',
  numImages: 1
};

function useSettingsHistory(initialState: GenerationSettings) {
  const [state, setState] = useState<{
    past: GenerationSettings[];
    present: GenerationSettings;
    future: GenerationSettings[];
  }>({
    past: [],
    present: initialState,
    future: []
  });

  const setSettings = React.useCallback((newSettings: GenerationSettings | ((prev: GenerationSettings) => GenerationSettings)) => {
    setState(prevState => {
      const nextSettings = typeof newSettings === 'function' ? newSettings(prevState.present) : newSettings;
      if (JSON.stringify(nextSettings) === JSON.stringify(prevState.present)) {
        return prevState;
      }
      const newPast = [...prevState.past, prevState.present];
      if (newPast.length > 50) newPast.shift();
      return {
        past: newPast,
        present: nextSettings,
        future: []
      };
    });
  }, []);

  const undoSettings = React.useCallback(() => {
    setState(prevState => {
      if (prevState.past.length === 0) return prevState;
      const previous = prevState.past[prevState.past.length - 1];
      const newPast = prevState.past.slice(0, prevState.past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [prevState.present, ...prevState.future]
      };
    });
  }, []);

  const redoSettings = React.useCallback(() => {
    setState(prevState => {
      if (prevState.future.length === 0) return prevState;
      const next = prevState.future[0];
      const newFuture = prevState.future.slice(1);
      return {
        past: [...prevState.past, prevState.present],
        present: next,
        future: newFuture
      };
    });
  }, []);

  return {
    settings: state.present,
    setSettings,
    undoSettings,
    redoSettings,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0
  };
}

const TypingEffect = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    setDisplayedText("");
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(prev => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 15);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span>
      {displayedText.split('').map((line, i) => (
        <React.Fragment key={i}>
          {line}
          {i !== displayedText.split('').length - 1 && <br />}
        </React.Fragment>
      ))}
    </span>
  );
};

// FileDropzone được tách sang src/components/common/FileDropzone.tsx (dùng
// chung cho các workflow đã tách file lẫn các workflow còn nhúng ở đây).

const App: React.FC = () => {
  const [isLocked, setIsLocked] = useState(true); 
  const [passwordInput, setPasswordInput] = useState(""); 
  const [passwordError, setPasswordError] = useState(""); 
  
  const [appState, setAppState] = useState<AppState>(AppState.READY);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isImagePanelVisible, setIsImagePanelVisible] = useState(true);
  
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [conceptStep, setConceptStep] = useState<number>(1);
  const [techStep, setTechStep] = useState<number>(1); 
  const [packagingStep, setPackagingStep] = useState<number>(1); 
  const [techEffectStep, setTechEffectStep] = useState<number>(1); 
  const [packagingCheckStep, setPackagingCheckStep] = useState<number>(1);
  const [packagingInputMode, setPackagingInputMode] = useState<'MANUAL' | 'EXCEL'>('EXCEL');
  const [packagingFileType, setPackagingFileType] = useState<string>('HỘP MÀU');
  const [packagingFileName, setPackagingFileName] = useState<string>('');
  const [standardParams, setStandardParams] = useState<{key: string, value: string}[]>([]);
  const [packagingFiles, setPackagingFiles] = useState<{name: string, data: string}[]>([]);
  const [packagingDesignImage, setPackagingDesignImage] = useState<string | null>(null);
  const [packagingCheckResult, setPackagingCheckResult] = useState<{ params: any[], qr?: any } | null>(null);
  const [isAnalyzingMaterial, setIsAnalyzingMaterial] = useState<boolean>(false);
  const [render3DStep, setRender3DStep] = useState<number>(1);
  const [whiteBgStep, setWhiteBgStep] = useState<number>(1); 
  const [colorChangeStep, setColorChangeStep] = useState<number>(1); 
  const [whiteBgWebStep, setWhiteBgWebStep] = useState<number>(1); 
  const [stagingStep, setStagingStep] = useState<number>(1); 
  const [studioStep, setStudioStep] = useState<number>(1); 
  const [trackSocketStep, setTrackSocketStep] = useState<number>(1); 

  const [suggestions, setSuggestions] = useState<AISuggestions>({
    concepts: [],
    locations: [],
    props: []
  });
  // Chỉ dẫn đúc kết từ các ảnh đã được đội ngũ Elmich đánh giá "Rất tốt!" cho
  // đúng dòng sản phẩm + phong cách hiện tại (lấy 1 lần ở bước phân tích concept
  // đầu tiên, dùng lại xuyên suốt các bước gợi ý đạo cụ tiếp theo trong cùng workflow).
  const [conceptCategoryGuidance, setConceptCategoryGuidance] = useState<string | null>(null);

  const { settings, setSettings, undoSettings, redoSettings, canUndo, canRedo } = useSettingsHistory(initialSettings);
  
  const [customConcept, setCustomConcept] = useState('');
  const [customProp, setCustomProp] = useState('');
  const [currentColorPart, setCurrentColorPart] = useState('');
  const [currentPantoneCode, setCurrentPantoneCode] = useState('');
  const [currentColorDescription, setCurrentColorDescription] = useState('');
  const [currentSampleImage, setCurrentSampleImage] = useState<string | null>(null); 
  
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);
  const [isGalleryLoaded, setIsGalleryLoaded] = useState(false);
  const [askFeedbackImage, setAskFeedbackImage] = useState<GeneratedImage | null>(null);
  const [successfulPrompts, setSuccessfulPrompts] = useState<SuccessfulPrompt[]>(() => {
    try {
      const saved = localStorage.getItem('elmich_ai_successful_prompts');
      if (saved) {
        return JSON.parse(saved) as SuccessfulPrompt[];
      }
    } catch (e) {
      console.error('Failed to parse successful prompts', e);
    }
    return [];
  });
  useEffect(() => {
    import('localforage').then((m) => {
      const lf = m.default || m;
      // Load gallery
      lf.getItem('elmich_ai_gallery').then((saved) => {
        if (saved) {
           const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved as GeneratedImage[];
           const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
           setGallery(parsed.filter((img: any) => img.timestamp > oneWeekAgo));
        }
        setIsGalleryLoaded(true);
      });
    }).catch(e => {
       console.error('Failed to load gallery', e);
       setIsGalleryLoaded(true);
    });
  }, []);

  const [activeImage, setActiveImage] = useState<GeneratedImage | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [editReferenceImage, setEditReferenceImage] = useState<string | null>(null);

  const [translateImageBase64, setTranslateImageBase64] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedImageURL, setTranslatedImageURL] = useState<string | null>(null);

  const editRefFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('elmich_ai_successful_prompts', JSON.stringify(successfulPrompts));
  }, [successfulPrompts]);

  // Sync productName and productCode for background Lark tracking
  useEffect(() => {
    localStorage.setItem('elmich_ai_product_name', settings.productName || '');
    if (settings.visualStyle === 'COLOR_CHANGE') {
      localStorage.setItem('elmich_ai_product_code', 'sản phẩm mới');
    } else {
      localStorage.setItem('elmich_ai_product_code', settings.productCode || '');
    }
  }, [settings.productName, settings.productCode, settings.visualStyle]);

  const [isEditingImage, setIsEditingImage] = useState(false);
  const [editQuality, setEditQuality] = useState<ImageSize>('1K');
  const [editModel, setEditModel] = useState<ImageModelTier>('FLASH');
  
  const [viewMode, setViewMode] = useState<'studio' | 'chat' | 'history'>('studio');
  const [isHandbookOpen, setIsHandbookOpen] = useState(false);
  
  const [chatSessions, setChatSessions] = useState<import('./types').ChatSession[]>([]);
  const [isChatLoaded, setIsChatLoaded] = useState(false);

  useEffect(() => {
    import('localforage').then((m) => {
      const lf = m.default || m;
      lf.getItem('elmich_ai_chat_sessions').then(async (saved) => {
        let localSessions: import('./types').ChatSession[] = [];
        if (saved) {
          const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved as import('./types').ChatSession[];
          const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          localSessions = parsed.filter((s: any) => s.timestamp > oneWeekAgo);
        }

        // Luôn thử đồng bộ thêm với lịch sử chat DÙNG CHUNG từ server, chứ
        // không chỉ khi cache cục bộ trống — trước đây chỉ fetch remote lúc
        // trống nên hễ trình duyệt đã có DÙ CHỈ 1 đoạn chat cũ, nó sẽ không
        // bao giờ thấy các đoạn chat mới được tạo ở trình duyệt/thiết bị
        // khác nữa (đây là nguyên nhân "lịch sử chat không đồng bộ giữa các
        // trình duyệt"). Nếu backend Lịch sử chưa cấu hình, fetchChatHistory()
        // tự trả về success:false và hành vi giữ nguyên như cũ (chỉ dùng cache
        // cục bộ, không crash).
        const remote = await fetchChatHistory().catch(() => null);
        let merged = localSessions;
        if (remote?.success && remote.items && remote.items.length > 0) {
          const remoteSessions: import('./types').ChatSession[] = remote.items.map(item => ({
            id: item.id,
            title: item.title,
            timestamp: item.timestamp,
            messages: item.messages.map(m => ({
              id: m.id,
              role: m.role,
              text: m.text,
              imageUrl: m.imageUrl || undefined,
              uploadedImageUrl: m.uploadedImageUrl || undefined,
            })),
          }));
          // Gộp theo id: ưu tiên bản có nhiều tin nhắn hơn (đầy đủ hơn) giữa
          // local và remote — tránh trường hợp hiếm gặp remote chưa kịp nhận
          // tin nhắn vừa gửi (logChatSession chạy kiểu bắn-và-quên, không
          // chờ) lại ghi đè mất bản mới hơn đang có sẵn cục bộ.
          const byId = new Map<string, import('./types').ChatSession>();
          localSessions.forEach(s => byId.set(s.id, s));
          remoteSessions.forEach(r => {
            const existing = byId.get(r.id);
            if (!existing || (r.messages?.length || 0) >= (existing.messages?.length || 0)) {
              byId.set(r.id, r);
            }
          });
          merged = Array.from(byId.values()).sort((a, b) => b.timestamp - a.timestamp);
        }
        setChatSessions(merged);
        setIsChatLoaded(true);
      });
    }).catch(e => {
       console.error('Failed to load chat sessions', e);
       setIsChatLoaded(true);
    });
  }, []);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Chỉ tự động mở lại đoạn chat gần nhất DUY NHẤT 1 LẦN khi app vừa tải
  // xong lịch sử (mở lại app sau khi đóng). Nếu không chặn bằng ref này,
  // effect sẽ chạy lại mỗi khi activeSessionId về null — kể cả khi người
  // dùng chủ động bấm "Đoạn chat mới" — khiến nút đó như không có tác dụng
  // vì bị tự động kéo ngược về đoạn chat cũ ngay lập tức.
  const hasAutoResumedChatRef = useRef(false);
  useEffect(() => {
    if (isChatLoaded && !hasAutoResumedChatRef.current) {
      hasAutoResumedChatRef.current = true;
      if (!activeSessionId && chatSessions.length > 0) {
        setActiveSessionId(chatSessions[0].id);
      }
    }
  }, [isChatLoaded]);
  
  useEffect(() => {
    if (isChatLoaded) {
      import('localforage').then((m) => {
        const lf = m.default || m;
        lf.setItem('elmich_ai_chat_sessions', chatSessions).catch((e: any) => {
          console.error('Lỗi khi lưu chat vào localForage:', e);
        });
      });
    }
  }, [chatSessions, isChatLoaded]);

  // Lưu ý: state/logic gửi tin nhắn chat (chatInput, handleSendMessage,
  // handleImageUploadToChat, handleNewChat...) đã được chuyển hẳn vào
  // src/components/chat/ChatView.tsx từ khi tách component — không khai
  // báo lại ở đây để tránh 2 nguồn sự thật (trước đó có 1 bản sao chép y
  // hệt nhưng KHÔNG bao giờ được gọi tới, đã dọn bỏ).

  useEffect(() => {
    if (isGalleryLoaded) {
      import('localforage').then((m) => {
        const lf = m.default || m;
        lf.setItem('elmich_ai_gallery', gallery).catch((e: any) => {
          console.error('Lỗi khi lưu vào localForage:', e);
          setAlertMessage('Bộ nhớ quá tải, không thể lưu thêm ảnh.');
        });
      });
    }
  }, [gallery, isGalleryLoaded]);

  const productFilesRef = useRef<HTMLInputElement>(null);
  const refFileRef = useRef<HTMLInputElement>(null);
  const pendingPackagingFace = useRef<keyof PackagingFaces | "flat">("flat");

  const handlePasswordChange = (val: string) => {
    setPasswordInput(val);
    setPasswordError("");
    if (val === "1111") {
      setIsLocked(false);
    } else if (val.length >= 4) {
      setPasswordError("Mật khẩu không chính xác");
    }
  };

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width; let height = img.height;
          const maxDim = 1024; // Giảm xuống 1024 để tăng tốc độ phân tích và tiết kiệm băng thông (AI chỉ cần độ phân giải này là đủ hiểu chi tiết)
          if (width > maxDim || height > maxDim) {
            const ratio = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * ratio); height = Math.round(height * ratio);
          }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => reject(new Error("Lỗi đọc ảnh"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Lỗi file"));
      reader.readAsDataURL(file);
    });
  };

  const onImageUpload = async (filesOrEvent: React.ChangeEvent<HTMLInputElement> | FileList, type: 'product' | 'reference' | 'color_sample' | 'packaging' | 'track' | 'socket' | 'edit_reference') => {
    const files = 'target' in filesOrEvent ? filesOrEvent.target.files : filesOrEvent;
    if (!files || files.length === 0) return;
    try {
      if (type === 'packaging') {
          const base64 = await resizeImage(files[0]);
          const face = pendingPackagingFace.current;
          setSettings(prev => ({ ...prev, packagingFaces: { ...prev.packagingFaces, [face]: base64 } }));
      } else if (type === 'color_sample') {
        const base64 = await resizeImage(files[0]);
        setCurrentSampleImage(base64); 
      } else if (type === 'reference') {
        const base64 = await resizeImage(files[0]);
        setSettings(prev => ({ ...prev, referenceImage: base64 }));
      } else if (type === 'product') {
        const newImages = await Promise.all(Array.from(files).map((file) => resizeImage(file as File)));
        setSettings(prev => ({ ...prev, productImages: [...prev.productImages, ...newImages].slice(0, 5) }));
      } else if (type === 'track') {
        const base64 = await resizeImage(files[0]);
        setSettings(prev => ({ ...prev, trackImage: base64 }));
      } else if (type === 'socket') {
        const base64 = await resizeImage(files[0]);
        setSettings(prev => ({ 
          ...prev, 
          sockets: [...(prev.sockets || []), { id: Date.now().toString(), image: base64, quantity: 1, applianceNote: '' }] 
        }));
      } else if (type === 'edit_reference') {
        const base64 = await resizeImage(files[0]);
        setEditReferenceImage(base64);
      }
    } catch (error) { setAlertMessage("Lỗi khi tải ảnh."); }
    if ('target' in filesOrEvent) filesOrEvent.target.value = '';
  };

  // --- LOGIC CONCEPT WORKFLOW (OPTIMIZED 3 STEPS - UNIFIED INFERENCE) ---
  const handleConceptAnalysis = async () => {
    if (!settings.productName || settings.productImages.length === 0) return setAlertMessage("Vui lòng nhập tên và tải ít nhất 1 ảnh sản phẩm.");
    setAppState(AppState.ANALYZING);
    setLoadingMessage("AI đang phân tích và đề xuất toàn diện Phong cách & Đạo cụ...");
    try {
      const dimStr = `${settings.dimensions.length}x${settings.dimensions.width}x${settings.dimensions.height}mm`;
      const { guidanceText } = await fetchCategoryGuidance({
        visualStyle: 'CONCEPT',
        productName: settings.productName,
        productCode: settings.productCode,
      });
      setConceptCategoryGuidance(guidanceText);
      const result = await analyzeConceptAndCamera(settings.productName, dimStr, settings.productImages, settings.referenceImage, guidanceText || undefined);
      
      const firstConcept = result.concepts[0];
      const initialProps = (firstConcept?.props && firstConcept.props.length > 0)
        ? firstConcept.props
        : getFallbackProps(settings.productName, 'LIFESTYLE');
      const initialPlacement = firstConcept?.placement || "Đặt trên mặt bàn bếp, ánh sáng tự nhiên nghiêng 45 độ";

      setSuggestions(prev => ({ 
        ...prev, 
        concepts: result.concepts,
        props: initialProps
      }));

      const initialSelectedProps = initialProps.slice(0, 3).map(p => ({
        name: p,
        size: 'auto' as const,
        position: 'auto' as const,
        rotation: 'auto' as const
      }));

      setSettings(prev => ({
        ...prev,
        camera: result.suggestedCamera,
        concept: firstConcept?.prompt || '',
        conceptTitle: firstConcept?.title || '',
        placement: initialPlacement,
        props: initialSelectedProps
      }));
      setConceptStep(2);
    } catch (e: any) { 
      console.error(e); 
      setAlertMessage("Có lỗi khi phân tích. Vui lòng thử lại.");
    } finally { 
      setAppState(AppState.READY); 
    }
  };

  const handleSelectConcept = (c: ConceptSuggestion) => {
    const conceptProps = (c.props && c.props.length > 0) ? c.props : suggestions.props;
    setSuggestions(prev => ({
      ...prev,
      props: conceptProps
    }));
    setSettings(prev => ({
      ...prev,
      concept: c.prompt,
      conceptTitle: c.title,
      placement: c.placement || prev.placement || "Đặt trên mặt bàn bếp, ánh sáng tự nhiên nghiêng 45 độ",
      props: conceptProps.slice(0, 3).map(p => ({
        name: p,
        size: 'auto',
        position: 'auto',
        rotation: 'auto'
      }))
    }));
  };

  const handlePropSuggestion = async () => {
    const finalConcept = settings.concept || suggestions.concepts[0]?.prompt || (settings.productName ? `Không gian hiện đại cho ${settings.productName}` : 'Không gian bếp hiện đại');
    setAppState(AppState.ANALYZING);
    setLoadingMessage("AI đang tìm kiếm đạo cụ phù hợp cho phối cảnh này...");
    try {
      const result = await suggestPropsForConcept(settings.productName, finalConcept, 'LIFESTYLE', [], conceptCategoryGuidance || undefined);
      const validProps = Array.isArray(result.props) && result.props.length > 0
        ? result.props
        : getFallbackProps(settings.productName, 'LIFESTYLE');

      setSuggestions(prev => ({ ...prev, props: validProps }));
      const initialSelected = validProps.slice(0, 3).map(p => ({
        name: p,
        size: 'auto',
        position: 'auto',
        rotation: 'auto'
      }));
      setSettings(prev => ({
        ...prev,
        concept: finalConcept,
        props: initialSelected,
        placement: result.placement || prev.placement || "Đặt trên mặt bàn bếp, ánh sáng tự nhiên nghiêng 45 độ"
      }));
    } catch (e: any) {
      console.error("handlePropSuggestion error:", e);
    } finally {
      setAppState(AppState.READY);
    }
  };

  // Cho phép người dùng xin thêm gợi ý đạo cụ MỚI (không trùng danh sách hiện có)
  // ngay tại bước chọn đạo cụ, thay vì phải quay lại phân tích từ đầu.
  const handleMorePropSuggestion = async () => {
    const finalConcept = settings.concept || suggestions.concepts[0]?.prompt || (settings.productName ? `Không gian cho ${settings.productName}` : 'Không gian bếp');
    setAppState(AppState.ANALYZING);
    setLoadingMessage("AI đang tìm thêm đạo cụ mới, khác biệt hơn...");
    try {
      const result = await suggestPropsForConcept(settings.productName, finalConcept, 'LIFESTYLE', suggestions.props, conceptCategoryGuidance || undefined);
      const newProps = Array.isArray(result.props) ? result.props : [];
      const distinctNew = newProps.filter(p => !suggestions.props.includes(p));
      if (distinctNew.length === 0) {
        setAlertMessage("AI không tìm thêm được đạo cụ mới. Bạn có thể tự thêm ở ô nhập bên dưới.");
      } else {
        setSuggestions(prev => ({
          ...prev,
          props: [...prev.props, ...distinctNew]
        }));
        setAlertMessage(`AI đã bổ sung thêm ${distinctNew.length} gợi ý đạo cụ mới.`);
      }
    } catch (e) {
      console.error("handleMorePropSuggestion error:", e);
      setAlertMessage("Có lỗi khi tìm thêm đạo cụ. Vui lòng thử lại.");
    } finally {
      setAppState(AppState.READY);
    }
  };

  const handleAutoSelectProps = () => {
    if (!suggestions.props || suggestions.props.length === 0) {
      setAlertMessage("Chưa có gợi ý đạo cụ nào từ AI để chọn.");
      return;
    }
    const countToPick = Math.min(3, suggestions.props.length);
    const picked = suggestions.props.slice(0, countToPick).map(p => ({
      name: p,
      size: 'auto',
      position: 'auto',
      rotation: 'auto'
    }));
    setSettings(prev => ({ ...prev, props: picked }));
    setAlertMessage(`AI đã tự động chọn ${picked.length} đạo cụ phù hợp nhất.`);
  };

  const handleClearAllProps = () => {
    setSettings(prev => ({ ...prev, props: [] }));
  };

  const addCustomConceptToList = () => {
    if (customConcept && !suggestions.concepts.some(c => c.prompt === customConcept)) {
      setSuggestions(prev => ({ ...prev, concepts: [{ title: "Tùy chỉnh", prompt: customConcept }, ...prev.concepts] }));
      setSettings(prev => ({ ...prev, concept: customConcept }));
      setCustomConcept('');
    }
  };

  const addCustomPropToList = () => {
    if (customProp && !suggestions.props.includes(customProp)) {
      setSuggestions(prev => ({ ...prev, props: [customProp, ...prev.props] }));
      setSettings(prev => ({ ...prev, props: [...prev.props, { name: customProp, size: 'auto', position: 'auto', rotation: 'auto' }] }));
      setCustomProp('');
    }
  };

  const toggleProp = (propName: string) => {
    setSettings(prev => {
      const exists = prev.props.some(p => p.name === propName);
      if (exists) {
        return { ...prev, props: prev.props.filter(p => p.name !== propName) };
      } else {
        return { ...prev, props: [...prev.props, { name: propName, size: 'auto', position: 'auto', rotation: 'auto' }] };
      }
    });
  };

  const updateProp = (propName: string, updates: Partial<PropConfig>) => {
    setSettings(prev => ({
      ...prev,
      props: prev.props.map(p => p.name === propName ? { ...p, ...updates } : p)
    }));
  };

  // --- LOGIC TECH WORKFLOW ---
  const handleTechAnalysis = async () => {
    if (!settings.productName || !settings.techDescription || settings.productImages.length === 0) return setAlertMessage("Thiếu thông tin");
    setAppState(AppState.ANALYZING);
    setLoadingMessage("Gemini đang thiết kế ý tưởng kỹ thuật...");
    try {
      const dimStr = `${settings.dimensions.length}x${settings.dimensions.width}x${settings.dimensions.height}mm`;
      const result = await analyzeTechConceptAndCamera(settings.productName, settings.techDescription, dimStr, settings.productImages);
      setSuggestions(prev => ({ ...prev, concepts: result.concepts }));
      setSettings(prev => ({ ...prev, camera: result.suggestedCamera, concept: result.concepts[0]?.prompt || '' }));
      setTechStep(3);
    } catch (e: any) { console.error(e); } 
    finally { setAppState(AppState.READY); }
  };

  const handleTechVisualSuggestion = async () => {
    const finalConcept = settings.concept;
    setAppState(AppState.ANALYZING);
    setLoadingMessage("Đang tìm hiệu ứng...");
    try {
      const result = await suggestTechVisuals(settings.productName, finalConcept);
      setSuggestions(prev => ({ ...prev, props: result.props }));
      setSettings(prev => ({ ...prev, props: [], placement: result.placement }));
      setTechStep(4);
    } catch (e) { console.error(e); } 
    finally { setAppState(AppState.READY); }
  };

  const handleSeaConceptSuggestion = async () => {
      if (!settings.productName || !settings.techTitle) return setAlertMessage("Thiếu tên SP/Tiêu đề");
      setAppState(AppState.ANALYZING);
      setLoadingMessage("Đang gợi ý concept biển...");
      try {
          const concepts = await suggestTechConcepts(settings.productName, settings.techTitle);
          setSuggestions(prev => ({ ...prev, concepts }));
          setSettings(prev => ({ ...prev, selectedTechConcept: concepts[0]?.prompt || '' }));
          setTechEffectStep(3);
      } catch (e) { console.error(e); }
      finally { setAppState(AppState.READY); }
  };

  const handleStagingAnalysis = async () => {
      if (!settings.concept || !settings.productImages[0] || !settings.referenceImage) return setAlertMessage("Vui lòng điền đủ thông tin & up ảnh.");
      setAppState(AppState.ANALYZING);
      setLoadingMessage("AI đang phân tích phối cảnh...");
      try {
          const items = await analyzeStagingScene(settings.concept, settings.productImages[0], settings.referenceImage);
          setSuggestions(prev => ({ ...prev, props: items }));
          setSettings(prev => ({ ...prev, props: [] }));
          setStagingStep(4);
      } catch (e: any) { console.error(e); } 
      finally { setAppState(AppState.READY); }
  };

  // --- LOGIC STUDIO WORKFLOW (OPTIMIZED 3 STEPS - UNIFIED INFERENCE) ---
  const handleStudioAnalysis = async () => {
    if (!settings.productName || settings.productImages.length === 0) return setAlertMessage("Vui lòng nhập tên và tải ít nhất 1 ảnh sản phẩm.");
    setAppState(AppState.ANALYZING);
    setLoadingMessage("AI đang phân tích và đề xuất toàn diện Studio Concept & Đạo cụ...");
    try {
      const dimStr = `${settings.dimensions.length}x${settings.dimensions.width}x${settings.dimensions.height}mm`;
      const { guidanceText } = await fetchCategoryGuidance({
        visualStyle: 'STUDIO',
        productName: settings.productName,
        productCode: settings.productCode,
      });
      setConceptCategoryGuidance(guidanceText);
      const result = await analyzeStudioConcept(settings.productName, dimStr, settings.productImages, guidanceText || undefined);

      const firstConcept = result.concepts[0];
      const initialProps = (firstConcept?.props && firstConcept.props.length > 0)
        ? firstConcept.props
        : getFallbackProps(settings.productName, 'STUDIO');
      const initialPlacement = firstConcept?.placement || "Đặt chính giữa bục studio, góc chụp ngang tầm mắt tôn dáng sản phẩm";

      setSuggestions(prev => ({ 
        ...prev, 
        concepts: result.concepts,
        props: initialProps
      }));

      const initialSelectedProps = initialProps.slice(0, 3).map(p => ({
        name: p,
        size: 'auto' as const,
        position: 'auto' as const,
        rotation: 'auto' as const
      }));

      setSettings(prev => ({
        ...prev,
        camera: result.suggestedCamera,
        concept: firstConcept?.prompt || '',
        conceptTitle: firstConcept?.title || '',
        placement: initialPlacement,
        props: initialSelectedProps
      }));
      setStudioStep(2);
    } catch (e: any) { 
      console.error(e); 
      setAlertMessage("Có lỗi khi phân tích studio. Vui lòng thử lại.");
    } finally { 
      setAppState(AppState.READY); 
    }
  };

  const handleSelectStudioConcept = (c: ConceptSuggestion) => {
    const conceptProps = (c.props && c.props.length > 0) ? c.props : suggestions.props;
    setSuggestions(prev => ({
      ...prev,
      props: conceptProps
    }));
    setSettings(prev => ({
      ...prev,
      concept: c.prompt,
      conceptTitle: c.title,
      placement: c.placement || prev.placement || "Đặt chính giữa bục studio, góc chụp ngang tầm mắt tôn dáng sản phẩm",
      props: conceptProps.slice(0, 3).map(p => ({
        name: p,
        size: 'auto',
        position: 'auto',
        rotation: 'auto'
      }))
    }));
  };

  const handleStudioPropSuggestion = async () => {
    const finalConcept = settings.concept || suggestions.concepts[0]?.prompt || (settings.productName ? `Studio chuyên nghiệp cho ${settings.productName}` : 'Studio tối giản cao cấp');
    setAppState(AppState.ANALYZING);
    setLoadingMessage("AI đang tìm kiếm đạo cụ Studio phù hợp...");
    try {
      const result = await suggestPropsForConcept(settings.productName, finalConcept, 'STUDIO', [], conceptCategoryGuidance || undefined);
      const validProps = Array.isArray(result.props) && result.props.length > 0
        ? result.props
        : getFallbackProps(settings.productName, 'STUDIO');

      setSuggestions(prev => ({ ...prev, props: validProps }));
      const initialSelected = validProps.slice(0, 3).map(p => ({
        name: p,
        size: 'auto',
        position: 'auto',
        rotation: 'auto'
      }));
      setSettings(prev => ({
        ...prev,
        concept: finalConcept,
        props: initialSelected,
        placement: result.placement || prev.placement || "Đặt chính giữa bục studio, góc chụp ngang tầm mắt tôn dáng sản phẩm"
      }));
    } catch (e: any) {
      console.error("handleStudioPropSuggestion error:", e);
    } finally {
      setAppState(AppState.READY);
    }
  };

  // Tương tự handleMorePropSuggestion nhưng cho nhánh Studio (mode 'STUDIO').
  const handleMoreStudioPropSuggestion = async () => {
    const finalConcept = settings.concept || suggestions.concepts[0]?.prompt || (settings.productName ? `Studio cho ${settings.productName}` : 'Studio');
    setAppState(AppState.ANALYZING);
    setLoadingMessage("AI đang tìm thêm đạo cụ Studio mới, khác biệt hơn...");
    try {
      const result = await suggestPropsForConcept(settings.productName, finalConcept, 'STUDIO', suggestions.props, conceptCategoryGuidance || undefined);
      const newProps = Array.isArray(result.props) ? result.props : [];
      const distinctNew = newProps.filter(p => !suggestions.props.includes(p));
      if (distinctNew.length === 0) {
        setAlertMessage("AI không tìm thêm được đạo cụ Studio mới. Bạn có thể tự thêm ở ô bên dưới.");
      } else {
        setSuggestions(prev => ({
          ...prev,
          props: [...prev.props, ...distinctNew]
        }));
        setAlertMessage(`AI đã bổ sung thêm ${distinctNew.length} đạo cụ Studio mới.`);
      }
    } catch (e) {
      console.error("handleMoreStudioPropSuggestion error:", e);
      setAlertMessage("Có lỗi khi tìm thêm đạo cụ Studio. Vui lòng thử lại.");
    } finally {
      setAppState(AppState.READY);
    }
  };

  const startGeneration = async (overrideSettings?: Partial<GenerationSettings>) => {
    setAppState(AppState.GENERATING);
    setLoadingMessage("Gemini Thinking đang chuẩn bị kiệt tác...");
    try {
      const finalSettings = { ...settings, ...overrideSettings };
      // Lấy chỉ dẫn đã đúc kết riêng cho dòng sản phẩm này (đúc kết từ các
      // ảnh đã được cả đội đánh giá "Rất tốt!") — trả về rỗng ngay nếu backend
      // chưa cấu hình hoặc chưa đủ dữ liệu, không làm chậm luồng tạo ảnh.
      const { guidanceText: categoryGuidance } = await fetchCategoryGuidance({
        visualStyle: finalSettings.visualStyle,
        productName: finalSettings.productName,
        productCode: finalSettings.productCode,
      });
      const urls = await Promise.all(Array.from({ length: finalSettings.numImages }, (_, i) => generateProductImage(finalSettings, i + 1, successfulPrompts, categoryGuidance || undefined)));
      const time = Date.now();
      const newImages: GeneratedImage[] = urls.map((url, i) => ({ id: `${time}-${i}`, url, prompt: finalSettings.concept, timestamp: time, settings: { ...finalSettings }, variant: i + 1 }));
      setGallery(prev => [...newImages, ...prev]);
      setActiveImage(newImages[0]);
      // Ghi lịch sử dùng chung (bắn-và-quên, không chặn UI nếu backend chưa cấu hình)
      newImages.forEach(img => {
        logGeneratedImage({
          id: img.id,
          url: img.url,
          prompt: img.prompt,
          productName: finalSettings.productName,
          productCode: finalSettings.productCode,
          visualStyle: finalSettings.visualStyle,
          aspectRatio: finalSettings.aspectRatio,
          imageSize: finalSettings.imageSize,
          variant: img.variant,
          costUSD: calculateCost(img),
          timestamp: img.timestamp,
        }).catch(() => {});
      });
    } catch (error: any) {
      console.error(error);
      setAlertMessage("Lỗi tạo ảnh.");
    } finally { setAppState(AppState.READY); }
  };

  const handleEditImage = async () => {
    if (!activeImage || !editPrompt.trim()) return;
    setIsEditingImage(true);
    try {
      const newUrl = await editProductImage(activeImage.url, editPrompt, editQuality, editReferenceImage, activeImage.settings, editModel);
      const time = Date.now();
      const newImage: GeneratedImage = {
        id: `${time}-edited`,
        url: newUrl,
        prompt: editPrompt,
        timestamp: time,
        settings: { ...activeImage.settings, imageSize: editQuality, imageModel: editModel },
        variant: activeImage.variant + 1
      };
      setGallery(prev => [newImage, ...prev]);
      setActiveImage(newImage);
      setEditPrompt("");
      setEditReferenceImage(null);
      logGeneratedImage({
        id: newImage.id,
        url: newImage.url,
        prompt: newImage.prompt,
        productName: newImage.settings.productName,
        productCode: newImage.settings.productCode,
        visualStyle: newImage.settings.visualStyle,
        aspectRatio: newImage.settings.aspectRatio,
        imageSize: editQuality,
        variant: newImage.variant,
        costUSD: calculateCost(newImage),
        timestamp: newImage.timestamp,
      }).catch(() => {});
    } catch (error: any) {
      console.error(error);
      setAlertMessage("Lỗi chỉnh sửa ảnh.");
    } finally {
      setIsEditingImage(false);
    }
  };

  const resetMode = () => {
    setCurrentStep(1); setConceptStep(1); setTechStep(1); setPackagingStep(1); setTechEffectStep(1); setWhiteBgStep(1); setColorChangeStep(1); setStagingStep(1); setStudioStep(1); setTrackSocketStep(1);
    setSettings(prev => ({
      ...prev, productName: '', productImages: [], referenceImage: null, techDescription: '', concept: '', placement: '', props: [], colorChanges: [], packagingFaces: {}, techTitle: '', selectedTechConcept: '', productMaterial: 'MATTE', emptySpacePosition: [], trackImage: undefined, sockets: []
    }));
    setSuggestions({ concepts: [], locations: [], props: [] });
    setCurrentSampleImage(null); setCustomConcept(''); setCustomProp('');
  };

  // Bắt đầu 1 phiên làm việc mới từ màn hình kết quả: xóa ảnh/thiết lập
  // hiện tại và quay về màn hình chính, tương đương mở lại app từ đầu
  // nhưng KHÔNG khóa lại màn hình (không yêu cầu nhập lại mã PIN).
  const handleStartNewSession = () => {
    setActiveImage(null);
    setSettings(initialSettings);
    setCurrentStep(1);
    setConceptStep(1); setTechStep(1); setPackagingStep(1); setTechEffectStep(1); setWhiteBgStep(1); setColorChangeStep(1); setStagingStep(1); setStudioStep(1); setTrackSocketStep(1); setRender3DStep(1); setWhiteBgWebStep(1);
    setSuggestions({ concepts: [], locations: [], props: [] });
    setCurrentSampleImage(null); setCustomConcept(''); setCustomProp('');
  };

  // --- REUSABLE COMPONENTS ---

  const StepIndicator = ({ current, total, labels }: { current: number, total: number, labels: string[] }) => (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[#242526]/10 -translate-y-1/2 z-0" />
        <motion.div 
          className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 -translate-y-1/2 z-0"
          initial={{ width: 0 }}
          animate={{ width: `${((current - 1) / (total - 1)) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
        
        {labels.map((label, idx) => {
          const stepNum = idx + 1;
          const isActive = stepNum === current;
          const isCompleted = stepNum < current;
          
          return (
            <div key={idx} className="relative z-10 flex flex-col items-center">
              <motion.div 
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                  isActive ? 'bg-[#242526] border-[#1877F2] text-[#1877F2] shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 
                  isCompleted ? 'bg-[#1877F2] border-cyan-500 text-white' : 
                  'bg-[#242526] border-[#3E4042] text-white/40'
                }`}
                animate={isActive ? { scale: 1.1 } : { scale: 1 }}
              >
                {isCompleted ? <Check size={16} strokeWidth={3} /> : <span className="text-xs font-bold">{stepNum}</span>}
              </motion.div>
              <div className={`absolute top-10 whitespace-nowrap text-[8px] font-bold uppercase tracking-wider transition-colors duration-300 ${
                isActive ? 'text-[#1877F2]' : 'text-white'
              }`}>
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // --- RENDER FUNCTIONS ---

  // 1. Ảnh phối cảnh Workflow (Lifestyle Concept)
  
  
  const filterAndFormatImportantParams = (extracted: {key: string, value: string}[]) => {
    const findValue = (keywords: string[]) => {
      for (const item of extracted) {
        const lowerKey = item.key.toLowerCase();
        if (keywords.some(kw => lowerKey.includes(kw))) {
          return item.value;
        }
      }
      return "";
    };

    const maSp = findValue(["mã sản phẩm", "mã sp", "item code", "mã hàng"]);
    const ean13 = findValue(["ean13", "ean-13", "mã vạch", "barcode"]);
    
    return [
      { key: "Tên sản phẩm", value: findValue(["tên sản phẩm", "tên hàng"]) },
      { key: "Model", value: findValue(["model"]) },
      { key: "Mã sản phẩm", value: maSp },
      { key: "Công suất", value: findValue(["công suất"]) },
      { key: "Điện áp", value: findValue(["điện áp", "nguồn điện"]) },
      { key: "Tần số", value: findValue(["tần số"]) },
      { key: "Kích thước sản phẩm", value: findValue(["kích thước"]) },
      { key: "Trọng lượng sản phẩm", value: findValue(["trọng lượng", "khối lượng"]) },
      { key: "Định lượng", value: findValue(["định lượng"]) },
      { key: "Dung tích", value: findValue(["dung tích", "thể tích"]) },
      { key: "Chất liệu vỏ", value: findValue(["chất liệu"]) },
      { key: "Xuất xứ", value: findValue(["xuất xứ", "made in", "sản xuất tại"]) },
      { key: "Năm sản xuất", value: findValue(["năm sản xuất"]) },
      { key: "Đơn vị sản xuất", value: findValue(["đơn vị sản xuất", "nhà sản xuất", "sản xuất bởi"]) },
      { key: "Địa chỉ", value: findValue(["địa chỉ", "address"]) },
      { key: "Mã vạch EAN13", value: ean13 },
      { key: "Mã vạch code 128", value: maSp },
      { key: "Mã QR", value: maSp ? `www.elmich.vn/san-pham/${maSp.toLowerCase()}` : "" }
    ];
  };

  const processRawRows = (rows: any[][]) => {
    const extractedParams: {key: string, value: string}[] = [];
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!Array.isArray(row)) continue;
        
        const validCells = row.filter(cell => cell !== undefined && cell !== null && String(cell).trim() !== "");
        if (validCells.length < 2) continue; 
        
        let cellsToProcess = [...validCells];
        const firstCellStr = String(cellsToProcess[0]).trim();
        if (/^(\d+|[IVXLCDM]+)$/i.test(firstCellStr)) {
          cellsToProcess.shift();
        }
        
        if (cellsToProcess.length < 2) continue;
        
        const value = String(cellsToProcess.pop()).trim();
        const key = cellsToProcess.map(c => String(c).trim()).join(" - ");
        extractedParams.push({ key, value });
    }
    return filterAndFormatImportantParams(extractedParams);
  };

  
  const handlePackagingFilesUpload = (filesOrEvent: React.ChangeEvent<HTMLInputElement> | FileList) => {
    const filesList = 'target' in filesOrEvent ? filesOrEvent.target.files : filesOrEvent;
    const files = Array.from(filesList || []) as File[];
    if (files.length > 0) {
      setPackagingFiles(prev => [...prev, ...files]);
    }
  };

  const handleExcelUpload = async (filesOrEvent: React.ChangeEvent<HTMLInputElement> | FileList) => {
    const files = 'target' in filesOrEvent ? filesOrEvent.target.files : filesOrEvent;
    const file = files?.[0];
    if (!file) return;
    setLoadingMessage("AI đang phân tích dữ liệu Excel...");
    setAppState(AppState.ANALYZING);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      let textData = "";
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        jsonData.forEach(row => {
            textData += row.join(" \t ") + "";
        });
      });
      
      const aiParams = await extractStandardParamsWithAI(textData);
      setStandardParams(aiParams);
      setAppState(AppState.READY);
    } catch (err: any) {
      console.error(err);
      setAlertMessage("Lỗi khi đọc file Excel: " + err.message);
      setAppState(AppState.READY);
    }
    if ('target' in filesOrEvent) filesOrEvent.target.value = '';
  };

  const handlePastedExcelData = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (!text.trim()) return;
    
    setLoadingMessage("AI đang phân tích dữ liệu văn bản...");
    setAppState(AppState.ANALYZING);
    try {
      const aiParams = await extractStandardParamsWithAI(text);
      setStandardParams(aiParams);
      setAppState(AppState.READY);
    } catch (err: any) {
       console.error(err);
       setAlertMessage("Lỗi phân tích: " + err.message);
       setAppState(AppState.READY);
    }
    e.target.value = ''; // clear textarea
  };
  const addStandardParam = () => setStandardParams([...standardParams, { key: '', value: '' }]);
  const updateStandardParam = (index: number, field: 'key' | 'value', val: string) => {
    const newParams = [...standardParams];
    newParams[index][field] = val;
    setStandardParams(newParams);
  };
  const removeStandardParam = (index: number) => {
    setStandardParams(standardParams.filter((_, i) => i !== index));
  };

  
  const exportPackagingReport = () => {
    if (!packagingCheckResult || !packagingCheckResult.params) return;

    const data: any[] = [];
    
    packagingCheckResult.params.forEach((res: any) => {
        const row: any = {
            'Thông số': res.key,
            'Giá trị chuẩn': res.expected || '-',
            'Khớp (Tổng thể)': res.match ? 'ĐẠT' : 'KHÔNG ĐẠT',
        };

        packagingFiles.forEach((file, fIdx) => {
            let fileResult = (res.fileResults || []).find((fr: any) => {
                if (!fr.fileName) return false;
                const cleanFr = fr.fileName.toLowerCase().trim();
                const cleanF = file.name.toLowerCase().trim();
                return cleanFr === cleanF || cleanFr.includes(cleanF) || cleanF.includes(cleanFr);
            });
            if (!fileResult && (res.fileResults || []).length === packagingFiles.length) {
                fileResult = (res.fileResults || [])[fIdx];
            }

            row[`File: ${file.name} (Thực tế)`] = fileResult ? (fileResult.actual || 'Không tìm thấy') : 'Không có dữ liệu';
            row[`File: ${file.name} (Ghi chú)`] = fileResult ? (fileResult.notes || '') : '';
            row[`File: ${file.name} (Đánh giá)`] = fileResult ? (fileResult.match ? 'ĐẠT' : 'KHÔNG ĐẠT') : '-';
        });

        data.push(row);
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BaoCaoKiemTra");
    XLSX.writeFile(workbook, `BaoCao_KiemTraBaoBi_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const runPackagingCheck = async () => {
    if (packagingFiles.length === 0) return;
    setAppState(AppState.ANALYZING);
    setLoadingMessage("AI đang quét thiết kế và đối chiếu thông số...");
    
    try {
      // Run AI Check (including QR)
      const result = await analyzePackagingContent(packagingFiles, standardParams);
      
      // Group AI results by standard params to avoid duplicate rows
      const enrichedParams = standardParams.filter(p => p.value.trim() !== '').map(param => {
         // Find the AI result for this param (allow flexible matching if AI slightly alters the key)
         const aiResult = (result.params || []).find((res: any) => 
            res.key && (
              res.key.toLowerCase().trim() === param.key.toLowerCase().trim() ||
              res.key.toLowerCase().trim().includes(param.key.toLowerCase().trim()) ||
              param.key.toLowerCase().trim().includes(res.key.toLowerCase().trim())
            )
         );
         
         if (aiResult) {
            return {
               ...aiResult,
               key: param.key, // Always use the original clean key
               expected: param.value // Always use the original expected value
            };
         } else {
            return {
               key: param.key,
               expected: param.value,
               match: false,
               fileResults: []
            };
         }
      });

      console.log('AI raw result:', result);
      console.log('Enriched params:', enrichedParams);
      setPackagingCheckResult({
        params: enrichedParams
      });
      setPackagingCheckStep(3);
    } catch (e) {
      console.error(e);
      setAlertMessage("Lỗi trong quá trình kiểm tra. Vui lòng thử lại.");
    } finally {
      setAppState(AppState.READY);
    }
  };
  // 1. Ảnh phối cảnh Workflow (Concept)
  // renderConceptWorkflow được tách sang
  // src/components/workflows/ConceptWorkflow.tsx (xem dispatch JSX bên
  // dưới, tìm '<ConceptWorkflow').

  // 2. Xây dựng phối cảnh Workflow (Real Scene Staging)
  const renderStagingWorkflow = () => {
    const displayedProps = Array.from(new Set([...suggestions.props, ...settings.props.map(p => p.name)]));
    return (
      <div className="space-y-6">
        <StepIndicator current={stagingStep} total={5} labels={['Ý tưởng', 'Hiện trạng', 'Style', 'Đạo cụ', 'Xuất bản']} />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={stagingStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {stagingStep === 1 && (
                <div className="space-y-4">
                    <label className="block text-[9px] font-bold text-white uppercase">Mô tả ý tưởng trang trí</label>
                    <textarea className="w-full h-32 bg-[#242526]  border border-[#3E4042] rounded-xl px-4 py-3 text-sm text-white focus:border-[#1877F2] outline-none resize-none transition-colors custom-scrollbar" placeholder="VD: Phòng khách hiện đại với sofa xám, ánh sáng nắng chiều len lỏi qua cửa sổ..." value={settings.concept} onChange={e => setSettings({...settings, concept: e.target.value})} />
                    <button onClick={() => settings.concept ? setStagingStep(2) : setAlertMessage("Thiếu mô tả!")} className="w-full py-4 bg-[#1877F2] text-white font-bold rounded-xl uppercase text-xs shadow-[0_0_20px_rgba(34,211,238,0.2)]">Tiếp tục</button>
                </div>
            )}
            {stagingStep === 2 && (
                <div className="space-y-4">
                    <label className="block text-[9px] font-bold text-white uppercase">Tải lên ảnh hiện trạng</label>
                    <FileDropzone onFilesDrop={(f) => onImageUpload(f, 'product')} onClick={() => productFilesRef.current?.click()} className="aspect-video w-full bg-[#242526]  border-2 border-dashed border-[#3E4042] rounded-xl flex items-center justify-center cursor-pointer overflow-hidden relative group hover:border-[#1877F2] transition-all">
                        {settings.productImages[0] ? <img src={settings.productImages[0]} className="w-full h-full object-contain" referrerPolicy="no-referrer" /> : <span className="text-white font-bold uppercase text-[10px] group-hover:text-[#1877F2]">+ Ảnh thực tế</span>}
                    </FileDropzone>
                    <input type="file" hidden ref={productFilesRef} accept="image/*" onChange={e => onImageUpload(e, 'product')} />

                    <div>
                      <label className="block text-[9px] font-bold text-white uppercase mb-2">Mô tả đặc tính vật liệu (Quan trọng để khử CGI)</label>
                      <textarea 
                        rows={3}
                        placeholder="Ví dụ: Inox xước hairline mờ, tay cầm nhựa nhám, nắp kính cường lực..."
                        className="w-full bg-[#242526] border border-[#3E4042] rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#1877F2] resize-none transition-all placeholder:text-gray-500"
                        value={settings.whiteBGMaterialsDescription || ''}
                        onChange={e => setSettings({...settings, whiteBGMaterialsDescription: e.target.value})}
                      />
                    </div>

                    <button 
                      type="button"
                      disabled={settings.productImages.length === 0 || isAnalyzingMaterial} 
                      onClick={async (e) => {
                        e.preventDefault();
                        if (settings.productImages.length === 0) return;
                        setIsAnalyzingMaterial(true);
                        try {
                          const result = await analyzeProductMaterials(settings.productImages[0]);
                          setSettings(s => ({
                            ...s,
                            whiteBGSelectedCategories: result.categories,
                            whiteBGMaterialsDescription: result.description
                          }));
                        } catch (err: any) {
                          console.error("Auto analyze failed:", err);
                          setAlertMessage(err?.message ? `Lỗi phân tích chất liệu: ${err.message}` : "Lỗi phân tích chất liệu. Vui lòng thử lại.");
                        } finally {
                          setIsAnalyzingMaterial(false);
                        }
                      }}
                      className="w-full py-2 bg-[#2A2B2C] border border-[#1877F2]/30 text-[#1877F2] font-bold rounded-xl text-xs hover:bg-[#1877F2]/10 transition-all flex items-center justify-center gap-2"
                    >
                      {isAnalyzingMaterial ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                      {isAnalyzingMaterial ? 'Đang phân tích chất liệu...' : '✨ Tự động nhận diện chất liệu bằng AI'}
                    </button>

                    <div className="flex gap-2">
                      <button type="button" onClick={() => setStagingStep(1)} className="flex-1 py-4 border border-[#3E4042] text-white rounded-xl text-[10px] font-bold hover:bg-[#242526] ">Quay lại</button>
                      <button type="button" onClick={() => settings.productImages[0] ? setStagingStep(3) : setAlertMessage("Thiếu ảnh!")} className="flex-[2] py-4 bg-[#1877F2] text-white font-bold rounded-xl uppercase text-xs">Tiếp tục</button>
                    </div>
                </div>
            )}
            {stagingStep === 3 && (
                <div className="space-y-4">
                    <label className="block text-[9px] font-bold text-white uppercase">Ảnh mẫu phong cách tham khảo</label>
                    <FileDropzone onFilesDrop={(f) => onImageUpload(f, 'reference')} onClick={() => refFileRef.current?.click()} className="aspect-video w-full bg-[#242526]  border-2 border-dashed border-[#3E4042] rounded-xl flex items-center justify-center cursor-pointer overflow-hidden relative group hover:border-[#1877F2] transition-all">
                        {settings.referenceImage ? <img src={settings.referenceImage} className="w-full h-full object-contain" referrerPolicy="no-referrer" /> : <span className="text-white font-bold uppercase text-[10px] group-hover:text-[#1877F2]">+ Ảnh mẫu phong cách</span>}
                    </FileDropzone>
                    <input type="file" hidden ref={refFileRef} accept="image/*" onChange={e => onImageUpload(e, 'reference')} />
                    <div className="flex gap-2">
                      <button onClick={() => setStagingStep(2)} className="flex-1 py-4 border border-[#3E4042] text-white rounded-xl text-[10px] font-bold hover:bg-[#242526] ">Quay lại</button>
                      <button onClick={handleStagingAnalysis} className="flex-[2] py-4 bg-[#1877F2] text-white font-bold rounded-xl uppercase text-xs">AI Phân tích</button>
                    </div>
                </div>
            )}
            {stagingStep === 4 && (
                <div className="space-y-4">
                    <label className="block text-[9px] font-bold text-white uppercase">Gợi ý đạo cụ phối cảnh</label>
                    <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                       {displayedProps.map(p => (
                         <button key={p} onClick={() => toggleProp(p)} className={`px-3 py-2 rounded-lg border text-[9px] font-bold transition-all ${settings.props.some(i => i.name === p) ? 'bg-[#1877F2] text-white border-[#1877F2]' : 'bg-[#242526] shadow-sm text-white border-[#3E4042] text-white hover:text-white'}`}>{p}</button>
                       ))}
                    </div>
                    <div className="flex gap-2 mt-4 pt-4 border-t border-[#3E4042]">
                       <input type="text" placeholder="Thêm vật phẩm khác..." className="flex-1 bg-[#242526]  border border-[#3E4042] rounded-xl px-4 text-xs text-white outline-none focus:border-[#1877F2]" value={customProp} onChange={e => setCustomProp(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomPropToList()} />
                       <button type="button" onClick={addCustomPropToList} className="px-5 bg-[#3A3B3C] rounded-xl text-white font-bold hover:bg-[#242526]/20 transition-all">+</button>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => setStagingStep(3)} className="flex-1 py-4 border border-[#3E4042] text-white rounded-xl text-[10px] font-bold hover:bg-[#242526] ">Quay lại</button>
                      <button onClick={() => setStagingStep(5)} className="flex-[2] py-4 bg-[#1877F2] text-white font-bold rounded-xl uppercase text-xs">Tiếp tục</button>
                    </div>
                </div>
            )}
            {stagingStep === 5 && (
                <div className="space-y-5">
                   <div className="bg-[#242526]  rounded-xl p-4 border border-[#3E4042] space-y-2 text-center">
                       <h3 className="font-bold text-white text-sm">Sẵn sàng dựng phối cảnh</h3>
                       <p className="text-[10px] text-white">Concept: {settings.concept.substring(0, 30)}... | Props: {settings.props.length}</p>
                   </div>
                   {renderModelSelection()}
                   <button onClick={() => startGeneration()} className="w-full py-4 bg-[#1877F2] text-white font-bold rounded-xl uppercase text-xs shadow-xl">Tạo ảnh</button>
                </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };

  // 3. Ảnh USP công nghệ Workflow (Tech USP Visual)
  const renderTechWorkflow = () => (
    <div className="space-y-6">
      <StepIndicator current={techStep} total={5} labels={['Dữ liệu', 'Kích thước', 'Ý tưởng', 'Visual', 'Xuất bản']} />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={techStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {techStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <input type="text" placeholder="Tên sản phẩm..." className="col-span-2 bg-[#242526]  border border-[#3E4042] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1877F2] transition-colors" value={settings.productName} onChange={e => setSettings({...settings, productName: e.target.value})} />
                <input type="text" placeholder="Mã sản phẩm..." className="bg-[#242526]  border border-[#3E4042] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1877F2] transition-colors" value={settings.productCode || ''} onChange={e => setSettings({...settings, productCode: e.target.value})} />
              </div>
              <textarea placeholder="Mô tả tính năng kỹ thuật..." className="w-full h-24 bg-[#242526]  border border-[#3E4042] rounded-xl px-4 py-3 text-sm text-white resize-none outline-none focus:border-[#1877F2] transition-colors custom-scrollbar" value={settings.techDescription} onChange={e => setSettings({...settings, techDescription: e.target.value})} />
              <FileDropzone onFilesDrop={(f) => onImageUpload(f, 'product')} onClick={() => productFilesRef.current?.click()} className="h-32 w-full bg-[#242526]  border-2 border-dashed border-[#3E4042] rounded-xl flex items-center justify-center cursor-pointer overflow-hidden group hover:border-[#1877F2] transition-all">
                {settings.productImages.length > 0 ? <img src={settings.productImages[0]} className="h-full object-contain" referrerPolicy="no-referrer" /> : <span className="text-white text-xs font-bold uppercase group-hover:text-[#1877F2]">+ Ảnh SP</span>}
              </FileDropzone>
              <input type="file" hidden ref={productFilesRef} accept="image/*" multiple onChange={e => onImageUpload(e, 'product')} />
              <button onClick={() => (settings.productName && settings.techDescription) ? setTechStep(2) : setAlertMessage("Thiếu thông tin")} className="w-full py-4 bg-[#1877F2] text-white font-bold rounded-xl uppercase text-xs">Tiếp tục</button>
            </div>
          )}

          {techStep === 2 && (
            <div className="space-y-4">
              <label className="block text-[9px] font-bold text-white uppercase">Kích thước sản phẩm</label>
              <div className="grid grid-cols-3 gap-3">
                 {['length', 'width', 'height'].map(f => (
                   <input key={f} type="number" placeholder={f === 'length' ? 'Dài (mm)' : f === 'width' ? 'Rộng (mm)' : 'Cao (mm)'} className="bg-[#242526]  border border-[#3E4042] rounded-lg p-3 text-xs text-white outline-none focus:border-[#1877F2] transition-colors" value={(settings.dimensions as any)[f]} onChange={e => setSettings({...settings, dimensions: {...settings.dimensions, [f]: e.target.value}})} />
                 ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setTechStep(1)} className="flex-1 py-4 border border-[#3E4042] text-white rounded-xl text-[10px] font-bold hover:bg-[#242526] ">Quay lại</button>
                <button onClick={handleTechAnalysis} className="flex-[2] py-4 bg-[#1877F2] text-white font-bold rounded-xl uppercase text-xs">AI Thiết kế Visual</button>
              </div>
            </div>
          )}

          {techStep === 3 && (
            <div className="space-y-4">
               <label className="block text-[9px] font-bold text-white uppercase">Chọn Tech Concept</label>
               <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                 {suggestions.concepts.map((c, idx) => (
                   <button key={idx} onClick={() => setSettings({...settings, concept: c.prompt})} className={`w-full text-left p-3 rounded-xl border transition-all ${settings.concept === c.prompt ? 'bg-[#1877F2] text-white border-[#1877F2]' : 'bg-[#242526] shadow-sm text-white border-[#3E4042] text-white hover:bg-[#3A3B3C]'}`}>
                     <div className="font-bold text-[11px] mb-1">{c.title}</div>
                     <div className="text-[10px] leading-relaxed opacity-80 whitespace-pre-line">{c.prompt}</div>
                   </button>
                 ))}
               </div>
               <div className="pt-4 border-t border-[#3E4042] space-y-2">
                  <input type="text" placeholder="Tự nhập tech concept..." className="w-full bg-[#242526]  border border-[#3E4042] rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#1877F2]" value={customConcept} onChange={e => setCustomConcept(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomConceptToList()} />
                  <button onClick={addCustomConceptToList} className="w-full py-2 bg-[#3A3B3C] rounded-lg text-white text-[10px] hover:bg-[#242526]/20">Thêm vào danh sách</button>
               </div>
               <div className="flex gap-2">
                 <button onClick={() => setTechStep(2)} className="flex-1 py-4 border border-[#3E4042] text-white rounded-xl text-[10px] font-bold hover:bg-[#242526] ">Quay lại</button>
                 <button onClick={handleTechVisualSuggestion} className="flex-[2] py-4 bg-[#1877F2] text-white font-bold rounded-xl uppercase text-xs">Tiếp tục</button>
               </div>
            </div>
          )}

          {techStep === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                 <label className="block text-[9px] font-bold text-white uppercase">Vị trí và tỷ lệ sản phẩm</label>
                 <textarea 
                   className="w-full bg-[#242526]  border border-[#3E4042] rounded-xl p-3 text-xs text-white outline-none focus:border-[#1877F2] min-h-[80px] custom-scrollbar"
                   value={settings.placement}
                   onChange={e => setSettings(prev => ({ ...prev, placement: e.target.value }))}
                   placeholder="Nhập vị trí và tỷ lệ sản phẩm..."
                 />
              </div>

              <label className="block text-[9px] font-bold text-white uppercase">Visual Elements</label>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {suggestions.props.map(p => (
                  <button key={p} onClick={() => toggleProp(p)} className={`px-3 py-2 rounded-lg border text-[9px] font-bold transition-all ${settings.props.some(i => i.name === p) ? 'bg-[#1877F2] text-white border-[#1877F2]' : 'bg-[#242526] shadow-sm text-white border-[#3E4042] text-white hover:text-white'}`}>{p}</button>
                ))}
              </div>
              <div className="pt-4 border-t border-[#3E4042] space-y-2">
                 <div className="flex gap-2">
                    <input type="text" placeholder="Thêm visual element..." className="flex-1 bg-[#242526]  border border-[#3E4042] rounded-xl px-4 text-xs text-white outline-none focus:border-[#1877F2]" value={customProp} onChange={e => setCustomProp(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomPropToList()} />
                    <button type="button" onClick={addCustomPropToList} className="px-5 bg-[#3A3B3C] rounded-xl text-white font-bold hover:bg-[#242526]/20 transition-all">+</button>
                 </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setTechStep(3)} className="flex-1 py-4 border border-[#3E4042] text-white rounded-xl text-[10px] font-bold hover:bg-[#242526] ">Quay lại</button>
                <button onClick={() => setTechStep(5)} className="flex-[2] py-4 bg-[#1877F2] text-white font-bold rounded-xl uppercase text-xs">Tiếp tục</button>
              </div>
            </div>
          )}

          {techStep === 5 && renderCameraSettings(() => setTechStep(4))}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  // 4. Làm màu sản phẩm Workflow
  // 4. Đổi màu sản phẩm Workflow (Color Change)
  // renderColorWorkflow được tách sang
  // src/components/workflows/ColorChangeWorkflow.tsx (xem dispatch JSX bên
  // dưới, tìm '<ColorChangeWorkflow').

  // 5. Dựng mockup bao bì Workflow (Packaging Mockup)
  // renderPackagingWorkflow được tách sang
  // src/components/workflows/PackagingMockupWorkflow.tsx (xem dispatch JSX
  // bên dưới, tìm '<PackagingMockupWorkflow').

  // 6. Xử lý chữ ký hình ảnh Workflow (Tech Effects)
  // renderTechEffectsWorkflow được tách sang
  // src/components/workflows/TechEffectsWorkflow.tsx (xem dispatch JSX
  // bên dưới, tìm '<TechEffectsWorkflow').

  // 7. Làm ảnh nền trắng Workflow (White BG Retouch)
  // renderWhiteBgRetouchWorkflow được tách sang
  // src/components/workflows/WhiteBgRetouchWorkflow.tsx (xem dispatch JSX
  // bên dưới, tìm '<WhiteBgRetouchWorkflow').

  // 3D Render sang Ảnh thật Workflow
  // render3DRenderToPhotoWorkflow được tách sang
  // src/components/workflows/Render3DToPhotoWorkflow.tsx (xem dispatch JSX
  // bên dưới, tìm '<Render3DToPhotoWorkflow').

  // 7.6 Chuyển thành Line Art
  
  const renderTracingAssistantWorkflow = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <div>
            <label className="block text-[9px] font-bold text-white uppercase mb-2">Thông tin logo/hình ảnh</label>
            <div className="grid grid-cols-1 gap-2">
              <input type="text" placeholder="Tên logo hoặc mô tả ngắn gọn..." className="col-span-1 bg-[#242526] border border-[#3E4042] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1877F2] transition-colors" value={settings.productName} onChange={e => setSettings({...settings, productName: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-white uppercase mb-2">Yêu cầu chi tiết (Phong cách, Màu sắc...)</label>
            <textarea
              placeholder="Ví dụ: Làm nét, đồ lại mượt mà thành dạng vector phẳng đen trắng, giữ nguyên bố cục..."
              className="w-full bg-[#242526] border border-[#3E4042] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1877F2] transition-colors resize-none h-20"
              value={settings.techDescription}
              onChange={e => setSettings({...settings, techDescription: e.target.value})}
            />
          </div>

          <div>
             <label className="block text-[9px] font-bold text-white uppercase mb-2">Tỷ lệ khung hình</label>
             <select className="w-full bg-[#242526] border border-[#3E4042] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1877F2]" value={settings.aspectRatio} onChange={e => setSettings({...settings, aspectRatio: e.target.value as AspectRatio})}>
                <option value="1:1" className="bg-[#242526]">1:1 Vuông</option>
                <option value="4:3" className="bg-[#242526]">4:3</option>
                <option value="3:4" className="bg-[#242526]">3:4</option>
                <option value="16:9" className="bg-[#242526]">16:9 HD</option>
             </select>
          </div>

          {renderModelSelection()}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[9px] font-bold text-white uppercase mb-2">Ảnh mờ / Logo cần làm nét</label>
            <FileDropzone onFilesDrop={(f) => onImageUpload(f, 'reference')} onClick={() => refFileRef.current?.click()} className="h-48 bg-[#242526] border-2 border-dashed border-[#3E4042] rounded-xl flex items-center justify-center cursor-pointer overflow-hidden group relative hover:border-[#1877F2] transition-all">
               {settings.referenceImage ? (
                 <>
                   <img src={settings.referenceImage} className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                   <div className="absolute inset-0 bg-[#242526] shadow-sm opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-xs font-bold">Thay ảnh</div>
                 </>
               ) : <span className="text-white text-xs font-bold uppercase group-hover:text-[#1877F2]">+ Tải ảnh lên</span>}
            </FileDropzone>
            <input type="file" hidden ref={refFileRef} accept="image/*" onChange={e => onImageUpload(e, 'reference')} />
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button disabled={appState !== AppState.READY} onClick={() => { if (!settings.referenceImage) { setAlertMessage("Vui lòng tải ảnh mờ / logo gốc cần làm nét trước khi tạo."); } else { startGeneration(); } }} className="w-full py-4 bg-[#1877F2] text-white font-bold rounded-xl uppercase text-xs shadow-lg hover:brightness-110 transition-all disabled:opacity-50 flex justify-center items-center gap-2">
          {appState === AppState.GENERATING ? <Loader2 size={16} className="animate-spin" /> : null}
          Tạo ảnh sắc nét 4K
        </button>
      </div>
    </div>
  );

  // renderLineArtWorkflow được tách sang
  // src/components/workflows/LineArtWorkflow.tsx (xem dispatch JSX bên dưới,
  // tìm '<LineArtWorkflow').

  // 8. Tạo hình ảnh chụp trong studio Workflow
  // 8. Chụp ảnh trong Studio Workflow
  // renderStudioWorkflow được tách sang
  // src/components/workflows/StudioWorkflow.tsx (xem dispatch JSX bên
  // dưới, tìm '<StudioWorkflow').

// 9. Phối cảnh Thanh ray & Ổ cắm Workflow
// renderTrackSocketWorkflow được tách sang
// src/components/workflows/TrackSocketWorkflow.tsx (xem dispatch JSX bên
// dưới, tìm '<TrackSocketWorkflow').

  const renderBarcodeQrSidebar = () => (
    <div className="space-y-6">
      <div className="bg-[#242526] p-6 rounded-2xl border border-[#3E4042]">
        <h3 className="text-white font-bold text-lg mb-2">Tạo Mã Vạch & QR Code</h3>
        <p className="text-gray-400 text-sm mb-4">
          Sử dụng công cụ ở phần màn hình chính để tạo:
        </p>
        <ul className="space-y-3 text-sm text-gray-300">
          <li className="flex items-center gap-2"><Check size={16} className="text-[#1877F2]"/> Code 128 (Ký tự + Số)</li>
          <li className="flex items-center gap-2"><Check size={16} className="text-[#1877F2]"/> EAN-13 & EAN-14</li>
          <li className="flex items-center gap-2"><Check size={16} className="text-[#1877F2]"/> QR Code chuẩn Vector</li>
        </ul>
      </div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setCurrentStep(1)} className="w-full py-4 border border-[#3E4042] text-white rounded-xl text-[10px] font-bold hover:bg-[#242526]">Quay lại Menu</button>
      </div>
    </div>
  );

  
  const renderTranslatePackagingSidebar = () => (
    <div className="space-y-6">
      <div className="bg-[#242526] p-6 rounded-2xl border border-[#3E4042]">
        <h3 className="text-white font-bold text-lg mb-2">Dịch bao bì tự động</h3>
        <p className="text-gray-400 text-sm mb-4">
          Công cụ tạo ảnh: AI sẽ tạo lại (recreate) bức ảnh thiết kế của bạn với toàn bộ nội dung tiếng Anh được dịch sang tiếng Việt.
        </p>
      </div>
    </div>
  );

  const renderPackagingCheckSidebar = () => (
    <div className="space-y-6">
      <div className="bg-[#242526] p-6 rounded-2xl border border-[#3E4042]">
        <h3 className="text-white font-bold text-lg mb-2">Kiểm tra Bao Bì</h3>
        <p className="text-gray-400 text-sm mb-4">
          Sử dụng phần màn hình chính để:
        </p>
        <ul className="text-gray-400 text-sm space-y-2 list-disc pl-4">
          <li>Tải lên dữ liệu chuẩn từ file Excel.</li>
          <li>Xem và chỉnh sửa các thông số chuẩn.</li>
          <li>Tải lên file thiết kế dạng ảnh.</li>
          <li>AI sẽ đối chiếu dữ liệu thiết kế với bảng chuẩn và kiểm tra mã QR.</li>
        </ul>
      </div>
    </div>
  );
  // Chọn 1 công cụ từ màn hình chọn công cụ (AppHomeScreen) và chuyển sang
  // bước 2 (thiết lập chi tiết) của công cụ đó.
  const handleSelectTool = (id: string) => {
    setSettings(s => ({ ...s, visualStyle: id as VisualStyle }));
    setConceptStep(1); setTechStep(1); setPackagingStep(1); setTechEffectStep(1); setWhiteBgStep(1); setRender3DStep(1); setWhiteBgWebStep(1); setStagingStep(1); setStudioStep(1); setTrackSocketStep(1);
    setCurrentStep(2);
  };

  const renderSidebar = () => {
    return (
      <div className="animate-fade-in h-full flex flex-col">
         <div className="mb-8 flex items-center justify-between">
           <button 
             onClick={resetMode} 
             className="flex items-center gap-2 text-[10px] font-bold uppercase text-white hover:text-[#1877F2] transition-colors group"
           >
             <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
             Quay lại Menu chính
           </button>
           
           <div className="flex items-center gap-2">
             <button 
               onClick={undoSettings} 
               disabled={!canUndo}
               className="p-1.5 rounded-lg bg-[#242526]  border border-[#3E4042] text-white hover:text-white hover:bg-[#3A3B3C] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
               title="Hoàn tác (Undo)"
             >
               <Undo2 size={14} />
             </button>
             <button 
               onClick={redoSettings} 
               disabled={!canRedo}
               className="p-1.5 rounded-lg bg-[#242526]  border border-[#3E4042] text-white hover:text-white hover:bg-[#3A3B3C] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
               title="Làm lại (Redo)"
             >
               <Redo2 size={14} />
             </button>
           </div>
         </div>
         
         <div className="flex-1">
           <AnimatePresence mode="wait">
             <motion.div
               key={settings.visualStyle}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               transition={{ duration: 0.3 }}
             >
               {settings.visualStyle === 'CONCEPT' && (
                 <ConceptWorkflow
                   settings={settings}
                   setSettings={setSettings}
                   conceptStep={conceptStep}
                   setConceptStep={setConceptStep}
                   suggestions={suggestions}
                   onImageUpload={onImageUpload}
                   isAnalyzingMaterial={isAnalyzingMaterial}
                   setIsAnalyzingMaterial={setIsAnalyzingMaterial}
                   setAlertMessage={setAlertMessage}
                   handleConceptAnalysis={handleConceptAnalysis}
                   handleSelectConcept={handleSelectConcept}
                   handlePropSuggestion={handlePropSuggestion}
                   handleMorePropSuggestion={handleMorePropSuggestion}
                   handleAutoSelectProps={handleAutoSelectProps}
                   handleClearAllProps={handleClearAllProps}
                   customProp={customProp}
                   setCustomProp={setCustomProp}
                   addCustomPropToList={addCustomPropToList}
                   toggleProp={toggleProp}
                   renderCameraSettings={renderCameraSettings}
                 />
               )}
               {settings.visualStyle === 'SCENE_STAGING' && renderStagingWorkflow()}
               {settings.visualStyle === 'TECH_PS' && renderTechWorkflow()}
               {settings.visualStyle === 'COLOR_CHANGE' && (
                 <ColorChangeWorkflow
                   settings={settings}
                   setSettings={setSettings}
                   colorChangeStep={colorChangeStep}
                   setColorChangeStep={setColorChangeStep}
                   currentSampleImage={currentSampleImage}
                   setCurrentSampleImage={setCurrentSampleImage}
                   onImageUpload={onImageUpload}
                   startGeneration={startGeneration}
                 />
               )}
               {settings.visualStyle === 'PACKAGING_MOCKUP' && (
                 <PackagingMockupWorkflow
                   settings={settings}
                   setSettings={setSettings}
                   packagingStep={packagingStep}
                   setPackagingStep={setPackagingStep}
                   pendingPackagingFace={pendingPackagingFace}
                   onImageUpload={onImageUpload}
                   startGeneration={startGeneration}
                 />
               )}
               {settings.visualStyle === 'TECH_EFFECTS' && (
                 <TechEffectsWorkflow
                   settings={settings}
                   setSettings={setSettings}
                   techEffectStep={techEffectStep}
                   setTechEffectStep={setTechEffectStep}
                   concepts={suggestions.concepts}
                   onImageUpload={onImageUpload}
                   handleSeaConceptSuggestion={handleSeaConceptSuggestion}
                   startGeneration={startGeneration}
                 />
               )}
               {settings.visualStyle === 'WHITE_BG_RETOUCH' && (
                 <WhiteBgRetouchWorkflow
                   settings={settings}
                   setSettings={setSettings}
                   whiteBgStep={whiteBgStep}
                   setWhiteBgStep={setWhiteBgStep}
                   onImageUpload={onImageUpload}
                   appState={appState}
                   isAnalyzingMaterial={isAnalyzingMaterial}
                   setIsAnalyzingMaterial={setIsAnalyzingMaterial}
                   setAlertMessage={setAlertMessage}
                   startGeneration={startGeneration}
                 />
               )}
               {settings.visualStyle === '3D_TO_REAL_WHITE_BG' && (
                 <Render3DToPhotoWorkflow
                   settings={settings}
                   setSettings={setSettings}
                   render3DStep={render3DStep}
                   setRender3DStep={setRender3DStep}
                   onImageUpload={onImageUpload}
                   isAnalyzingMaterial={isAnalyzingMaterial}
                   setIsAnalyzingMaterial={setIsAnalyzingMaterial}
                   setAlertMessage={setAlertMessage}
                   startGeneration={startGeneration}
                 />
               )}
               {settings.visualStyle === 'LINE_ART' && (
                 <LineArtWorkflow
                   settings={settings}
                   setSettings={setSettings}
                   onImageUpload={onImageUpload}
                   appState={appState}
                   startGeneration={startGeneration}
                   setAlertMessage={setAlertMessage}
                 />
               )}
               {settings.visualStyle === 'STUDIO' && (
                 <StudioWorkflow
                   settings={settings}
                   setSettings={setSettings}
                   studioStep={studioStep}
                   setStudioStep={setStudioStep}
                   suggestions={suggestions}
                   onImageUpload={onImageUpload}
                   isAnalyzingMaterial={isAnalyzingMaterial}
                   setIsAnalyzingMaterial={setIsAnalyzingMaterial}
                   setAlertMessage={setAlertMessage}
                   handleStudioAnalysis={handleStudioAnalysis}
                   handleSelectStudioConcept={handleSelectStudioConcept}
                   handleStudioPropSuggestion={handleStudioPropSuggestion}
                   handleMoreStudioPropSuggestion={handleMoreStudioPropSuggestion}
                   handleAutoSelectProps={handleAutoSelectProps}
                   handleClearAllProps={handleClearAllProps}
                   customProp={customProp}
                   setCustomProp={setCustomProp}
                   addCustomPropToList={addCustomPropToList}
                   toggleProp={toggleProp}
                   renderCameraSettings={renderCameraSettings}
                 />
               )}
               {settings.visualStyle === 'TRACK_SOCKET_STAGING' && (
                 <TrackSocketWorkflow
                   settings={settings}
                   setSettings={setSettings}
                   trackSocketStep={trackSocketStep}
                   setTrackSocketStep={setTrackSocketStep}
                   onImageUpload={onImageUpload}
                   setAlertMessage={setAlertMessage}
                   renderCameraSettings={renderCameraSettings}
                 />
               )}
               {settings.visualStyle === 'BARCODE_QR_GENERATOR' && renderBarcodeQrSidebar()}
               {settings.visualStyle === 'PACKAGING_CHECK' && renderPackagingCheckSidebar()}
               {settings.visualStyle === 'TRANSLATE_PACKAGING' && renderTranslatePackagingSidebar()}
               {settings.visualStyle === 'TRACING_ASSISTANT' && renderTracingAssistantWorkflow()}
             </motion.div>
           </AnimatePresence>
         </div>
      </div>
    );
  };

  // Dùng lại component chung (đã tách sang src/components/common/ModelSelection.tsx)
  // để các workflow còn lại vẫn gọi renderModelSelection() như cũ, không phải
  // sửa từng chỗ gọi ngay lúc này.
  const renderModelSelection = () => (
    <ModelSelection
      imageSize={settings.imageSize}
      onChange={(size) => setSettings({ ...settings, imageSize: size })}
      imageModel={settings.imageModel}
      onModelChange={(model) => setSettings({ ...settings, imageModel: model })}
    />
  );

  // 13. Kiểm tra bao bì
  
  
  const handleTranslatePackaging = async () => {
    if (!translateImageBase64) return;
    setIsTranslating(true);
    setAlertMessage(null);
    try {
      const { editProductImage } = await import('./services/geminiService');
      const prompt = "Recreate this exact packaging design perfectly. Keep the exact same dieline (cut lines), background graphics, and colors. However, translate all the English text on the packaging into Vietnamese.";
      const newImageUrl = await editProductImage(translateImageBase64, prompt, '1K');
      setTranslatedImageURL(newImageUrl);
      setIsTranslating(false);
    } catch (err: any) {
      console.error(err);
      setAlertMessage("Lỗi dịch: " + err.message);
      setIsTranslating(false);
    }
  };

  const renderCameraSettings = (onBack: () => void) => (
    <div className="space-y-5">
      <div className="bg-[#242526]  rounded-xl p-4 space-y-4 border border-[#3E4042]">
         <div className="space-y-2">
            <div className="flex justify-between text-[9px] font-bold text-white uppercase"><span>Góc chụp</span><span className="text-[#caf0f8]">{settings.camera.angle}°</span></div>
            <input type="range" min="-15" max="90" step="5" className="w-full h-1 bg-[#3A3B3C] rounded-lg appearance-none cursor-pointer" value={settings.camera.angle} onChange={e => setSettings({...settings, camera: {...settings.camera, angle: parseInt(e.target.value)}})} />
         </div>
         <div className="space-y-2">
            <div className="flex justify-between text-[9px] font-bold text-white uppercase"><span>Tiêu cự</span><span className="text-[#caf0f8]">{settings.camera.focalLength}mm</span></div>
            <input type="range" min="12" max="200" step="1" className="w-full h-1 bg-[#3A3B3C] rounded-lg appearance-none cursor-pointer" value={settings.camera.focalLength} onChange={e => setSettings({...settings, camera: {...settings.camera, focalLength: parseInt(e.target.value)}})} />
         </div>
         <div className="grid grid-cols-2 gap-3">
           <div>
              <label className="block text-[8px] font-bold text-white uppercase mb-1">Khẩu độ</label>
              <select className="w-full bg-[#242526]  border border-[#3E4042] rounded-lg p-2 text-[10px] text-white outline-none focus:border-[#caf0f8]" value={settings.camera.aperture} onChange={e => setSettings({...settings, camera: {...settings.camera, aperture: e.target.value}})}>
                {CAMERA_APERTURES.map(a => <option key={a} value={a} className="bg-[#242526]">{a}</option>)}
              </select>
           </div>
           <div>
              <label className="block text-[8px] font-bold text-white uppercase mb-1">ISO</label>
              <select className="w-full bg-[#242526]  border border-[#3E4042] rounded-lg p-2 text-[10px] text-white outline-none focus:border-[#caf0f8]" value={settings.camera.iso} onChange={e => setSettings({...settings, camera: {...settings.camera, iso: e.target.value}})}>
                {CAMERA_ISO.map(i => <option key={i} value={i} className="bg-[#242526]">{i}</option>)}
              </select>
           </div>
         </div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        <div>
           <label className="block text-[9px] font-bold text-white uppercase mb-1">Tỷ lệ</label>
           <select className="w-full bg-[#242526]  border border-[#3E4042] rounded-lg p-2 text-[10px] text-white outline-none" value={settings.aspectRatio} onChange={e => setSettings({...settings, aspectRatio: e.target.value as AspectRatio})}>
              <option value="1:1" className="bg-[#242526]">1:1 Vuông</option><option value="16:9" className="bg-[#242526]">16:9 HD</option><option value="9:16" className="bg-[#242526]">9:16</option><option value="4:3" className="bg-[#242526]">4:3</option><option value="3:4" className="bg-[#242526]">3:4</option><option value="1:4" className="bg-[#242526]">1:4</option><option value="4:1" className="bg-[#242526]">4:1</option>
           </select>
        </div>
      </div>
      {renderModelSelection()}
      <div className="flex gap-2">
        <button onClick={onBack} className="flex-1 py-4 border border-[#3E4042] text-white rounded-xl uppercase text-[10px] font-bold">Quay lại</button>
        <button onClick={() => startGeneration()} className="flex-[2] bg-[#1877F2] text-white font-bold py-4 rounded-xl uppercase text-[12px] shadow-xl">Tạo ảnh</button>
      </div>
    </div>
  );

  if (isLocked) {
    return <LockScreen onUnlock={() => setIsLocked(false)} />;
  }

  const getDownloadFileName = (image: GeneratedImage) => {
    if (image.settings?.visualStyle === 'COLOR_CHANGE') {
      return 'Sản phẩm mới.png';
    }
    const code = image.settings?.productCode?.trim();
    return code ? `${code}.png` : `elmich-ai-${image.id}.png`;
  };

  const handleDownload = (e: React.MouseEvent, image: GeneratedImage) => {
    e.preventDefault();
    setAskFeedbackImage(image);
    
    // Convert base64 to blob to prevent URI length limits in browsers for 4K images
    fetch(image.url)
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = getDownloadFileName(image);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      })
      .catch(err => console.error('Download failed:', err));
  };

  const calculateCost = (image: GeneratedImage) => {
    // Giá theo ảnh (Standard tier), phụ thuộc tầng model người dùng đã chọn:
    // FLASH (gemini-3.1-flash-image): 1K=$0.067, 2K=$0.101, 4K=$0.151.
    // PRO (gemini-3-pro-image): 1K/2K=$0.134, 4K=$0.24.
    let cost = image.settings.imageModel === 'PRO'
      ? (image.settings.imageSize === '4K' ? 0.24 : 0.134)
      : (image.settings.imageSize === '4K' ? 0.151 : image.settings.imageSize === '2K' ? 0.101 : 0.067);

    // Prompt generation cost (Step 1, dùng gemini-2.5-pro) — ước tính gần
    // đúng cho 1 lượt "thinking" (nhúng 3 file manual + prompt sinh ra).
    if (image.settings.visualStyle === 'CONCEPT' || image.settings.visualStyle === 'STUDIO') {
      cost += 0.01;
    }

    return cost;
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
    }
    // Xóa luôn khỏi Lịch sử dùng chung (server) — nếu không, phiên vừa xóa
    // cục bộ có thể "sống lại" ở lần sau nhờ cơ chế fallback tải từ server
    // khi cache trình duyệt trống (xem effect load chatSessions phía trên).
    deleteChatHistorySession(sessionId).catch(() => {});
  };

  // Mở 1 phiên chat cũ từ tab "Lịch sử" ngay trong Trợ lý Chat để xem tiếp/
  // trả lời tiếp, không cần tìm lại từ đầu.
  const handleOpenChatFromHistory = (sessionId: string, session: import('./types').ChatSession) => {
    setChatSessions(prev => {
      const exists = prev.some(s => s.id === sessionId);
      return exists ? prev.map(s => (s.id === sessionId ? session : s)) : [session, ...prev];
    });
    setActiveSessionId(sessionId);
    setViewMode('chat');
  };

  // 3 workflow này luôn có nội dung riêng ở cột "Center Feed" (không phụ
  // thuộc activeImage) — các workflow còn lại chỉ cần cột này khi đã có
  // kết quả; nếu chưa có, ẩn hẳn cột này để form bên trái dùng full chiều
  // ngang, đỡ phải kéo thanh trượt dọc.
  const isSpecialFullFeedStyle = settings.visualStyle === 'BARCODE_QR_GENERATOR' || settings.visualStyle === 'TRANSLATE_PACKAGING' || settings.visualStyle === 'PACKAGING_CHECK';
  const showResultSection = isSpecialFullFeedStyle || !!activeImage;

  return (
    <div className="min-h-screen bg-[#18191A] text-white font-sans flex flex-col relative animate-fade-in">
      {/* Nút Handbook nổi nhỏ gọn — thay cho Header đã ẩn, không chiếm chỗ
          như 1 thanh header đầy đủ. */}
      <button
        onClick={() => setIsHandbookOpen(true)}
        className="fixed top-3 right-3 z-40 w-10 h-10 rounded-full bg-[#242526] border border-[#3E4042] text-[#1877F2] hover:bg-[#3A3B3C] flex items-center justify-center shadow-lg transition-colors"
        title="Xem Handbook & Hướng dẫn kỹ thuật"
      >
        <BookOpen size={18} />
      </button>

      <ProviderSettingsButton />

      <HandbookModal
        isOpen={isHandbookOpen}
        onClose={() => setIsHandbookOpen(false)}
      />

      <LoadingModal
        appState={appState}
        loadingMessage={loadingMessage}
      />

      <AnimatePresence>
        {alertMessage && (
          <motion.div initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: -20, x: '-50%' }} className="fixed top-16 left-1/2 z-[100] bg-gray-900 border border-gray-700 text-white font-semibold px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 min-w-[300px] justify-between">
             <span className="text-[14px] leading-snug">{alertMessage}</span>
             <button onClick={() => setAlertMessage(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800 transition-colors shrink-0 text-gray-400 hover:text-white"><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>
      

      {viewMode === 'studio' ? (
      <main className="flex-1 flex flex-col max-w-[1920px] mx-auto w-full relative xl:h-screen bg-[#18191A] xl:bg-[#242526] xl:py-0">
        {currentStep === 1 ? (
          <AppHomeScreen
            tools={APP_TOOLS}
            onSelectTool={handleSelectTool}
            onSelectChat={() => setViewMode('chat')}
            onSelectHistory={() => setViewMode('history')}
          />
        ) : (
        <>
        <div className="flex-1 flex flex-col xl:flex-row overflow-hidden min-h-0">
        {/* Left Sidebar Layout */}
        {settings.visualStyle !== 'PACKAGING_CHECK' && (
        <aside className={`w-full ${showResultSection ? 'xl:w-[480px] shrink-0 xl:border-r xl:border-[#3E4042]' : 'xl:flex-1'} xl:h-full xl:overflow-y-auto custom-scrollbar px-2 mb-8 xl:mb-0 xl:pt-4 bg-[#242526] xl:bg-transparent flex flex-col`}>
          <div className="space-y-1">
             <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#3A3B3C] text-left transition-colors" onClick={() => setCurrentStep(1)}>
                <div className="w-9 h-9 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold">AE</div>
                <span className="font-semibold text-[15px] text-white">Ai Image Elmich</span>
             </button>
          </div>
          <div className="mt-4 border-t border-[#3E4042] pt-4 px-2">
            <h3 className="text-white font-semibold text-[17px] mb-2 px-2">Công cụ</h3>
            {renderSidebar()}
          </div>
        
          

        </aside>
        )}

        {/* Center Feed Layout */}
        {showResultSection && (
        <section className={`flex-1 w-full mx-auto px-0 sm:px-4 flex flex-col gap-4 pb-20 mt-4 xl:mt-0 xl:h-full xl:overflow-y-auto custom-scrollbar xl:pt-4 bg-[#18191A] xl:bg-transparent ${settings.visualStyle === 'PACKAGING_CHECK' ? 'max-w-[1400px]' : 'max-w-[1000px]'}`}>

          {settings.visualStyle === 'BARCODE_QR_GENERATOR' ? (
            <BarcodeGenerator />
          ) : settings.visualStyle === 'TRANSLATE_PACKAGING' ? (
            <div className="bg-[#242526] rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.2)] xl:shadow-none xl:border xl:border-[#3E4042] p-6">
               <TranslatePackagingWorkflow 
                 onBackToMenu={() => setCurrentStep(1)} 
                 setAlertMessage={setAlertMessage} 
               />
            </div>
          ) : settings.visualStyle === 'PACKAGING_CHECK' ? (
            <div className="bg-[#242526] rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.2)] xl:shadow-none xl:border xl:border-[#3E4042] p-6">
               <PackagingCheckWorkflow 
                 onBackToMenu={() => setCurrentStep(1)} 
                 appState={appState} 
                 setAppState={setAppState} 
                 setLoadingMessage={setLoadingMessage} 
                 setAlertMessage={setAlertMessage} 
               />
            </div>
          ) : activeImage ? (
            // Chỉ hiện panel này khi đã có kết quả (activeImage) — trước đó
            // (đang điền form/thiết lập) không hiện gì ở cột này nữa.
            <div className="bg-[#242526] rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.2)] xl:shadow-none xl:border xl:border-[#3E4042]">
               <div className="border-b border-[#3E4042] p-4 font-semibold text-[17px] text-white flex justify-between items-center">
                   Trạng thái làm việc
               </div>
               {/* Feed / Main Image section */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between p-4 px-4">
                     <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold">AE</div>
                        <div>
                          <p className="font-semibold text-[15px] text-white">{activeImage.settings.productName || 'Ai Image Elmich'} <span className="font-normal text-white text-[13px]">đã tạo ảnh mới.</span></p>
                          <p className="text-[13px] text-white">Phiên bản 0{activeImage.variant} • Chi phí ${calculateCost(activeImage).toFixed(3)}</p>
                        </div>
                     </div>
                  </div>
                  <div className="p-4 pt-0">
     <p className="font-semibold text-[15px] text-white mb-2">{activeImage.settings.conceptTitle || activeImage.settings.techTitle || (activeImage.settings.concept ? `Yêu cầu: ${activeImage.settings.concept.substring(0, 100)}...` : `Chế độ: ${activeImage.settings.visualStyle}`)}</p>
     <details className="bg-[#18191A] p-3 rounded-lg border border-[#3E4042] group cursor-pointer marker:content-[''] outline-none">
       <summary className="text-[11px] font-bold text-white outline-none uppercase flex items-center justify-between select-none">
         <span>Hiện prompt</span>
         <ChevronDown size={14} className="group-open:rotate-180 transition-transform" />
       </summary>
       <div className="mt-2 pt-2 border-t border-[#3E4042] cursor-text">
         <p className="text-[13px] text-white whitespace-pre-wrap font-mono leading-relaxed">{activeImage.prompt}</p>
       </div>
     </details>
  </div>
                  <div className="bg-[#3A3B3C] w-full relative">
                     <img src={activeImage.url} alt="Generated" className="w-full max-h-[70vh] object-contain block mx-auto" />
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between border-b border-[#3E4042]">
                     <div className="flex items-center gap-1 text-white text-[15px]">
                       <div className="w-5 h-5 rounded-full bg-[#1877F2] flex items-center justify-center shadow-sm">
                          <Check size={12} className="text-white" />
                       </div>
                       Tạo thành công
                     </div>
                  </div>
                  <div className="flex px-2 py-1 border-b border-[#3E4042]">
                     <a href="#" onClick={(e) => handleDownload(e, activeImage)} className="flex-1 flex gap-2 items-center justify-center py-2 text-white font-semibold text-[15px] hover:bg-[#18191A] rounded-md mx-1 transition-colors">
                        <Download size={20} /> Tải xuống
                     </a>
                     <button onClick={handleStartNewSession} className="flex-1 flex gap-2 items-center justify-center py-2 text-white font-semibold text-[15px] hover:bg-[#18191A] rounded-md mx-1 transition-colors">
                        <Plus size={20} /> Tạo ảnh khác
                     </button>
                  </div>
                  
                  {/* Edit AI Image Section inside the post (comments area) */}
                  <div className="p-4 bg-[#18191A] rounded-b-lg flex flex-col gap-3">
                    <p className="font-semibold text-[13px] text-white">Chỉnh sửa ảnh với AI</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                       <select
                         value={editQuality}
                         onChange={e => setEditQuality(e.target.value as ImageSize)}
                         disabled={isEditingImage}
                         className="flex-1 bg-[#242526] border border-[#3E4042] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#1877F2]"
                       >
                         <option value="1K">1K Standard</option>
                         <option value="2K">2K Pro</option>
                         <option value="4K">4K Ultra</option>
                       </select>
                       <select
                         value={editModel}
                         onChange={e => setEditModel(e.target.value as ImageModelTier)}
                         disabled={isEditingImage}
                         className="flex-1 bg-[#242526] border border-[#3E4042] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#1877F2]"
                       >
                         <option value="FLASH">Flash (nhanh, rẻ)</option>
                         <option value="PRO">Pro (chất lượng cao)</option>
                       </select>
                    </div>

                    <div className="mb-2">
                        <FileDropzone onFilesDrop={(f) => onImageUpload(f, 'edit_reference')} onClick={() => editRefFileRef.current?.click()} className="h-20 w-full bg-[#242526] border-2 border-dashed border-[#3E4042] rounded-xl flex items-center justify-center cursor-pointer overflow-hidden group relative hover:border-[#1877F2] transition-all">
                           {editReferenceImage ? (
                             <>
                               <img src={editReferenceImage} className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                               <div className="absolute inset-0 bg-[#242526]/80 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-xs font-bold text-white z-10">Thay ảnh đính kèm</div>
                               <button onClick={(e) => { e.stopPropagation(); setEditReferenceImage(null); }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center z-20 hover:bg-red-600">×</button>
                             </>
                           ) : <span className="text-white text-xs font-bold uppercase group-hover:text-[#1877F2]">+ Tải ảnh tham chiếu (Tùy chọn)</span>}
                        </FileDropzone>
                        <input type="file" hidden ref={editRefFileRef} accept="image/*" onChange={e => onImageUpload(e, 'edit_reference')} />
                    </div>

                    <textarea value={editPrompt} onChange={e => setEditPrompt(e.target.value)} disabled={isEditingImage} placeholder="Viết yêu cầu chỉnh sửa..." className="w-full bg-[#242526] border border-[#3E4042] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#1877F2] resize-none h-16" />
                    <button onClick={handleEditImage} disabled={!editPrompt.trim() || isEditingImage} className="w-full py-2 bg-[#1877F2] text-white font-semibold rounded-lg hover:bg-[#166FE5] disabled:opacity-50">
                       {isEditingImage ? 'Đang xử lý...' : 'Chỉnh sửa'}
                    </button>
                  </div>
                </div>
          </div>
          ) : null}

          </section>
        )}
        </div>

      {/* Footer Gallery Rail */}
      {settings.visualStyle !== 'BARCODE_QR_GENERATOR' && settings.visualStyle !== 'PACKAGING_CHECK' && (
        <GalleryRail
          gallery={gallery}
          activeImage={activeImage}
          setActiveImage={setActiveImage}
          onClearGallery={() => {
            setGallery([]);
            setActiveImage(null);
          }}
        />
      )}
        </>
        )}
      </main>
      ) : viewMode === 'chat' ? (
        <ChatView
          chatSessions={chatSessions}
          setChatSessions={setChatSessions}
          activeSessionId={activeSessionId}
          setActiveSessionId={setActiveSessionId}
          handleDeleteSession={handleDeleteSession}
          onBackToHome={() => { setViewMode('studio'); setCurrentStep(1); }}
        />
      ) : (
        <HistoryView onOpenChat={handleOpenChatFromHistory} onBackToHome={() => { setViewMode('studio'); setCurrentStep(1); }} />
      )}

      {/* Feedback Modal */}
      <AnimatePresence>
        {askFeedbackImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/60 flex items-center justify-center p-4"
            onClick={() => setAskFeedbackImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#242526] rounded-xl shadow-2xl max-w-sm w-full overflow-hidden"
            >
              <div className="p-4 border-b border-[#3E4042]">
                <h3 className="font-bold text-lg text-center">Ảnh này có đạt yêu cầu không?</h3>
              </div>
              <div className="p-4 text-center text-white">
                <p>Phản hồi của bạn giúp AI học hỏi và tạo ra kết quả tốt hơn trong những lần sau.</p>
              </div>
              <div className="flex border-t border-[#3E4042]">
                <button
                  className="flex-1 py-3 font-semibold text-white hover:bg-[#18191A] transition-colors border-r border-[#3E4042]"
                  onClick={() => {
                    rateGeneratedImage(askFeedbackImage.id, 'bad').catch(() => {});
                    setAskFeedbackImage(null);
                  }}
                >
                  Không hẳn
                </button>
                <button
                  className="flex-1 py-3 font-bold text-[#1877F2] hover:bg-[#18191A] transition-colors"
                  onClick={() => {
                    const newPrompt: SuccessfulPrompt = {
                      id: Date.now().toString(),
                      imageSettings: askFeedbackImage.settings,
                      timestamp: Date.now()
                    };
                    setSuccessfulPrompts(prev => [...prev, newPrompt]);
                    // Ghi lên Lịch sử dùng chung để CẢ ĐỘI cùng hưởng chỉ dẫn đúc kết
                    // theo dòng sản phẩm này ở lần tạo ảnh sau (không chỉ riêng trình
                    // duyệt này) — xem fetchCategoryGuidance() trong startGeneration().
                    rateGeneratedImage(askFeedbackImage.id, 'good').catch(() => {});
                    setAskFeedbackImage(null);
                  }}
                >
                  Rất tốt!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;