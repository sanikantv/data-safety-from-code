android {
    namespace = "dev.example.calc"
    defaultConfig { minSdk = 24; targetSdk = 36 }
}

dependencies {
    implementation("androidx.core:core-ktx:1.17.0")
    implementation("androidx.compose.material3:material3:1.4.0")
}
