#!/usr/bin/env python3
"""Scan an Android project for evidence of user data collection.

    python3 scan.py /path/to/project -o findings.json [--gradle-deps deps.txt]

Reads manifests, Gradle files (Groovy, Kotlin DSL, version catalogs), Kotlin/Java source and
network security config. Every finding carries file:line evidence. Nothing here decides the
final answers: draft.py turns SDK matches into a draft, and the agent judges source signals.

--gradle-deps takes the output of
    ./gradlew :app:dependencies --configuration releaseRuntimeClasspath
so SDKs pulled in transitively are matched too.
"""
from __future__ import annotations

import argparse
import datetime as dt
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import csvlib as c  # noqa: E402

VERSION = "0.1.0"
SKIP_DIRS = {".git", ".gradle", ".idea", "node_modules", ".kotlin", ".cxx", "out", ".fleet", ".vscode"}
TEST_DIR_RX = re.compile(r"[\\/]src[\\/](test|androidTest|testDebug|testRelease|sharedTest)[\\/]")
MERGED_MANIFEST_RX = re.compile(r"[\\/]build[\\/]intermediates[\\/]merged_manifests?[\\/].*release", re.I)
MAX_HITS = 25

# Dependencies that never collect user data on their own; kept out of the "unknown" list.
QUIET_GROUPS = (
    "androidx.", "org.jetbrains.kotlin", "org.jetbrains.kotlinx", "com.google.android.material", "junit",
    "org.junit", "io.mockk", "org.mockito", "app.cash.turbine", "com.google.dagger", "com.google.code.gson",
    "com.squareup.moshi", "com.squareup.retrofit2", "com.squareup.okhttp3", "io.coil-kt", "com.github.bumptech",
    "com.google.accompanist", "org.robolectric", "com.jakewharton.timber", "io.insert-koin", "com.google.guava",
    "org.jetbrains:annotations", "com.google.devtools.ksp", "io.ktor", "com.android.tools", "org.slf4j",
    "com.google.android.gms:play-services-base", "com.google.android.gms:play-services-basement",
    "com.google.android.gms:play-services-tasks", "com.google.firebase:firebase-bom", "com.google.firebase:firebase-common",
    "com.google.protobuf", "com.airbnb.android:lottie", "io.github.raamcosta", "com.google.android.play:review",
    "com.google.android.play:app-update", "com.google.android.play:core", "com.google.android.play:feature-delivery",
    "com.google.android.gms:play-services-location", "com.google.android.gms:play-services-maps",
)

SHIPPING = {"implementation", "api", "runtimeOnly", "releaseImplementation", "releaseApi", "releaseRuntimeOnly"}

