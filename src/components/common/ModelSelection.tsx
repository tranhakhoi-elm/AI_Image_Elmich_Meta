import React from 'react';
import { ImageSize, ImageModelTier } from '../../../types';

interface ModelSelectionProps {
  imageSize: ImageSize;
  onChange: (size: ImageSize) => void;
  imageModel?: ImageModelTier;
  onModelChange?: (model: ImageModelTier) => void;
}

/**
 * Bộ chọn chất lượng + model ĐÃ ĐƯỢC GỠ BỎ theo yêu cầu: app chạy Meta-only
 * với model Muse Image 1.0 duy nhất và chất lượng ảnh xuất ra luôn cố định
 * 2K (ép cứng tại services/geminiService.ts ở các nhánh Meta). Component
 * giữ nguyên chữ ký props và không render gì, để các workflow đang gọi nó
 * không phải sửa — muốn khôi phục bộ chọn thì mang lại JSX cũ từ git.
 */
export const ModelSelection: React.FC<ModelSelectionProps> = () => null;
