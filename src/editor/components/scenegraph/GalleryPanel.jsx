import { useEffect, useRef } from 'react';
import { useGallery, GalleryContent } from '@shared/gallery';
import { Loader } from '@shared/icons';
import { signIn } from '../../api';
import styles from './GalleryPanel.module.scss';

const openInGenerator = async (item, tabName) => {
  try {
    const imageUrl = item.fullImageURL || item.storageUrl || item.objectURL;
    if (!imageUrl) throw new Error('No valid image URL available');

    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    localStorage.setItem(
      'pendingGalleryItem',
      JSON.stringify({
        imageDataUrl: dataUrl,
        id: item.id,
        metadata: item.metadata,
        timestamp: Date.now(),
        targetTab: tabName
      })
    );

    window.open(`/generator/#${tabName}`, '_blank');
  } catch (error) {
    console.error('Failed to open generator with gallery item:', error);
  }
};

const handleCopyParams = (item) => {
  if (!item.metadata) return;
  navigator.clipboard
    .writeText(JSON.stringify(item.metadata, null, 2))
    .catch((err) => console.error('Failed to copy parameters', err));
};

const GalleryPanel = () => {
  const gallery = useGallery();
  const { items, isLoggedIn, isLoadingMore, hasMore, reloadItems, loadMore } =
    gallery;

  const sentinelRef = useRef(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && hasMore && !isLoadingMore) {
            loadMore();
          }
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore, items.length]);

  if (!isLoggedIn) {
    return (
      <div className={styles.galleryPanel}>
        <div className={styles.signInPrompt}>
          <p>Sign in to view your gallery.</p>
          <button className={styles.signInButton} onClick={() => signIn()}>
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.galleryPanel}>
      <div className={styles.toolbar}>
        <span className={styles.count}>
          {items.length}
          {hasMore ? '+' : ''} {items.length === 1 ? 'item' : 'items'}
        </span>
        <button
          type="button"
          className={styles.refreshButton}
          onClick={() => reloadItems()}
          aria-label="Refresh gallery"
          title="Refresh gallery"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
        </button>
      </div>
      <div className={styles.scrollArea}>
        <GalleryContent
          gallery={gallery}
          variant="unbounded"
          gridClassName={styles.grid}
          sentinelRef={sentinelRef}
          loadingState={
            <div className={styles.loading}>
              <Loader className={styles.spinner} />
            </div>
          }
          emptyState={
            <div className={styles.empty}>
              No items yet. Generated images will appear here.
            </div>
          }
          onCopyParams={handleCopyParams}
          onUseForGenerator={(item) => openInGenerator(item, 'modify')}
          onUseForVideo={(item) => openInGenerator(item, 'video')}
        />
        {isLoadingMore && (
          <div className={styles.loadingMore}>
            <Loader className={styles.spinner} />
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryPanel;
