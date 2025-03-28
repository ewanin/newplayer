"use client";
import { useEffect, useRef, useState } from "react";

const Home = () => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [shakaPlayer, setShakaPlayer] = useState(null);
  const containerRef = useRef(null);
  const { userAgent } = navigator;
  const isIOS = (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) ||
    (/Safari/.test(userAgent) && !/Chrome/.test(userAgent) && !/Edge/.test(userAgent));
  const isChromeMac = /Chrome/.test(userAgent) && /Mac/.test(userAgent);
  const isSafariMac = /Safari/.test(userAgent) && /Mac/.test(userAgent);

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("shaka-player/dist/shaka-player.ui.js").then((shaka) => {
        setShakaPlayer(shaka);
      });
    }
  }, []);

  useEffect(() => {
    const initPlayer = async () => {
      const playerId = document.getElementById("video");
      if (shakaPlayer && videoRef.current) {
        const video = videoRef.current;
        const container = containerRef.current;

        shakaPlayer.polyfill.installAll();

        if (!video || !container) return;

        video.setAttribute("muted", "true");
        video.setAttribute("playsinline", "true");

        const player = new shakaPlayer.Player(video);
        playerRef.current = player;

        player.getNetworkingEngine().registerRequestFilter((type, request) => {
          if (type === shakaPlayer.net.NetworkingEngine.RequestType.LICENSE &&
            "eyJhbGciOiJIUzI1NiJ9.eyJ2ZXJzaW9uIjoxLCJjb21fa2V5X2lkIjoiYjQ1ODc2N2QtYTgzYi00MWQ0LWFlNjgtYWNhNzAwZDNkODRmIiwibWVzc2FnZSI6eyJ0eXBlIjoiZW50aXRsZW1lbnRfbWVzc2FnZSIsInZlcnNpb24iOjIsImxpY2Vuc2UiOnsiZXhwaXJhdGlvbl9kYXRldGltZSI6IjIwMjUtMDMtMjlUMDk6NTA6MTcuNjI5WiIsImFsbG93X3BlcnNpc3RlbmNlIjp0cnVlLCJyZWFsX3RpbWVfZXhwaXJhdGlvbiI6dHJ1ZX0sImNvbnRlbnRfa2V5X3VzYWdlX3BvbGljaWVzIjpbeyJuYW1lIjoiUG9saWN5IEEiLCJ3aWRldmluZSI6eyJkZXZpY2Vfc2VjdXJpdHlfbGV2ZWwiOiJTV19TRUNVUkVfQ1JZUFRPIn19XSwiY29udGVudF9rZXlzX3NvdXJjZSI6eyJpbmxpbmUiOlt7ImlkIjoiMDJlM2FhNzg4M2IyOWI4OGEwZDM1ZTU4ODkyMDUxMDciLCJ1c2FnZV9wb2xpY3kiOiJQb2xpY3kgQSJ9LHsiaWQiOiI3ZmUzMmY0MjZjMjE3MTliNTQxNTg5MWY2MjU2NzhkYSIsInVzYWdlX3BvbGljeSI6IlBvbGljeSBBIn0seyJpZCI6IjA4MmUxOWQzOTU5NmYwZWUzZDk5NzliOGQ0NjI2M2JiIiwidXNhZ2VfcG9saWN5IjoiUG9saWN5IEEifV19fSwiaWF0IjoxNzQzMTU5MDE3LCJleHAiOjE3NDMyNDU0MTd9.VoXPBV4l3O5vLYhdLJaVYKRf9xaDihHQBSEj7vPPaHs") {
            request.headers["X-AxDRM-Message"] = "eyJhbGciOiJIUzI1NiJ9.eyJ2ZXJzaW9uIjoxLCJjb21fa2V5X2lkIjoiYjQ1ODc2N2QtYTgzYi00MWQ0LWFlNjgtYWNhNzAwZDNkODRmIiwibWVzc2FnZSI6eyJ0eXBlIjoiZW50aXRsZW1lbnRfbWVzc2FnZSIsInZlcnNpb24iOjIsImxpY2Vuc2UiOnsiZXhwaXJhdGlvbl9kYXRldGltZSI6IjIwMjUtMDMtMjlUMDk6NTA6MTcuNjI5WiIsImFsbG93X3BlcnNpc3RlbmNlIjp0cnVlLCJyZWFsX3RpbWVfZXhwaXJhdGlvbiI6dHJ1ZX0sImNvbnRlbnRfa2V5X3VzYWdlX3BvbGljaWVzIjpbeyJuYW1lIjoiUG9saWN5IEEiLCJ3aWRldmluZSI6eyJkZXZpY2Vfc2VjdXJpdHlfbGV2ZWwiOiJTV19TRUNVUkVfQ1JZUFRPIn19XSwiY29udGVudF9rZXlzX3NvdXJjZSI6eyJpbmxpbmUiOlt7ImlkIjoiMDJlM2FhNzg4M2IyOWI4OGEwZDM1ZTU4ODkyMDUxMDciLCJ1c2FnZV9wb2xpY3kiOiJQb2xpY3kgQSJ9LHsiaWQiOiI3ZmUzMmY0MjZjMjE3MTliNTQxNTg5MWY2MjU2NzhkYSIsInVzYWdlX3BvbGljeSI6IlBvbGljeSBBIn0seyJpZCI6IjA4MmUxOWQzOTU5NmYwZWUzZDk5NzliOGQ0NjI2M2JiIiwidXNhZ2VfcG9saWN5IjoiUG9saWN5IEEifV19fSwiaWF0IjoxNzQzMTU5MDE3LCJleHAiOjE3NDMyNDU0MTd9.VoXPBV4l3O5vLYhdLJaVYKRf9xaDihHQBSEj7vPPaHs";
          }
        });

        try {
          const drmConfig = {};
          if (isIOS || isChromeMac || isSafariMac) {
            video.muted = true;
            video.autoPlay = true;
            drmConfig["com.apple.fps"] = "https://c8eaeae1-drm-fairplay-licensing.axprod.net/AcquireLicense";
            player.configure({
              streaming: {
                useNativeHlsForFairPlay: true,
                bufferingGoal: 10,
                bufferBehind: 10,
                rebufferingGoal: 4,
                lowLatencyMode: false,
              },
              abr: {
                enabled: true,
                switchInterval: 6,
                bandwidthUpgradeTarget: 0.75,
                bandwidthDowngradeTarget: 0.85,
              },
              drm: {
                servers: drmConfig,
                advanced: {
                  "com.apple.fps": {
                    serverCertificateUri: "https://travelxp.akamaized.net/cert/fairplay/fairplay.cer",
                  },
                },
              },
            });
          } else {
            drmConfig["com.widevine.alpha"] = "https://c8eaeae1-drm-widevine-licensing.axprod.net/AcquireLicense";
            const widevineAdvanced = {
              videoRobustness: ["SW_SECURE_DECODE"],
            };
            player.configure({
              streaming: {
                bufferingGoal: 10,
                bufferBehind: 10,
                rebufferingGoal: 4,
                lowLatencyMode: false,
              },
              abr: {
                enabled: true,
                switchInterval: 6,
                bandwidthUpgradeTarget: 0.75,
                bandwidthDowngradeTarget: 0.85,
              },
              drm: {
                servers: drmConfig,
                advanced: {
                  "com.widevine.alpha": widevineAdvanced,
                },
              },
            });
          }
          const contentUrl = isIOS || isChromeMac || isSafariMac ?
            "https://travelxp.akamaized.net/65eb247ae719caba054e56fa/manifest_v1_hd_14032024_1647.m3u8" :
            "https://travelxp.akamaized.net/65eb247ae719caba054e56fa/manifest_v1_hd_14032024_1646.mpd";

          await player.load(contentUrl);
        } catch (error) {
          console.error("Error loading player:", error);
        }
      }
    };

    if (shakaPlayer) {
      initPlayer();
    }
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [shakaPlayer, isIOS, isChromeMac, isSafariMac]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "900px", height: "600px", justifySelf: "center" }}>
      <video id="video" ref={videoRef} controls style={{ width: "100%", height: "auto" }} />
    </div>
  );
};

export default Home;