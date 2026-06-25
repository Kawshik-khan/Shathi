# Shathi — Android Release (Signed APK)

This document describes how to produce a **signed** production APK for the Shathi Android app.

## Prerequisites
- JDK 21 (e.g. Microsoft OpenJDK) — `JAVA_HOME` must point to it.
- Android SDK — `ANDROID_HOME` / `ANDROID_SDK_ROOT` must point to it (e.g. `D:\AndroidSDK`).
- `android/local.properties` must contain `sdk.dir=<path-to-Android-SDK>`.

## 1. Branding / web assets
The app brand name is **Shathi** (`siteConfig.name`, i18n strings, `capacitor.config.ts` `appName`,
and `android/.../values/strings.xml` `app_name` / `title_activity_main`).

App icon and splash are authored as in-repo SVG sources:
- `assets/icon.svg` (1024×1024 glassmorphism lotus mark)
- `assets/splash.svg` (2732×2732 centered logo on brand gradient)

Regenerate all native densities after changing the SVGs:

```
npx @capacitor/assets generate --android
npx cap sync android
```

## 2. Signing keystore
A release keystore was generated with `keytool` (kept **out of source control**):

```
keytool -genkeypair -v -keystore android/shathi-release.keystore -alias shathi \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass <STORE_PASSWORD> -keypass <KEY_PASSWORD> \
  -dname "CN=Shathi, OU=Mobile, O=Shathi, L=Dhaka, ST=Dhaka, C=BD"
```

Credentials are read from `android/keystore.properties` (gitignored):

```
storeFile=shathi-release.keystore
storePassword=<STORE_PASSWORD>
keyAlias=shathi
keyPassword=<KEY_PASSWORD>
```

> `android/app/build.gradle` loads `keystore.properties` and applies `signingConfigs.release`
> to `buildTypes.release` only when the properties file exists. If it is missing, the build
> falls back to producing an unsigned APK.

Both `shathi-release.keystore` and `keystore.properties` are listed in `android/.gitignore`.

## 3. Build the signed APK

```
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

## 4. Verify the signature

```
<ANDROID_SDK>/build-tools/<version>/apksigner verify --verbose app-release.apk
```

Expected: `Verified` with `APK Signature Scheme v2: true` and `Number of signers: 1`.
