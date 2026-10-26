android {
    namespace = "dev.example.weather"
    defaultConfig {
        minSdk = 24
        targetSdk = 35
        buildConfigField("String", "API_URL", "\"http://api.weather-fixture.net/v1/\"")
    }
}

dependencies {
    implementation("com.squareup.retrofit2:retrofit:3.0.0")
    implementation("com.google.android.gms:play-services-location:21.3.0")
}
