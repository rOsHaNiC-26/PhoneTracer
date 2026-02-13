/* ==========================================
   PhoneTracer — Frontend Logic
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {
    // === DOM Elements ===
    const form = document.getElementById("track-form");
    const phoneInput = document.getElementById("phone-input");
    const clearBtn = document.getElementById("clear-btn");
    const trackBtn = document.getElementById("track-btn");
    const btnText = trackBtn.querySelector(".btn-text");
    const btnLoader = trackBtn.querySelector(".btn-loader");
    const btnIcon = trackBtn.querySelector(".btn-icon");
    const errorMsg = document.getElementById("error-msg");
    const errorText = document.getElementById("error-text");
    const results = document.getElementById("results");
    const resultsGrid = document.getElementById("results-grid");
    const validityBadge = document.getElementById("validity-badge");
    const mapContainer = document.getElementById("map-container");

    let map = null;
    let marker = null;
    let clockTimer = null;
    let currentUser = JSON.parse(localStorage.getItem("tracer_user") || "null");

    // === App Initialization ===
    updateAuthState();
    loadHistory();

    // === Authentication UI ===
    const loginTrigger = document.getElementById("login-trigger");
    const authModal = document.getElementById("auth-modal");
    const closeModal = document.querySelector(".close-modal");
    const authTabs = document.querySelectorAll(".auth-tab");
    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");
    const logoutBtn = document.getElementById("logout-btn");

    const openAuth = () => authModal.classList.add("active");
    const closeAuth = () => authModal.classList.remove("active");

    loginTrigger.onclick = openAuth;
    closeModal.onclick = closeAuth;

    authTabs.forEach(tab => {
        tab.onclick = () => {
            authTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            if (tab.dataset.tab === "login") {
                loginForm.style.display = "block";
                signupForm.style.display = "none";
            } else {
                loginForm.style.display = "none";
                signupForm.style.display = "block";
            }
        };
    });

    loginForm.onsubmit = (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value;
        currentUser = { name: email.split("@")[0], email };
        localStorage.setItem("tracer_user", JSON.stringify(currentUser));
        updateAuthState();
        closeAuth();
    };

    signupForm.onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById("signup-name").value;
        currentUser = { name, email: document.getElementById("signup-email").value };
        localStorage.setItem("tracer_user", JSON.stringify(currentUser));
        updateAuthState();
        closeAuth();
    };

    logoutBtn.onclick = () => {
        localStorage.removeItem("tracer_user");
        currentUser = null;
        updateAuthState();
        location.reload();
    };

    function updateAuthState() {
        const userArea = document.getElementById("user-area");
        const loginBtn = document.getElementById("login-trigger");
        const userProfile = document.getElementById("user-profile");
        const userNameEl = document.getElementById("user-name");

        if (currentUser) {
            loginBtn.style.display = "none";
            userProfile.style.display = "flex";
            userNameEl.textContent = `👋 ${currentUser.name}`;
        } else {
            loginBtn.style.display = "block";
            userProfile.style.display = "none";
        }
    }

    // === Input Handling ===
    phoneInput.addEventListener("input", () => {
        clearBtn.style.display = phoneInput.value.length > 0 ? "flex" : "none";
    });

    clearBtn.addEventListener("click", () => {
        phoneInput.value = "";
        clearBtn.style.display = "none";
        phoneInput.focus();
        hideError();
        hideResults();
    });

    // === Form Submit ===
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!currentUser) {
            openAuth();
            showError("Please Login or Sign Up to use the tracker.");
            return;
        }

        const phoneNumber = phoneInput.value.trim();
        if (!phoneNumber) {
            showError("Please enter a phone number.");
            return;
        }

        trackNumber(phoneNumber);
    });

    async function trackNumber(phoneNumber) {
        hideError();
        hideResults();
        setLoading(true);

        try {
            const response = await fetch("/api/track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone_number: phoneNumber }),
            });

            if (!response.ok) {
                const text = await response.text();
                console.error("Server returned error:", response.status, text);
                try {
                    const data = JSON.parse(text);
                    showError(data.error || `Server error (${response.status})`);
                } catch (e) {
                    showError(`Network error (${response.status}). Please try again later.`);
                }
                return;
            }

            const data = await response.json();

            if (!data.success) {
                showError(data.error || "Failed to track the phone number.");
                return;
            }

            saveToHistory(data.data);
            renderResults(data.data);
        } catch (err) {
            console.error("Fetch error:", err);
            showError("Network error. Please check your connection and try again.");
        } finally {
            setLoading(false);
        }
    }

    // === Loading State ===
    function setLoading(isLoading) {
        trackBtn.disabled = isLoading;
        btnText.style.display = isLoading ? "none" : "inline";
        btnIcon.style.display = isLoading ? "none" : "inline";
        btnLoader.style.display = isLoading ? "flex" : "none";
    }

    // === Error Display ===
    function showError(message) {
        errorText.textContent = message;
        errorMsg.style.display = "flex";
    }

    function hideError() {
        errorMsg.style.display = "none";
    }

    // === Hide Results ===
    function hideResults() {
        results.style.display = "none";
        mapContainer.style.display = "none";
        if (clockTimer) clearInterval(clockTimer);
    }

    // === Render Results ===
    function renderResults(data) {
        resultsGrid.innerHTML = "";
        if (clockTimer) clearInterval(clockTimer);

        // Validity badge
        if (data.is_valid) {
            validityBadge.className = "validity-badge valid";
            validityBadge.innerHTML = "✅ Valid Number";
        } else {
            validityBadge.className = "validity-badge invalid";
            validityBadge.innerHTML = "❌ Invalid Number";
        }

        // Pro Feature: Action Center
        const actionCenter = document.createElement("div");
        actionCenter.className = "action-center";
        const cleanNumber = data.formatted.e164.replace(/\+/g, "");
        actionCenter.innerHTML = `
        <a href="https://wa.me/${cleanNumber}" target="_blank" class="action-btn whatsapp">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.628 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            <span>WhatsApp</span>
        </a>
        <a href="https://t.me/share/url?url=${data.formatted.e164}" target="_blank" class="action-btn telegram">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0C5.346 0 0 5.347 0 11.944c0 6.598 5.346 11.944 11.944 11.944 6.598 0 11.944-5.346 11.944-11.944C23.888 5.347 18.542 0 11.944 0zm5.206 16.561c-.139.467-.714 1.106-1.127 1.189-.524.106-1.025.106-1.558-.33l-2.077-1.693-1.258-1.023-2.008 1.636c-.463.376-.893.426-1.25.426-.525 0-.75-.327-.75-.838 0-.306.1-.59.278-.853l1.83-2.678c.038-.056.094-.094.156-.11l.163-.038a.333.333 0 01.353.111l1.597 1.954 1.18-.962-2.92-3.568c-.144-.176-.144-.45 0-.626L13.11 5.92c.113-.09.288-.04.35.1l.66 1.488c.038.085.038.182 0 .267l-.66 1.488a.315.315 0 01-.1.13c-.015.01-.033.02-.05.026-.06.015-.123.012-.18-.01a.332.332 0 01-.157-.168l-.34-.766-.58.708 2.05 2.508 1.76-1.436c.41-.335.807-.4.12-.4-.36-.01-.73-.01-.11-.01.35 0 .58.26.58.58v4.832c0 .35-.11.58-.33.72-.11.07-.26.11-.42.11-.27 0-.58-.1-.85-.33l-1.33-1.085z"/></svg>
            <span>Telegram</span>
        </a>
        <a href="tel:${data.formatted.e164}" class="action-btn call">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            <span>Call</span>
        </a>
    `;
        resultsGrid.appendChild(actionCenter);

        // Pro Feature: Local Clock
        const timezone = data.timezones[0] || "UTC";
        const clockContainer = document.createElement("div");
        clockContainer.className = "clock-container";
        clockContainer.innerHTML = `
        <div class="clock-info">
            <span class="clock-label">Current Local Time</span>
            <span class="clock-time" id="local-clock">--:--:--</span>
        </div>
        <div style="font-size: 0.9rem; text-align: right; color: rgba(255,255,255,0.8);">
            <strong>${timezone}</strong><br/>
            ${data.location}
        </div>
    `;
        resultsGrid.appendChild(clockContainer);

        startClock(timezone);

        // Build result items
        const items = [
            { label: "Location", value: `${data.flag} ${data.location}`, icon: "📍", color: "#6366f1" },
            { label: "Original Carrier", value: data.carrier, icon: "📡", color: "#ec4899", note: data.carrier_note },
            { label: "Country", value: data.country_code, icon: "🌍", color: "#14b8a6" },
            { label: "Number Type", value: data.number_type, icon: "📱", color: "#f59e0b" },
            { label: "International", value: data.formatted.international, icon: "🔢", color: "#06b6d4" },
            { label: "National", value: data.formatted.national, icon: "📞", color: "#10b981" },
            { label: "E.164 Format", value: data.formatted.e164, icon: "🏷️", color: "#f97316" },
        ];

        items.forEach((item, index) => {
            const el = document.createElement("div");
            el.className = "result-item";
            el.style.animation = `fadeInUp 0.4s ease forwards ${index * 0.05 + 0.3}s`;
            el.style.opacity = "0";
            el.innerHTML = `
        <button class="copy-btn" title="Copy to clipboard" onclick="copyToClipboard('${item.value}', this)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
        <div class="result-label">
          <span class="result-label-dot" style="background: ${item.color};"></span>
          ${item.icon} ${item.label}
        </div>
        <div class="result-value">${item.value}</div>
        ${item.note ? `<span class="carrier-note">${item.note}</span>` : ""}
      `;
            resultsGrid.appendChild(el);
        });

        results.style.display = "block";
        if (data.location !== "Unknown") showMap(data.location, data.country_code);

        setTimeout(() => results.scrollIntoView({ behavior: "smooth" }), 200);
    }

    // === Pro Feature: Clock ===
    function startClock(tz) {
        const clockEl = document.getElementById("local-clock");
        const update = () => {
            try {
                const time = new Intl.DateTimeFormat("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                    timeZone: tz
                }).format(new Date());
                clockEl.textContent = time;
            } catch (e) {
                clockEl.textContent = new Date().toLocaleTimeString();
            }
        };
        update();
        clockTimer = setInterval(update, 1000);
    }

    // === Pro Feature: History (User-Specific) ===
    function saveToHistory(data) {
        if (!currentUser) return;

        // Create a unique key for each user's history
        const historyKey = `tracer_history_${currentUser.email}`;
        let history = JSON.parse(localStorage.getItem(historyKey) || "[]");

        const newItem = {
            number: data.formatted.international,
            location: data.location,
            flag: data.flag,
            time: new Date().toISOString()
        };

        // Remove duplicates
        history = history.filter(h => h.number !== newItem.number);
        history.unshift(newItem);
        history = history.slice(0, 10);

        localStorage.setItem(historyKey, JSON.stringify(history));
        loadHistory();
    }

    function loadHistory() {
        let historySection = document.getElementById("history-section");

        // If not logged in, remove history section if it exists
        if (!currentUser) {
            if (historySection) historySection.style.display = "none";
            return;
        }

        if (!historySection) {
            historySection = document.createElement("section");
            historySection.id = "history-section";
            historySection.className = "history-section";
            historySection.innerHTML = `
            <div class="section-header">
                <h2 class="section-title">Your Recent <span class="gradient-text">Tracks</span></h2>
            </div>
            <div id="history-grid" class="history-grid"></div>
        `;
            document.querySelector("main").appendChild(historySection);
        }

        const grid = document.getElementById("history-grid");
        const historyKey = `tracer_history_${currentUser.email}`;
        const history = JSON.parse(localStorage.getItem(historyKey) || "[]");

        if (history.length === 0) {
            historySection.style.display = "none";
            return;
        }

        historySection.style.display = "block";
        grid.innerHTML = history.map(item => `
        <div class="history-card" onclick="document.getElementById('phone-input').value='${item.number}'; trackNumber('${item.number}'); window.scrollTo({top:0, behavior:'smooth'});">
            <div class="history-details">
                <span class="history-number">${item.number}</span>
                <span class="history-meta">${item.flag} ${item.location} • ${new Date(item.time).toLocaleDateString()}</span>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
    `).join("");
    }

    // === Map ===
    async function showMap(locationQuery, countryCode) {
        mapContainer.style.display = "block";

        // Build geocoding query
        let query = locationQuery;
        if (
            countryCode &&
            countryCode !== "Unknown" &&
            !locationQuery.toLowerCase().includes(countryCode.toLowerCase())
        ) {
            query = `${locationQuery}, ${countryCode}`;
        }

        try {
            // Geocode location using Nominatim
            const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
            const geoResponse = await fetch(geoUrl, {
                headers: {
                    "User-Agent": "PhoneTracer/1.0",
                },
            });
            const geoData = await geoResponse.json();

            if (geoData.length === 0) {
                mapContainer.style.display = "none";
                return;
            }

            const lat = parseFloat(geoData[0].lat);
            const lon = parseFloat(geoData[0].lon);

            // Init or update map
            if (map) {
                map.remove();
                map = null;
            }

            map = L.map("map", {
                zoomControl: true,
                attributionControl: true,
            }).setView([lat, lon], 8);

            // Use CartoDB dark tiles for our dark theme
            L.tileLayer(
                "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
                {
                    attribution:
                        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
                    subdomains: "abcd",
                    maxZoom: 19,
                }
            ).addTo(map);

            // Custom marker
            const customIcon = L.divIcon({
                className: "custom-marker",
                html: `
          <div style="
            width: 24px;
            height: 24px;
            background: linear-gradient(135deg, #6366f1, #a855f7);
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.6), 0 4px 12px rgba(0,0,0,0.4);
            position: relative;
          ">
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              width: 50px;
              height: 50px;
              transform: translate(-50%, -50%);
              border-radius: 50%;
              border: 2px solid rgba(99, 102, 241, 0.4);
              animation: markerRipple 2s ease-in-out infinite;
            "></div>
          </div>
        `,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
            });

            marker = L.marker([lat, lon], { icon: customIcon }).addTo(map);
            marker
                .bindPopup(
                    `
        <div style="
          font-family: 'Inter', sans-serif;
          padding: 8px 4px;
          text-align: center;
        ">
          <strong style="font-size: 14px;">📍 ${locationQuery}</strong><br/>
          <span style="font-size: 12px; color: #666;">Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}</span>
        </div>
      `
                )
                .openPopup();

            // Add CSS for marker animation
            if (!document.getElementById("marker-styles")) {
                const style = document.createElement("style");
                style.id = "marker-styles";
                style.textContent = `
          @keyframes markerRipple {
            0% { width: 24px; height: 24px; opacity: 1; }
            100% { width: 80px; height: 80px; opacity: 0; }
          }
          .custom-marker {
            background: transparent !important;
            border: none !important;
          }
        `;
                document.head.appendChild(style);
            }

            // Force map to recalculate size
            setTimeout(() => {
                map.invalidateSize();
            }, 300);
        } catch (err) {
            console.error("Geocoding error:", err);
            mapContainer.style.display = "none";
        }
    }

    // === Smooth scroll for anchor links ===
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute("href"));
            if (target) {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });

    // === Header scroll effect ===
    const header = document.getElementById("header");
    let lastScrollY = 0;

    window.addEventListener("scroll", () => {
        const currentScrollY = window.scrollY;
        if (currentScrollY > 50) {
            header.style.background = "rgba(10, 10, 15, 0.95)";
            header.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.3)";
        } else {
            header.style.background = "rgba(10, 10, 15, 0.8)";
            header.style.boxShadow = "none";
        }
        lastScrollY = currentScrollY;
    });

    // === Intersection Observer for animations ===
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.style.animation = "fadeInUp 0.6s ease forwards";
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe feature cards and step cards
    document.querySelectorAll(".feature-card, .step-card").forEach((el) => {
        el.style.opacity = "0";
        observer.observe(el);
    });

    // === Copy to Clipboard ===
    window.copyToClipboard = (text, btn) => {
        navigator.clipboard.writeText(text).then(() => {
            const originalContent = btn.innerHTML;
            btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
            setTimeout(() => {
                btn.innerHTML = originalContent;
            }, 2000);
        });
    };
});
