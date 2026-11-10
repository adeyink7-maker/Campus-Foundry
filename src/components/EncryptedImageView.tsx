import React from 'react';

export interface EncryptedImageProps {
  src: string;
  alt?: string;
  className?: string;
}

export const EncryptedImageView: React.FC<EncryptedImageProps> = ({ src, alt = 'Encrypted image', className = '' }) => {
  return (
    <img
      src={src}
      alt={alt}
      className={`object-cover select-none pointer-events-none ${className}`}
      draggable={false}
    />
  );
};

export default EncryptedImageView;
