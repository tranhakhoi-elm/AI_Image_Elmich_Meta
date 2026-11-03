import React, { useState, useRef, useEffect } from 'react';
import {
  Zap,
  Trash2,
  Wand2,
  Send,
  X,
  Image as ImageIcon,
  Plus,
  Menu,
  ArrowLeft
} from 'lucide-react';
import { ChatMessage, ChatSession } from '../../../types';
import { generateImageForChat, chatWithAI } from '../../../services/geminiService';
import { logChatSession, logGeneratedImage, fetchCategoryGuidance } from '../../../services/historyService';

const TypingEffect: React.FC<{ text: string }> = ({ text }) => {
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
      {displayedText.split('\n').map((line, i, arr) => (
        <React.Fragment key={i}>
          {line}
          {i !== arr.length - 1 && <br />}
        </React.Fragment>
      ))}
    </span>
  );
};

interface ChatViewProps {
  chatSessions: ChatSession[];
  setChatSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  handleDeleteSession: (sessionId: string, e: React.MouseEvent) => void;
  onBackToHome: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  chatSessions,
  setChatSessions,
  activeSessionId,
  setActiveSessionId,
  handleDeleteSession,
  onBackToHome
}) => {
  const currentSession = chatSessions.find(s => s.id === activeSessionId);
  const chatMessages = currentSession?.messages || [];
  
  const [chatInput, setChatInput] = useState('');
  const [chatInputImageBase64, setChatInputImageBase64] = useState<string | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatMode, setChatMode] = useState<'chat' | 'image'>('chat');
  const [chatImageAspectRatio, setChatImageAspectRatio] = useState('1:1');
  const [chatImageQuality, setChatImageQuality] = useState('1K');
  const [chatImageModel, setChatImageModel] = useState<'FLASH' | 'PRO'>('FLASH');
  
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  // Chỉ tin nhắn VỪA được tạo trong phiên component hiện tại mới chạy hiệu
  // ứng gõ chữ. Khởi tạo là null mỗi khi ChatView mount lại (chuyển tab,
  // đổi đoạn chat) nên tin nhắn cũ không bị "gõ lại" từ đầu mỗi lần vào.
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);

  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if ((!chatInput.trim() && !chatInputImageBase64) || isChatLoading) return;
    
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: chatInput,
      uploadedImageUrl: chatInputImageBase64 || undefined
    };

    let targetSessionId = activeSessionId;
    const sessionTitle = activeSessionId
      ? (chatSessions.find(s => s.id === activeSessionId)?.title || 'Đoạn chat')
      : (chatInput.trim().slice(0, 30) || 'Đoạn chat mới');
    const priorMessages = targetSessionId ? (chatSessions.find(s => s.id === targetSessionId)?.messages || []) : [];

    if (!targetSessionId) {
      targetSessionId = Date.now().toString();
      setActiveSessionId(targetSessionId);
      setChatSessions(prev => [{
        id: targetSessionId!,
        title: sessionTitle,
        messages: [newUserMsg],
        timestamp: Date.now()
      }, ...prev]);
    } else {
      setChatSessions(prev => prev.map(s => s.id === targetSessionId ? {
        ...s,
        messages: [...s.messages, newUserMsg],
        timestamp: Date.now()
      } : s));
    }

    setChatInput('');
    setChatInputImageBase64(null);
    setIsChatLoading(true);

    // Toàn bộ lịch sử hội thoại (kể cả ảnh đã tải lên/đã tạo ở các lượt
    // trước) — dùng chung cho CẢ 2 chế độ, để chuyển qua lại giữa "Chat & Tư
    // vấn" và "Tạo ảnh AI" trong cùng đoạn chat không bị mất mạch/ảnh mẫu.
    const messagesToSend = [...priorMessages, newUserMsg];

    let finalMsg: ChatMessage;
    try {
      let newModelMsg: ChatMessage;
      if (chatMode === 'image') {
        const selectedImageModel = chatImageModel === 'PRO' ? 'gemini-3-pro-image' : 'gemini-3.1-flash-image';
        // Chỉ dẫn đúc kết theo dòng sản phẩm (nếu suy luận được từ nội dung
        // tin nhắn) — cùng cơ chế đang dùng cho 11 workflow, xem
        // fetchCategoryGuidance() trong App.tsx::startGeneration().
        const { guidanceText: categoryGuidance } = await fetchCategoryGuidance({
          visualStyle: 'CONCEPT',
          text: newUserMsg.text,
        });
        const imageUrl = await generateImageForChat(
          messagesToSend,
          selectedImageModel,
          chatImageAspectRatio,
          chatImageQuality,
          categoryGuidance || undefined
        );
        newModelMsg = {
          id: Date.now().toString() + 'm',
          role: 'model',
          text: 'Đây là hình ảnh của bạn:',
          imageUrl
        };

        // Đồng bộ ảnh tạo qua Chat vào tab "Lịch sử" > "Ảnh đã tạo" chung của
        // Studio luôn, để cả team thấy được cả ảnh tạo tự do qua Chat, không
        // chỉ ảnh từ 15 workflow chính.
        logGeneratedImage({
          id: newModelMsg.id,
          url: imageUrl,
          prompt: newUserMsg.text || '(theo ngữ cảnh cuộc trò chuyện)',
          productName: 'Trợ lý Chat AI',
          visualStyle: 'CONCEPT',
          aspectRatio: chatImageAspectRatio,
          imageSize: chatImageQuality,
          timestamp: Date.now(),
        }).catch(() => {});
      } else {
        const defaultChatModel = 'gemini-3.8-flash';
        const replyText = await chatWithAI(messagesToSend, defaultChatModel);
        newModelMsg = {
          id: Date.now().toString() + 'm',
          role: 'model',
          text: replyText
        };
      }
      finalMsg = newModelMsg;
      setChatSessions(prev => prev.map(s => s.id === targetSessionId ? {
        ...s,
        messages: [...s.messages, newModelMsg],
        timestamp: Date.now()
      } : s));
    } catch (e: any) {
      const errorMsg: ChatMessage = {
        id: Date.now().toString() + 'e',
        role: 'model',
        text: `⚠️ Lỗi: ${e.message || 'Đã xảy ra lỗi trong quá trình xử lý.'}`
      };
      finalMsg = errorMsg;
      setChatSessions(prev => prev.map(s => s.id === targetSessionId ? {
        ...s,
        messages: [...s.messages, errorMsg],
        timestamp: Date.now()
      } : s));
    } finally {
      setIsChatLoading(false);
    }

    // Chỉ tin nhắn vừa nhận trong lượt gửi NÀY mới chạy hiệu ứng gõ chữ.
    setTypingMessageId(finalMsg.id);

    // Ghi lịch sử dùng chung (bắn-và-quên, không chặn UI nếu backend chưa cấu hình)
    logChatSession({
      id: targetSessionId,
      title: sessionTitle,
      timestamp: Date.now(),
      messages: [...priorMessages, newUserMsg, finalMsg],
    }).catch(() => {});
  };

  const handleImageUploadToChat = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setChatInputImageBase64(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    // Xóa sạch mọi dữ liệu còn sót lại của đoạn chat cũ trên ô soạn tin —
    // giống hành vi "New chat" của các app chat AI khác: bản nháp đang gõ,
    // ảnh đã đính kèm, chế độ và thiết lập ảnh đều về mặc định.
    setChatInput('');
    setChatInputImageBase64(null);
    setTypingMessageId(null);
    setChatMode('chat');
    setChatImageAspectRatio('1:1');
    setChatImageQuality('1K');
    setChatImageModel('FLASH');
  };

  return (
    <main className="flex-1 flex max-w-[1920px] mx-auto w-full relative bg-[#242526]">
      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Session Sidebar (Desktop tĩnh & Mobile drawer trượt) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[300px] bg-[#242526] border-r border-[#3E4042] flex flex-col h-full shrink-0 transition-transform duration-300
        md:static md:translate-x-0
        ${isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 border-b border-[#3E4042] flex items-center justify-between">
          <h2 className="font-bold text-white text-lg">Lịch sử chat</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { handleNewChat(); setIsMobileSidebarOpen(false); }}
              className="p-2 rounded-full hover:bg-[#18191A] text-[#1877F2]"
              title="Tạo đoạn chat mới"
            >
              <Zap size={20} />
            </button>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-2 rounded-full hover:bg-[#18191A] text-gray-400 hover:text-white md:hidden"
              title="Đóng menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-1">
          {/* Ô đại diện cho đoạn chat mới đang soạn (chưa có tin nhắn nào nên
              chưa được lưu vào chatSessions) — hiển thị ngay khi bấm "Đoạn
              chat mới" để cột lịch sử phản ánh đúng là đang ở 1 phiên mới,
              tách biệt hoàn toàn khỏi các đoạn chat cũ bên dưới (không đoạn
              nào trong số đó bị xóa hay ghi đè). */}
          {!activeSessionId && (
            <div className="w-full text-left p-3 rounded-xl bg-[#3A3B3C] font-semibold text-white flex items-center gap-2">
              <Plus size={16} className="text-[#1877F2] shrink-0" />
              <div className="text-[15px] truncate">Đoạn chat mới</div>
            </div>
          )}
          {chatSessions.length === 0 && (
            <div className="p-4 text-center text-xs text-gray-400">
              Chưa có đoạn chat nào. Bắt đầu nhắn tin để lưu lịch sử!
            </div>
          )}
          {chatSessions.map(s => (
            <div
              key={s.id}
              onClick={() => { setActiveSessionId(s.id); setIsMobileSidebarOpen(false); }}
              className={`w-full text-left p-3 rounded-xl transition-colors cursor-pointer group flex items-start justify-between ${
                activeSessionId === s.id ? 'bg-[#3A3B3C] font-semibold text-white' : 'text-white hover:bg-[#18191A]'
              }`}
            >
              <div className="flex-1 overflow-hidden pr-2">
                <div className="text-[15px] truncate">{s.title}</div>
                <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1.5">
                  <span>{new Date(s.timestamp).toLocaleDateString('vi-VN')}</span>
                  <span>·</span>
                  <span>{s.messages?.length || 0} tin nhắn</span>
                </div>
              </div>
              <button
                onClick={(e) => handleDeleteSession(s.id, e)}
                className={`p-1.5 rounded-full hover:bg-black/10 transition-colors ${
                  activeSessionId === s.id ? 'opacity-100 text-red-400' : 'opacity-0 text-red-400 group-hover:opacity-100'
                }`}
                title="Xóa đoạn chat này"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </aside>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-[100dvh] bg-[#242526] text-white min-w-0 overflow-hidden">
        <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 border-b border-[#3E4042] flex items-center justify-between bg-[#242526] z-10 shrink-0 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={onBackToHome}
              className="p-2 rounded-xl bg-[#18191A] border border-[#3E4042] text-gray-300 hover:text-white shrink-0"
              title="Quay lại màn hình chọn công cụ"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-[#18191A] border border-[#3E4042] text-gray-300 hover:text-white shrink-0"
              title="Xem danh sách chat"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0 flex items-center gap-2">
              <h2 className="font-bold text-base sm:text-xl truncate">{activeSessionId ? (chatSessions.find(s => s.id === activeSessionId)?.title || 'Đoạn chat') : 'Đoạn chat mới'}</h2>
              <button
                onClick={handleNewChat}
                className="hidden sm:inline-flex items-center gap-1 text-[11px] bg-[#18191A] border border-[#3E4042] hover:border-[#1877F2] text-gray-300 hover:text-white px-2.5 py-1 rounded-lg transition-colors shrink-0"
                title="Tạo đoạn chat mới"
              >
                <Plus size={12} className="text-[#1877F2]" />
                <span>Đoạn chat mới</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:px-24 xl:px-48 flex flex-col gap-4 sm:gap-6 custom-scrollbar text-[15px]">
          {chatMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-white space-y-4 opacity-50">
              <Wand2 size={48} />
              <p className="text-xl font-medium">Bắt đầu trò chuyện với Trợ lý AI</p>
              <p className="text-sm text-center max-w-lg">
                Tải lên hình để AI tư vấn thiết kế bằng chữ (chế độ Chat & Tư vấn).<br/>
                Để tạo hoặc sửa ảnh bằng prompt tự nhiên, chuyển sang chế độ Tạo ảnh AI.
              </p>
            </div>
          )}
          {chatMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group max-w-full`}>
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1877F2] to-cyan-500 text-white flex-shrink-0 flex items-center justify-center font-bold text-[11px] mr-3 font-sans shadow-md border-2 border-white">
                  AI
                </div>
              )}
              <div className={`px-4 py-3 rounded-2xl max-w-[85%] break-words flex flex-col gap-3 shadow-sm ${
                msg.role === 'user' ? 'bg-[#1877F2] text-white rounded-br-sm' : 'bg-[#18191A] text-white rounded-bl-sm border border-[#3A3B3C]'
              }`}>
                <span className="leading-relaxed whitespace-pre-wrap">
                  {msg.role === 'model' && msg.id === typingMessageId ? (
                    <TypingEffect text={msg.text} />
                  ) : (
                    msg.text
                  )}
                </span>
                {msg.uploadedImageUrl && (
                  <img src={msg.uploadedImageUrl} alt="User Upload" className="max-w-[400px] w-full rounded-lg border border-black/10 mx-auto" />
                )}
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="AI Generated" className="max-w-2xl w-full rounded-xl border border-black/10 mx-auto bg-[#242526]" />
                )}
              </div>
            </div>
          ))}
          {isChatLoading && (
            <div className="flex justify-start items-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1877F2] to-cyan-500 text-white flex-shrink-0 flex items-center justify-center font-bold text-[11px] mr-3 font-sans shadow-md border-2 border-white">
                AI
              </div>
              <div className="px-5 py-4 bg-[#18191A] rounded-2xl rounded-bl-sm flex gap-1.5 border border-[#3A3B3C]">
                <div className="w-2 h-2 bg-[#65676B] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-[#65676B] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-[#65676B] rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
          <div ref={chatMessagesEndRef} />
        </div>

        <div className="p-3 sm:p-4 md:p-6 lg:px-24 xl:px-48 border-t border-[#3E4042] bg-[#242526] shrink-0 pb-20 md:pb-6">
          <div className="flex items-center flex-wrap gap-2 sm:gap-3 mb-2.5 sm:mb-3">
            <div className="flex items-center gap-1.5 bg-[#18191A] px-2.5 py-1 rounded-lg border border-[#3E4042]">
              <span className="text-[11px] text-gray-300 font-semibold">Chế độ:</span>
              <select
                value={chatMode}
                onChange={e => setChatMode(e.target.value as 'chat' | 'image')}
                className="bg-transparent border-none text-xs outline-none text-white font-bold cursor-pointer"
              >
                <option value="chat" className="bg-[#18191A] text-white">Chat & Tư vấn</option>
                <option value="image" className="bg-[#18191A] text-white">Tạo ảnh AI</option>
              </select>
            </div>

            {chatMode === 'image' && (
              <>
                <div className="flex items-center gap-1.5 bg-[#18191A] px-2.5 py-1 rounded-lg border border-[#3E4042]">
                  <span className="text-[11px] text-gray-300 font-semibold">Tỷ lệ:</span>
                  <select
                    value={chatImageAspectRatio}
                    onChange={e => setChatImageAspectRatio(e.target.value)}
                    className="bg-transparent border-none text-xs outline-none text-white font-bold cursor-pointer"
                  >
                    <option value="1:1" className="bg-[#18191A] text-white">1:1 (Vuông)</option>
                    <option value="16:9" className="bg-[#18191A] text-white">16:9 (Ngang)</option>
                    <option value="9:16" className="bg-[#18191A] text-white">9:16 (Dọc)</option>
                    <option value="4:3" className="bg-[#18191A] text-white">4:3</option>
                    <option value="3:4" className="bg-[#18191A] text-white">3:4</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5 bg-[#18191A] px-2.5 py-1 rounded-lg border border-[#3E4042]">
                  <span className="text-[11px] text-gray-300 font-semibold">Cỡ:</span>
                  <select
                    value={chatImageQuality}
                    onChange={e => setChatImageQuality(e.target.value)}
                    className="bg-transparent border-none text-xs outline-none text-white font-bold cursor-pointer"
                  >
                    <option value="1K" className="bg-[#18191A] text-white">1K</option>
                    <option value="2K" className="bg-[#18191A] text-white">2K</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5 bg-[#18191A] px-2.5 py-1 rounded-lg border border-[#3E4042]">
                  <span className="text-[11px] text-gray-300 font-semibold">Model:</span>
                  <select
                    value={chatImageModel}
                    onChange={e => setChatImageModel(e.target.value as 'FLASH' | 'PRO')}
                    className="bg-transparent border-none text-xs outline-none text-white font-bold cursor-pointer"
                  >
                    <option value="FLASH" className="bg-[#18191A] text-white">Flash</option>
                    <option value="PRO" className="bg-[#18191A] text-white">Pro</option>
                  </select>
                </div>
              </>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:gap-3 bg-[#18191A] p-2 sm:p-3 rounded-2xl border border-[#3E4042] focus-within:border-[#1877F2] focus-within:ring-1 focus-within:ring-[#1877F2] transition-colors shadow-sm">
            {chatInputImageBase64 && (
              <div className="relative inline-block w-20 h-20 bg-[#242526] rounded-lg border border-[#3E4042] p-1 shadow-sm">
                <img src={chatInputImageBase64} alt="Upload preview" className="w-full h-full object-contain rounded-md" />
                <button 
                  onClick={() => setChatInputImageBase64(null)}
                  className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center bg-[#050505] text-white rounded-full shadow-md hover:bg-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <label className="p-2.5 text-white hover:text-[#1877F2] hover:bg-[#3A3B3C] rounded-full cursor-pointer transition-colors" title="Đính kèm ảnh">
                <ImageIcon size={24} />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUploadToChat} />
              </label>
              <textarea 
                placeholder="Hỏi AI về thiết kế sản phẩm, hoặc tải lên một hình ảnh..." 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isChatLoading}
                className="flex-1 bg-transparent px-2 py-3 text-[16px] outline-none text-white placeholder-[#65676B] resize-none h-[50px] min-h-[50px] max-h-[200px]"
                rows={1}
              />
              <button 
                onClick={handleSendMessage}
                disabled={(!chatInput.trim() && !chatInputImageBase64) || isChatLoading}
                className="p-3 text-[#1877F2] hover:bg-[#3A3B3C] rounded-full transition-colors disabled:opacity-50 disabled:bg-transparent"
              >
                <Send size={24} className={(chatInput.trim() || chatInputImageBase64) ? "fill-[#1877F2]" : ""} />
              </button>
            </div>
          </div>
          <div className="text-center mt-3 text-xs text-gray-400">Gemini AI có thể mắc lỗi. Vui lòng kiểm tra lại những thông tin quan trọng.</div>
        </div>
      </div>
    </main>
  );
};
