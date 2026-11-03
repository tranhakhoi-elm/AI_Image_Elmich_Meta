import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image as ImageIcon, MessageCircle, Loader2, X, RefreshCw, Search, Trash2, Copy, Check, Send, ArrowLeft, Heart } from 'lucide-react';
import {
  fetchImageHistory,
  fetchChatHistory,
  deleteGeneratedImage,
  deleteChatHistorySession,
  rateGeneratedImage,
  ImageHistoryRecord,
  ChatHistorySession,
} from '../../../services/historyService';

type HistoryTab = 'images' | 'chats';

const STYLE_NAMES: Record<string, string> = {
  CONCEPT: 'Concept Lifestyle',
  SCENE_STAGING: 'Phối cảnh Thực tế',
  TECH_PS: 'Điểm mạnh Kỹ thuật',
  COLOR_CHANGE: 'Đổi màu Pantone',
  PACKAGING_MOCKUP: 'Mockup Bao bì 3D',
  TECH_EFFECTS: 'Hiệu ứng Công nghệ',
  WHITE_BG_RETOUCH: 'Retouch Phông trắng',
  '3D_TO_REAL_WHITE_BG': 'Render 3D sang Ảnh thật',
  TRACING_ASSISTANT: 'Trợ lý Đồ nét',
  LINE_ART: 'Bản vẽ Kỹ thuật',
  STUDIO: 'Chụp Studio Nghệ thuật',
  TRACK_SOCKET_STAGING: 'Ray Ổ Cắm',
  TRANSLATE_PACKAGING: 'Dịch Bao bì',
  PACKAGING_CHECK: 'Kiểm duyệt Bao bì',
};

const LoadingState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
    <Loader2 size={28} className="animate-spin text-[#1877F2]" />
    <span className="text-sm">Đang tải lịch sử...</span>
  </div>
);

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-2">
    <ImageIcon size={32} className="text-gray-600" />
    <span className="text-sm">{text}</span>
  </div>
);

const HistoryErrorState: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs rounded-xl p-4 mb-4">
    <div className="font-bold mb-1">Chưa thể tải Lịch sử dùng chung</div>
    <div>{message}</div>
    <div className="mt-2 text-yellow-400/80">
      Nếu bạn là quản trị hệ thống: kiểm tra biến môi trường{' '}
      <code className="bg-black/30 px-1 rounded">GCS_BUCKET_NAME</code> và quyền Firestore/Storage của
      Service Account — xem <code className="bg-black/30 px-1 rounded">ARCHITECTURE.md</code>.
    </div>
  </div>
);

