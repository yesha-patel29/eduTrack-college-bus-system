const socket = io();

/*************************************************
 * UI ELEMENTS
 *************************************************/
const driverBtn = document.getElementById("driverBtn");
const passengerBtn = document.getElementById("passengerBtn");
const managerBtn = document.getElementById("managerBtn");
const roleSelection = document.getElementById("role-selection");

const stopEntryPanel = document.getElementById("passenger-stop-entry");
const busListPanel = document.getElementById("bus-list-panel");
const busDetailCard = document.getElementById("bus-detail-card"); 
const stopInput = document.getElementById("stopInput");
const findBusBtn = document.getElementById("findBusBtn");
const selectedStopDisp = document.getElementById("selectedStopDisp");
const finalTrackBtn = document.getElementById("finalTrackBtn"); 
const backToBusList = document.getElementById("backToBusList"); 
const backFromStopEntry = document.getElementById("backFromStopEntry");
const backFromBusList = document.getElementById("backFromBusList");

const driverPortal = document.getElementById("driver-portal");
const startTripBtn = document.getElementById("startTrip");
const endTripBtn = document.getElementById("endTrip");
const viewMapBtn = document.getElementById("viewMap");
const backToDashboardBtn = document.getElementById("backToDashboard");
const backFromDriverDash = document.getElementById("backFromDriverDash");
const mapViewOverlay = document.getElementById("map-view");

const driverRouteEntry = document.getElementById("driver-route-entry");
const driverRouteInput = document.getElementById("driverRouteInput");
const verifyRouteBtn = document.getElementById("verifyRouteBtn");
const driverError = document.getElementById("driverError");
const backFromDriverEntry = document.getElementById("backFromDriverEntry");

const managerPortal = document.getElementById("manager-portal");
const backFromManagerPortal = document.getElementById("backFromManagerPortal");
const routeModal = document.getElementById("route-modal");
const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const saveRouteBtn = document.getElementById("saveRouteBtn");
const managerRouteList = document.getElementById("manager-route-list");

const managerDetailView = document.getElementById("manager-detail-view");
const managerEditBtn = document.getElementById("managerEditBtn");
const managerSaveBtn = document.getElementById("managerSaveBtn");
const managerTrackBtn = document.getElementById("managerTrackBtn");
const managerCloseDetailBtn = document.getElementById("managerCloseDetailBtn");

const dispBusNo = document.getElementById("disp-bus-no");
const dispDriverName = document.getElementById("disp-driver-name");
const dispRouteName = document.getElementById("disp-route-name");
const managerVerticalStops = document.getElementById("manager-vertical-stops");

const editBusNo = document.getElementById("editBusNo");
const editDriverName = document.getElementById("editDriverName");
const editRouteName = document.getElementById("editRouteName");
const editStops = document.getElementById("editStops");
const managerLiveStatus = document.getElementById("manager-live-status");

/*************************************************
 * CONNECTION STATE FLAGS & DATA
 *************************************************/
let role = null;
let passengerId = null;
let isDriverLive = false;
let globalRoutes = []; 
let activeRoutesFromServer = []; 
let selectedRoute = null; 
let wakeLock = null; 

// OSRM Smoothness Variables
let isFetchingRoute = false; 
let lastRequestLocation = null;

// Heartbeat State
let safetyPingInterval = null;

/*************************************************
 * NAVIGATION & HISTORY LOGIC
 *************************************************/
function navigate(viewName) {
    history.pushState({ view: viewName }, "", "#" + viewName);
    showView(viewName);
}

window.onpopstate = function(event) {
    if (event.state && event.state.view) {
        showView(event.state.view);
    } else {
        showView("home");
    }
};

