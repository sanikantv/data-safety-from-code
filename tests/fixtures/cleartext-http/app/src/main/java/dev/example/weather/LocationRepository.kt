package dev.example.weather

import com.google.android.gms.location.LocationServices
import retrofit2.Retrofit

class LocationRepository(context: android.content.Context) {
    private val client = LocationServices.getFusedLocationProviderClient(context)
    private val api = Retrofit.Builder().baseUrl("http://api.weather-fixture.net/v1/").build().create(WeatherApi::class.java)

    suspend fun forecastHere(): String {
        val location = client.lastLocation.await()
        return api.forecast(location.latitude, location.longitude)
    }
}
