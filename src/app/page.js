"use client";
import { useEffect, useState } from 'react';

const Home = () => {
  const [shakaPlayer, setShakaPlayer] = useState(null);
  const [error, setError] = useState(null);

  const { userAgent } = navigator;
  const isIOS = (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) ||
    (/Safari/.test(userAgent) && !/Chrome/.test(userAgent) && !/Edge/.test(userAgent));
  const isChromeMac = /Chrome/.test(userAgent) && /Mac/.test(userAgent);
  const isSafariMac = /Safari/.test(userAgent) && /Mac/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);

  const contentUrl = isIOS || isChromeMac || isSafariMac ?
    "https://travelxp.akamaized.net/65eb247ae719caba054e56fa/manifest_v1_hd_14032024_1647.m3u8" :
    "https://travelxp.akamaized.net/65eb247ae719caba054e56fa/manifest_v1_hd_14032024_1646.mpd";
  // "https://travelxp.akamaized.net/676026372b3f6946db2f607d/manifest_v2_hd_12032025_1111.m3u8" :
  // "https://travelxp.akamaized.net/676026372b3f6946db2f607d/manifest_v2_hd_12032025_1109.mpd";

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
      setError("Browser not supported!");
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
      if (isIOS || isChromeMac || isSafariMac) {
        video.muted = true;
        video.autoPlay = true;
        drmConfig["com.apple.fps"] = "https://c8eaeae1-drm-fairplay-licensing.axprod.net/AcquireLicense";

        // Add the advanced FairPlay DRM configuration (server certificate URI)
        player.configure({
          drm: {
            advanced: {
              "com.apple.fps": {
                serverCertificateUri: "https://travelxp.akamaized.net/cert/fairplay/fairplay.cer", // FairPlay certificate URL
              },
            },
          },
        });
      } else if (isAndroid) {
        drmConfig["com.widevine.alpha"] = "https://c8eaeae1-drm-widevine-licensing.axprod.net/AcquireLicense";
      } else {
        drmConfig["com.widevine.alpha"] = "https://c8eaeae1-drm-widevine-licensing.axprod.net/AcquireLicense";
      }

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

      // Add the request filter to intercept and modify the DRM license request
      player.getNetworkingEngine().registerRequestFilter(function (type, request) {
        if (type === shakaPlayer.net.NetworkingEngine.RequestType.LICENSE) {
          request.headers['X-AxDRM-Message'] = "eyJhbGciOiJIUzI1NiJ9.eyJ2ZXJzaW9uIjoxLCJjb21fa2V5X2lkIjoiYjQ1ODc2N2QtYTgzYi00MWQ0LWFlNjgtYWNhNzAwZDNkODRmIiwibWVzc2FnZSI6eyJ0eXBlIjoiZW50aXRsZW1lbnRfbWVzc2FnZSIsInZlcnNpb24iOjIsImxpY2Vuc2UiOnsiZXhwaXJhdGlvbl9kYXRldGltZSI6IjIwMjUtMDMtMjlUMTE6MzA6MDcuNDAxWiIsImFsbG93X3BlcnNpc3RlbmNlIjp0cnVlLCJyZWFsX3RpbWVfZXhwaXJhdGlvbiI6dHJ1ZX0sImNvbnRlbnRfa2V5X3VzYWdlX3BvbGljaWVzIjpbeyJuYW1lIjoiUG9saWN5IEEiLCJ3aWRldmluZSI6eyJkZXZpY2Vfc2VjdXJpdHlfbGV2ZWwiOiJTV19TRUNVUkVfQ1JZUFRPIn19XSwiY29udGVudF9rZXlzX3NvdXJjZSI6eyJpbmxpbmUiOlt7ImlkIjoiMDJlM2FhNzg4M2IyOWI4OGEwZDM1ZTU4ODkyMDUxMDciLCJ1c2FnZV9wb2xpY3kiOiJQb2xpY3kgQSJ9LHsiaWQiOiI3ZmUzMmY0MjZjMjE3MTliNTQxNTg5MWY2MjU2NzhkYSIsInVzYWdlX3BvbGljeSI6IlBvbGljeSBBIn0seyJpZCI6IjA4MmUxOWQzOTU5NmYwZWUzZDk5NzliOGQ0NjI2M2JiIiwidXNhZ2VfcG9saWN5IjoiUG9saWN5IEEifV19fSwiaWF0IjoxNzQzMTY1MDA3LCJleHAiOjE3NDMyNTE0MDd9.ekNJT6TwxTMYE5x4dHRvsv5sTdkelpmg-xqwfYxyfRI";
          // request.headers['X-AxDRM-Message'] = "eyJhbGciOiJIUzI1NiJ9.eyJ2ZXJzaW9uIjoxLCJjb21fa2V5X2lkIjoiYjQ1ODc2N2QtYTgzYi00MWQ0LWFlNjgtYWNhNzAwZDNkODRmIiwibWVzc2FnZSI6eyJ0eXBlIjoiZW50aXRsZW1lbnRfbWVzc2FnZSIsInZlcnNpb24iOjIsImxpY2Vuc2UiOnsiZXhwaXJhdGlvbl9kYXRldGltZSI6IjIwMjUtMDMtMjlUMTM6NDY6NDUuNzM4WiIsImFsbG93X3BlcnNpc3RlbmNlIjp0cnVlLCJyZWFsX3RpbWVfZXhwaXJhdGlvbiI6dHJ1ZX0sImNvbnRlbnRfa2V5X3VzYWdlX3BvbGljaWVzIjpbeyJuYW1lIjoiUG9saWN5IEEiLCJ3aWRldmluZSI6eyJkZXZpY2Vfc2VjdXJpdHlfbGV2ZWwiOiJTV19TRUNVUkVfQ1JZUFRPIn19XSwiY29udGVudF9rZXlzX3NvdXJjZSI6eyJpbmxpbmUiOlt7ImlkIjoiYmJkZjFmYWVlZmE5ODRjNjNhZjVkNmYzYzA1MDQwMDkiLCJ1c2FnZV9wb2xpY3kiOiJQb2xpY3kgQSJ9LHsiaWQiOiJhMzAzYzM1NzRiMTIzYmZlZGM3YWEyZmZkNmY1M2JmMSIsInVzYWdlX3BvbGljeSI6IlBvbGljeSBBIn0seyJpZCI6ImI0ZTU0MjVjM2NhYjc4NTE0MTgwZDQ2MTA3NzBkNmJkIiwidXNhZ2VfcG9saWN5IjoiUG9saWN5IEEifSx7ImlkIjoiZTdkMjQ0NzI1MGQ5YmE0MmE0MzIzNzRmODU3ZjJhYzgiLCJ1c2FnZV9wb2xpY3kiOiJQb2xpY3kgQSJ9XX19LCJpYXQiOjE3NDMxNzMyMDUsImV4cCI6MTc0MzI1OTYwNX0.7j0W9pt-zBFTws56ysFSMICYjUo2RZPqjG4EBCAFE2M";
        }
      });

      // Try loading content with hvc1 codec
      await loadPlayerWithCodec(contentUrl, 'hvc1', player);
    } catch (error) {
      console.error("Error loading player:", error);
      setError("Error loading player.");
    }
  }

  async function loadPlayerWithCodec(url, codec, player) {
    try {
      if (isCodecSupported(codec)) {
        console.log(`Loading content with ${codec} codec`);
        await player.load(url + `?codec=${codec}`);
      } else {
        throw new Error(`${codec} codec not supported`);
      }
    } catch (error) {
      console.error(`Failed to load ${codec}:`, error);
      if (codec === 'hvc1') {
        // Fallback to avc1
        await loadPlayerWithCodec(url, 'avc1', player);
      } else if (codec === 'avc1') {
        // Fallback to vp9
        await loadPlayerWithCodec(url, 'vp9', player);
      } else {
        setError("All codecs failed to load.");
      }
    }
  }

  function isCodecSupported(codec) {
    const video = document.createElement('video');
    return video.canPlayType(`video/mp4; codecs="${codec}"`) !== '';
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
      {error && <div style={{ color: 'red', position: 'absolute', top: '10px', left: '10px' }}>{error}</div>}
    </div>
  );
};

export default Home;
