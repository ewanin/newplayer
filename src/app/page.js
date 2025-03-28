"use client";
import { useEffect, useState } from 'react';

const Home = () => {
  const [shakaPlayer, setShakaPlayer] = useState(null);

  const { userAgent } = navigator;
  const isIOS = (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) ||
    (/Safari/.test(userAgent) && !/Chrome/.test(userAgent) && !/Edge/.test(userAgent));
  const isChromeMac = /Chrome/.test(userAgent) && /Mac/.test(userAgent);
  const isSafariMac = /Safari/.test(userAgent) && /Mac/.test(userAgent);

  const contentUrl = isIOS || isChromeMac || isSafariMac ?
    "https://travelxp.akamaized.net/65eb247ae719caba054e56fa/manifest_v1_hd_14032024_1647.m3u8" :
    "https://travelxp.akamaized.net/65eb247ae719caba054e56fa/manifest_v1_hd_14032024_1646.mpd";

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
    // Install polyfills for older browsers.
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
          request.headers['X-AxDRM-Message'] = "eyJhbGciOiJIUzI1NiJ9.eyJ2ZXJzaW9uIjoxLCJjb21fa2V5X2lkIjoiYjQ1ODc2N2QtYTgzYi00MWQ0LWFlNjgtYWNhNzAwZDNkODRmIiwibWVzc2FnZSI6eyJ0eXBlIjoiZW50aXRsZW1lbnRfbWVzc2FnZSIsInZlcnNpb24iOjIsImxpY2Vuc2UiOnsiZXhwaXJhdGlvbl9kYXRldGltZSI6IjIwMjUtMDMtMjlUMTE6MzA6MDcuNDAxWiIsImFsbG93X3BlcnNpc3RlbmNlIjp0cnVlLCJyZWFsX3RpbWVfZXhwaXJhdGlvbiI6dHJ1ZX0sImNvbnRlbnRfa2V5X3VzYWdlX3BvbGljaWVzIjpbeyJuYW1lIjoiUG9saWN5IEEiLCJ3aWRldmluZSI6eyJkZXZpY2Vfc2VjdXJpdHlfbGV2ZWwiOiJTV19TRUNVUkVfQ1JZUFRPIn19XSwiY29udGVudF9rZXlzX3NvdXJjZSI6eyJpbmxpbmUiOlt7ImlkIjoiMDJlM2FhNzg4M2IyOWI4OGEwZDM1ZTU4ODkyMDUxMDciLCJ1c2FnZV9wb2xpY3kiOiJQb2xpY3kgQSJ9LHsiaWQiOiI3ZmUzMmY0MjZjMjE3MTliNTQxNTg5MWY2MjU2NzhkYSIsInVzYWdlX3BvbGljeSI6IlBvbGljeSBBIn0seyJpZCI6IjA4MmUxOWQzOTU5NmYwZWUzZDk5NzliOGQ0NjI2M2JiIiwidXNhZ2VfcG9saWN5IjoiUG9saWN5IEEifV19fSwiaWF0IjoxNzQzMTY1MDA3LCJleHAiOjE3NDMyNTE0MDd9.ekNJT6TwxTMYE5x4dHRvsv5sTdkelpmg-xqwfYxyfRI";
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
      <video id="video" muted autoPlay controls style={{ width: "100%", height: "auto" }} />
    </div>
  );
};

export default Home;