# (kind, regex, description, candidate data types, account method hint)
SIGNALS = [
    ("network_client", r"\b(retrofit2|okhttp3|io\.ktor\.client|com\.android\.volley|HttpsURLConnection|HttpURLConnection|com\.apollographql|io\.grpc)\b",
     "HTTP client: data passed to these calls leaves the device", [], None),
    ("upload", r"\b(MultipartBody|@Multipart|asRequestBody|toRequestBody\(.*(image|jpeg|png|octet))|\.put(File|Bytes|Stream)\(",
     "File or byte upload: check what is uploaded (photos, audio, documents)", ["PSL_PHOTOS", "PSL_VIDEOS", "PSL_FILES_AND_DOCS"], None),
    ("backend_write", r"\.collection\([^)]*\)\.(add|document)|\.setValue\(|FirebaseDatabase\.getInstance|Firebase\.(firestore|database)\b",
     "Writes to Firestore / Realtime Database: everything written is collected", ["PSL_USER_GENERATED_CONTENT", "PSL_OTHER_APP_ACTIVITY"], None),
    ("analytics_event", r"\blogEvent\(|\.setUserProperty\(|\.track\(\s*\"|mixpanel\.track|Amplitude.*\.track\(",
     "Analytics event: app interactions are collected", ["PSL_USER_INTERACTION", "PSL_OTHER_APP_ACTIVITY"], None),
    ("analytics_user_id", r"\.setUserId\(|\.identify\(|crashlytics\.setUserId",
     "User ID set on analytics/crash SDK: links data to the user's account", ["PSL_USER_ACCOUNT"], None),
    ("search_event", r"Event\.SEARCH|\"search\"\s*\)|logEvent\(\s*\"search",
     "Search terms logged", ["PSL_IN_APP_SEARCH_HISTORY"], None),
    ("ai_request", r"\bgenerateContent\(|GenerativeModel\(|chat\.completions|ChatCompletionRequest|OpenAI\(|\.responses\.create|createChatCompletion|api\.anthropic\.com|generativelanguage\.googleapis",
     "Generative AI request: prompts (and images) are sent to the model provider", ["PSL_USER_GENERATED_CONTENT"], None),
    ("auth_password", r"createUserWithEmailAndPassword|signInWithEmailAndPassword|EmailAuthProvider",
     "Email + password accounts", ["PSL_EMAIL", "PSL_USER_ACCOUNT"], "PSL_ACM_USER_ID_PASSWORD"),
    ("auth_oauth", r"GoogleAuthProvider|GoogleIdTokenCredential|GetGoogleIdOption|GetSignInWithGoogleOption|OAuthProvider|FacebookAuthProvider|GoogleSignIn\.getClient|signInWithCredential",
     "Sign-in with Google / OAuth", ["PSL_NAME", "PSL_EMAIL", "PSL_USER_ACCOUNT"], "PSL_ACM_OAUTH"),
    ("auth_phone", r"PhoneAuthProvider|verifyPhoneNumber",
     "Phone-number sign-in", ["PSL_PHONE", "PSL_USER_ACCOUNT"], "PSL_ACM_USER_ID_OTHER_AUTH"),
    ("auth_anonymous", r"signInAnonymously",
     "Anonymous auth: no user-created account, but the UID is a user ID", ["PSL_USER_ACCOUNT"], None),
    ("device_id", r"Settings\.Secure\.ANDROID_ID|AdvertisingIdClient|getAdvertisingIdInfo|FirebaseInstallations|\.getAppInstanceId\(",
     "Device or advertising identifier read in code", ["PSL_DEVICE_ID"], None),
    ("billing", r"\bBillingClient\b|launchBillingFlow|queryPurchasesAsync|Purchases\.sharedInstance",
     "In-app purchases: purchase history is collected if purchases reach your server or a third party", ["PSL_PURCHASE_HISTORY"], None),
    ("email_input", r"KeyboardType\.Email|TYPE_TEXT_VARIATION_EMAIL_ADDRESS|textEmailAddress|AutofillType\.EmailAddress|ContentType\.EmailAddress",
     "Email input field: collected if the value is sent anywhere", ["PSL_EMAIL"], None),
    ("phone_input", r"KeyboardType\.Phone|textPhone|ContentType\.PhoneNumber",
     "Phone number input field", ["PSL_PHONE"], None),
    ("ip_geolocation", r"ip-api\.com|ipinfo\.io|ipapi\.co|geoip|ipgeolocation",
     "IP-based geolocation: Google requires declaring this as location", ["PSL_APPROX_LOCATION"], None),
    ("crash_handler", r"setDefaultUncaughtExceptionHandler",
     "Custom crash handler: crash logs are collected if it reports anywhere", ["PSL_CRASH_LOGS"], None),
    ("webview", r"\bWebView\b|loadUrl\(",
     "WebView: pages it loads may collect data under your app's name", [], None),
    ("contacts_read", r"ContactsContract", "Reads contacts", ["PSL_CONTACTS"], None),
    ("installed_apps", r"getInstalledPackages|getInstalledApplications", "Lists installed apps", ["PSL_APPS_ON_DEVICE"], None),
    ("ml_kit_cloud", r"FirebaseVisionCloud|getCloudTextRecognizer|getCloudImageLabeler|ImageAnnotatorClient",
     "Cloud vision API: images leave the device", ["PSL_PHOTOS"], None),
]

HTTP_IGNORE = re.compile(
    r"http://(schemas\.android\.com|www\.w3\.org|localhost|127\.0\.0\.1|10\.0\.2\.2|0\.0\.0\.0|"
    r"(www\.)?example\.(com|org)|xmlpull\.org|ns\.adobe\.com|www\.apache\.org|purl\.org|xml\.org|"
    r"java\.sun\.com|schemas\.xmlsoap\.org|tools\.android\.com)"
)
HTTP_RX = re.compile(r"""["'](http://[^"'\s\\]+)""")


def rel(root: str, path: str) -> str:
    return os.path.relpath(path, root)


