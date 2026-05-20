window.addEventListener('DOMContentLoaded', () => {
    // Unpack Shared Cloud Firestore & Authentication Framework Tools
    const db = window.db;
    const auth = window.auth;
    const { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot } = window.dbTools;
    const { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } = window.authTools;

    // Database Reference Points Hooks
    const occupantsCollection = collection(db, "occupants");
    const roomsCollection = collection(db, "rooms");

    // Standalone Workflow Window State Handles
    const authScreen = document.getElementById('auth-screen');
    const mainSystem = document.getElementById('main-system');
    const userDisplay = document.getElementById('user-display');

    // Access Authentication Form Elements handles
    const authForm = document.getElementById('auth-form');
    const authEmail = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');
    const authTitle = document.getElementById('auth-title');
    const authBtn = document.getElementById('auth-btn');
    const toggleAuthBtn = document.getElementById('toggle-auth');
    const logoutBtn = document.getElementById('logout-btn');
    // Admin Management Elements
    const adminForm = document.getElementById('admin-form');
    const newAdminEmail = document.getElementById('new-admin-email');
    const newAdminPassword = document.getElementById('new-admin-password');

    // Directory Workspace Inputs Targets
    const occForm = document.getElementById('occ-form');
    const occId = document.getElementById('occ-id');
    const occLastname = document.getElementById('occ-lastname');
    const occFirstname = document.getElementById('occ-firstname');
    const occMiddlename = document.getElementById('occ-middlename');
    const occAge = document.getElementById('occ-age');
    const occBirthday = document.getElementById('occ-birthday');
    const occGender = document.getElementById('occ-gender');
    const occStatus = document.getElementById('occ-status');
    const occDormId = document.getElementById('occ-dormid');
    const occRoomNum = document.getElementById('occ-roomnum');
    const occContact = document.getElementById('occ-contact');
    const occEmergency = document.getElementById('occ-emergency');
    const occSubmitBtn = document.getElementById('occ-submit-btn');
    const occFormTitle = document.getElementById('occ-form-title');
    const occTableBody = document.getElementById('occ-table-body');

    // Registry Workspace Inputs Targets
    const roomForm = document.getElementById('room-form');
    const roomId = document.getElementById('room-id');
    const roomNumberInput = document.getElementById('room-number-input');
    const roomDormId = document.getElementById('room-dorm-id');
    const roomCapacity = document.getElementById('room-capacity');
    const roomFloor = document.getElementById('room-floor');
    const roomCr = document.getElementById('room-cr');
    const roomLamps = document.getElementById('room-lamps');
    const roomWindows = document.getElementById('room-windows');
    const roomSize = document.getElementById('room-size');
    const roomRent = document.getElementById('room-rent');
    const roomSubmitBtn = document.getElementById('room-submit-btn');
    const roomFormTitle = document.getElementById('room-form-title');
    const roomsTableBody = document.getElementById('rooms-table-body');

    // Metric Summary Presentation Handles
    const statTotalRooms = document.getElementById('stat-total-rooms');
    const statTotalOccupants = document.getElementById('stat-total-occupants');
    const overviewTableBody = document.getElementById('overview-table-body');

    let localRooms = [];
    let localOccupants = [];
    let occEditMode = false;
    let roomEditMode = false;
    let isLoginMode = true;
    let unsubOccupants = null;
    let unsubRooms = null;

    // ==========================================
    // 🔐 CONTROL DECK ACCESS MANAGER SESSIONS
    // ==========================================

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = authEmail.value;
        const password = authPassword.value;

        if (password.length < 6) {
            alert("Security Core: Password parameters length matrix must equal at least 6 characters.");
            return;
        }

        try {
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
                alert("Success: System administration access credentials established.");
            }
            authForm.reset();
        } catch (error) {
            alert("Security Gatekeeper Notification: " + error.message);
        }
    });

    logoutBtn.addEventListener('click', async () => {
        if (confirm("Core System Notice: Disconnect active administration token session window?")) {
            await signOut(auth);
        }
    });

    // 💥 PROGRAMMATIC ROUTING CONTROLLER BETWEEN LOGIN AND DORMITORY HUB WORKSPACE
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // SUCCESSFUL SESSION: Completely hides Login overlay screen, brings the glassmorphism workspace to view
            authScreen.style.setProperty('display', 'none', 'important');
            mainSystem.style.setProperty('display', 'block', 'important');
            userDisplay.textContent = `Admin: ${user.email}`;
            startDataSync();
        } else {
            // NO SESSION ACCESSED: Force clears workflow data visibility frames, displays Login UI standalone
            authScreen.style.setProperty('display', 'flex', 'important');
            mainSystem.style.setProperty('display', 'none', 'important');
            stopDataSync();
        }
    });

    // ==========================================
    // 📊 REALTIME SNAPSHOT STREAM SUBSCRIPTIONS
    // ==========================================
    function startDataSync() {
        unsubRooms = onSnapshot(roomsCollection, (snapshot) => {
            localRooms = [];
            roomsTableBody.innerHTML = "";
            snapshot.forEach((doc) => {
                const r = doc.data();
                localRooms.push({ id: doc.id, ...r });
                roomsTableBody.innerHTML += `
                    <tr>
                        <td><strong>Room No. ${r.roomNum}</strong></td>
                        <td><span class="badge bg-maroon">${r.dormId}</span></td>
                        <td>${r.capacity} Total Slots</td>
                        <td class="fw-bold text-success">PHP ${r.rent}</td>
                        <td>
                            <button class="btn btn-warning btn-xs fw-bold text-dark me-1" onclick="editRoomTrigger('${doc.id}', '${r.roomNum}', '${r.dormId}', ${r.capacity}, ${r.floor}, '${r.cr}', ${r.lamps}, ${r.windows}, '${r.size}', ${r.rent})">Edit</button>
                            <button class="btn btn-danger btn-xs fw-bold text-white" onclick="deleteRoom('${doc.id}')">Delete</button>
                        </td>
                    </tr>`;
            });
            updateOverviewDashboard();
        });

        unsubOccupants = onSnapshot(occupantsCollection, (snapshot) => {
            localOccupants = [];
            occTableBody.innerHTML = "";
            snapshot.forEach((doc) => {
                const o = doc.data();
                localOccupants.push({ id: doc.id, ...o });
                occTableBody.innerHTML += `
                    <tr>
                        <td><strong>${o.lastname}</strong>, ${o.firstname}</td>
                        <td>Dorm: ${o.dormId} / Room: ${o.roomNum}</td>
                        <td>${o.age} yrs / ${o.gender}</td>
                        <td>${o.contact}</td>
                        <td>
                            <button class="btn btn-warning btn-xs fw-bold text-dark me-1" onclick="editOccTrigger('${doc.id}', '${o.lastname}', '${o.firstname}', '${o.middlename}', ${o.age}, '${o.birthday}', '${o.gender}', '${o.status}', '${o.dormId}', '${o.roomNum}', '${o.contact}', '${o.emergency}')">Edit</button>
                            <button class="btn btn-danger btn-xs fw-bold text-white" onclick="deleteOcc('${doc.id}')">Delete</button>
                        </td>
                    </tr>`;
            });
            updateOverviewDashboard();
        });
    }

    function stopDataSync() {
        if (unsubRooms) unsubRooms();
        if (unsubOccupants) unsubOccupants();
        localRooms = [];
        localOccupants = [];
    }

    function updateOverviewDashboard() {
        statTotalRooms.textContent = localRooms.length;
        statTotalOccupants.textContent = localOccupants.length;
        overviewTableBody.innerHTML = "";

        localRooms.forEach(room => {
            const activeMatches = localOccupants.filter(o => o.roomNum === room.roomNum && o.dormId === room.dormId);
            const occupantNames = activeMatches.map(o => `${o.firstname} ${o.lastname}`).join(', ') || "No Occupants Checked-In";
            
            overviewTableBody.innerHTML += `
                <tr>
                    <td><span class="badge bg-maroon">${room.dormId}</span></td>
                    <td>Dorm Complex Floor Allocation: ${room.floor}</td>
                    <td><strong>Room Suite ${room.roomNum}</strong></td>
                    <td><span class="text-dark fw-semibold small"><i class="bi bi-person-check-fill text-success me-1"></i> ${occupantNames} (${activeMatches.length}/${room.capacity} slots loaded)</span></td>
                </tr>`;
        });
    }

    // ==========================================
    // 🧑‍🤝‍🧑 OCCUPANTS OPERATION ENGINE (CRUD)
    // ==========================================
    occForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            lastname: occLastname.value,
            firstname: occFirstname.value,
            middlename: occMiddlename.value,
            age: parseInt(occAge.value),
            birthday: occBirthday.value,
            gender: occGender.value,
            status: occStatus.value,
            dormId: occDormId.value,
            roomNum: occRoomNum.value,
            contact: occContact.value,
            emergency: occEmergency.value
        };

        if (!occEditMode) {
            await addDoc(occupantsCollection, payload);
        } else {
            await updateDoc(doc(db, "occupants", occId.value), payload);
            occEditMode = false;
            occSubmitBtn.textContent = "Save Occupant Record";
            occSubmitBtn.className = "btn btn-maroon btn-sm fw-bold shadow-sm";
            occFormTitle.innerHTML = `<i class="bi bi-person-plus-fill me-1"></i> Register New Occupant`;
        }
        occForm.reset();
        occId.value = "";
    });

    window.editOccTrigger = (id, ln, fn, mn, age, bday, gen, stat, dId, rNum, con, emer) => {
        occId.value = id;
        occLastname.value = ln;
        occFirstname.value = fn;
        occMiddlename.value = mn;
        occAge.value = age;
        occBirthday.value = bday;
        occGender.value = gen;
        occStatus.value = stat;
        occDormId.value = dId;
        occRoomNum.value = rNum;
        occContact.value = con;
        occEmergency.value = emer;

        occEditMode = true;
        occSubmitBtn.textContent = "Apply Modification Matrix";
        occSubmitBtn.className = "btn btn-warning btn-sm fw-bold text-dark";
        occFormTitle.innerHTML = `<i class="bi bi-pencil-square me-1"></i> Adjusting Target Occupant Trace`;
        
        document.getElementById('occupants-tab').click();
    };

    window.deleteOcc = async (id) => {
        if (confirm("Core Warning: Delete target occupant tracking metrics from database storage files?")) {
            await deleteDoc(doc(db, "occupants", id));
        }
    };

    // ==========================================
    // 🚪 ROOMS OPERATION ENGINE (CRUD)
    // ==========================================
    roomForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            roomNum: roomNumberInput.value,
            dormId: roomDormId.value,
            capacity: parseInt(roomCapacity.value),
            floor: parseInt(roomFloor.value),
            cr: roomCr.value,
            lamps: parseInt(roomLamps.value) || 0,
            windows: parseInt(roomWindows.value) || 0,
            size: roomSize.value,
            rent: parseFloat(roomRent.value)
        };

        if (!roomEditMode) {
            await addDoc(roomsCollection, payload);
        } else {
            await updateDoc(doc(db, "rooms", roomId.value), payload);
            roomEditMode = false;
            roomSubmitBtn.textContent = "Save Room Unit";
            roomSubmitBtn.className = "btn btn-maroon btn-sm fw-bold shadow-sm";
            roomFormTitle.innerHTML = `<i class="bi bi-door-open-fill me-1"></i> Provision New Room`;
        }
        roomForm.reset();
        roomId.value = "";
    });

    window.editRoomTrigger = (id, rNum, dId, cap, flr, crType, lmp, win, sz, rnt) => {
        roomId.value = id;
        roomNumberInput.value = rNum;
        roomDormId.value = dId;
        roomCapacity.value = cap;
        roomFloor.value = flr;
        roomCr.value = crType;
        roomLamps.value = lmp;
        roomWindows.value = win;
        roomSize.value = sz;
        roomRent.value = rnt;

        roomEditMode = true;
        roomSubmitBtn.textContent = "Apply Configuration Updates";
        roomSubmitBtn.className = "btn btn-warning btn-sm fw-bold text-dark";
        roomFormTitle.innerHTML = `<i class="bi bi-pencil-square me-1"></i> Adjusting Target Room Parameters`;

        document.getElementById('rooms-tab').click();
    };

    window.deleteRoom = async (id) => {
        if (confirm("Core Warning: Destroy target room profile index metrics trace configuration file?")) {
            await deleteDoc(doc(db, "rooms", id));
        }
    };
    // ==========================================
    // 👮 ADMIN MANAGEMENT OPERATIONS
    // ==========================================
    adminForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = newAdminEmail.value.trim();
        const password = newAdminPassword.value.trim();

        if (password.length < 6) {
            alert("Password must contain at least 6 characters.");
            return;
        }

        try {
            await createUserWithEmailAndPassword(auth, email, password);

            alert("New administrator account created successfully.");

            adminForm.reset();

            // IMPORTANT:
           // Firebase automatically logs into the newly created account.
            // Re-login may be needed for the original admin.

        } catch (error) {
            alert("Admin creation failed: " + error.message);
        }
    });
});