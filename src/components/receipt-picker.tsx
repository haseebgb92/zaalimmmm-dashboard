"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Image, X, Upload } from "lucide-react";
import NextImage from "next/image";
import { toast } from "sonner";

interface ReceiptPickerProps {
  onReceiptSelect: (file: File) => void;
  currentReceiptUrl?: string;
  onRemoveReceipt?: () => void;
}

export function ReceiptPicker({ onReceiptSelect, currentReceiptUrl, onRemoveReceipt }: ReceiptPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      onReceiptSelect(file);
      setIsOpen(false);
    }
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onReceiptSelect(file);
      setIsOpen(false);
    }
  };

  const openGallery = () => {
    fileInputRef.current?.click();
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  const handleRemoveReceipt = () => {
    onRemoveReceipt?.();
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      {/* Current Receipt Display */}
      {currentReceiptUrl && (
        <div className="relative inline-block">
          <NextImage
            src={currentReceiptUrl}
            alt="Receipt"
            width={80}
            height={80}
            className="h-20 w-20 object-cover rounded-lg border border-border"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            onClick={handleRemoveReceipt}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Receipt Picker Button */}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-start"
        >
          <Upload className="h-4 w-4 mr-2" />
          {currentReceiptUrl ? 'Change Receipt' : 'Attach Receipt'}
        </Button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-10">
            <div className="p-2 space-y-1">
              <Button
                type="button"
                variant="ghost"
                onClick={openCamera}
                className="w-full justify-start"
              >
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={openGallery}
                className="w-full justify-start"
              >
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image className="h-4 w-4 mr-2" />
                Choose from Gallery
              </Button>
              {currentReceiptUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleRemoveReceipt}
                  className="w-full justify-start text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove Receipt
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
      />
    </div>
  );
}