def read(path: str) -> str:
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            return f.read()
    except OSError:
        return ""


def line_of(text: str, offset: int) -> int:
    return text.count("\n", 0, offset) + 1


def strip_comment(line: str) -> str:
    s = line.strip()
    if s.startswith("//") or s.startswith("*") or s.startswith("/*") or s.startswith("#"):
        return ""
    return line


def walk(root: str):
    files = {"manifest": [], "merged_manifest": [], "gradle": [], "toml": [], "source": [], "test_source": [],
             "xml": [], "values": [], "google_services": []}
    for dirpath, dirnames, filenames in os.walk(root):
        parts = set(rel(root, dirpath).replace("\\", "/").split("/"))
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        # Inside build/ only the merged manifests matter; don't walk the rest of the outputs.
        base = os.path.basename(dirpath)
        if base == "build":
            dirnames[:] = [d for d in dirnames if d == "intermediates"]
        elif base == "intermediates" and "build" in parts:
            dirnames[:] = [d for d in dirnames if d.startswith("merged_manifest")]
        in_build = "build" in parts
        for fn in filenames:
            p = os.path.join(dirpath, fn)
            if in_build:
                if fn == "AndroidManifest.xml" and MERGED_MANIFEST_RX.search(p):
                    files["merged_manifest"].append(p)
                continue
            if fn == "AndroidManifest.xml":
                files["manifest"].append(p)
            elif fn.endswith((".gradle", ".gradle.kts")):
                files["gradle"].append(p)
            elif fn.endswith(".toml") and os.path.basename(dirpath) == "gradle":
                files["toml"].append(p)
            elif fn.endswith((".kt", ".java")):
                (files["test_source"] if TEST_DIR_RX.search(p) else files["source"]).append(p)
            elif fn.endswith(".xml") and "/res/xml" in dirpath.replace("\\", "/"):
                files["xml"].append(p)
            elif fn.endswith(".xml") and "/res/values" in dirpath.replace("\\", "/"):
                files["values"].append(p)
            elif fn == "google-services.json":
                files["google_services"].append(p)
    return files


# ---------------------------------------------------------------- version catalog

def parse_catalog(path: str) -> dict:
    """Return {'libraries': {accessor: (coord, line)}, 'bundles': {accessor: [accessor...]}}."""
    text = read(path)
    versions: dict[str, str] = {}
    libs: dict[str, tuple[str, int]] = {}
    bundles: dict[str, list[str]] = {}
    section = None
    lines = text.splitlines()
    i = 0
    while i < len(lines):
        raw = lines[i]
        line = raw.split("#", 1)[0].strip()
        lineno = i + 1
        i += 1
        if not line:
            continue
        m = re.fullmatch(r"\[(\w+)\]", line)
        if m:
            section = m.group(1)
            continue
        if "=" not in line:
            continue
        key, val = (s.strip() for s in line.split("=", 1))
        key = key.strip('"')
        # Bundles can span several lines.
        if section == "bundles" and val.startswith("[") and "]" not in val:
            while i < len(lines) and "]" not in val:
                val += lines[i].split("#", 1)[0]
                i += 1
        accessor = re.sub(r"[-_]", ".", key)
        if section == "versions":
            versions[key] = val.strip('"')
        elif section == "libraries":
            coord = None
            if val.startswith('"'):
                parts = val.strip('"').split(":")
                coord = ":".join(parts[:2])
            else:
                mod = re.search(r'module\s*=\s*"([^"]+)"', val)
                grp = re.search(r'group\s*=\s*"([^"]+)"', val)
                name = re.search(r'name\s*=\s*"([^"]+)"', val)
                if mod:
                    coord = mod.group(1)
                elif grp and name:
                    coord = f"{grp.group(1)}:{name.group(1)}"
            if coord:
                libs[accessor] = (coord, lineno)
        elif section == "bundles":
            bundles[accessor] = [re.sub(r"[-_]", ".", x) for x in re.findall(r'"([^"]+)"', val)]
    return {"libraries": libs, "bundles": bundles, "versions": versions}


# ---------------------------------------------------------------- gradle

