"""
Fiyatcim Urun Yoneticisi — Otomatik Build & Release Scripti.

Kullanim:
    python release.py          # Mevcut versiyonu build + release
    python release.py 2.3.0    # Versiyonu guncelle + build + release
"""

import os
import re
import sys
import shutil
import subprocess

ROOT = os.path.dirname(os.path.abspath(__file__))
VERSION_FILE = os.path.join(ROOT, "app", "version.py")
SPEC_FILE = os.path.join(ROOT, "Fiyatcim-UrunYoneticisi.spec")
DIST_DIR = os.path.join(ROOT, "dist", "Fiyatcim-UrunYoneticisi")
REPO = "salihensar1313/fiyatcim"


def read_version() -> str:
    with open(VERSION_FILE, "r", encoding="utf-8") as f:
        match = re.search(r'APP_VERSION\s*=\s*"(.+?)"', f.read())
    if not match:
        raise RuntimeError("APP_VERSION bulunamadi!")
    return match.group(1)


def write_version(new_ver: str):
    with open(VERSION_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    content = re.sub(
        r'APP_VERSION\s*=\s*".+?"',
        f'APP_VERSION = "{new_ver}"',
        content,
    )
    with open(VERSION_FILE, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[OK] Versiyon guncellendi: {new_ver}")


def build_exe():
    print("\n[BUILD] PyInstaller baslatiliyor...")
    result = subprocess.run(
        [sys.executable, "-m", "PyInstaller", SPEC_FILE, "--noconfirm", "--clean"],
        cwd=ROOT,
    )
    if result.returncode != 0:
        raise RuntimeError("PyInstaller build BASARISIZ!")
    if not os.path.isdir(DIST_DIR):
        raise RuntimeError(f"Build ciktisi bulunamadi: {DIST_DIR}")
    print("[OK] Build tamamlandi.")


def create_zip(version: str) -> str:
    zip_name = f"Fiyatcim-UrunYoneticisi-v{version}"
    zip_path = os.path.join(ROOT, "dist", zip_name)
    # Eski zip varsa sil
    if os.path.exists(zip_path + ".zip"):
        os.remove(zip_path + ".zip")
    shutil.make_archive(zip_path, "zip", DIST_DIR)
    final_path = zip_path + ".zip"
    size_mb = os.path.getsize(final_path) / (1024 * 1024)
    print(f"[OK] ZIP olusturuldu: {final_path} ({size_mb:.1f} MB)")
    return final_path


def get_gh_env() -> dict:
    """gh CLI icin environment hazirla (token dahil)."""
    env = os.environ.copy()
    # Python subprocess'te keyring calismayabiliyor,
    # GH_TOKEN yoksa bash uzerinden token al
    if "GH_TOKEN" not in env:
        try:
            token_result = subprocess.run(
                ["bash", "-c", "gh auth token"],
                capture_output=True, text=True,
            )
            token = token_result.stdout.strip()
            if token:
                env["GH_TOKEN"] = token
        except Exception:
            pass
    return env


def check_gh_cli():
    env = get_gh_env()
    try:
        result = subprocess.run(
            ["gh", "auth", "status"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            env=env,
        )
        if result.returncode != 0:
            raise RuntimeError("gh CLI giris yapilmamis! 'gh auth login' calistirin.")
    except FileNotFoundError:
        raise RuntimeError("gh CLI bulunamadi! https://cli.github.com adresinden yukleyin.")
    print("[OK] GitHub CLI hazir.")


def check_existing_release(tag: str) -> bool:
    env = get_gh_env()
    result = subprocess.run(
        ["gh", "release", "view", tag, "--repo", REPO],
        capture_output=True, text=True, env=env,
    )
    return result.returncode == 0


def create_release(version: str, zip_path: str):
    tag = f"v{version}"
    env = get_gh_env()

    if check_existing_release(tag):
        print(f"\n[!] {tag} release'i zaten mevcut.")
        answer = input("Silip yeniden olusturmak ister misiniz? (e/h): ").strip().lower()
        if answer == "e":
            subprocess.run(
                ["gh", "release", "delete", tag, "--repo", REPO, "--yes", "--cleanup-tag"],
                env=env,
            )
            print(f"[OK] Eski {tag} silindi.")
        else:
            print("[IPTAL] Release olusturulmadi.")
            return

    notes = f"""## Fiyatcim Urun Yoneticisi v{version}

### Kurulum
1. ZIP dosyasini indirin
2. Klasore cikartin
3. Fiyatcim-UrunYoneticisi.exe dosyasini calistirin
4. Ilk calistirmada config.json olusturun (ornek: config.example.json)
"""

    print(f"\n[RELEASE] GitHub release v{version} olusturuluyor...")
    result = subprocess.run(
        [
            "gh", "release", "create", tag,
            zip_path,
            "--repo", REPO,
            "--title", f"Fiyatcim Urun Yoneticisi v{version}",
            "--notes", notes,
            "--latest",
        ],
        capture_output=True, text=True, env=env,
    )
    if result.returncode != 0:
        print(f"[HATA] {result.stderr}")
        raise RuntimeError("GitHub release olusturulamadi!")

    print(f"[OK] Release yayinlandi: {result.stdout.strip()}")


def copy_to_desktop(zip_path: str):
    desktop = os.path.join(os.path.expanduser("~"), "OneDrive", "Masaüstü")
    if not os.path.isdir(desktop):
        desktop = os.path.join(os.path.expanduser("~"), "Desktop")
    dest = os.path.join(desktop, "Final-Uygulama.zip")
    shutil.copy2(zip_path, dest)
    print(f"[OK] Final-Uygulama.zip masaustune kopyalandi.")


def main():
    print("=" * 50)
    print("  Fiyatcim Urun Yoneticisi — Release Araci")
    print("=" * 50)

    # Versiyon kontrol
    current = read_version()
    if len(sys.argv) > 1:
        new_ver = sys.argv[1]
        if new_ver != current:
            write_version(new_ver)
            current = new_ver
    print(f"\n[INFO] Versiyon: {current}")

    # gh CLI kontrol
    check_gh_cli()

    # Build
    build_exe()

    # ZIP
    zip_path = create_zip(current)

    # GitHub Release
    create_release(current, zip_path)

    # Desktop'a kopyala
    copy_to_desktop(zip_path)

    print("\n" + "=" * 50)
    print(f"  TAMAMLANDI! v{current} yayinlandi.")
    print("=" * 50)


if __name__ == "__main__":
    main()
