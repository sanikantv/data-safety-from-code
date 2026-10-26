package dev.example.notes

import com.google.firebase.Firebase
import com.google.firebase.analytics.analytics
import com.google.firebase.analytics.logEvent
import com.google.firebase.firestore.firestore

class NotesRepository(private val uid: String) {
    private val db = Firebase.firestore

    fun save(title: String, body: String) {
        db.collection("users").document(uid).collection("notes").add(mapOf("title" to title, "body" to body))
        Firebase.analytics.logEvent("note_saved") { param("length", body.length.toLong()) }
    }
}