CONFIG_RX = re.compile(r"^\s*([A-Za-z]*(?:[Ii]mplementation|[Aa]pi|[Cc]ompileOnly|[Rr]untimeOnly)|kapt|ksp|annotationProcessor|classpath)\b")
COORD_RX = re.compile(r"""["']([A-Za-z0-9_.\-]+):([A-Za-z0-9_.\-]+)(?::([^"'@\s]+))?["']""")
MAP_RX = re.compile(r"""group\s*[:=]\s*["']([^"']+)["']\s*,\s*name\s*[:=]\s*["']([^"']+)["']""")
LIBS_RX = re.compile(r"\blibs\.([A-Za-z0-9_.]+)")


def scope_of(config: str | None) -> str:
    if config is None:
        return "unknown"
    lc = config.lower()
    if "androidtest" in lc or lc.startswith("test") or "testimplementation" in lc:
        return "test"
    if lc.startswith("debug"):
        return "debug"
    if lc in ("kapt", "ksp", "annotationprocessor", "classpath"):
        return "build"
    if "compileonly" in lc:
        return "compile-only"
    return "release"


def parse_gradle(root: str, files: list[str], catalog: dict) -> tuple[list[dict], dict]:
    deps: list[dict] = []
    meta = {"min_sdk": None, "target_sdk": None}
    libs, bundles = catalog.get("libraries", {}), catalog.get("bundles", {})
    for path in files:
        text = read(path)
        for n, raw in enumerate(text.splitlines(), start=1):
            line = strip_comment(raw)
            if not line:
                continue
            m = re.search(r"\btargetSdk(?:Version)?\s*[=(]?\s*(\d+)", line)
            if m:
                meta["target_sdk"] = max(meta["target_sdk"] or 0, int(m.group(1)))
            m = re.search(r"\bminSdk(?:Version)?\s*[=(]?\s*(\d+)", line)
            if m:
                ms = int(m.group(1))
                meta["min_sdk"] = ms if meta["min_sdk"] is None else min(meta["min_sdk"], ms)
            cm = CONFIG_RX.match(line)
            config = cm.group(1) if cm else None
            if config is None and "plugins" in line:
                continue
            found = []
            for g, a, v in COORD_RX.findall(line):
                if "." in g or g in ("junit",):
                    found.append((f"{g}:{a}", v or None))
            for g, a in MAP_RX.findall(line):
                found.append((f"{g}:{a}", None))
            for acc in LIBS_RX.findall(line):
                acc = acc.rstrip(".")
                if acc.startswith("bundles."):
                    for member in bundles.get(acc[len("bundles."):], []):
                        if member in libs:
                            found.append((libs[member][0], None))
                elif acc.startswith(("versions.", "plugins.")):
                    continue
                elif acc in libs:
                    found.append((libs[acc][0], None))
            for coord, ver in found:
                if config is None and "dependencies" not in text:
                    continue
                deps.append({"coord": coord, "version": ver, "config": config, "scope": scope_of(config),
                             "file": rel(root, path), "line": n, "text": raw.strip()[:160]})
    return deps, meta


def parse_gradle_deps_report(path: str) -> list[dict]:
    """Coordinates from `./gradlew :app:dependencies --configuration releaseRuntimeClasspath`."""
    out, seen = [], set()
    for n, line in enumerate(read(path).splitlines(), start=1):
        m = re.search(r"[+\\]--- ([A-Za-z0-9_.\-]+):([A-Za-z0-9_.\-]+)(?::([A-Za-z0-9_.\-]+))?", line)
        if m:
            coord = f"{m.group(1)}:{m.group(2)}"
            if coord not in seen:
                seen.add(coord)
                out.append({"coord": coord, "version": m.group(3), "config": "releaseRuntimeClasspath",
                            "scope": "release-transitive", "file": os.path.basename(path), "line": n,
                            "text": line.strip()[:160]})
    return out


def sdk_matches(coord: str, pattern: str) -> bool:
    if pattern.endswith("*"):
        return coord.startswith(pattern[:-1])
    return coord == pattern or coord == pattern + "-ktx"


# ---------------------------------------------------------------- manifest

PERM_RX = re.compile(r"<uses-permission(?:-sdk-23)?\b[^>]*?android:name\s*=\s*\"([^\"]+)\"[^>]*>", re.S)


