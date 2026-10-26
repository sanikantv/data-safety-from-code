plugins {
    alias(libs.plugins.android.application)
}

android {
    namespace = "dev.example.admob"
    compileSdk = 36
    defaultConfig {
        minSdk = 24
        targetSdk = 36
    }
}

dependencies {
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.material3)
    implementation(libs.play.services.ads)
    testImplementation(libs.junit)
}