function showView(viewName) {
    const panels = [
        roleSelection, stopEntryPanel, busListPanel, busDetailCard, 
        driverPortal, driverRouteEntry, managerPortal, managerDetailView, 
        mapViewOverlay
    ];
    panels.forEach(p => { 
        if (p) { 
            p.style.display = "none"; 
            p.classList.add("hidden"); 
        } 
    });

    switch(viewName) {
        case "home":
            if (roleSelection) {
                roleSelection.classList.remove("hidden");
                roleSelection.style.display = "flex";
            }
            role = null;
            break;
        case "manager-list":
            if (managerPortal) {
                managerPortal.style.display = "flex";
                managerPortal.classList.remove("hidden");
            }
            break;
        case "manager-detail":
            if (managerDetailView) {
                managerDetailView.style.display = "flex";
                managerDetailView.classList.remove("hidden");
            }
            break;
        case "driver-entry":
            if (driverRouteEntry) {
                driverRouteEntry.style.display = "flex";
                driverRouteEntry.classList.remove("hidden");
            }
            if (driverRouteInput) driverRouteInput.value = "";
            if (driverError) driverError.style.display = "none";
            break;
        case "driver-dash":
            if (driverPortal) {
                driverPortal.style.display = "block";
                driverPortal.classList.remove("hidden");
            }
            break;
        case "passenger-entry":
            if (stopEntryPanel) {
                stopEntryPanel.style.display = "flex";
                stopEntryPanel.classList.remove("hidden");
            }
            break;
        case "passenger-list":
            if (busListPanel) {
                busListPanel.style.display = "flex";
                busListPanel.classList.remove("hidden");
            }
            break;
        case "passenger-detail":
            if (busDetailCard) {
                busDetailCard.style.display = "flex";
                busDetailCard.classList.remove("hidden");
            }
            break;
        case "map-view":
            if (mapViewOverlay) {
                mapViewOverlay.style.display = "block";
                mapViewOverlay.classList.remove("hidden");
            }
            if (map) {
                setTimeout(() => {
                    map.invalidateSize();
                    if (driverLocation && selectedRoute && activeRoutesFromServer.includes(selectedRoute.id)) {
                        updateMarker(driverLocation.latitude, driverLocation.longitude, `driver-${selectedRoute.id}`, `Bus: ${selectedRoute.busNo}`);
                    } else if (selectedRoute && !activeRoutesFromServer.includes(selectedRoute.id)) {
                        const mId = `driver-${selectedRoute.id}`;
                        if (markers[mId]) {
                            map.removeLayer(markers[mId]);
                            delete markers[mId];
                        }
                        if (routeLine && map) {
                            map.removeLayer(routeLine);
                            routeLine = null;
                        }
                        driverLocation = null;
                    }
                }, 200);
            }
            socket.emit("request-active-locations");
            break;
    }
}

/*************************************************
 * MAP INITIALIZATION
 *************************************************/
let map = null;
if (document.getElementById("map")) {
    map = L.map("map").setView([22.3072, 73.1812], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);
}

const markers = {};
let mapCentered = false;
let myLocation = null;
let driverLocation = null;
let routeLine = null;
let watchId = null;

/*************************************************
 * MAP HELPERS
 *************************************************/
function clearMapMarkers() {
    for (let id in markers) {
        if (id !== passengerId) {
            if (map) map.removeLayer(markers[id]);
            delete markers[id];
        }
    }
    if (routeLine && map) {
        map.removeLayer(routeLine);
        routeLine = null;
    }
    driverLocation = null;
    mapCentered = false;
    lastRequestLocation = null; 
}

function updateMarker(latitude, longitude, markerId, label) {
    if (!map) return;
    if (!markers[markerId]) {
        const marker = L.marker([latitude, longitude]).addTo(map);
        marker.bindPopup(label);
        markers[markerId] = marker;
    } else {
        markers[markerId].setLatLng([latitude, longitude]);
    }

    if (!mapCentered) {
        map.setView([latitude, longitude], 16);
        mapCentered = true;
    }
}

/* ==============================================
   SMOOTH OSRM ROUTE DRAWING
   ============================================== */