def parse_manifests(root: str, files: list[str], source: str) -> tuple[list[dict], list[dict]]:
    perms, cleartext = [], []
    for path in files:
        text = read(path)
        for m in PERM_RX.finditer(text):
            tag = m.group(0)
            perms.append({"name": m.group(1), "file": rel(root, path), "line": line_of(text, m.start()),
                          "source": source, "removed": 'tools:node="remove"' in tag})
        for m in re.finditer(r"android:usesCleartextTraffic\s*=\s*\"(true|false)\"", text):
            cleartext.append({"kind": "usesCleartextTraffic", "value": m.group(1) == "true",
                              "file": rel(root, path), "line": line_of(text, m.start()), "text": m.group(0)})
        for m in re.finditer(r"android:networkSecurityConfig\s*=\s*\"@xml/([\w.]+)\"", text):
            cleartext.append({"kind": "networkSecurityConfig", "value": m.group(1),
                              "file": rel(root, path), "line": line_of(text, m.start()), "text": m.group(0)})
    return perms, cleartext


def parse_nsc(root: str, files: list[str]) -> list[dict]:
    out = []
    for path in files:
        text = read(path)
        if "<network-security-config" not in text:
            continue
        for m in re.finditer(r"<(base-config|domain-config)\b[^>]*cleartextTrafficPermitted\s*=\s*\"(true|false)\"", text):
            out.append({"kind": f"nsc:{m.group(1)}", "value": m.group(2) == "true", "file": rel(root, path),
                        "line": line_of(text, m.start()), "text": m.group(0)[:160]})
    return out


# ---------------------------------------------------------------- source

def grep(root: str, files: list[str], rx: re.Pattern, limit: int = MAX_HITS) -> list[dict]:
    hits = []
    for path in files:
        text = read(path)
        if not rx.search(text):
            continue
        for n, raw in enumerate(text.splitlines(), start=1):
            line = strip_comment(raw)
            if line and rx.search(line):
                hits.append({"file": rel(root, path), "line": n, "text": raw.strip()[:160]})
                if len(hits) >= limit:
                    return hits
    return hits


