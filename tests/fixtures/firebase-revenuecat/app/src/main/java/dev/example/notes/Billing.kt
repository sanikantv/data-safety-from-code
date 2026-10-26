package dev.example.notes

import com.revenuecat.purchases.Purchases
import com.revenuecat.purchases.PurchasesConfiguration

fun configureBilling(context: android.content.Context, uid: String) {
    Purchases.configure(PurchasesConfiguration.Builder(context, "goog_fixture").appUserID(uid).build())
    Purchases.sharedInstance.syncPurchases()
}