async function drawRoute() {
    if (role !== "passenger" || !myLocation || !driverLocation || !map) return;

    if (routeLine) {
        let coords = routeLine.getLatLngs();
        if (coords.length > 0) {
            coords[coords.length - 1] = [driverLocation.latitude, driverLocation.longitude];
            routeLine.setLatLngs(coords);
        }
    }

    if (lastRequestLocation) {
        const dist = map.distance(
            [driverLocation.latitude, driverLocation.longitude],
            [lastRequestLocation.latitude, lastRequestLocation.longitude]
        );
        if (dist < 30) return; 
    }

    if (isFetchingRoute) return;

    isFetchingRoute = true;
    const url = `https://router.project-osrm.org/route/v1/driving/${myLocation.longitude},${myLocation.latitude};${driverLocation.longitude},${driverLocation.latitude}?overview=full&geometries=geojson`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
            const routeCoords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
            if (routeLine) {
                routeLine.setLatLngs(routeCoords);
            } else {
                routeLine = L.polyline(routeCoords, { color: "blue", weight: 5, opacity: 0.6, lineJoin: 'round' }).addTo(map);
            }
            lastRequestLocation = { ...driverLocation };
        }
    } catch (error) { console.error("Route error:", error); } finally { isFetchingRoute = false; }
}

/*************************************************
 * WAKE LOCK & BACKGROUND LOGIC
 *************************************************/
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator && document.visibilityState === 'visible') {
            wakeLock = await navigator.wakeLock.request('screen');
            wakeLock.addEventListener('release', () => {
                console.log('Wake Lock was released');
            });
            console.log('Wake Lock is active!');
        }
    } catch (err) { 
        console.warn('Wake Lock unavailable or not allowed in this context:', err.message); 
    }
}

document.addEventListener("visibilitychange", async () => {
    if (role === "driver" && isDriverLive && document.visibilityState === "visible") {
        await requestWakeLock();
    }
});

function startGlobalDriverTracking() {
    if (!selectedRoute) return;
    
    requestWakeLock();

    let currentLat = 22.3072;
    let currentLng = 73.1812;

    const sendPos = (lat, lng) => {
        if (!selectedRoute) return;
        socket.emit("driver-location", { 
            routeId: selectedRoute.id, 
            latitude: lat, 
            longitude: lng 
        });
        driverLocation = { latitude: lat, longitude: lng };
        updateMarker(lat, lng, `driver-${selectedRoute.id}`, `Bus: ${selectedRoute.busNo}`);
        const ds = document.getElementById("driver-status");
        if (ds) { ds.textContent = "LIVE"; ds.className = "live"; }
    };

    // Immediately emit position so bus marker is created instantly
    sendPos(currentLat, currentLng);

    if ("geolocation" in navigator) {
        if (watchId) navigator.geolocation.clearWatch(watchId);
        watchId = navigator.geolocation.watchPosition((pos) => {
            currentLat = pos.coords.latitude;
            currentLng = pos.coords.longitude;
            sendPos(currentLat, currentLng);
        }, (err) => {
            console.warn("Geolocation watch fallback:", err.message);
            sendPos(currentLat, currentLng);
        }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    }

    if (safetyPingInterval) clearInterval(safetyPingInterval);
    safetyPingInterval = setInterval(() => {
        if (isDriverLive && selectedRoute) {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition((pos) => {
                    sendPos(pos.coords.latitude, pos.coords.longitude);
                }, () => {
                    currentLat += 0.0001;
                    currentLng += 0.0001;
                    sendPos(currentLat, currentLng);
                }, { enableHighAccuracy: true, timeout: 5000 });
            } else {
                currentLat += 0.0001;
                currentLng += 0.0001;
                sendPos(currentLat, currentLng);
            }
        }
    }, 10000);
}

/*************************************************
 * MANAGER LOGIC
 *************************************************/
function renderManagerRouteList(routes) {
    if (!managerRouteList) return;
    managerRouteList.innerHTML = routes.map(r => {
        const isLive = activeRoutesFromServer.includes(r.id);
        return `
            <div onclick="openManagerRouteDetail('${r.id}')" style="background:#f3f4f6; padding:15px; border-radius:8px; margin-bottom:10px; border-left: 5px solid ${isLive ? '#10b981' : '#7c3aed'}; cursor:pointer; position:relative;">
                <strong>${r.routeName}</strong>
                ${isLive ? '<span style="background:#10b981; color:white; font-size:10px; padding:2px 6px; border-radius:4px; margin-left:10px;">LIVE</span>' : ''}
                <br><small>Bus: ${r.busNo} | Driver: ${r.driverName}</small>
            </div>
        `;
    }).join("") || '<p>No routes added yet.</p>';
}