export interface HistoryViewProps {
  /** Gọi khi người dùng bấm "Mở trong Trợ lý Chat" ở 1 phiên chat cũ — App.tsx
   * chịu trách nhiệm nạp session này vào state chatSessions và chuyển viewMode. */
  onOpenChat?: (sessionId: string, session: ChatHistorySession) => void;
  onBackToHome: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onOpenChat, onBackToHome }) => {
  const [tab, setTab] = useState<HistoryTab>('images');
  const [searchQuery, setSearchQuery] = useState('');
  const [styleFilter, setStyleFilter] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [images, setImages] = useState<ImageHistoryRecord[]>([]);
  const [imagesCursor, setImagesCursor] = useState<string | null>(null);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imagesError, setImagesError] = useState<string | null>(null);
  const [imagesLoadedOnce, setImagesLoadedOnce] = useState(false);
  const [activeImage, setActiveImage] = useState<ImageHistoryRecord | null>(null);

  const [chats, setChats] = useState<ChatHistorySession[]>([]);
  const [chatsCursor, setChatsCursor] = useState<string | null>(null);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [chatsError, setChatsError] = useState<string | null>(null);
  const [chatsLoadedOnce, setChatsLoadedOnce] = useState(false);
  const [expandedChatId, setExpandedChatId] = useState<string | null>(null);
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<{ type: 'image' | 'chat'; id: string; title: string } | null>(null);

  const loadImages = useCallback(async (cursor?: string) => {
    setImagesLoading(true);
    setImagesError(null);
    const res = await fetchImageHistory(cursor);
    if (res.success) {
      setImages(prev => (cursor ? [...prev, ...(res.items || [])] : res.items || []));
      setImagesCursor(res.nextCursor || null);
    } else {
      setImagesError(res.error || 'Không tải được lịch sử ảnh.');
    }
    setImagesLoading(false);
    setImagesLoadedOnce(true);
  }, []);

  const loadChats = useCallback(async (cursor?: string) => {
    setChatsLoading(true);
    setChatsError(null);
    const res = await fetchChatHistory(cursor);
    if (res.success) {
      setChats(prev => (cursor ? [...prev, ...(res.items || [])] : res.items || []));
      setChatsCursor(res.nextCursor || null);
    } else {
      setChatsError(res.error || 'Không tải được lịch sử chat.');
    }
    setChatsLoading(false);
    setChatsLoadedOnce(true);
  }, []);

  useEffect(() => {
    if (tab === 'images' && !imagesLoadedOnce) loadImages();
    if (tab === 'chats' && !chatsLoadedOnce) loadChats();
  }, [tab, imagesLoadedOnce, chatsLoadedOnce, loadImages, loadChats]);

  const handleDeleteImage = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setConfirmDeleteTarget({ type: 'image', id, title: 'ảnh này' });
  };

  const handleDeleteChat = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setConfirmDeleteTarget({ type: 'chat', id, title: 'đoạn chat này' });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteTarget) return;
    const { type, id } = confirmDeleteTarget;
    setConfirmDeleteTarget(null);
    if (type === 'image') {
      const ok = await deleteGeneratedImage(id);
      if (ok) {
        setImages(prev => prev.filter(img => img.id !== id));
        if (activeImage?.id === id) setActiveImage(null);
      }
    } else {
      const ok = await deleteChatHistorySession(id);
      if (ok) {
        setChats(prev => prev.filter(c => c.id !== id));
        if (expandedChatId === id) setExpandedChatId(null);
      }
    }
  };

  // Thả tim = đánh giá "Rất tốt!" ngay từ lưới Lịch sử — có tác dụng y hệt
  // nút "Rất tốt!" ở modal phản hồi sau khi tạo ảnh (rateGeneratedImage()):
  // giúp cả ảnh tạo qua 11 workflow lẫn ảnh tạo qua Chat (trước đây không có
  // cách nào để rate) đều có thể đóng góp vào category guidance (xem
  // ARCHITECTURE.md mục 8.5). Cập nhật lạc quan trên UI trước, bắn-và-quên
  // request thật — không chặn thao tác của người dùng.
  const handleRateGood = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setImages(prev => prev.map(img => (img.id === id ? { ...img, rating: 'good' } : img)));
    setActiveImage(prev => (prev?.id === id ? { ...prev, rating: 'good' } : prev));
    rateGeneratedImage(id, 'good').catch(() => {});
  };

  const handleCopyPrompt = (id: string, text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {});
  };

  const filteredImages = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return images.filter(img => {
      const matchQuery = !query
        || img.productName?.toLowerCase().includes(query)
        || img.productCode?.toLowerCase().includes(query)
        || img.prompt?.toLowerCase().includes(query);
      const matchStyle = styleFilter === 'ALL' || img.visualStyle === styleFilter;
      return matchQuery && matchStyle;
    });
  }, [images, searchQuery, styleFilter]);

  const filteredChats = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return chats.filter(c => !query || c.title?.toLowerCase().includes(query));
  }, [chats, searchQuery]);

  return (
    <main className="flex-1 flex flex-col max-w-[1400px] mx-auto w-full p-3 sm:p-4 md:p-6 pb-24 md:pb-8 gap-4 text-white overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            onClick={onBackToHome}
            className="p-2 rounded-xl bg-[#18191A] border border-[#3E4042] text-gray-300 hover:text-white shrink-0"
            title="Quay lại màn hình chọn công cụ"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold truncate">Lịch sử dùng chung</h1>
            <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
              Ảnh và đoạn chat được lưu trên máy chủ chung của team.
            </p>
          </div>
        </div>
        <button
          onClick={() => (tab === 'images' ? loadImages() : loadChats())}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-[#3A3B3C] transition-colors shrink-0"
        >
          <RefreshCw size={14} className={imagesLoading || chatsLoading ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Làm mới</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
        <div className="grid grid-cols-2 sm:flex sm:items-center bg-[#18191A] p-1 rounded-xl border border-[#3E4042] w-full sm:w-fit shrink-0 gap-1">
          <button
            onClick={() => setTab('images')}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === 'images' ? 'bg-[#1877F2] text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            <ImageIcon size={14} /> Ảnh ({images.length})
          </button>
          <button
            onClick={() => setTab('chats')}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === 'chats' ? 'bg-[#1877F2] text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            <MessageCircle size={14} /> Chat ({chats.length})
          </button>
        </div>

        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={tab === 'images' ? 'Tìm theo tên sản phẩm, mã...' : 'Tìm đoạn chat...'}
            className="w-full bg-[#18191A] border border-[#3E4042] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#1877F2]"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              <X size={13} />
            </button>
          )}
        </div>

        {tab === 'images' && (
          <select
            value={styleFilter}
            onChange={e => setStyleFilter(e.target.value)}
            className="bg-[#18191A] border border-[#3E4042] rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer shrink-0 w-full sm:w-auto"
          >
            <option value="ALL">Tất cả workflow</option>
            {Object.entries(STYLE_NAMES).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex-1">
        {tab === 'images' && (
          <>
            {imagesError && <HistoryErrorState message={imagesError} />}
            {!imagesError && imagesLoadedOnce && images.length === 0 && (
              <EmptyState text="Chưa có ảnh nào được ghi vào lịch sử dùng chung." />
            )}
            {!imagesError && imagesLoadedOnce && images.length > 0 && filteredImages.length === 0 && (
              <EmptyState text="Không tìm thấy ảnh khớp với bộ lọc hiện tại." />
            )}
            {filteredImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredImages.map(img => (
                  <div
                    key={img.id}
                    onClick={() => setActiveImage(img)}
                    className="text-left bg-[#242526] border border-[#3E4042] rounded-xl overflow-hidden hover:border-[#1877F2] transition-colors group cursor-pointer"
                  >
                    <div className="relative aspect-square bg-[#18191A] overflow-hidden">
                      {img.imageUrl ? (
                        <img
                          src={img.imageUrl}
                          alt={img.productName || img.visualStyle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs text-center p-2">
                          Link xem đã hết hạn
                        </div>
                      )}
                      <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                        <button
                          onClick={(e) => (img.rating === 'good' ? e.stopPropagation() : handleRateGood(img.id, e))}
                          disabled={img.rating === 'good'}
                          className={`p-1.5 rounded-full transition-all bg-black/70 ${
                            img.rating === 'good'
                              ? 'text-red-500 opacity-100'
                              : 'text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:text-red-500'
                          }`}
                          title={img.rating === 'good' ? 'Đã đánh giá "Rất tốt!"' : 'Đánh giá "Rất tốt!" — giúp AI học chỉ dẫn cho dòng sản phẩm này'}
                        >
                          <Heart size={13} fill={img.rating === 'good' ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteImage(img.id, e)}
                          className="p-1.5 bg-black/70 hover:bg-red-600 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                          title="Xóa ảnh khỏi lịch sử"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      {img.visualStyle && (
                        <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm text-[9px] text-white font-semibold px-1.5 py-0.5 rounded-md">
                          {STYLE_NAMES[img.visualStyle] || img.visualStyle}
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <div className="text-xs font-semibold text-white truncate">
                        {img.productName || img.visualStyle || 'Không tên'}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {new Date(img.timestamp).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {imagesCursor && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => loadImages(imagesCursor)}
                  disabled={imagesLoading}
                  className="px-4 py-2 bg-[#3A3B3C] hover:bg-[#4E4F50] rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-2"
                >
                  {imagesLoading && <Loader2 size={14} className="animate-spin" />}
                  Tải thêm
                </button>
              </div>
            )}
            {imagesLoading && images.length === 0 && <LoadingState />}
          </>
        )}

        {tab === 'chats' && (
          <>
            {chatsError && <HistoryErrorState message={chatsError} />}
            {!chatsError && chatsLoadedOnce && chats.length === 0 && (
              <EmptyState text="Chưa có đoạn chat nào được ghi vào lịch sử dùng chung." />
            )}
            {!chatsError && chatsLoadedOnce && chats.length > 0 && filteredChats.length === 0 && (
              <EmptyState text="Không tìm thấy đoạn chat khớp với từ khóa." />
            )}
            <div className="space-y-3">
              {filteredChats.map(session => (
                <div key={session.id} className="bg-[#242526] border border-[#3E4042] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedChatId(prev => (prev === session.id ? null : session.id))}
                    className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-[#2f3031] transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white truncate">{session.title || 'Đoạn chat'}</div>
                      <div className="text-[11px] text-gray-400">
                        {new Date(session.timestamp).toLocaleString('vi-VN')} · {session.messages.length} tin nhắn
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {onOpenChat && (
                        <span
                          role="button"
                          onClick={(e) => { e.stopPropagation(); onOpenChat(session.id, session); }}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-[#1877F2] hover:bg-[#18191A] transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                          title="Mở trong Trợ lý Chat"
                        >
                          <Send size={14} />
                        </span>
                      )}
                      <span
                        role="button"
                        onClick={(e) => handleDeleteChat(session.id, e)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-[#18191A] transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                        title="Xóa đoạn chat này"
                      >
                        <Trash2 size={14} />
                      </span>
                    </div>
                  </button>
                  {expandedChatId === session.id && (
                    <div className="border-t border-[#3E4042] p-4 space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar">
                      {session.messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`px-3 py-2 rounded-2xl max-w-[80%] text-sm break-words flex flex-col gap-2 ${
                              msg.role === 'user'
                                ? 'bg-[#1877F2] text-white'
                                : 'bg-[#18191A] text-white border border-[#3A3B3C]'
                            }`}
                          >
                            {msg.text && <span className="whitespace-pre-wrap">{msg.text}</span>}
                            {msg.uploadedImageUrl && (
                              <img src={msg.uploadedImageUrl} className="max-w-[280px] rounded-lg" referrerPolicy="no-referrer" />
                            )}
                            {msg.imageUrl && (
                              <img src={msg.imageUrl} className="max-w-[280px] rounded-lg" referrerPolicy="no-referrer" />
                            )}
                          </div>
                        </div>
                      ))}
                      {onOpenChat && (
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => onOpenChat(session.id, session)}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1877F2] hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            <MessageCircle size={13} /> Mở trong Trợ lý Chat
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {chatsCursor && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => loadChats(chatsCursor)}
                  disabled={chatsLoading}
                  className="px-4 py-2 bg-[#3A3B3C] hover:bg-[#4E4F50] rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-2"
                >
                  {chatsLoading && <Loader2 size={14} className="animate-spin" />}
                  Tải thêm
                </button>
              </div>
            )}
            {chatsLoading && chats.length === 0 && <LoadingState />}
          </>
        )}
      </div>

      {activeImage && (
        <div
          className="fixed inset-0 z-[260] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveImage(null)}
        >
          <div
            className="bg-[#242526] border border-[#3E4042] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-[#3E4042]">
              <div className="font-bold text-white">{activeImage.productName || activeImage.visualStyle}</div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => (activeImage.rating === 'good' ? undefined : handleRateGood(activeImage.id, e))}
                  disabled={activeImage.rating === 'good'}
                  className={`p-1.5 rounded-lg hover:bg-[#3A3B3C] ${activeImage.rating === 'good' ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
                  title={activeImage.rating === 'good' ? 'Đã đánh giá "Rất tốt!"' : 'Đánh giá "Rất tốt!" — giúp AI học chỉ dẫn cho dòng sản phẩm này'}
                >
                  <Heart size={16} fill={activeImage.rating === 'good' ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => handleDeleteImage(activeImage.id)}
                  className="p-1.5 rounded-lg hover:bg-[#3A3B3C] text-gray-400 hover:text-red-400"
                  title="Xóa ảnh khỏi lịch sử"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => setActiveImage(null)}
                  className="p-1.5 rounded-lg hover:bg-[#3A3B3C] text-gray-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {activeImage.imageUrl && (
                <img src={activeImage.imageUrl} alt="" className="w-full rounded-xl" referrerPolicy="no-referrer" />
              )}
              <div className="grid grid-cols-2 gap-3 text-xs text-gray-300">
                <div>
                  <span className="text-gray-500">Workflow:</span> {STYLE_NAMES[activeImage.visualStyle || ''] || activeImage.visualStyle}
                </div>
                <div>
                  <span className="text-gray-500">Kích thước:</span> {activeImage.imageSize} · {activeImage.aspectRatio}
                </div>
                <div>
                  <span className="text-gray-500">Chi phí ước tính:</span> ${(activeImage.costUSD || 0).toFixed(4)}
                </div>
                <div>
                  <span className="text-gray-500">Thời gian:</span> {new Date(activeImage.timestamp).toLocaleString('vi-VN')}
                </div>
              </div>
              {activeImage.prompt && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-bold uppercase text-[10px]">Prompt sinh ảnh</span>
                    <button
                      onClick={() => handleCopyPrompt(activeImage.id, activeImage.prompt || '')}
                      className="text-[#1877F2] hover:underline flex items-center gap-1 text-[11px] font-semibold"
                    >
                      {copiedId === activeImage.id ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                      {copiedId === activeImage.id ? 'Đã sao chép' : 'Sao chép'}
                    </button>
                  </div>
                  <div className="bg-[#18191A] border border-[#3E4042] rounded-lg p-3 text-xs text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">
                    {activeImage.prompt}
                  </div>
                </div>
              )}
              {activeImage.imageUrl && (
                <a
                  href={activeImage.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-4 py-2 bg-[#1877F2] hover:bg-blue-600 rounded-lg text-xs font-bold text-white"
                >
                  Mở ảnh gốc
                </a>
              )}
            </div>
          </div>
        </div>
      )}
      {/* In-app Confirmation Modal for deletion */}
      {confirmDeleteTarget && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setConfirmDeleteTarget(null)}
        >
          <div
            className="bg-[#242526] border border-[#3E4042] rounded-2xl max-w-sm w-full p-5 shadow-2xl text-white space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold">Xác nhận xóa</h3>
                <p className="text-xs text-gray-400">Hành động này áp dụng cho cả team trên Server.</p>
              </div>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa {confirmDeleteTarget.title} khỏi Lịch sử dùng chung?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#3E4042]">
              <button
                onClick={() => setConfirmDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:bg-[#3A3B3C] transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-colors shadow-md shadow-red-600/30"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
