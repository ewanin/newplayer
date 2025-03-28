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

  const contentUrl = isIOS || isChromeMac || isSafariMac ?
    "https://travelxp.akamaized.net/676026372b3f6946db2f607d/manifest_v2_hd_12032025_1111.m3u8" :
    "https://travelxp.akamaized.net/676026372b3f6946db2f607d/manifest_v2_hd_12032025_1109.mpd";

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

      // Modify DRM and player settings for Android devices
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
      } else if (isAndroid) {
        drmConfig["com.widevine.alpha"] = "https://c8eaeae1-drm-widevine-licensing.axprod.net/AcquireLicense";

        // For Android devices, use custom settings for better performance
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
          request.headers['X-AxDRM-Message'] = "eyJhbGciOiJIUzI1NiJ9.eyJ2ZXJzaW9uIjoxLCJjb21fa2V5X2lkIjoiYjQ1ODc2N2QtYTgzYi00MWQ0LWFlNjgtYWNhNzAwZDNkODRmIiwibWVzc2FnZSI6eyJ0eXBlIjoiZW50aXRsZW1lbnRfbWVzc2FnZSIsInZlcnNpb24iOjIsImxpY2Vuc2UiOnsiZXhwaXJhdGlvbl9kYXRldGltZSI6IjIwMjUtMDMtMjlUMTM6NDY6NDUuNzM4WiIsImFsbG93X3BlcnNpc3RlbmNlIjp0cnVlLCJyZWFsX3RpbWVfZXhwaXJhdGlvbiI6dHJ1ZX0sImNvbnRlbnRfa2V5X3VzYWdlX3BvbGljaWVzIjpbeyJuYW1lIjoiUG9saWN5IEEiLCJ3aWRldmluZSI6eyJkZXZpY2Vfc2VjdXJpdHlfbGV2ZWwiOiJTV19TRUNVUkVfQ1JZUFRPIn19XSwiY29udGVudF9rZXlzX3NvdXJjZSI6eyJpbmxpbmUiOlt7ImlkIjoiYmJkZjFmYWVlZmE5ODRjNjNhZjVkNmYzYzA1MDQwMDkiLCJ1c2FnZV9wb2xpY3kiOiJQb2xpY3kgQSJ9LHsiaWQiOiJhMzAzYzM1NzRiMTIzYmZlZGM3YWEyZmZkNmY1M2JmMSIsInVzYWdlX3BvbGljeSI6IlBvbGljeSBBIn0seyJpZCI6ImI0ZTU0MjVjM2NhYjc4NTE0MTgwZDQ2MTA3NzBkNmJkIiwidXNhZ2VfcG9saWN5IjoiUG9saWN5IEEifSx7ImlkIjoiZTdkMjQ0NzI1MGQ5YmE0MmE0MzIzNzRmODU3ZjJhYzgiLCJ1c2FnZV9wb2xpY3kiOiJQb2xpY3kgQSJ9XX19LCJpYXQiOjE3NDMxNzMyMDUsImV4cCI6MTc0MzI1OTYwNX0.7j0W9pt-zBFTws56ysFSMICYjUo2RZPqjG4EBCAFE2M";
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
    console.error('Error code', error.code, 'object', error);
  }

  return (
    <div style={{ position: "relative", width: "900px", height: "600px", justifySelf: "center" }}>
      <video id="video" playsInline autoPlay muted controls style={{ width: "100%", height: "auto" }} />
    </div>
  );
};

export default Home;
