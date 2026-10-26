package dev.example.notes

import androidx.credentials.GetCredentialRequest
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.Firebase
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.auth.auth

class AuthRepository {
    private val option = GetGoogleIdOption.Builder().setServerClientId(BuildConfig.WEB_CLIENT_ID).build()
    val request = GetCredentialRequest.Builder().addCredentialOption(option).build()

    suspend fun signIn(token: GoogleIdTokenCredential) {
        val credential = GoogleAuthProvider.getCredential(token.idToken, null)
        Firebase.auth.signInWithCredential(credential)
    }

    fun deleteAccount() = Firebase.auth.currentUser?.delete()
}
