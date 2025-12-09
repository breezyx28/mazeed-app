import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Share2, ShoppingBag, X, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Capacitor } from "@capacitor/core";
import { detectVideoType, getYouTubeEmbedUrl, fetchTikTokOembed } from "@/utils/videoUtils";
import { fetchMetaTags } from "@/utils/metaFetcher";

interface ProductVideo {
  id: string;
  product_id: string;
  video_type: 'uploaded' | 'external_link';
  video_url: string;
  thumbnail_url?: string;
  caption: string;
  link_title?: string;
  link_description?: string;
  link_image?: string;
  views: number;
  price?: number;
}

const mockVideos: ProductVideo[] = [
  {
    id: "1",
    product_id: "1",
    video_type: "external_link",
    video_url: "https://vt.tiktok.com/ZSPLcT1s9/",
    caption: "Ember Mug - Keep Your Drink Perfectly Warm",
    link_title: "Check out this amazing product!",
    link_description: "Ember Mug keeps your drink at the perfect temperature",
    link_image: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop",
    price: 299.99,
    views: 1234,
  },
  {
    id: "2",
    product_id: "2",
    video_type: "uploaded",
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    caption: "Smart Watch Pro - Track Your Fitness Goals",
    price: 199.99,
    views: 5678,
  },
  {
    id: "3",
    product_id: "3",
    video_type: "uploaded",
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    caption: "Designer Sunglasses - UV Protection",
    views: 890,
  },
];

const ProductReels = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [tiktokEmbed, setTiktokEmbed] = useState<any>(null);
  const [metaData, setMetaData] = useState<any>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const touchStartY = useRef(0);
  const lastTap = useRef(0);
  const isMobile = Capacitor.isNativePlatform();

  const videos = mockVideos.length > 0 ? mockVideos : [];

  useEffect(() => {
    const loadVideoData = async () => {
      const video = videos[currentIndex];
      
      if (video.video_type === 'external_link') {
        setLoadingMeta(true);
        const meta = await fetchMetaTags(video.video_url);
        setMetaData(meta);
        setLoadingMeta(false);
      } else {
        setMetaData(null);
        const currentVideo = videoRefs.current[currentIndex];
        if (currentVideo) {
          currentVideo.play().catch(() => {});
          videos[currentIndex].views += 1;
        }
      }
    };

    loadVideoData();

    return () => {
      videoRefs.current.forEach((video) => {
        if (video) video.pause();
      });
    };
  }, [currentIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < videos.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (diff < 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 50 && currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (e.deltaY < -50 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleScreenTap = (e: React.MouseEvent) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTap.current;

    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      const newSpeed =
        playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
      setPlaybackSpeed(newSpeed);
      const currentVideo = videoRefs.current[currentIndex];
      if (currentVideo) currentVideo.playbackRate = newSpeed;
    } else {
      const currentVideo = videoRefs.current[currentIndex];
      if (currentVideo) {
        if (isPlaying) {
          currentVideo.pause();
        } else {
          currentVideo.play();
        }
        setIsPlaying(!isPlaying);
      }
      setShowControls(!showControls);
    }

    lastTap.current = now;
  };

  const handleShare = async () => {
    const video = videos[currentIndex];
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.caption,
          text: `Check out this product: ${video.caption}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    }
  };

  const handleViewProduct = () => {
    navigate(`/product/${videos[currentIndex].product_id}`);
  };

  if (videos.length === 0) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <ShoppingBag className="w-16 h-16 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{t("noVideosYet")}</h2>
          <p className="text-muted-foreground mb-6">
            {t("noVideosDescription")}
          </p>
          <Button onClick={() => navigate("/")}>{t("backToHome")}</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black" onWheel={handleWheel}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="relative w-full h-full"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={handleScreenTap}
        >
          {videos[currentIndex].video_type === 'external_link' ? (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
              {loadingMeta ? (
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p>Loading preview...</p>
                </div>
              ) : (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="max-w-md w-full"
                >
                  <a
                    href={videos[currentIndex].video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-card rounded-3xl overflow-hidden shadow-2xl border border-border/50 hover:scale-105 transition-transform"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative h-64 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                      {(metaData?.image || videos[currentIndex].link_image) ? (
                        <>
                          <img
                            src={metaData?.image || videos[currentIndex].link_image}
                            alt={metaData?.title || videos[currentIndex].link_title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-24 h-24 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg></div>';
                              }
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-24 h-24 text-primary/40" />
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-2">
                        {metaData?.title || videos[currentIndex].link_title || 'Mazeed Store'}
                      </h3>
                      <p className="text-muted-foreground mb-4 line-clamp-3">
                        {metaData?.description || videos[currentIndex].link_description || 'Discover amazing products and exclusive deals at Mazeed Store. Your one-stop shop for quality items.'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {new URL(videos[currentIndex].video_url).hostname}
                        </span>
                        <div className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                          Visit Link
                        </div>
                      </div>
                    </div>
                  </a>
                </motion.div>
              )}
            </div>
          ) : (
            <video
              ref={(el) => (videoRefs.current[currentIndex] = el)}
              src={videos[currentIndex].video_url}
              className="w-full h-full object-cover"
              loop
              playsInline
              autoPlay
              muted={false}
              controls={false}
            />
          )}

          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none"
              >
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/80 to-transparent" />

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(-1);
                  }}
                  className="absolute top-2 left-2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-auto hover:bg-black/60 transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>

                {playbackSpeed !== 1 && (
                  <div className="absolute top-2 right-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm">
                    <span className="text-white text-sm font-semibold">
                      {playbackSpeed}x
                    </span>
                  </div>
                )}

                <div className="absolute right-2 bottom-20 flex flex-col gap-6 pointer-events-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare();
                    }}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/60 transition-all group-hover:scale-110">
                      <Share2 className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white text-xs font-medium">
                      Share
                    </span>
                  </button>

                  <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white text-xs font-medium">
                      {videos[currentIndex].views.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="absolute bottom-4 left-2 right-16 pointer-events-auto">
                  <p className="text-white text-base font-medium mb-1 line-clamp-2 drop-shadow-lg">
                    {videos[currentIndex].caption}
                  </p>
                  {videos[currentIndex].price && (
                    <p className="text-white text-xl font-bold mb-2 drop-shadow-lg">
                      ${videos[currentIndex].price}
                    </p>
                  )}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewProduct();
                    }}
                    className="w-full bg-primary hover:bg-primary/90 shadow-lg"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    {t("viewProduct")}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ProductReels;
