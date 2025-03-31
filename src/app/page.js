"use client";
import { useEffect, useState } from 'react';

const Home = () => {
  const [shakaPlayer, setShakaPlayer] = useState(null);

  const { userAgent } = navigator;
  const isIOS = (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) ||
    (/Safari/.test(userAgent) && !/Chrome/.test(userAgent) && !/Edge/.test(userAgent));
  const isChromeMac = /Chrome/.test(userAgent) && /Mac/.test(userAgent);
  const isSafariMac = /Safari/.test(userAgent) && /Mac/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  const isAndroidTablet = /Android/.test(userAgent) && !/Mobile/.test(userAgent);

  const contentUrl = isIOS || isChromeMac || isSafariMac ?
    "https://travelxp.akamaized.net/5ed605df46c9074616122f9b/manifest_v2_hd_24042023_0739.m3u8" :
    "https://travelxp.akamaized.net/5ed605df46c9074616122f9b/manifest_v2_hd_24042023_0738.mpd";

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("shaka-player/dist/shaka-player.compiled.js").then((shaka) => {
        setShakaPlayer(shaka);
      });
    }
  }, []);

  useEffect(() => {
    if (shakaPlayer) {
      initApp();
    }
  }, [shakaPlayer]);

  function initApp() {
    shakaPlayer.polyfill.installAll();

    if (shakaPlayer.Player.isBrowserSupported()) {
      initPlayer();
    } else {
      console.error('Browser not supported!');
    }
  }

  async function initPlayer() {
    const video = document.getElementById('video');
    const player = new shakaPlayer.Player();
    player.attach(video);

    window.player = player;
    player.addEventListener('error', onErrorEvent);

    try {
      const drmConfig = {};
      const supportsH265 = video?.canPlayType('video/mp4; codecs="hvc1.1.6.L93.90"') !== '';
      console.log("supportsH265", supportsH265);
      // Modify DRM and player settings for Android devices
      if (isIOS || isChromeMac || isSafariMac) {
        video.muted = true;
        video.autoPlay = true;
        drmConfig["com.apple.fps"] = "https://c8eaeae1-drm-fairplay-licensing.axprod.net/AcquireLicense";

        player.configure({
          preferredVideoCodecs: supportsH265 ? ['hvc1', 'avc1', 'vp9'] : ['avc1', 'vp9'],
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
      } else if (isAndroidTablet) {
        drmConfig["com.widevine.alpha"] = "https://c8eaeae1-drm-widevine-licensing.axprod.net/AcquireLicense";

        // For Android devices, use custom settings for better performance
        player.configure({
          preferredVideoCodecs: ['vp9', 'avc1', 'hvc1'],
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
              "com.widevine.alpha": {
                videoRobustness: ["SW_SECURE_DECODE"], // Ensure software-based decoding
                audioRobustness: ["SW_SECURE_CRYPTO"],
              },
            },
          },
        });
      } else {
        drmConfig["com.widevine.alpha"] = "https://c8eaeae1-drm-widevine-licensing.axprod.net/AcquireLicense";

        player.configure({
          preferredVideoCodecs: supportsH265 ? ['hvc1', 'avc1', 'vp9'] : ['avc1', 'vp9'],
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
          },
        });
      }

      player.getNetworkingEngine().registerRequestFilter(function (type, request) {
        if (type === shakaPlayer.net.NetworkingEngine.RequestType.LICENSE) {
          request.headers['X-AxDRM-Message'] = "eyJhbGciOiJIUzI1NiJ9.eyJ2ZXJzaW9uIjoxLCJjb21fa2V5X2lkIjoiYjQ1ODc2N2QtYTgzYi00MWQ0LWFlNjgtYWNhNzAwZDNkODRmIiwibWVzc2FnZSI6eyJ0eXBlIjoiZW50aXRsZW1lbnRfbWVzc2FnZSIsInZlcnNpb24iOjIsImxpY2Vuc2UiOnsiZXhwaXJhdGlvbl9kYXRldGltZSI6IjIwMjUtMDQtMDFUMDY6NTc6NTcuODQwWiIsImFsbG93X3BlcnNpc3RlbmNlIjp0cnVlLCJyZWFsX3RpbWVfZXhwaXJhdGlvbiI6dHJ1ZX0sImNvbnRlbnRfa2V5X3VzYWdlX3BvbGljaWVzIjpbeyJuYW1lIjoiUG9saWN5IEEiLCJ3aWRldmluZSI6eyJkZXZpY2Vfc2VjdXJpdHlfbGV2ZWwiOiJTV19TRUNVUkVfQ1JZUFRPIn19XSwiY29udGVudF9rZXlzX3NvdXJjZSI6eyJpbmxpbmUiOlt7ImlkIjoiMGM1MWUzNzQ0ZGNhODcwMjJjNTM0ZGZkYTZjMmVmMTYiLCJ1c2FnZV9wb2xpY3kiOiJQb2xpY3kgQSJ9LHsiaWQiOiJjNDJlMmYwMGNkOGM3YzViYTJiY2E5Y2ZmNDhiZGNjNiIsInVzYWdlX3BvbGljeSI6IlBvbGljeSBBIn0seyJpZCI6ImJkMWQ5YjYwZGUyNmMxYTkzNDgwMjdhOWE1N2FiOWI4IiwidXNhZ2VfcG9saWN5IjoiUG9saWN5IEEifV19fSwiaWF0IjoxNzQzNDA3ODc3LCJleHAiOjE3NDM0OTQyNzd9.fIlS2_-G7WS79Xg2_N1ilQY-HQMiHwHM5tBUWpqxKao";
        }
      });

      await player.load(contentUrl);
    } catch (error) {
      console.error("Error loading player:", error);
    }
  }

  function onErrorEvent(event) {
    onError(event.detail);
  }

  function onError(error) {
    console.warn("error", error);
    console.warn("shakaPlayer", shakaPlayer)
    console.warn("shakaPlayer VIDEO_ERROR", shakaPlayer.error.VIDEO_ERROR)
    console.warn("shakaPlayer DECODE_ERROR", shakaPlayer.error.DECODE_ERROR)
    // Check for specific video codec-related errors and log them
    // if (error.code === shakaPlayer.error.Code.VIDEO_ERROR) {
    //   console.error('Video error occurred:', error);
    // } else if (error.code === shakaPlayer.error.Code.DECODE_ERROR) {
    //   console.error('Decode error occurred:', error);
    // } else {
    //   // Log other errors
    //   console.error('Error code', error.code, 'object', error);
    // }
  }

  return (
    <div style={{ position: "relative", width: "900px", height: "600px", justifySelf: "center" }}>
      <video id="video" playsInline autoPlay muted controls style={{ width: "100%", height: "auto" }} />
      <div style={{ textAlign: "center" }}>{isAndroidTablet ? "Tablet" : isAndroid ? "Android" : isIOS ? "iOS" : "Device"}</div>
    </div>
  );
};

export default Home;
