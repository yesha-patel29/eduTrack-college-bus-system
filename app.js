const express = require("express");
const app = express();

const http = require("http");
const path = require("path");

const socketio = require("socket.io");
const server = http.createServer(app);
const io = socketio(server);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

/* =========================
   GLOBAL STATE (IN-MEMORY)
   ========================= */
const passengers = {}; 
let drivers = {};      
let allRoutes = [
  {
    id: "route_default_1",
    busNo: "GJ-06-AB-1234",
    driverName: "Rajesh Kumar",
    routeName: "City Center Express",
    stops: ["Station", "Main Market", "University", "City Center"]
  }
]; 
let activeRouteIds = new Set();

// HEARTBEAT STATE: Track timeouts for each route
let driverTimers = {};

/* =========================
   SOCKET CONNECTION
   ========================= */
io.on("connection", function (socket) {

    // On initial socket connection, send current data
    socket.emit("update-route-list", allRoutes);
    socket.emit("update-active-status", Array.from(activeRouteIds));

    /* -------- JOIN EVENT -------- */
    socket.on("join", function ({ role }) {

        if (role === "passenger") {
            const userId = `user_${socket.id.slice(0, 5)}`;
            socket.userId = userId;
            socket.join(userId);
            passengers[userId] = socket.id;

            console.log(`Passenger connected: ${userId}`);

            activeRouteIds.forEach(routeId => {
                const d = drivers[routeId];
                if (d && d.latitude != null) {
                    socket.emit("receive-location", {
                        latitude: d.latitude,
                        longitude: d.longitude,
                        routeId: routeId,
                        type: "driver"
                    });
                }
            });

            socket.emit("assign-userId", { userId });
        }

        if (role === "driver") {
            socket.role = "driver";
            console.log("Driver joined socket:", socket.id);
        }

        if (role === "manager") {
            socket.role = "manager";
            console.log("Manager connected:", socket.id);
            
            socket.emit("update-route-list", allRoutes);
            socket.emit("update-active-status", Array.from(activeRouteIds));
            
            activeRouteIds.forEach(routeId => {
                const d = drivers[routeId];
                if (d && d.latitude != null) {
                    socket.emit("receive-location", {
                        latitude: d.latitude,
                        longitude: d.longitude,
                        routeId: routeId,
                        type: "driver"
                    });
                }
            });
        }
    });

    /* -------- TRIP STATUS LOGIC -------- */
    socket.on("start-trip", function({ routeId }) {
        if (!routeId) return;
        activeRouteIds.add(routeId);
        
        if (!drivers[routeId]) {
            drivers[routeId] = {
                socketId: socket.id,
                latitude: null,
                longitude: null,
                routeId: routeId
            };
        } else {
            drivers[routeId].socketId = socket.id;
        }
        
        io.emit("update-active-status", Array.from(activeRouteIds));
        console.log(`Trip Started for Route: ${routeId}`);
    });

    socket.on("end-trip", function({ routeId }) {
        if (!routeId) return;
        // Clear heartbeat timer if trip ends
        if (driverTimers[routeId]) {
            clearTimeout(driverTimers[routeId]);
            delete driverTimers[routeId];
        }

        activeRouteIds.delete(routeId);
        delete drivers[routeId]; 
        
        io.emit("update-active-status", Array.from(activeRouteIds));
        io.emit("user-disconnected", `driver-${routeId}`); 
        console.log(`Trip Ended for Route: ${routeId}`);
    });

    socket.on("request-active-locations", function() {
        activeRouteIds.forEach(routeId => {
            const d = drivers[routeId];
            if (d && d.latitude != null && d.longitude != null) {
                socket.emit("receive-location", {
                    latitude: d.latitude,
                    longitude: d.longitude,
                    routeId: routeId,
                    type: "driver",
                    status: "online"
                });
            }
        });
    });

    /* -------- MANAGER ROUTE MANAGEMENT -------- */
    socket.on("add-new-route", function (routeData) {
        const newRoute = {
            ...routeData,
            id: `route_${Date.now()}`,
            createdAt: new Date()
        };

        allRoutes.push(newRoute);
        io.emit("update-route-list", allRoutes);
    });

    socket.on("update-existing-route", function (updatedData) {
        const index = allRoutes.findIndex(r => r.id === updatedData.id);
        if (index > -1) { 
            allRoutes[index] = { ...allRoutes[index], ...updatedData };
            io.emit("update-route-list", allRoutes);
        }
    });

    /* -------- PASSENGER LOCATION -------- */
    socket.on("send-location", function (data) {
        if (socket.userId) {
            io.to(socket.userId).emit("receive-location", {
                ...data,
                type: "passenger"
            });
        }
    });

    /* -------- DRIVER LOCATION & HEARTBEAT -------- */
    socket.on("driver-location", function (data) {
        const { routeId, latitude, longitude } = data;
        
        if (routeId) {
            if (!drivers[routeId]) {
                drivers[routeId] = { socketId: socket.id, latitude, longitude, routeId };
            } else {
                drivers[routeId].latitude = latitude;
                drivers[routeId].longitude = longitude;
                drivers[routeId].socketId = socket.id;
            }

            if (!activeRouteIds.has(routeId)) {
                activeRouteIds.add(routeId);
                io.emit("update-active-status", Array.from(activeRouteIds));
            }

            // HEARTBEAT LOGIC: 
            // 1. Clear the previous "lag" timer
            if (driverTimers[routeId]) clearTimeout(driverTimers[routeId]);

            // 2. Set a new timer. If no location comes for 20 seconds, broadcast "lagging"
            driverTimers[routeId] = setTimeout(() => {
                io.emit("driver-heartbeat-status", {
                    routeId: routeId,
                    status: "lagging",
                    message: "Driver moved to background. Tracking might lag."
                });
                console.log(`Heartbeat warning: Route ${routeId} is lagging.`);
            }, 20000); 

            // Broadcast location to all
            io.emit("receive-location", {
                latitude,
                longitude,
                routeId,
                type: "driver",
                status: "online" // Explicitly mark as online when location is fresh
            });
        }
    });

    /* -------- GENERAL DISCONNECT -------- */
    socket.on("disconnect", function () {
        if (socket.userId) {
            delete passengers[socket.userId];
            io.emit("user-disconnected", socket.userId);
        }

        for (let routeId in drivers) {
            if (drivers[routeId].socketId === socket.id) {
                console.log(`Driver for route ${routeId} socket disconnected`);
                // If socket breaks, trigger lagging message immediately
                io.emit("driver-heartbeat-status", {
                    routeId: routeId,
                    status: "lagging",
                    message: "Driver connection lost. Reconnecting..."
                });
            }
        }
    });
});

app.get("/", function (req, res) {
    res.render("index");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