if (managerBtn) {
    managerBtn.addEventListener("click", () => {
        role = "manager";
        socket.emit("join", { role: "manager" });
        if(globalRoutes.length > 0) renderManagerRouteList(globalRoutes);
        navigate("manager-list");
    });
}

if (openModalBtn) openModalBtn.addEventListener("click", () => routeModal.style.display = "flex");
if (closeModalBtn) closeModalBtn.addEventListener("click", () => routeModal.style.display = "none");

if (saveRouteBtn) {
    saveRouteBtn.addEventListener("click", () => {
        const routeData = {
            busNo: document.getElementById("newBusNo").value.trim(),
            driverName: document.getElementById("newDriverName").value.trim(),
            routeName: document.getElementById("newRouteName").value.trim(),
            stops: document.getElementById("newStops").value.split(",").map(s => s.trim()).filter(Boolean)
        };
        if (routeData.busNo !== "" && routeData.driverName !== "" && routeData.routeName !== "") {
            socket.emit("add-new-route", routeData);
            routeModal.style.display = "none";
            document.getElementById("newBusNo").value = "";
            document.getElementById("newDriverName").value = "";
            document.getElementById("newRouteName").value = "";
            document.getElementById("newStops").value = "";
        } else { alert("Fill all fields!"); }
    });
}

window.openManagerRouteDetail = (id) => {
    selectedRoute = globalRoutes.find(r => r.id === id);
    if (!selectedRoute) return;
    updateManagerDetailUI();
    toggleManagerEditMode(false);
    navigate("manager-detail");
};

function updateManagerDetailUI() {
    if (!selectedRoute) return;
    if (dispBusNo) dispBusNo.textContent = selectedRoute.busNo;
    if (dispDriverName) dispDriverName.textContent = selectedRoute.driverName;
    if (dispRouteName) dispRouteName.textContent = selectedRoute.routeName;
    if (editBusNo) editBusNo.value = selectedRoute.busNo;
    if (editDriverName) editDriverName.value = selectedRoute.driverName;
    if (editRouteName) editRouteName.value = selectedRoute.routeName;
    if (editStops) editStops.value = selectedRoute.stops.join(", ");
    
    if (managerVerticalStops) {
        managerVerticalStops.innerHTML = selectedRoute.stops.map(s => `
            <li><div class="stop-dot"></div><span class="stop-name">${s}</span></li>
        `).join("");
    }

    const isLive = activeRoutesFromServer.includes(selectedRoute.id);
    if (managerLiveStatus) {
        managerLiveStatus.textContent = isLive ? "LIVE" : "OFFLINE";
        managerLiveStatus.className = isLive ? "live" : "off";
    }
}

function toggleManagerEditMode(isEditing) {
    const viewMode = document.getElementById("manager-view-mode");
    const editMode = document.getElementById("manager-edit-mode");
    if (viewMode) viewMode.style.display = isEditing ? "none" : "block";
    if (editMode) editMode.style.display = isEditing ? "block" : "none";
    if (managerEditBtn) managerEditBtn.style.display = isEditing ? "none" : "block";
    if (managerSaveBtn) managerSaveBtn.style.display = isEditing ? "block" : "none";
}

if (managerEditBtn) managerEditBtn.addEventListener("click", () => toggleManagerEditMode(true));

if (managerSaveBtn) {
    managerSaveBtn.addEventListener("click", () => {
        const updatedData = {
            id: selectedRoute.id,
            busNo: editBusNo.value.trim(),
            driverName: editDriverName.value.trim(),
            routeName: editRouteName.value.trim(),
            stops: editStops.value.split(",").map(s => s.trim()).filter(Boolean)
        };
        socket.emit("update-existing-route", updatedData);
        toggleManagerEditMode(false);
    });
}

if (managerTrackBtn) {
    managerTrackBtn.addEventListener("click", () => {
        socket.emit("join", { role: "manager" }); 
        navigate("map-view"); 
    });
}

if (managerCloseDetailBtn) {
    managerCloseDetailBtn.addEventListener("click", () => navigate("manager-list"));
}

