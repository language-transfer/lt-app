plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "org.languagetransfer"
    compileSdk = 36
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        // Same id as the Expo app, so this can replace it in the Play Store.
        applicationId = "org.languagetransfer"
        // Set explicitly instead of inheriting flutter.*SdkVersion, so a
        // Flutter upgrade cannot change them silently.
        minSdk = 24
        targetSdk = 36
        // Uses the version code from pubspec.yaml. When using split APKs, 1000 * ABI_VERSION
        // is added automatically by Flutter. (https://developer.android.com/studio/build/configure-apk-splits#configure-APK-versions)
        // You can force using the value of versionCode by specifying the `-P force-version-code-ignoring-abi=true`
        // flag during build.
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        // Language Transfer upload-key signing, with the same Gradle properties
        // as the Expo app (normally in ~/.gradle/gradle.properties). The
        // keystore lives in android/app/ and is git-ignored. Never put
        // credential values in this file.
        create("release") {
            val storeFilePath = providers.gradleProperty("MYAPP_UPLOAD_STORE_FILE").orNull
            if (storeFilePath != null) {
                val uploadStoreFile = file(storeFilePath)
                if (!uploadStoreFile.exists()) {
                    throw GradleException("Android upload keystore not found at $uploadStoreFile")
                }
                storeFile = uploadStoreFile
                storePassword = providers.gradleProperty("MYAPP_UPLOAD_STORE_PASSWORD").get()
                keyAlias = providers.gradleProperty("MYAPP_UPLOAD_KEY_ALIAS").get()
                keyPassword = providers.gradleProperty("MYAPP_UPLOAD_KEY_PASSWORD").get()
            }
        }
    }

    buildTypes {
        // Development builds get their own id and name, so they install next
        // to the store app. The Flutter Gradle plugin creates "profile" from
        // "debug" before this block runs, so it is configured explicitly.
        debug {
            applicationIdSuffix = ".dev"
            manifestPlaceholders["appName"] = "LT Dev"
        }
        getByName("profile") {
            applicationIdSuffix = ".dev"
            manifestPlaceholders["appName"] = "LT Dev"
        }
        release {
            manifestPlaceholders["appName"] = "Language Transfer"
            // Without the upload key, fall back to the debug key so that
            // `flutter run --release` works locally. Google Play rejects
            // debug-signed uploads, so such a build cannot be published.
            val hasUploadKey = providers.gradleProperty("MYAPP_UPLOAD_STORE_FILE").isPresent
            signingConfig = signingConfigs.getByName(if (hasUploadKey) "release" else "debug")
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
