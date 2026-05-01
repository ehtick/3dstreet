/**
 * Gallery Component - Main container component
 */

import GallerySidebar from './GallerySidebar.jsx';

const Gallery = ({
  mode = 'sidebar',
  onCopyParams,
  onUseForGenerator,
  onUseForVideo,
  onNotification,
  onClose
}) => {
  // For now, only sidebar mode is implemented
  // Modal mode can be added later for other use cases
  if (mode === 'sidebar') {
    return (
      <GallerySidebar
        onCopyParams={onCopyParams}
        onUseForGenerator={onUseForGenerator}
        onUseForVideo={onUseForVideo}
        onNotification={onNotification}
      />
    );
  }

  // Future: add modal mode support
  return null;
};

export default Gallery;