if (backFromManagerPortal) {
    backFromManagerPortal.addEventListener("click", () => navigate("home"));
}

/*************************************************
 * DRIVER FLOW LOGIC
 *************************************************/
if (driverBtn) {
    driverBtn.addEventListener("click", () => {
        role = "driver";
        navigate("driver-entry");
    });
}

if (backFromDriverEntry) {
    backFromDriverEntry.addEventListener("click", () => navigate("home"));
}

if (backFromDriverDash) {
    backFromDriverDash.addEventListener("click", () => navigate("home"));
}

if (verifyRouteBtn) {
    verifyRouteBtn.addEventListener("click", () => {
        const entered = driverRouteInput.value.trim().toLowerCase();
        
        if (!entered) {
            if (driverError) {
                driverError.textContent = "⚠️ Please enter a Route Title or Bus Number!";
                driverError.style.display = "block";
            }
            return;
        }

        const match = globalRoutes.find(r => {
            const name = (r.routeName || "").trim().toLowerCase();
            const bus = (r.busNo || "").trim().toLowerCase();
            const id = (r.id || "").trim().toLowerCase();
            return name === entered || bus === entered || id === entered;
        });

        if (match) {
            selectedRoute = match;
            renderDriverDashboard(match);
            socket.emit("join", { role: "driver" });
            if (driverError) driverError.style.display = "none";
            navigate("driver-dash");
        } else {
            if (driverError) {
                driverError.textContent = "❌ Route not found in manager list!";
                driverError.style.display = "block";
            }
        }
    });
}

if (driverRouteInput) {
    driverRouteInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter" && verifyRouteBtn) {
            verifyRouteBtn.click();
        }
    });
}

function renderDriverDashboard(route) {
    const isLive = activeRoutesFromServer.includes(route.id);
    const infoElem = document.getElementById("driver-display-info");
    if (infoElem) {
        infoElem.innerHTML = `
            <p><strong>Name:</strong> ${route.driverName}</p>
            <p><strong>Bus No:</strong> ${route.busNo}</p>
            <p><strong>Route:</strong> ${route.routeName}</p>
            <p class="status">Status: <span id="driver-status" class="${isLive ? 'live' : 'off'}">${isLive ? 'LIVE' : 'OFF'}</span></p>
        `;
    }
    const listElem = document.getElementById("driver-stop-list");
    if (listElem) {
        listElem.innerHTML = route.stops.map(s => `
            <li><div class="stop-dot"></div><span class="stop-name">${s}</span></li>
        `).join("");
    }
}

if (startTripBtn) {
    startTripBtn.addEventListener("click", () => {
        if (!selectedRoute) {
            alert("No route selected!");
            return;
        }
        isDriverLive = true;
        socket.emit("start-trip", { routeId: selectedRoute.id });
        const ds = document.getElementById("driver-status");
        if (ds) { ds.textContent = "LIVE"; ds.className = "live"; }
        startGlobalDriverTracking();
        alert("Trip Started!");
    });
}

if (endTripBtn) {
    endTripBtn.addEventListener("click", () => {
        if (!selectedRoute) return;
        socket.emit("end-trip", { routeId: selectedRoute.id });
        isDriverLive = false;
        driverLocation = null;
        if (watchId) { navigator.geolocation.clearWatch(watchId); watchId = null; }
        if (safetyPingInterval) { clearInterval(safetyPingInterval); safetyPingInterval = null; }
        if (wakeLock) { wakeLock.release(); wakeLock = null; }
        
        const mId = `driver-${selectedRoute.id}`;
        if (markers[mId]) { 
            if (map) map.removeLayer(markers[mId]); 
            delete markers[mId]; 
        }
        if (routeLine && map) {
            map.removeLayer(routeLine);
            routeLine = null;
        }
        const ds = document.getElementById("driver-status");
        if (ds) { ds.textContent = "OFF"; ds.className = "off"; }
        alert("Trip Ended.");
    });
}

/*************************************************
 * PASSENGER FLOW LOGIC
 *************************************************/
if (passengerBtn) {
    passengerBtn.addEventListener("click", () => {
        role = "passenger";
        navigate("passenger-entry");
    });
}

