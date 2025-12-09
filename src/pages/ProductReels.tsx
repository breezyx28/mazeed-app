import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Share2, ShoppingBag, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Capacitor } from "@capacitor/core";

interface ProductVideo {
  id: string;
  videoUrl: string;
  caption: string;
  productId: string;
  price?: number;
  views: number;
}

const mockVideos: ProductVideo[] = [
  {
    id: "1",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    caption: "Premium Wireless Headphones - Crystal Clear Sound",
    productId: "1",
    price: 299.99,
    views: 1234,
  },
  {
    id: "2",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    caption: "Smart Watch Pro - Track Your Fitness Goals",
    productId: "2",
    price: 199.99,
    views: 5678,
  },
  {
    id: "3",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    caption: "Designer Sunglasses - UV Protection",
    productId: "3",
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
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const touchStartY = useRef(0);
  const lastTap = useRef(0);
  const isMobile = Capacitor.isNativePlatform();

  const videos = mockVideos.length > 0 ? mockVideos : [];

  useEffect(() => {
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      currentVideo.play().catch(() => {});
      videos[currentIndex].views += 1;
    }

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
      const newSpeed = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
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
    navigate(`/product/${videos[currentIndex].productId}`);
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
          <video
            ref={(el) => (videoRefs.current[currentIndex] = el)}
            src={videos[currentIndex].videoUrl}
            className="w-full h-full object-cover"
            loop
            playsInline
            autoPlay
            muted={false}
            controls={false}
          />

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
                    <span className="text-white text-xs font-medium">Share</span>
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