def scan(root: str, gradle_deps: str | None = None) -> dict:
    root = os.path.abspath(root)
    files = walk(root)
    catalog = {"libraries": {}, "bundles": {}}
    for t in files["toml"]:
        cat = parse_catalog(t)
        catalog["libraries"].update(cat["libraries"])
        catalog["bundles"].update(cat["bundles"])

    deps, meta = parse_gradle(root, files["gradle"], catalog)
    if gradle_deps:
        deps += parse_gradle_deps_report(gradle_deps)

    # SDK matching against the knowledge base.
    kb = c.load_knowledge("sdks.json")
    sdks, matched_coords = [], set()
    for s in kb:
        hits = [d for d in deps if any(sdk_matches(d["coord"], p) for p in s.get("match", []))]
        if not hits:
            continue
        matched_coords.update(d["coord"] for d in hits)
        ships = any(d["scope"] in ("release", "release-transitive", "unknown") for d in hits)
        sdks.append({
            "id": s["id"], "name": s["name"], "category": s.get("category"), "confidence": s["confidence"],
            "source": s.get("source"), "notes": s.get("notes"), "ships_in_release": ships,
            "matched": [{k: d[k] for k in ("coord", "scope", "file", "line", "text")} for d in hits],
            "data": s.get("data", []),
        })

    unknown, seen = [], set()
    for d in deps:
        if d["coord"] in matched_coords or d["coord"] in seen or d["scope"] in ("test", "build", "debug"):
            continue
        if d["coord"].startswith(QUIET_GROUPS):
            continue
        seen.add(d["coord"])
        unknown.append({k: d[k] for k in ("coord", "scope", "file", "line")})

    # Permissions, and whether the app's own code uses them.
    perm_kb = c.load_knowledge("permissions.json")
    app_perms, cleartext = parse_manifests(root, files["manifest"], "app")
    merged_perms, merged_ct = parse_manifests(root, files["merged_manifest"], "merged")
    app_names = {p["name"] for p in app_perms}
    library_perms = [p for p in merged_perms if p["name"] not in app_names]
    permissions = []
    for p in app_perms + library_perms:
        entry = next((e for e in perm_kb if e["permission"] == p["name"] or
                      (e["permission"].endswith("*") and p["name"].startswith(e["permission"][:-1]))), None)
        use = []
        if entry and entry.get("apis"):
            use = grep(root, files["source"], re.compile("|".join(f"(?:{a})" for a in entry["apis"])), limit=8)
        permissions.append({**p, "types": entry["types"] if entry else [], "known": bool(entry),
                            "used_in_code": bool(use), "use_evidence": use})

    cleartext += merged_ct + parse_nsc(root, files["xml"])
    http_urls = []
    for path in files["source"] + files["values"] + files["gradle"]:
        text = read(path)
        if "http://" not in text:
            continue
        for n, raw in enumerate(text.splitlines(), start=1):
            if not strip_comment(raw):
                continue
            for url in HTTP_RX.findall(raw):
                if not HTTP_IGNORE.match(url):
                    http_urls.append({"url": url, "file": rel(root, path), "line": n, "text": raw.strip()[:160]})

    cleartext_on = [x for x in cleartext if x["kind"] in ("usesCleartextTraffic",) or x["kind"].startswith("nsc:")]
    permitted = any(x["value"] is True for x in cleartext_on)
    target = meta["target_sdk"]
    if http_urls and (permitted or (target is not None and target < 28)):
        enc, why = False, "plain http:// URLs found and cleartext traffic is permitted"
    elif permitted:
        enc, why = None, "cleartext traffic is permitted in config but no http:// URL was found in code; check server URLs that come from config or the network"
    elif http_urls:
        enc, why = None, "http:// URLs found, but cleartext traffic is blocked (requests to them would fail); check whether they are used"
    else:
        enc, why = True, "no http:// URLs and no cleartext permission found"

    signals = []
    for kind, rx, desc, types, acm in SIGNALS:
        hits = grep(root, files["source"], re.compile(rx))
        if hits:
            signals.append({"kind": kind, "description": desc, "types": types, "account_method": acm, "evidence": hits})

    has_internet = any(p["name"] == "android.permission.INTERNET" for p in app_perms + merged_perms) or bool(sdks)
    notes = []
    if not files["merged_manifest"]:
        notes.append("No merged release manifest found under build/. Permissions added by libraries are not listed; "
                     "run ./gradlew :app:processReleaseMainManifest (or a release build) and scan again to include them.")
    if not gradle_deps:
        notes.append("Only directly declared dependencies were matched. For transitive SDKs run "
                     "./gradlew :app:dependencies --configuration releaseRuntimeClasspath > deps.txt and pass --gradle-deps deps.txt.")
    if files["google_services"]:
        notes.append("google-services.json is present: Firebase is configured.")

    return {
        "tool": "data-safety-from-code/scan", "version": VERSION,
        "project": root, "scanned_at": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat(),
        "stats": {k: len(v) for k, v in files.items()},
        "gradle": meta,
        "dependencies": deps,
        "sdks": sdks,
        "unknown_dependencies": unknown,
        "permissions": permissions,
        "has_internet_permission": has_internet,
        "network": {"http_urls": http_urls[:MAX_HITS], "cleartext_config": cleartext,
                    "encrypted_in_transit_suggestion": enc, "reason": why},
        "signals": signals,
        "notes": notes,
    }


def summary(f: dict) -> str:
    out = [f"Scanned {f['project']}",
           f"  source files: {f['stats']['source']}  gradle files: {f['stats']['gradle']}  manifests: {f['stats']['manifest']}"]
    out.append(f"  SDKs matched: {', '.join(s['id'] for s in f['sdks']) or 'none'}")
    if f["unknown_dependencies"]:
        out.append(f"  dependencies not in the knowledge base: {len(f['unknown_dependencies'])} (review them)")
    unused = [p["name"] for p in f["permissions"] if p["known"] and not p["used_in_code"] and p["source"] == "app"]
    if unused:
        out.append(f"  permissions declared but no use found in code: {', '.join(unused)}")
    out.append(f"  signals: {', '.join(s['kind'] for s in f['signals']) or 'none'}")
    out.append(f"  encrypted in transit: {f['network']['encrypted_in_transit_suggestion']} ({f['network']['reason']})")
    return "\n".join(out)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("project")
    ap.add_argument("-o", "--out", default="findings.json")
    ap.add_argument("--gradle-deps", help="output of ./gradlew :app:dependencies --configuration releaseRuntimeClasspath")
    a = ap.parse_args()
    if not os.path.isdir(a.project):
        print(f"not a directory: {a.project}", file=sys.stderr)
        return 2
    f = scan(a.project, a.gradle_deps)
    c.dump_json(f, a.out)
    print(summary(f))
    print(f"\nwrote {a.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