if (findBusBtn) {
    findBusBtn.addEventListener("click", () => {
        const searchVal = stopInput.value.trim().toLowerCase();
        if (searchVal !== "") {
            if (selectedStopDisp) selectedStopDisp.textContent = stopInput.value;
            const filteredBuses = globalRoutes.filter(route => 
                route.stops.some(stopName => stopName.toLowerCase().includes(searchVal)) ||
                route.routeName.toLowerCase().includes(searchVal)
            );
            renderPassengerBusList(filteredBuses);
            navigate("passenger-list");
        } else {
            // If empty, show all available buses
            if (selectedStopDisp) selectedStopDisp.textContent = "All Stops";
            renderPassengerBusList(globalRoutes);
            navigate("passenger-list");
        }
    });
}

function renderPassengerBusList(busesToShow) {
    const listDiv = document.getElementById("dynamic-bus-list");
    if (!listDiv) return;
    listDiv.innerHTML = busesToShow.map(route => {
        const isLive = activeRoutesFromServer.includes(route.id);
        return `
            <div class="bus-item">
                <div class="bus-info">
                    <strong>Bus ${route.busNo}</strong>
                    ${isLive ? '<span style="background:#10b981; color:white; font-size:11px; padding:2px 6px; border-radius:4px; margin-left:8px; font-weight:600;">LIVE</span>' : '<span style="background:#6b7280; color:white; font-size:11px; padding:2px 6px; border-radius:4px; margin-left:8px; font-weight:600;">OFFLINE</span>'}
                    <p>${route.routeName}</p>
                </div>
                <button class="track-btn" onclick="viewRouteDetails('${route.id}')">Details</button>
            </div>
        `;
    }).join("") || '<p style="padding: 15px; color: #6b7280;">No buses found for this stop.</p>';
}

window.viewRouteDetails = (id) => {
    selectedRoute = globalRoutes.find(r => r.id === id);
    if (selectedRoute) {
        const isRouteLive = activeRoutesFromServer.includes(id);
        const detailsElem = document.getElementById("dynamic-bus-details");
        if (detailsElem) {
            detailsElem.innerHTML = `
                <p><strong>Driver:</strong> ${selectedRoute.driverName}</p>
                <p><strong>Bus No:</strong> ${selectedRoute.busNo}</p>
                <p><strong>Route:</strong> ${selectedRoute.routeName}</p>
                <p class="status">Status: <span id="bus-live-status" class="${isRouteLive ? 'live' : 'off'}">${isRouteLive ? 'LIVE' : 'OFFLINE'}</span></p>
            `;
        }
        const stopElem = document.getElementById("dynamic-stop-list");
        if (stopElem) {
            stopElem.innerHTML = selectedRoute.stops.map(s => `
                <li><div class="stop-dot"></div><span class="stop-name">${s}</span></li>
            `).join("");
        }
        navigate("passenger-detail");
    }
};

if (finalTrackBtn) finalTrackBtn.addEventListener("click", () => { 
    socket.emit("join", { role: "passenger" });
    navigate("map-view"); 
});

if (backToBusList) backToBusList.addEventListener("click", () => navigate("passenger-list"));
if (backFromBusList) backFromBusList.addEventListener("click", () => navigate("passenger-entry"));
if (backFromStopEntry) backFromStopEntry.addEventListener("click", () => navigate("home"));

if (viewMapBtn) viewMapBtn.addEventListener("click", () => navigate("map-view"));

if (backToDashboardBtn) {
    backToDashboardBtn.addEventListener("click", () => {
        if (role === "driver") {
            navigate("driver-dash");
        } else if (role === "manager") {
            navigate("manager-detail");
        } else if (role === "passenger") {
            if (selectedRoute) {
                navigate("passenger-detail");
            } else {
                navigate("passenger-list");
            }
        } else {
            navigate("home");
        }
    });
}

/*************************************************
 * SOCKET EVENTS
 *************************************************/
