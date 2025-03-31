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
    "https://travelxp.akamaized.net/5ec8b26746c9074616122f3f/manifest_v1_hd_22062022_1732.m3u8" :
    "https://travelxp.akamaized.net/5ec8b26746c9074616122f3f/manifest_v1_hd_22062022_1731.mpd";

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

    let triedVP9 = false;
    let triedH264 = false;

    const CODECS = {
      h265: ['hev1.1.6.L93.B0', 'hvc1.1.6.L93.B0'],
      vp9: ['vp09.00.10.08'],
      h264: ['avc1.42E01E']
    };

    function configureCodec(codecList) {
      player.configure({
        preferredVideoCodecs: codecList
      });
      console.log('Configured codec:', codecList.join(', '));
    }

    async function fallbackToVP9IfPresent() {
      const manifest = await shaka.dash.DashParser.prototype.parseManifest(contentUrl, null);
      const hasVP9 = manifest.variants.some(v =>
        v.video && v.video.codecs && v.video.codecs.startsWith('vp09')
      );

      if (hasVP9) {
        console.warn('VP9 track found in manifest. Trying VP9 fallback.');
        try {
          await player.unload();
          configureCodec(CODECS.vp9);
          await player.load(contentUrl);
          triedVP9 = true;
          return true;
        } catch (err) {
          console.error('VP9 fallback failed:', err);
        }
      } else {
        console.warn('No VP9 track in manifest. Skipping VP9.');
      }
      return false;
    }

    async function fallbackToH264() {
      if (triedH264) return;
      triedH264 = true;
      console.warn('Trying final fallback: H.264');
      try {
        await player.unload();
        configureCodec(CODECS.h264);
        await player.load(contentUrl);
      } catch (err) {
        console.error('H.264 fallback failed:', err);
      }
    }

    configureCodec(CODECS.h265);


    window.player = player;

    player.addEventListener('error', async function (e) {
      const errorCode = e.detail.code;
      const isDecodeError = errorCode === shaka.util.Error.Code.DECODE_ERROR ||
        errorCode === shaka.util.Error.Code.VIDEO_ERROR;

      if (isDecodeError) {
        if (!triedVP9) {
          const vp9Tried = await fallbackToVP9IfPresent();
          if (vp9Tried) return;
        }

        fallbackToH264();
      } else {
        console.error('Unhandled Shaka error:', e.detail);
      }
    });


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
          drm: { servers: drmConfig, },
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
          request.headers['X-AxDRM-Message'] = "eyJhbGciOiJIUzI1NiJ9.eyJ2ZXJzaW9uIjoxLCJjb21fa2V5X2lkIjoiYjQ1ODc2N2QtYTgzYi00MWQ0LWFlNjgtYWNhNzAwZDNkODRmIiwibWVzc2FnZSI6eyJ0eXBlIjoiZW50aXRsZW1lbnRfbWVzc2FnZSIsInZlcnNpb24iOjIsImxpY2Vuc2UiOnsiZXhwaXJhdGlvbl9kYXRldGltZSI6IjIwMjUtMDQtMDFUMDY6MzE6MjEuMTA1WiIsImFsbG93X3BlcnNpc3RlbmNlIjp0cnVlLCJyZWFsX3RpbWVfZXhwaXJhdGlvbiI6dHJ1ZX0sImNvbnRlbnRfa2V5X3VzYWdlX3BvbGljaWVzIjpbeyJuYW1lIjoiUG9saWN5IEEiLCJ3aWRldmluZSI6eyJkZXZpY2Vfc2VjdXJpdHlfbGV2ZWwiOiJTV19TRUNVUkVfQ1JZUFRPIn19XSwiY29udGVudF9rZXlzX3NvdXJjZSI6eyJpbmxpbmUiOlt7ImlkIjoiMWRkZTE2OTM5NDIxZTA0ZTQ0MDRjNDFjYjcyNDY5MmYiLCJ1c2FnZV9wb2xpY3kiOiJQb2xpY3kgQSJ9LHsiaWQiOiIzYTBkYzQ0OGMxZWViMGM3YzVmNjE0ZmUwMWUzM2NmNSIsInVzYWdlX3BvbGljeSI6IlBvbGljeSBBIn0seyJpZCI6IjYzNGViZWY0Y2QxMzU3N2UzNTY1ZGIxZjA0MDJkZGIxIiwidXNhZ2VfcG9saWN5IjoiUG9saWN5IEEifSx7ImlkIjoiZjk2MzkxNmQyZjI3ZjYzNzkxNTU5YmNhODlhMmNlMjQiLCJ1c2FnZV9wb2xpY3kiOiJQb2xpY3kgQSJ9XX19LCJpYXQiOjE3NDM0MDYyODEsImV4cCI6MTc0MzQ5MjY4MX0.51U_Xg78Knq_82SP5Z1mWKdq6iySODP_jM1psXCkGHQ";
        }
      });

      // await player.load(contentUrl);
      try {
        await player.load(contentUrl);
      } catch (err) {
        console.error('Initial load failed:', err);

        const vp9Tried = await fallbackToVP9IfPresent();
        if (!vp9Tried) {
          fallbackToH264();
        }
      }
    } catch (error) {
      console.error("Error loading player:", error);
    }
  }

  return (
    <div style={{ position: "relative", width: "900px", height: "600px", justifySelf: "center" }}>
      <video id="video" playsInline autoPlay muted controls style={{ width: "100%", height: "auto" }} />
      <div style={{ textAlign: "center" }}>{isAndroidTablet ? "Tablet" : isAndroid ? "Android" : isIOS ? "iOS" : "Device"}</div>
    </div>
  );
};

export default Home;
