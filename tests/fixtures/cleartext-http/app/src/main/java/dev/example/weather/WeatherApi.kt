package dev.example.weather

import retrofit2.http.GET
import retrofit2.http.Query

interface WeatherApi {
    @GET("forecast")
    suspend fun forecast(@Query("lat") lat: Double, @Query("lon") lon: Double): String
}
