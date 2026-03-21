#!/usr/bin/env node
/**
 * Toplu fiyat guncelleme scripti
 * Arastirma sonuclarina gore tum urunlerin fiyatlarini gunceller
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(resolve(__dirname, '../../.env.local'), 'utf-8');
const env = {};
for (const line of envFile.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================================
// FIYAT VERITABANI — Arastirma sonuclari
// Format: name pattern -> price (TRY)
// Eslestirme: urun adindaki anahtar kelimeler ile match
// ============================================================

const PRICE_DB = {
  // ==================== AJAX ====================
  // Hub'lar
  'Hub (2G)': 11500,
  'Hub (4G)': 13158,
  'Hub 2 (2G)': 10276,
  'Hub 2 (4G)': 14097,
  'Hub Plus': 11635,
  'Hub 2 Plus': 17456,
  'Hub BP': 15000,
  // Dedektorler
  'MotionProtect Plus': 1489,
  'MotionProtect Outdoor': 1572,
  'MotionProtect Curtain': 1750,
  'MotionCam Outdoor': 7722,
  'MotionCam (PhOD)': 8500,
  'MotionCam S (PhOD)': 9000,
  'MotionCam': 3414,
  'MotionProtect': 1572,
  'DoorProtect Plus': 2598,
  'DoorProtect': 1662,
  'GlassProtect': 3599,
  'CombiProtect': 6822,
  'DualCurtain Outdoor': 15505,
  'CurtainCam Outdoor': 15505,
  'Curtain Outdoor Mini': 8000,
  'Curtain Outdoor': 15505,
  // Yangin
  'FireProtect 2': 3699,
  'FireProtect Plus': 3699,
  'FireProtect': 1331,
  'LeaksProtect': 2699,
  // Kumanda / Tus
  'SpaceControl': 999,
  'Button': 2924,
  'DoubleButton': 3500,
  'KeyPad TouchScreen': 23479,
  'KeyPad Plus': 5561,
  'KeyPad Outdoor': 7000,
  'KeyPad': 4028,
  // Siren
  'HomeSiren': 3052,
  'StreetSiren DoubleDeck': 8594,
  'StreetSiren': 5150,
  // Tekrarlayici
  'ReX 2': 7064,
  'ReX': 4850,
  'Fire ReX': 7064,
  'Fire Hub': 15000,
  // Otomasyon
  'Relay': 2099,
  'WallSwitch': 1610,
  'Socket': 3120,
  'LightSwitch': 3500,
  // Entegrasyon
  'MultiTransmitter': 5721,
  'Transmitter': 7797,
  'ocBridge Plus': 4500,
  'uartBridge': 3500,
  // Kameralar
  'BulletCam': 5500,
  'DomeCam Mini': 5000,
  'DomeCam': 6000,
  'TurretCam': 5500,
  'IndoorCam': 3500,
  'DoorBell': 8000,
  // NVR
  'NVR (8 ch)': 12000,
  'NVR (16 ch)': 18000,
  // Setler
  'StarterKit Cam Plus': 25658,
  'StarterKit Cam': 13199,
  'StarterKit Hub Plus': 16154,
  'StarterKit Hub 2': 14000,
  'StarterKit (4G)': 13708,
  'StarterKit Plus': 16154,
  'StarterKit': 10100,
  // Aksesuar
  'Case': 1500,
  'PSU': 800,
  'Holder': 500,
  'Brandplate': 300,
  'ExternalAntenna': 2000,
  'SideButton': 1000,
  'Tag': 800,
  'Pass': 1200,
  // Fibra
  'Fibra': 3000,
  // EN54
  'EN54': 3000,
  // I/O Module
  'I/O Module': 5000,
  // Superior serisi
  'Superior BulletCam HLVF (4 Mp)': 7000,
  'Superior BulletCam HLVF (8 Mp)': 9000,
  'Superior DomeCam HLVF (4 Mp)': 7500,
  'Superior DomeCam HLVF (8 Mp)': 9500,
  'Superior TurretCam HLVF (4 Mp)': 7000,
  'Superior TurretCam HLVF (8 Mp)': 9000,
  'Superior NVR H2DAI16PAC (16-ch)': 25000,
  'Superior NVR H2DAI16PAC (32-ch)': 35000,
  'Superior NVR H2DAI2GAC (16-ch)': 22000,
  'Superior NVR H2DAI2GAC (32-ch)': 32000,
  'Superior NVR H2DAI2GAC (8-ch)': 18000,
  'Superior NVR H2DAI8PAC (16-ch)': 23000,
  'Superior NVR H2DAI8PAC (8-ch)': 19000,
  'Superior MegaHub': 35000,
  'Superior Hub G3': 20000,
  'Superior Hub Hybrid 2': 25000,
  'Superior Hub Hybrid (4G)': 22000,
  'Superior Hub Hybrid (2G)': 18000,
  'Superior Internal Battery (16h)': 2500,
  'Superior Internal Battery (60h)': 5000,
  'Superior LineProtect': 4000,
  'Superior LineSplit': 3500,
  'Superior LineSupply (45 W)': 5000,
  'Superior LineSupply (75 W)': 7000,
  'Superior MultiRelay': 4500,
  'Superior MultiTransmitter IO (4X4)': 8000,
  'Superior MultiTransmitter G3': 7000,
  'Superior MultiTransmitter': 6500,
  'Superior SeismoProtect': 5000,
  'Superior MotionCam HD (PhOD)': 12000,
  'Superior MotionCam AM (PhOD)': 10000,
  'Superior MotionCam G3 (PhOD)': 11000,
  'Superior MotionCam (PhOD)': 9500,
  'Superior MotionCam': 5000,
  'Superior MotionProtect G3': 3000,
  'Superior MotionProtect Plus G3': 3500,
  'Superior MotionProtect Plus': 2500,
  'Superior MotionProtect': 2200,
  'Superior DoorProtect G3': 3000,
  'Superior DoorProtect Plus': 3500,
  'Superior DoorProtect': 2500,
  'Superior GlassProtect': 4500,
  'Superior CombiProtect': 8000,
  'Superior HomeSiren G3': 4500,
  'Superior HomeSiren': 4000,
  'Superior StreetSiren DoubleDeck': 10000,
  'Superior StreetSiren Plus G3': 8000,
  'Superior StreetSiren Plus': 7500,
  'Superior StreetSiren': 6500,
  'Superior ReX G3': 7500,
  'Superior KeyPad Plus G3': 7000,
  'Superior KeyPad Plus': 6500,
  'Superior KeyPad TouchScreen G3': 28000,
  'Superior KeyPad TouchScreen': 25000,
  'Superior KeyPad Outdoor': 8000,
  'Superior KeyPad': 5500,
  'Superior Button': 3500,
  'Superior DoubleButton G3': 4500,
  'Superior SpaceControl': 1500,
  'Superior Transmitter': 9000,
  // BulletCam/DomeCam/TurretCam varyantlari
  'BulletCam HLVF (5 Mp)': 6000,
  'BulletCam HLVF (8 Mp)': 8000,
  'BulletCam HL': 6500,
  'DomeCam HLVF (5 Mp)': 6500,
  'DomeCam HLVF (8 Mp)': 8500,
  'DomeCam Mini HL': 5500,
  'TurretCam HLVF (5 Mp)': 6000,
  'TurretCam HLVF (8 Mp)': 8000,
  'TurretCam HL': 6500,
  // NVR varyantlari
  'NVR DC (16-ch)': 20000,
  'NVR DC (8-ch)': 14000,
  'NVR H2D16PAC (16-ch)': 22000,
  'NVR H2D8PAC (16-ch)': 20000,
  'NVR H2D8PAC (8-ch)': 16000,
  'NVR H2DAC (16-ch)': 18000,
  'NVR H2DAC (8-ch)': 14000,
  'NVR HAC (16-ch)': 16000,
  'NVR HAC (8-ch)': 12000,
  'NVR HDC (16-ch)': 18000,
  'NVR HDC (8-ch)': 14000,
  'NVR 16-ch': 18000,
  'NVR 8-ch': 12000,
  // Ajax otomasyon
  'ManualCallPoint': 2500,
  'LifeQuality': 5000,
  'SpeakerPhone': 8000,
  'WaterStop': 12000,
  'vhfBridge': 4000,
  'Outlet': 3000,
  // Ajax aksesuar - generic
  '12-24V PSU': 800,
  '12V PSU': 800,
  '6V PSU': 600,
};

// Marka bazli fiyat tablosu
const BRAND_PRICES = {
  // ==================== HIKVISION ====================
  'Hikvision': {
    // Analog kameralar
    'DS-2CE16D0T': 760,
    'DS-2CE76D0T': 906,
    'DS-2CE10DF0T': 1228,
    'DS-2CE17D0T': 1462,
    'DS-2CE70DF0T': 1579,
    'DS-2CE10KF0T': 1696,
    'DS-2CE16K0T': 2339,
    // IP kameralar
    'DS-2CD1021': 1637,
    'DS-2CD1023': 1754,
    'DS-2CD1121': 1871,
    'DS-2CD1323': 1988,
    'DS-2CD1027': 2281,
    'DS-2CD2423': 2690,
    'DS-2CD2043': 3564,
    'DS-2CD2047': 4360,
    'DS-2CD2T47': 4870,
    'DS-2CD2T83': 8900,
    'DS-2CD2T26': 7974,
    'DS-2CD2166': 19373,
    'DS-2CD2347': 15540,
    'DS-2CD1T83': 13290,
    'DS-2CD2143': 5500,
    'DS-2CD2183': 7000,
    'DS-2CD2386': 12000,
    'DS-2CD2T86': 15000,
    // DVR
    'DS-7104HGHI-K1': 1552,
    'DS-7108HGHI-K1': 2124,
    'DS-7116HGHI-K1': 2966,
    'DS-7104HGHI-M1': 3888,
    'DS-7108HGHI-M1': 4917,
    'DS-7204HGHI': 3987,
    'DS-7204HQHI': 1650,
    'DS-7208HQHI': 3200,
    'DS-7216HQHI': 5500,
    'IDS-7216HQHI': 30303,
    // NVR
    'DS-7104NI-Q1/4P': 3288,
    'DS-7104NI-Q1': 1904,
    'DS-7108NI-Q1/8P': 4594,
    'DS-7108NI-Q1': 2500,
    'DS-7608NI-K2': 4205,
    'DS-7616NI-Q2/16P': 8899,
    'DS-7616NI-Q2': 3919,
    'DS-7616NXI': 41181,
    'DS-7732NI-K4/16P': 11001,
    'DS-7732NI-K4': 9400,
    // Intercom
    'DS-KH6320': 3285,
    'DS-KV6113': 3660,
    'DS-KH8350': 8000,
    'DS-KD8003': 6000,
    // Gecis kontrol
    'DS-K1T804': 3271,
    'DS-K1T671': 21553,
    'DS-K1T341': 80722,
    'DS-K1101': 1016,
    'DS-K1107': 1106,
    'DS-K1802': 1081,
    'DS-K1108AM': 2232,
    'DS-K1108AE': 1593,
    // Ek IP kameralar
    'DS-2CD1043G0': 1900,
    'DS-2CD1047G0': 2281,
    'DS-2CD1053G0': 2200,
    'DS-2CD1121': 1871,
    'DS-2CD1143G0': 2100,
    'DS-2CD1147G0': 2500,
    'DS-2CD2027G2': 2281,
    'DS-2CD2023G2': 2800,
    'DS-2CD2043G2': 3564,
    'DS-2CD2083G2': 5500,
    'DS-2CD2123G2': 3200,
    'DS-2CD2127G2': 4500,
    'DS-2CD2143G2': 3800,
    'DS-2CD2147G2': 5200,
    'DS-2CD2183G2': 7000,
    'DS-2CD2343G2': 4800,
    'DS-2CD2347G2': 5500,
    'DS-2CD2383G2': 8000,
    'DS-2CD2421G0': 2690,
    'DS-2CD2443G0': 3200,
    'DS-2CD2623G2': 5000,
    'DS-2CD2643G2': 6500,
    'DS-2CD2683G2': 9500,
    'DS-2CD2H43G2': 7000,
    'DS-2CD2H83G2': 10000,
    'DS-2CD2935FWD': 8000,
    'DS-2CD2955FWD': 12000,
    'DS-2CD3756G2': 19000,
    // Ek Turbo HD
    'DS-2CE16D0T-EXIPF': 760,
    'DS-2CE16D0T-IRF': 760,
    'DS-2CE16H0T': 1100,
    'DS-2CE56D0T-IRF': 906,
    'DS-2CE56D0T-IRMMF': 950,
    'DS-2CE56D0T': 906,
    'DS-2CE56H0T': 1200,
    'DS-2CE70KF0T': 1696,
    'DS-2CE72DF0T': 1228,
    'DS-2CE72KF0T': 1800,
    'DS-2CE76H0T': 1200,
    // WiFi
    'DS-2CV2041G2': 4000,
    // PTZ / Speed Dome
    'DS-2DE2A204': 5500,
    'DS-2DE2C200': 8000,
    'DS-2DE4225IW': 12000,
    'DS-2DE4425IW': 16000,
    'DS-2DE4A425IWG': 18000,
    'DS-2DE5232IW': 15000,
    'DS-2DE7A432IW': 25000,
    // Solar / 4G
    'DS-2XS2T41G1': 15000,
    // Termal
    'DS-2TD1217': 25000,
    'DS-2TD2637': 45000,
    // Ek DVR
    'DS-7204HUHI': 3987,
    'DS-7208HUHI': 5500,
    'DS-7216HUHI': 8000,
    'DS-7232HGHI': 7500,
    'iDS-7204HUHI': 5000,
    'iDS-7208HUHI': 7500,
    'iDS-7216HUHI': 10000,
    // Ek NVR
    'DS-7604NI-K1': 3500,
    'DS-7604NXI-K1': 5000,
    'DS-7608NI-K2': 4205,
    'DS-7608NXI-K2': 7000,
    'DS-7616NI-K2': 6000,
    'DS-7616NXI-K2': 9000,
    'DS-7732NXI-K4': 15000,
    'DS-9632NI-M8': 25000,
    // Interkom
    'DS-KV8113': 3660,
    // Generic set isimleri
    '4 Kameralı 2MP IP Set': 8000,
    '8MP Bullet Kamera': 5500,
    '8 Kanal NVR Kayıt Cihazı': 4594,
    'ColorVu Renkli Gece Kamera': 2500,
  },

  // ==================== DAHUA ====================
  'Dahua': {
    // Analog
    'HAC-T1A21P-0280': 1127,
    'HAC-T1A21P-0360': 1134,
    'HAC-HDW1200RP': 1422,
    'HAC-B1A21P-U-IL': 780,
    'HAC-B1A21-U-IL': 745,
    'HAC-T1A21-0280': 793,
    'HAC-T1A21-U-IL': 824,
    'HAC-B1A21P-U': 1347,
    'HAC-B2A21P': 1813,
    'HAC-HFW1200TLP-A': 2107,
    'HAC-HFW1200TLP': 1686,
    'HAC-HFW1230TL': 2739,
    'HAC-HFW1500TL': 2476,
    'HAC-HDW1200TL': 2370,
    'HAC-HDW1200EM': 2002,
    'HAC-HDW1500TLMQ': 2212,
    'HAC-B1A21P-0360': 2279,
    // IP
    'IPC-HFW1230S-0360': 3793,
    'IPC-HFW1230SP': 3688,
    'IPC-HFW1230S-S': 3898,
    'IPC-HDW1230SP': 4056,
    'IPC-HFW2249S': 3266,
    'IPC-HFW2541S': 5025,
    'IPC-HDW2541T': 5025,
    'DH-IPC-HDBW5241': 2849,
    'IPC-HFW1249S': 1925,
    'IPC-HFW2449S': 2622,
    'IPC-HDW2449T': 3325,
    'IPC-HDW2431T': 2679,
    'IPC-HFW2831T': 7821,
    'IPC-HFW2841': 5500,
    'IPC-HDW2849': 4000,
    'IPC-HFW2849': 4500,
    // Speed dome
    'SD49225-HC': 21598,
    'SD49225XA': 40922,
    'SD49425GB': 17696,
    // NVR
    'NVR2104HS-P': 3580,
    'NVR2104HS': 2460,
    'NVR2108HS-8P': 4700,
    'NVR2108HS-4KS': 2550,
    'NVR2108HS': 2859,
    'NVR2116HS': 2080,
    'NVR4104HS-P': 3586,
    'NVR4104HS': 2406,
    'NVR4108HS': 2761,
    'NVR4208-4KS2/L': 5638,
    'NVR4208-4KS2': 8290,
    'NVR4208-8P': 4752,
    'NVR4216-16P': 8400,
    'NVR4216': 4500,
    'NVR4232': 9800,
    // XVR
    'XVR5104HS-I3': 3069,
    'XVR5108HS-I3': 3600,
    'XVR5116HS-I3': 7724,
    'XVR7104': 3690,
    'XVR5104HS-4KL-I3': 4500,
    'XVR5108HS-4KL-I3': 5500,
    'XVR5116HS-4KL-I3': 9000,
    'XVR5232AN-I3': 12000,
    // Alarm
    'ARC3000H': 6241,
    'ARC5402A': 8500,
    'ARD1233': 1227,
    'ARD1731': 3733,
    'ARD2231': 2337,
    'ARD323': 734,
    'ARD912': 1188,
    'ARA13': 2150,
    'ARA12': 1800,
    // Intercom
    'VTH2621': 2589,
    'VTH2421': 3389,
    'VTH5321': 4560,
    'VTH5341': 9863,
    'VTO2111': 3288,
    'VTO6531': 12322,
    // Termal
    'TPC-BF1241-B3F4': 25000,
    'TPC-BF1241-TB7F8': 35000,
    'TPC-BF1241': 25000,
    // Ek Analog kameralar
    'HAC-HDW1200T-Z': 1800,
    'HAC-HDW1200TRQP': 1500,
    'HAC-HDW1209TLQP': 1900,
    'HAC-HFW1200CMP': 1600,
    'HAC-HFW1200T-A': 1700,
    'HAC-HFW1200TP': 1400,
    'HAC-HFW1209TLM': 1900,
    'HAC-HFW1500T-A': 2476,
    'HAC-HDW1500TRQP': 2300,
    'HAC-ME1200B-LED': 2500,
    'HAC-T1A21-0280B': 793,
    // Ek IP kameralar
    'IPC-HDW1230T-AS': 2200,
    'IPC-HDW1239T-A-LED': 2400,
    'IPC-HDW1431T-AS': 2800,
    'IPC-HDW1439T-A-LED': 3000,
    'IPC-HFW1230S-S-0280': 3793,
    'IPC-HFW1230S-S-0360': 3793,
    'IPC-HFW1230T-ZS': 4200,
    'IPC-HFW1239S-A-LED': 2600,
    'IPC-HFW1431S-S': 3200,
    'IPC-HFW1439S-A-LED': 3400,
    'IPC-HDW2241T-S': 3500,
    'IPC-HDW2241T-ZS': 4200,
    'IPC-HDW2249T-S-IL': 3800,
    'IPC-HDW2249T-S-LED': 3500,
    'IPC-HDW2441T-S': 4500,
    'IPC-HDW2441T-ZS': 5200,
    'IPC-HDW2449T-S-IL': 4200,
    'IPC-HDW2449T-S-LED': 3800,
    'IPC-HDW2841T-S': 6500,
    'IPC-HFW2241E-S': 3200,
    'IPC-HFW2241E-SA': 3400,
    'IPC-HFW2241T-ZAS': 4000,
    'IPC-HFW2249T-AS-IL': 3800,
    'IPC-HFW2249T-AS-LED': 3500,
    'IPC-HFW2441E-S': 4200,
    'IPC-HFW2441E-SA': 4400,
    'IPC-HFW2441T-ZAS': 5000,
    'IPC-HFW2449T-AS-IL': 4500,
    'IPC-HFW2449T-AS-LED': 4000,
    'IPC-HFW2841E-S': 6500,
    'IPC-HFW2841T-ZAS': 8000,
    'IPC-EW5541-AS': 8000,
    'IPC-A22EP': 2000,
    'IPC-C22FP-IMOU': 2500,
    'IPC-F22FEP': 2200,
    // WizMind
    'IPC-HDBW5241E-ZE': 5500,
    'IPC-HDBW5442E-ZE': 8000,
    'IPC-HFW5241E-ZE': 5500,
    'IPC-HFW5442E-ZE': 8000,
    'IPC-HFW5842E-ZE': 12000,
    // Panoramik
    'IPC-PFW8601-A180': 15000,
    // WiFi PT
    'SD2A200HB-GN-AW': 3500,
    // Speed Dome ek
    'SD49225-HC-LA': 21598,
    'SD49825-HNR': 35000,
    'SD5A445GA-HNR': 40000,
    // NVR ek modeller
    'NVR4104HS-P-4KS2/L': 3586,
    'NVR4108HS-8P-4KS2/L': 4700,
    'NVR4116HS-16P-4KS2/L': 6500,
    'NVR4216-16P-4KS2/L': 8400,
    'NVR4232-16P-4KS2/L': 12000,
    'NVR5216-16P-4KS2E': 15000,
    'NVR5232-16P-4KS2E': 22000,
    'NVR608RH-32-XI': 35000,
    // XVR ek
    'XVR1B04-I': 1800,
    'XVR1B08-I': 2200,
    'XVR1B16-I': 3500,
    // Alarm ek - tam suffix
    'ARC5402A-CW': 8500,
    'ARD1233-W2': 1227,
    'ARD323-W2': 734,
    'ARA12-W2': 1800,
    // Intercom ek
    'ASI7214Y': 8000,
    // Generic
    '4MP Dome IP Kamera': 4056,
    'PTZ IP Kamera 25x Zoom': 21598,
  },

  // ==================== UNV (Uniview) ====================
  'UNV': {
    'IPC2122': 1900,
    'IPC2124LB-SF': 2200,
    'IPC2124LB-ADF': 3820,
    'IPC2124': 1900,
    'IPC2322LB-ADZK': 3799,
    'IPC2322SB': 3499,
    'IPC2322': 1477,
    'IPC2324SB': 3820,
    'IPC2324': 1600,
    'IPC2128': 3911,
    'IPC3612': 616,
    'IPC3614LE': 1345,
    'IPC3614SR': 1354,
    'IPC3614': 954,
    'IPC3624': 2870,
    'IPC3618': 2260,
    'IPC3232': 1354,
    'IPC3234': 1600,
    'IPC3238': 9800,
    'IPC6322': 6124,
    'IPC6222': 7692,
    'IPC9312': 7860,
    'UAC-B112-AF': 582,
    'UAC-B112': 543,
    'UAC-B115': 1443,
    'UAC-T112': 642,
    'UAC-T132': 569,
    'NVR301-04S3': 2149,
    'NVR301-08S3-P8': 4150,
    'NVR301-08S3': 2995,
    'NVR301-16S3': 3161,
    'NVR301-16X': 3238,
    'NVR302-16': 4300,
    'NVR302-32': 6752,
    'NVR304-32': 12900,
    'NVR308-32': 12599,
    'NVR508-64': 22500,
    'XVR301-04F': 1428,
    'XVR301-04G3': 1552,
    'XVR301-08F': 1689,
    'XVR301-08G3': 2400,
    'XVR301-16F': 3175,
    'XVR301-16G3': 2739,
    // Ek IP kameralar
    'IPC2122LB-AF28K-DL': 2200,
    'IPC2122LB-ASF28K': 1900,
    'IPC2122LE-ADF28KMC': 2400,
    'IPC2124LB-ADF28KM': 3820,
    'IPC2124LB-AF28K-DL': 2800,
    'IPC2124LB-ASF28K': 2200,
    'IPC2125LB': 2800,
    'IPC2125SB': 2800,
    'IPC2225SB': 3800,
    'IPC2225LB': 3800,
    'IPC2314LE': 3200,
    'IPC2314SB': 3200,
    'IPC2318LE': 4500,
    'IPC2318SB': 4500,
    'IPC264EA': 6000,
    'IPC268EA': 8000,
    'IPC2B14': 3200,
    'IPC2B18': 4500,
    'IPC2B12': 2200,
    'IPC2325LB': 3800,
    'IPC2325SB': 3800,
    'IPC2328LB': 5000,
    'IPC2328SB': 5000,
    'IPC2B25': 4000,
    'IPC2B28': 5500,
    'IPC2524': 3500,
    'IPC2528': 5000,
    'IPC354E': 8500,
    'IPC358E': 12000,
    'IPC361E': 15000,
    'IPC3625': 3500,
    'IPC3628': 5000,
    'IPC3635': 4500,
    'IPC3638': 6000,
    'IPC3525': 3500,
    'IPC3528': 5000,
    'IPC3534': 4000,
    'IPC3538': 5500,
    'IPC3614LB': 1800,
    'IPC3618LB': 2260,
    'IPC3625LB': 3200,
    'IPC3628LB': 4200,
    'IPC3635LB': 4000,
    'IPC3638LB': 5500,
    'IPC652LB': 15000,
    'IPC672LR': 18000,
    'IPC9322': 12000,
    'IPC9312': 7860,
    'NVR301-04': 2149,
    'NVR301-08': 2995,
    'NVR301-16': 3161,
    'NVR302-08': 3500,
    'NVR304-16': 9000,
    'NVR501-04': 5000,
    'NVR502-16': 8000,
    'NVR502-32': 12000,
    'NVR504-32': 16000,
    'NVR516-32': 22000,
    'XVR301-04': 1428,
    'XVR301-08': 1689,
    'XVR301-16': 3175,
    // Genel UNV fallback
    '2MP': 1500,
    '4MP': 2200,
    '5MP': 2800,
    '8MP': 4500,
    '12MP': 8000,
    'Bullet': 2000,
    'Dome': 2200,
    'Turret': 2100,
    'PTZ': 8000,
    'NVR': 3000,
    'XVR': 2000,
    'Analog': 800,
    'OwlView': 3500,
    'LightHunter': 3000,
    'ColorHunter': 3200,
    'WizMind': 5000,
    'Panoramik': 8000,
    'Speed Dome': 12000,
  },

  // ==================== EZVIZ ====================
  'Ezviz': {
    'C6N': 1375,
    'C1C': 960,
    'C3TN': 1499,
    'C3T': 1515,
    'C8T': 3110,
    'H1C': 1058,
    'H6C Plus': 1798,
    'H6C Pro': 1798,
    'H6C (4MP)': 1329,
    'H6C': 981,
    'H8C (3MP)': 1823,
    'H8C': 1549,
    'H9C': 4999,
    'H4': 3029,
    'BC1C': 3854,
    'HB8': 5855,
    'EB8': 6410,
    'TY1': 960,
    'DB2C': 3800,
    'DB1C': 2500,
    'LC1C': 3200,
    'SP1': 450,
    'T31': 550,
    'C3W': 2100,
    'H3C': 1500,
    'BC2': 4500,
    'C4W': 2300,
    'C8C': 2800,
    'DP2C': 3200,
    'H2C': 1600,
    'H4C': 3200,
    'RE4 Plus': 2500,
    'RE4': 2000,
    'T30': 400,
    'CS-SP': 450,
    'CS-T3': 550,
    // Ek modeller
    'C6 2K': 2200,
    'C6': 2200,
    'CB3': 3854,
    'CB8': 5000,
    'CP1 Pro': 1600,
    'C8c 3K': 3200,
    'C8c 2K': 2800,
    'C8c': 2800,
    'E6': 2800,
    'EB3': 5500,
    'DP2': 3200,
    'EP3x Pro': 6000,
    'H1c': 1058,
    'H3 3K': 2800,
    'H3c 2K': 2100,
    'H3c Renkli': 1800,
    'H8 Pro': 4500,
    'H8c 4G': 3500,
    'H8c 2K': 2200,
    'H8c 1080P': 1549,
    'H90 Dual': 5500,
    'HB8 Lite Kit': 12000,
    'HB90 Dual Kit': 15000,
    'HP4': 2500,
    'HP7': 5000,
    'LC3': 4500,
    'S10': 3500,
    'S3C Pro': 2000,
    'C6N G1': 1800,
    'C6N 4MP': 1329,
  },

  // ==================== HILOOK ====================
  'HiLook': {
    'THC-B120-PC': 315,
    'THC-T120-PC': 508,
    'THC-T120-PS': 721,
    'THC-T120-MC': 935,
    'THC-B220': 644,
    'THC-B127': 708,
    'THC-B157': 928,
    'THC-T157': 960,
    'THC-B120': 570,
    'THC-T120': 508,
    'IPC-B120H': 988,
    'IPC-B121H': 1197,
    'IPC-B120HA': 1255,
    'IPC-D120HA': 1819,
    'IPC-T220H': 1060,
    'IPC-T220': 1347,
    'IPC-C320HA': 1529,
    'IPC-B140H': 1556,
    'IPC-B140HA': 1900,
    'IPC-D140H': 1632,
    'IPC-B160HA': 2781,
    'IPC-D160HA': 2819,
    'IPC-D120H': 1050,
    'IPC-T140H': 1700,
    'IPC-D140': 1700,
    'PTZ-N2C400I-W': 3912,
    'PTZ-N2C400I-K': 7094,
    'DVR-104G': 1441,
    'DVR-108G': 1797,
    'DVR-208G': 2160,
    'DVR-208Q': 2781,
    'DVR-116G': 3185,
    'DVR-232G': 9593,
    'NVR-104H': 1550,
    'NVR-108H': 2102,
    'NVR-104MH': 3451,
    'NVR-108MH': 2813,
    'NVR-116MH': 2800,
    // Ek DVR modeller
    'DVR-204G-K1(B)(S)': 1300,
    'DVR-208G-K1(B)(S)': 1797,
    'DVR-208Q-K1(S)': 2781,
    'DVR-232Q-M2': 9593,
    // Ek IP kameralar
    'IPC-B129H': 1300,
    'IPC-B640H': 2500,
    'IPC-D620H': 2000,
    'IPC-D640H': 2500,
    'IPC-T221H': 1197,
    'IPC-T229H': 1400,
    'IPC-T240H': 1700,
    'IPC-B121H-F': 1197,
    'IPC-B120H-F': 988,
    'IPC-T220H-F': 1060,
    'IPC-D120HA-LU': 1819,
    'IPC-C320HA': 1529,
    // Ek analog
    'THC-B123-M': 700,
    'THC-B129-P': 850,
    'THC-B220-C': 644,
    'THC-T123-M': 680,
    'THC-T129-P': 820,
    'THC-D320-VF': 900,
    'THC-B120-MPIRL': 570,
    // PTZ
    'PTZ-N2C400M': 3912,
    'PTZ-N4215I': 8000,
    'PTZ-N4225I': 12000,
    // NVR ek
    'NVR-104H-D': 1550,
    'NVR-108H-D': 2102,
    'NVR-116MH-C': 2800,
    'NVR-232MH-B': 6000,
  },

  // ==================== REOLINK ====================
  'Reolink': {
    'E1 Pro 5MP': 2499,
    'E1 Pro 4MP': 6533,
    'E1 Outdoor': 4490,
    'E1 3MP': 1549,
    'E1 Zoom': 3500,
    'E1': 1549,
    'P320': 4490,
    'P324': 7830,
    'P330': 8473,
    'RLC-811A': 10992,
    'CX810': 12900,
    'P334': 13331,
    'Argus 3 Pro': 26850,
    'Argus 4 Pro': 19900,
    'Argus PT': 32968,
    'Argus 3': 15000,
    'Argus PT Ultra': 22390,
    'Altas PT Ultra': 22390,
    'P430': 21750,
    'P340': 42184,
    'Duo 3 PoE': 34200,
    'Duo 2': 20000,
    'Doorbell PoE': 7900,
    'Doorbell WiFi': 24990,
    'NVS4': 22458,
    'NVS8-410': 43955,
    'NVS8': 37296,
    'NVS16': 63370,
    'NVS36': 39209,
    'RLC-510A': 5000,
    'RLC-520A': 5500,
    'RLC-810A': 8000,
    'RLC-820A': 8500,
    'RLC-1220A': 15000,
    'RLN-8-410': 12000,
    'RLN-16-410': 18000,
    'RLN16-410': 18000,
    'RLN8-410': 12000,
    'Go PT Plus': 15000,
    'Go Plus': 10000,
    // Ek modeller
    'Altas 2K': 8000,
    'Altas Go PT': 15000,
    'Altas': 8000,
    'Argus Track': 22000,
    'CX410': 7500,
    'Duo 3 WiFi': 34200,
    'Duo 3V PoE': 36000,
    'Duo 4G': 20000,
    'E1 Outdoor Pro': 8000,
    'E1 Zoom 4K': 5500,
    'Elite Floodlight': 18000,
    'Elite Pro Floodlight': 25000,
    'Go PT Ultra': 20000,
    'TrackFlex Floodlight': 22000,
    'TrackMix LTE': 25000,
    'TrackMix PoE': 20000,
    'TrackMix WiFi': 20000,
    'RLC-810WA': 9000,
    'RLC-823A': 12000,
    'RLC-823S1W': 14000,
    'RLC-823S2': 15000,
    'RLC-833A': 12000,
    'RLC-843A': 13000,
    'RLC-1224A': 15000,
    'RLK16-1200D8': 80000,
    'RLK16-800B8': 55000,
    'RLK8-1200V4': 50000,
    'RLK8-800V4': 35000,
    'Video Doorbell': 7900,
    'Home Hub': 30000,
  },

  // ==================== IMOU ====================
  'Imou': {
    'Ranger 2C': 1260,
    'Ranger RC': 1899,
    'Ranger Mini': 1619,
    'Ranger Dual Pro': 3036,
    'Ranger 2': 1949,
    'Ranger': 1260,
    'Rex 3D': 2790,
    'Rex VT': 2848,
    'Rex 2': 2500,
    'Rex': 2200,
    'DK2 4MP': 1559,
    'DK2 3MP': 1380,
    'DK2': 1380,
    'Bullet 2E': 1399,
    'Bullet 2C': 1698,
    'Bullet 5MP': 3299,
    'Bullet 3MP': 1967,
    'Bullet': 1399,
    'Bulb Cam': 2470,
    'Cruiser SE+ 5MP': 3310,
    'Cruiser SE+ 3MP': 2710,
    'Cruiser SE+': 2710,
    'Cruiser Z': 5112,
    'Cruiser Dual 2 Pro': 5939,
    'Cruiser Dual 2': 5219,
    'Cruiser Triple': 12999,
    'Cruiser 2': 3500,
    'Cruiser': 2710,
    'Cell PT': 5089,
    'AOV PT': 7189,
    'Versa': 4000,
    'NVR1104': 2850,
    'NVR1108': 4000,
    // Ek modeller
    'A1 Dual': 4500,
    'A1 Pro': 2200,
    'A1 3MP': 1800,
    'A1 2MP': 1500,
    'A1': 1500,
    'Bullet 3': 2200,
    'Bullet 2 Pro': 3000,
    'Bullet 2C 5MP': 2500,
    'Cell 2': 5500,
    'Cell 3C': 4500,
    'Cell Go': 4000,
    'Cruiser 2C': 3000,
    'Cruiser 2 5MP': 4000,
    'Cruiser 2 3MP': 3500,
    'Cruiser 4G': 5000,
    'Cruiser Dual 2 Pro': 7000,
    'Cruiser Dual 2 10MP': 6500,
    'Cruiser Dual 2 6MP': 5219,
    'Cruiser SE': 2200,
    'Cue 2': 1800,
    'Ranger Dual Pro': 3036,
    'Ranger Dual 6MP': 2800,
    'Ranger SE': 1500,
    'Rex 2D': 2600,
    'Rex 3D 5MP': 3200,
    'Rex 3D 3MP': 2790,
  },

  // ==================== IMOU (İ harfli brand) ====================
  'İmou': {
    'A1 Dual': 4500,
    'A1 Pro': 2200,
    'A1 3MP': 1800,
    'A1 2MP': 1500,
    'A1': 1500,
    'Bulb Cam': 2470,
    'Bullet 3': 2200,
    'Bullet 2 Pro': 3000,
    'Bullet 2C 5MP': 2500,
    'Bullet 2C': 1698,
    'Bullet 2E': 1399,
    'Bullet 5MP': 3299,
    'Bullet': 1399,
    'Cell 2': 5500,
    'Cell 3C': 4500,
    'Cell Go': 4000,
    'Cell PT': 5089,
    'Cruiser 2C': 3000,
    'Cruiser 2 5MP': 4000,
    'Cruiser 2 3MP': 3500,
    'Cruiser 4G': 5000,
    'Cruiser Dual 2 Pro': 7000,
    'Cruiser Dual 2 10MP': 6500,
    'Cruiser Dual 2 6MP': 5219,
    'Cruiser SE': 2200,
    'Cruiser Z': 5112,
    'Cruiser Triple': 12999,
    'Cruiser': 2710,
    'Cue 2': 1800,
    'Ranger RC': 1899,
    'Ranger Dual Pro': 3036,
    'Ranger Dual 6MP': 2800,
    'Ranger SE': 1500,
    'Ranger 2C': 1260,
    'Ranger 2': 1949,
    'Ranger Mini': 1619,
    'Ranger': 1260,
    'Rex 3D 5MP': 3200,
    'Rex 3D 3MP': 2790,
    'Rex 3D': 2790,
    'Rex 2D': 2600,
    'Rex VT': 2848,
    'Rex 2': 2500,
    'Rex': 2200,
    'Versa': 4000,
    'AOV PT': 7189,
    'DK2 4MP': 1559,
    'DK2': 1380,
  },

  // ==================== TEKNIM ====================
  'Teknim': {
    'TFP-3122': 4283,
    'TFP-3124': 4699,
    'TFP-404': 6788,
    'TFP-4404P': 4527,
    'TFP-4404': 4925,
    'TFP-408': 2534,
    'TFP-4408P': 5361,
    'TFP-4408': 7371,
    'TFP-1211': 12000,
    'TFP-1222': 18000,
    'TFD-4230': 557,
    'TFD-4240': 557,
    'TFD-4245': 614,
    'TFD-4250': 865,
    'TFD-3230': 363,
    'TFD-3240': 363,
    'TFD-3250': 444,
    'TFD-1332': 723,
    'TFD-1250': 1200,
    'TFD-1260': 1100,
    'TFD-1270': 1400,
    'TFB-3165': 510,
    'TFB-1166': 800,
    'TFS-3191': 774,
    'TFS-3192': 338,
    'TFS-1181': 900,
    'TSP-5334LCD': 6602,
    'TSP-5334': 5569,
    'TSP-5324': 4981,
    'TK-04': 13423,
    'TK-05': 14305,
    'TK-08': 16926,
    'TK-10': 18337,
    'TK-15': 22841,
    'TK-20': 28000,
    // Genel kategoriler
    'Duman Dedektor': 500,
    'Isi Dedektor': 500,
    'Yangin Ihbar Butonu': 510,
    'Siren': 600,
    'Panel': 5000,
    'Dedektor Soketi': 80,
    'Akü': 250,
    'Guc Kaynagi': 400,
    // Aksesuar ve tabanlar
    'TFA-0120': 80,
    'TFA-0121': 50,
    'TFA-0123': 90,
    'TFA-0130R': 120,
    'TFA-0130W': 120,
    'TFA-0135': 150,
    'TFA-0165': 100,
    'TFA-3196': 200,
    // Butonlar
    'TFB-2266': 900,
    'TFB-3165B': 510,
    'TFB-3165G': 510,
    'TFB-3165O': 510,
    'TFB-3165W': 510,
    'TFB-3165Y': 510,
    'TFB-3168': 550,
    // Adresli dedektorler
    'TFD-2350': 700,
    'TFD-2351': 750,
    'TFD-2360': 700,
    'TFD-2361': 750,
    'TFD-2370': 800,
    'TFD-2371': 850,
    'TFD-1170': 1200,
    // Modüller ve kartlar
    'TFC-1201': 3000,
    'TFC-1209': 2500,
    'TFCM-1801': 2000,
    // Tabanlar (buzzer, flasor, izolator)
    'TFM-1281': 300,
    'TFM-1282': 350,
    'TFM-1283': 400,
    'TFM-1287': 450,
    // Adresli paneller
    'TFP-1240': 8000,
    'TFP-2111': 14000,
    'TFP-2112': 20000,
    'TFP-2114': 30000,
    'TFP-2131': 18000,
    'TFP-2132': 25000,
    'TFP-2134': 35000,
    'TFP-2211': 12000,
    'TFP-2212': 18000,
    'TFP-2214': 28000,
    // Adresli sirenler
    'TFS-1182R': 950,
    'TFS-1182W': 950,
    'TFS-1183R': 800,
    'TFS-1183W': 800,
    'TFS-2282': 1100,
    'TFS-3191R': 774,
    'TFS-3192R': 338,
    'TFS-3192W': 338,
    'TFS-3193R': 350,
    'TFS-3193W': 350,
    'TFS-4192R': 400,
    'TFS-5792': 600,
    // Gaz dedektoru
    'TSD-701': 800,
    // Kablosuz serisi
    'TWA-1891': 3000,
    'TWB-1866': 800,
    'TWM-1885': 2500,
    'TWM-1886': 1500,
    'TWM-1887': 1800,
    'TWM-3885': 2000,
    'TWS-1815': 1200,
    // Modüller
    'TXM-0508': 2000,
    'TXM-5271': 1800,
    'TXM-5474': 2500,
  },

  // ==================== GST ====================
  'GST': {
    'GST102A': 554,
    'GST104A': 696,
    'GST108A': 920,
    'GST116A': 1239,
    'GST200-2': 42443,
    'GST-IFP8': 137057,
    'GST852RP': 438,
    'GST-NRP': 483,
    'GST301': 1178,
    'GST-FT8': 1178,
    'GSTGMC': 5310,
    'I-9101': 1379,
    'I-9102': 930,
    'I-9103': 1114,
    'I-9105R': 12998,
    'I-9300': 2122,
    'I-9301': 2033,
    'I-9303': 3544,
    'I-9319': 168,
    'I-9403': 3987,
    'I-9406': 1500,
    'I-9602': 2917,
    'DI-9204E': 1724,
    'DI-9204H': 7974,
    'DI-9204REXD': 1770,
    'D-9107REXD': 1770,
    'C-9101': 800,
    'C-9102': 700,
    'C-9103': 750,
    'C-9403': 1240,
    'C-9404': 1329,
    'DC-9204': 500,
    'C-9503': 1414,
    'DB-01': 221,
    'LC200': 14589,
    'LCIFP8': 31832,
    'P-9903': 2652,
    'P-9910': 12821,
    'C-9317': 52117,
    'KMD300': 2303,
    // Edwards
    'KMD302': 8000,
    'KMD304': 12000,
    // GST model isimleri bosluklu
    'GST 102A': 554,
    'GST 104A': 696,
    'GST 108A': 920,
    'GST 116A': 1239,
    'GST 200TK-2': 55000,
    'GST 200TK': 42443,
    'GST 852RP': 438,
    // Ek modeller
    'GST-NRP': 483,
    'NRP01': 483,
    'I-9602LW': 3500,
    'DI-9204REXD': 1770,
    'D-9107REXD': 1770,
    'DC-9204': 500,
    'DZ-03': 100,
    'P-9901A': 2652,
    'P-9930': 1500,
    'C-9317': 52117,
    'IFP8': 137057,
  },

  // ==================== SENS ====================
  'Sens': {
    'S6-CSD-200': 494,
    'S6-CHD-200': 577,
    'S6-CMD-101': 498,
    'S6-CHD-101': 435,
    'S6-AHD-300': 772,
    'S6-ACP-300': 1081,
    'S6-AMD-300': 1133,
    'RC-100': 650,
    'KRC-100': 140,
    'RSF-91': 608,
    'MC5-4': 5664,
    'MC5-8': 8238,
    'MC5-12': 5548,
    'MC5-16': 7131,
    'MC5-24': 8615,
    'MKKD1': 1200,
    'Gaz Dedektor': 2317,
    'Dedektor Soketi': 820,
    // Genel
    'Duman': 500,
    'Isi': 500,
    'Siren': 608,
    'Buton': 650,
    'Panel': 6000,
    'Kombine': 550,
    // Adreslenebilir modüller
    'H2-AHP-300': 3500,
    'I1-AIS-300': 1200,
    'M1-AIM-300': 1400,
    'M1-AOM-300': 1400,
    'F1-ASF-300': 1500,
    'F1-ASM-300': 1300,
    'F2-ASM-300': 1300,
    'W1-ACP-302': 15000,
    'W1-ACP-304': 22000,
    'W1-ACP-LC-300': 5000,
    'W1-ACP-NC-300': 4000,
    'W2-ARP-300': 8000,
    // Konvansiyonel dedektorler
    'S2-CMD-200': 400,
    'S2-CMD-300': 500,
    'S5-COD-20A': 1500,
    'S5-COD-20B': 1800,
    'S5-COD-20D': 1500,
    'S6-ARD-300': 700,
    'S6-MCP-100': 150,
    // Konvansiyonel paneller
    'M5-CCP-202': 3500,
    'M5-CCP-204': 4500,
    'M7-CCP-202': 4000,
    'M7-CCP-204': 5000,
    'M9-CCP-204': 5000,
    'M9-CCP-206': 5500,
    'M9-CCP-208': 6500,
    'M9-CCP-212': 7500,
    'M9-CCP-216': 8500,
    'M9-CCP-224': 10000,
    'M9-CRP-216': 7000,
    // Sirenler
    'RSF-90': 500,
    'TSF-91-W': 650,
    'TSF-91': 650,
    // Butonlar
    'BRC-100': 700,
    'YRC-100': 700,
    // Dedektörler
    'P1-CBD-200': 5000,
    // Lambalar
    'RX-88': 300,
    'RX-99': 350,
    // Test
    'T2-SPY-100': 200,
  },

  // ==================== DESI ====================
  'Desi': {
    'Midline Smart Plus': 6532,
    'Midline Smart': 5511,
    'Midline Plus': 1044,
    'Midline WS': 989,
    'Midline': 5511,
    'Ecoline': 4321,
    'Steely SB R': 2281,
    'Steely SB': 1912,
    'Steely Ankastre': 1580,
    'Steely': 1912,
    'DAK': 1958,
    'Metaline WKS': 6999,
    'Metaline WTKS': 7999,
    'Metaline': 6999,
    'Smartline IOT': 8803,
    'Smartline': 8803,
    'Kablolu PIR': 431,
    'Kablosuz PIR': 1232,
    'PIR Dedektor': 800,
    'Dummy': 722,
    'Dis Alan Isildagi': 1500,
    'Siren': 800,
    'Kumanda': 600,
    'Manyetik Kontak': 400,
    'Smart Plus IOT': 2750,
    // QUiC serisi
    'QUiC Q030+': 18000,
    'QUiC Q033+': 16000,
    'QUiC Q032+': 14000,
    'QUiC Q032': 12000,
    'QUiC Q016': 8500,
    'QUiC Q015': 7500,
    'QUiC Q006': 9000,
    'QUiC Q005': 7000,
    'QUiC Q004': 5500,
    'QUiC Q003': 6500,
    'QUiC Q002': 5000,
    'QUiC Q001': 4500,
    'QUiC Vision': 6000,
    'QUiC': 6000,
    // Utopic serisi
    'Utopic RXe': 8000,
    'Utopic RX': 9500,
    'Utopic R OK': 7000,
    'Utopic R': 6500,
    'Utopic': 7000,
    // Set fiyatlari (kilit + mekanik kilit set)
    'Mekanik Kilit Set': 8000,
    'Akıllı Köprü': 8500,
    'WiFi Köprü': 9000,
    'Yüz Tanıma': 10000,
    'Parmak İzi': 7500,
  },

  // ==================== YALE ====================
  'Yale': {
    'Luna Pro+': 18000,
    'Luna Pro': 15000,
    'Linus L2 Lite': 6388,
    'Linus L2 Seti': 16792,
    'Linus L2': 9156,
    'Linus': 4750,
    'YDM4109': 12000,
    'YDM3168': 8500,
    'YDM3109': 9120,
    'YDD724': 14000,
    'YDG413': 11000,
    'Smart Lock': 14800,
    'WiFi Modul': 7500,
    'Parmak Iz': 12000,
    'Akilli Kilit': 9000,
  },

  // ==================== KALE ====================
  'Kale': {
    // Barel / Silindir
    '164 ASYN 76': 4990,
    '164 ASYN 71': 3500,
    '164 ASYN 68': 3112,
    '164 ASYN': 3112,
    '164 ASM': 2472,
    '164 BTS': 747,
    '164 BNE': 546,
    '164 SNC': 474,
    '164 GNC 90': 373,
    '164 GNC 83': 575,
    '164 GNC 76': 205,
    '164 GNC 68': 398,
    '164 GNC': 398,
    '164 CEC M': 2748,
    '164 CEC': 2748,
    '164 KTBS': 600,
    '264 Cech': 4840,
    '264 BTS': 1388,
    '264 2li': 1047,
    '264': 1047,
    // Gomme kilit
    '252 RYM': 1837,
    '252 RSN': 901,
    '252 R': 388,
    '252': 388,
    '262 R': 729,
    '262': 729,
    '256G 14': 4295,
    '256G': 1749,
    '256': 1749,
    // Elektrikli
    '357 M': 1913,
    '157 EL': 1680,
    'KD012': 875,
    'KD002': 1200,
    // Akilli kilit
    'X10': 8000,
    // Genel
    'Elektronik Kilit': 2000,
    'Akilli Kilit': 5000,
    'Gece Mandali': 400,
    'Yale': 300,
    'Bas-Ac': 875,
    'Kapi Karsiligi': 875,
    'Otomatik Kilit': 2500,
    'Kapı Dürbünü': 250,
    'Asma Kilit': 200,
    'Dolap Kilidi': 150,
    'Posta Kutusu': 300,
    // Kameralar
    '4200007': 1500,
    '4200008': 2000,
    'KALE3100001': 1800,
    'KALE3100002': 1800,
    'KALE3100003': 2200,
    'KALE3200001': 1600,
    'KALE3200003': 1600,
    'KALE3200004': 2200,
    'KALE3200005': 1700,
    'KALE4100001': 2500,
    'KALE4200001': 2500,
    'KALE4200002': 3000,
    'KALE4200003': 3500,
    // DVR
    'KALE5100001': 1500,
    'KALE5100002': 1800,
    'KALE5200001': 2000,
    'KALE5200002': 2500,
    'KALE5300001': 3000,
    'KALE5300002': 3500,
    'KALE5300003': 4000,
    // NVR
    'KALE6100001': 2000,
    'KALE6200001': 2800,
    'KALE6200002': 3500,
    'KALE6300001': 3500,
    'KALE6300002': 4500,
    // Kartlı kilit - Modern seri
    'KD040/80-621': 3500,
    'KD040/80-625': 3500,
    'KD040/80-631': 3500,
    'KD040/80-632': 3500,
    'KD040/80-701': 3000,
    'KD040/80-710': 3000,
    'KD040/80-800': 4000,
    // Kartlı kilit - Lüks seri
    'KD040/87-220': 4500,
    'KD040/87-230': 3500,
    'KD040/87-244': 4000,
    'KD040/87-250': 4500,
    'KD040/87-260': 3500,
    'KD040/87-500': 5000,
    // Kartlı kilit - Rozetli seri
    'KD040/88-210': 3000,
    'KD040/88-211': 3000,
    'KD040/88-212': 3000,
    'KD040/88-213': 3000,
    'KD040/88-214': 3000,
    // Kartlı kilit - Yeni seri
    'KD040/90-513': 2000,
    'KD040/90-518': 3000,
    'KD040/90-526': 2500,
    'KD040/90-532': 1500,
    'KD040/90-533': 1500,
    'KD040/90-534': 2000,
    'KD040/90-635': 4000,
    'KD040/90-704': 4500,
    'KD040/90-800': 3500,
    'KD040/90-902': 5000,
    'KD040/90-905': 5000,
    // Ofis Tipi
    'K040/90-705': 3500,
    // Dış Gösterge / Panel
    'KD040/95-510': 2500,
    'KD040/95-520': 3000,
    'KD040/95-530': 1500,
    // Asansör kontrol
    'KD040/10-901': 2000,
    'KD040/10-910': 2500,
    // Program USB
    'KD040/50-102': 1500,
    // Banyo WC kilidi
    'KD045/10-101': 400,
    'KD045/10-104': 450,
    'KD045/10-105': 450,
    'KD045/10-110': 500,
    // Geçiş kontrol
    'KD050/10-101': 1500,
    'KD050/10-102': 1500,
    'KD050/10-350': 1200,
    'KD050/10-360': 1200,
    'KD050/10-600': 1800,
    'KD050/10-800': 2000,
    'KD050/10-900': 2500,
    // Motorlu otomat
    'KD050/30-400': 2000,
    // Elektronik kilit XT
    'KD050/40-105': 1680,
    // Elektronik kabin kilidi
    'KD050/45-100': 800,
    'KD050/45-106': 850,
    'KD050/45-110': 900,
    'KD050/45-115': 950,
    'KD050/45-116': 950,
    'KD050/45-201': 1200,
    'KD050/45-211': 1200,
    'KD050/45-214': 1200,
    // Parmak İzli Kapı Kolu
    'KD050/50-110': 3500,
    'KD050/50-120': 4000,
    // Elektronik kilit
    'KD050/50-130': 2000,
    'KD050/50-200': 2200,
    'KD050/50-220': 2400,
    'KD050/50-225': 2500,
    'KD050/50-300': 2800,
    'KD050/50-330': 3000,
    'KD050/50-400': 3500,
    // Elektromanyetik kilit
    'KD050/60-100': 800,
    'KD050/60-110': 400,
    'KD050/70-101': 1200,
    'KD050/70-111': 500,
    'KD050/80-101': 1800,
    'KD050/80-111': 600,
    // Elektromanyetik aksesuar
    'KD050/90-901': 300,
    'KD050/90-902': 350,
    'KD050/90-910': 500,
    'KD050/90-920': 600,
    // Kartlı kilit serisi
    'KE040/10-100': 3000,
    // Alarm ürünleri
    'KGS1112010': 3500,
    'KGS1118011': 1500,
    'KGS1119010': 250,
    'KGS1119110': 400,
    'KGS1211010': 500,
    'KGS1311010': 300,
    'KGS1311110': 400,
    'KGS1411010': 600,
    'KGS1411111': 500,
    'KGS1411210': 800,
    'KGS1411310': 900,
    'KGS1411410': 700,
    'KGS1411510': 600,
    'KGS1411720': 350,
    'KGS1711010': 800,
    'KGS1712010': 500,
    'KGS1712011': 600,
    'KGS2112010': 4500,
    'KGS2211010': 700,
    'KGS2311010': 400,
    'KGS2311011': 450,
    'KGS2311510': 500,
    'KGS2411010': 800,
    'KGS4112050': 200,
    'KGS4115010': 1200,
    'KGS4118043': 300,
    'KGS5115010': 1500,
    'KGS5411610': 600,
    // Generic patterns
    'KGS': 500,
    'KD040': 3000,
    'KD050': 1500,
    'KD045': 450,
    'KALE3': 1800,
    'KALE4': 2500,
    'KALE5': 2500,
    'KALE6': 3000,
  },

  // ==================== BLITZLOCK ====================
  'Blitzlock': {
    'BL-C300': 5400,
    'BL-C500': 7200,
    'BL-C700': 9500,
    'BL-S300': 6000,
    'BL-S500': 8500,
    'BL-P100': 4500,
    'BL-M200': 12000,
    'BL-X100': 14000,
    // İsimli modeller
    'Anatolia': 8000,
    'Beta': 6500,
    'Cat Eyes': 7500,
    'Flush': 9000,
    'Journey': 7000,
    'Minium': 5500,
    'Ottoman': 8500,
    'Taurus': 7500,
  },

  // ==================== ZKTECO ====================
  'ZKTeco': {
    'SpeedFace-V5L': 38000,
    'SpeedFace-V3L': 42000,
    'SpeedFace': 35000,
    'ProFace X': 35000,
    'ProBG3060': 85000,
    'ProBG': 85000,
    'F22': 4500,
    'F18': 3500,
    'KR600E': 1200,
    'KR600': 1200,
    'SF300': 675,
    'SF400': 950,
    'ZK-C3-200': 12000,
    'Parmak Iz': 4500,
    'Kart Okuyucu': 1200,
    'Turnike': 85000,
    'Terminal': 4500,
  },

  // ==================== PARADOX ====================
  'Paradox': {
    'SP4000': 975,
    'SP7000': 4800,
    'MG5050': 3500,
    'EVO192': 8000,
    'DG75': 800,
  },

  // ==================== SAMSUNG ====================
  'Samsung': {
    'SHP-DP609': 13350,
    'SHP': 13350,
  },

  // ==================== NEUTRON ====================
  'Neutron': {
    'IPC': 1200,
    'NVR': 2500,
    'DVR': 2000,
    'Bullet': 1000,
    'Dome': 1100,
    'Turret': 1050,
    'Analog': 800,
    // Spesifik modeller
    'NTA-GNA8545-4G': 5000,
    'NTA-IPC01': 1200,
    'NTA-IPC02': 1500,
    'NTA-KPC10': 800,
    'NTA-KPC15': 900,
    'NTA-KPW11': 1100,
    'NTA-MDC31': 300,
    'NTA-MDW33': 500,
    'NTA-MDW35': 550,
    'NTA-PDC200': 400,
    'NTA-PDW205': 700,
    'NTA-RCW25': 400,
    'NTA-SDW300': 800,
    'NTA-SRC100E': 600,
    'NTA-SRC43': 900,
    'NTA-SRW40': 1200,
    'NTA-SRW45': 1400,
    'NTA-EBW60': 500,
    'NTA-GDC100': 1500,
    'NTA-GSC100': 1800,
    'NTA-ISW80': 600,
    'NTA-TSW70': 700,
    'NTA-ZCC101': 400,
    'NTA-ZCC108': 800,
    'NTL-DB-01RF': 300,
    'NTL-HM-99WB': 2500,
    'NTL-MC-01RF': 400,
    'NTL-OD-99WB': 3000,
    'NTL-PB-01RF': 350,
    'NTL-PS-01RF': 600,
    'NTL-RC-01RF': 350,
    'NTA-': 800,
    'NTL-': 600,
  },

  // ==================== ROOMBANKER ====================
  'Roombanker': {
    'Hub': 8000,
    'PIR': 1500,
    'Door': 1200,
    'Siren': 2000,
    'Keypad': 3000,
    'Remote': 800,
    'Smoke': 1800,
    'Water': 1500,
    'Panic': 1000,
    'Relay': 1500,
    // Türkçe isimli ürünler
    'Anahtarlık': 800,
    'Dış Mekan Dedektör': 2500,
    'Dış Mekan Siren': 2000,
    'İç Mekan Siren': 1500,
    'Ev Güvenlik Kiti': 12000,
    'Kapı Sensörü': 1200,
    'Panik Butonu': 1000,
    'PIR Sensör': 1500,
    'Smart Hub': 8000,
    'Tuş Takımı': 3000,
  },

  // ==================== UNIVIZ ====================
  'Univiz': {
    // Spesifik modeller
    'IPC-B122': 1200,
    'IPC-B124': 1500,
    'IPC-B125': 1800,
    'IPC-B312': 2500,
    'IPC-B314': 3000,
    'IPC-D122': 1200,
    'IPC-D124': 1500,
    'IPC-D125': 1800,
    'IPC-D312': 2500,
    'IPC-P413': 5000,
    'IPC-T122': 1200,
    'IPC-T124': 1500,
    'IPC-T125': 1800,
    'IPC-T312': 2500,
    'IPC-T314': 3000,
    'NVR-104E2': 2500,
    'NVR-108E2': 3500,
    'NVR-110E2': 3000,
    'NVR-216S2': 6000,
    'NVR301-08S3': 2995,
    'NVR302-16S2': 4300,
    'NVR302-32S': 6752,
    'XVR-104G3': 1552,
    'XVR-108G3': 2400,
    'XVR-116G3': 2739,
    // Generic
    'IPC': 1500,
    'NVR': 3000,
    'Bullet': 1200,
    'Dome': 1300,
    'Turret': 1250,
    'PTZ': 5000,
    'DVR': 2500,
    'XVR': 2000,
  },
};

// ============================================================
// ESLESTIRME MOTORU
// ============================================================

function findPrice(product) {
  const name = product.name || '';
  const brand = product.brand?.name || '';
  const sku = product.sku || '';

  // 1. Marka bazli eslestirme (en spesifik once)
  const brandPrices = BRAND_PRICES[brand];
  if (brandPrices) {
    // SKU veya model numarasi ile eslestir
    const keys = Object.keys(brandPrices).sort((a, b) => b.length - a.length);

    for (const pattern of keys) {
      if (name.includes(pattern) || sku.includes(pattern)) {
        return brandPrices[pattern];
      }
    }

    // Case-insensitive eslestirme
    const nameLower = name.toLowerCase();
    for (const pattern of keys) {
      if (nameLower.includes(pattern.toLowerCase())) {
        return brandPrices[pattern];
      }
    }
  }

  // 2. Ajax icin genel PRICE_DB eslestirmesi
  if (brand === 'Ajax') {
    const ajaxKeys = Object.keys(PRICE_DB).sort((a, b) => b.length - a.length);
    for (const pattern of ajaxKeys) {
      if (name.includes(pattern)) {
        return PRICE_DB[pattern];
      }
    }
  }

  return null;
}

// ============================================================
// ANA CALISMA FONKSIYONU
// ============================================================

async function main() {
  console.log('=== TOPLU FIYAT GUNCELLEME ===\n');

  // Tum urunleri cek
  let allProducts = [];
  let offset = 0;
  const limit = 500;

  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('id, sku, name, price, sale_price, brand:brands(name)')
      .order('name')
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('DB hatasi:', error.message);
      return;
    }

    allProducts = allProducts.concat(data);
    if (data.length < limit) break;
    offset += limit;
  }

  console.log(`Toplam urun: ${allProducts.length}\n`);

  // Eslestirme ve guncelleme
  let matched = 0;
  let skipped = 0;
  let alreadyCorrect = 0;
  let updated = 0;
  let errors = 0;
  const unmatched = [];
  const updates = [];

  for (const product of allProducts) {
    const newPrice = findPrice(product);
    const brand = product.brand?.name || 'Unknown';

    if (!newPrice) {
      unmatched.push({ brand, name: product.name, sku: product.sku });
      continue;
    }

    matched++;

    // Zaten dogru fiyat mi?
    if (product.price === newPrice) {
      alreadyCorrect++;
      continue;
    }

    updates.push({
      id: product.id,
      name: product.name,
      brand,
      oldPrice: product.price,
      newPrice
    });
  }

  console.log(`Eslesen: ${matched}`);
  console.log(`Zaten dogru fiyat: ${alreadyCorrect}`);
  console.log(`Guncellenecek: ${updates.length}`);
  console.log(`Eslesmeyen: ${unmatched.length}\n`);

  // Batch guncelleme
  const BATCH_SIZE = 50;
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);

    for (const item of batch) {
      const { error } = await supabase
        .from('products')
        .update({ price: item.newPrice })
        .eq('id', item.id);

      if (error) {
        console.error(`HATA: ${item.name} — ${error.message}`);
        errors++;
      } else {
        updated++;
      }
    }

    console.log(`Guncelleme: ${Math.min(i + BATCH_SIZE, updates.length)}/${updates.length}`);
  }

  // Ozet
  console.log('\n=== SONUC ===');
  console.log(`Toplam urun: ${allProducts.length}`);
  console.log(`Eslesen: ${matched}`);
  console.log(`Guncellenen: ${updated}`);
  console.log(`Hata: ${errors}`);
  console.log(`Eslesmeyen: ${unmatched.length}`);

  // Marka bazli eslesmeyen raporu
  const unmatchedByBrand = {};
  for (const item of unmatched) {
    if (!unmatchedByBrand[item.brand]) unmatchedByBrand[item.brand] = [];
    unmatchedByBrand[item.brand].push(item.name);
  }

  console.log('\n=== ESLESMEYEN URUNLER (MARKA BAZLI) ===');
  for (const [brand, items] of Object.entries(unmatchedByBrand).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n${brand} (${items.length}):`);
    items.slice(0, 5).forEach(n => console.log(`  - ${n}`));
    if (items.length > 5) console.log(`  ... ve ${items.length - 5} urun daha`);
  }
}

main().catch(console.error);