socket.on("receive-location", (data) => {
    const { latitude, longitude, type, userId, routeId } = data;
    if (type === "driver") {
        if (!activeRoutesFromServer.includes(routeId)) {
            const mId = `driver-${routeId}`;
            if (markers[mId]) {
                if (map) map.removeLayer(markers[mId]);
                delete markers[mId];
            }
            if (selectedRoute && selectedRoute.id === routeId) {
                driverLocation = null;
                if (routeLine && map) { map.removeLayer(routeLine); routeLine = null; }
            }
            return;
        }

        const routeObj = globalRoutes.find(r => r.id === routeId);
        const busLabel = routeObj ? `Bus: ${routeObj.busNo} (${routeObj.routeName})` : `Bus: ${routeId}`;
        
        if (selectedRoute && selectedRoute.id === routeId) {
            driverLocation = { latitude, longitude };
            if (role === "passenger") drawRoute();
        }
        
        updateMarker(latitude, longitude, `driver-${routeId}`, busLabel);
    } else {
        updateMarker(latitude, longitude, userId, "You");
    }
});

socket.on("update-route-list", (routes) => {
    globalRoutes = routes;
    if(document.getElementById("totalBuses")) document.getElementById("totalBuses").textContent = routes.length;
    if(document.getElementById("totalRoutes")) document.getElementById("totalRoutes").textContent = routes.length;
    
    if (role === "manager") renderManagerRouteList(routes);

    if(selectedRoute) {
        const stillExists = routes.find(r => r.id === selectedRoute.id);
        if(stillExists) {
            selectedRoute = stillExists;
            if(role === "driver" && driverPortal && driverPortal.style.display !== "none") renderDriverDashboard(selectedRoute);
            if(role === "passenger" && busDetailCard && busDetailCard.style.display !== "none") viewRouteDetails(selectedRoute.id);
            if(role === "manager" && managerDetailView && managerDetailView.style.display !== "none") updateManagerDetailUI();
        }
    }
});

socket.on("update-active-status", (liveRouteIds) => {
    activeRoutesFromServer = liveRouteIds;
    
    for (let mId in markers) {
        if (mId.startsWith("driver-")) {
            const rId = mId.replace("driver-", "");
            if (!liveRouteIds.includes(rId)) {
                if (map) map.removeLayer(markers[mId]);
                delete markers[mId];
                if (selectedRoute && selectedRoute.id === rId) {
                    driverLocation = null;
                    if (routeLine && map) { map.removeLayer(routeLine); routeLine = null; }
                }
            }
        }
    }

    if (role === "manager") {
        renderManagerRouteList(globalRoutes);
        if (managerDetailView && managerDetailView.style.display !== "none") updateManagerDetailUI();
    }
    if (role === "passenger" && busListPanel && busListPanel.style.display !== "none") {
        renderPassengerBusList(globalRoutes);
    }
    if (selectedRoute) {
        const isNowLive = activeRoutesFromServer.includes(selectedRoute.id);
        const pLive = document.getElementById("bus-live-status");
        if(pLive) { pLive.textContent = isNowLive ? "LIVE" : "OFFLINE"; pLive.className = isNowLive ? "live" : "off"; }
        const dLive = document.getElementById("driver-status");
        if(dLive && role === "driver") { dLive.textContent = isNowLive ? "LIVE" : "OFF"; dLive.className = isNowLive ? "live" : "off"; }
    }
});

socket.on("assign-userId", ({ userId }) => {
    passengerId = userId;
    if (role === "passenger") {
        navigator.geolocation.watchPosition((pos) => {
            const { latitude, longitude } = pos.coords;
            socket.emit("send-location", { latitude, longitude, userId: passengerId });
            myLocation = { latitude, longitude };
            updateMarker(latitude, longitude, passengerId, "You");
            drawRoute();
        }, (err) => console.error(err), { enableHighAccuracy: true });
    }
});

socket.on("user-disconnected", (id) => {
    if (markers[id]) { 
        if (map) map.removeLayer(markers[id]); 
        delete markers[id]; 
    }
    if (id.startsWith("driver-")) {
        const rId = id.replace("driver-", "");
        if (selectedRoute && selectedRoute.id === rId) {
            driverLocation = null;
            if (routeLine && map) { map.removeLayer(routeLine); routeLine = null; }
        }
    }
});

history.replaceState({ view: "home" }, "", "#home");
showView("home");
