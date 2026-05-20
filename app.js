window.addEventListener('DOMContentLoaded', () => {
    // Unpack Shared Firebase Core Engine Hooks
    const db = window.db;
    const auth = window.auth;
    const { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot } = window.dbTools;
    const { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } = window.authTools;

    // Direct Collection Pointers
    const occupantsCollection = collection(db, "occupants");
    const roomsCollection = collection(db, "rooms");

    // Window View Containers
    const authScreen = document.getElementById('auth-screen');
    const mainSystem = document.getElementById('main-system');
    const userDisplay = document.getElementById('user-display');

    // Account Session Controller Node Handles
    const authForm = document.getElementById('auth-form');
    const authEmail = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');
    const authTitle = document.getElementById('auth-title');
    const authBtn = document.getElementById('auth-btn');
    const toggleAuthBtn = document.getElementById('toggle-auth');
    const logoutBtn = document.getElementById('logout-btn');

    // Tenant Field Inputs Elements
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

    // Unit Properties Forms Inputs Elements
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

    // Metric Summary Targets Elements
    const statTotalRooms = document.getElementById('stat-total-rooms');
    const statTotalOccupants = document.getElementById('stat-total-occupants');
    const overviewTableBody = document.getElementById('overview-table-body');

    let localRooms = [];
    let localOccupants = [];
    let isLoginMode = true;
    let occEditMode = false;
    let roomEditMode = false;

    let unsubOccupants = null;
    let unsubRooms = null;

    // ==========================================
    // 🔐 AUTH WINDOW UI TOGGLE & SYSTEM SESSION CONTROLLERS
    // ==========================================
    toggleAuthBtn.onclick = function() {
        isLoginMode = !isLoginMode;
        if (isLoginMode) {
            authTitle.textContent = "MSU-Main Dormitory";
            authBtn.textContent = "Login";
            toggleAuthBtn.textContent = "Don't have an account? Register here";
        } else {
            authTitle.textContent = "Create Admin Registration";
            authBtn.textContent = "Register Account";
            toggleAuthBtn.textContent = "Already registered? Login here";
        }
    };

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = authEmail.value;
        const password = authPassword.value;

        if (password.length < 6) {
            alert("Password parameters must be at least 6 characters long.");
            return;
        }

        try {
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, email, password);
                alert("Welcome back Admin!");
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
                alert("Admin registration account created successfully!");
            }
            authForm.reset();
        } catch (error) {
            alert("Security Error: " + error.message);
        }
    });

    logoutBtn.addEventListener('click', async () => {
        if (confirm("Are you sure you want to sign out from the system window?")) {
            await signOut(auth);
        }
    });

    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Hides authentication card and pops up main system dashboard as separate step
            authScreen.style.setProperty('display', 'none', 'important');
            mainSystem.style.display = 'block';
            userDisplay.textContent = `Admin User: ${user.email}`;
            startDataSync();
        } else {
            // Displays authentication card layout view standalone
            authScreen.style.setProperty('display', 'flex', 'important');
            mainSystem.style.display = 'none';
            stopDataSync();
        }
    });

    // ==========================================
    // 📊 REALTIME LISTENER SYNCHRONIZATION
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
                        <td><strong>Room ${r.roomNum}</strong></td>
                        <td>${r.dormId}</td>
                        <td>${r.capacity} Occupants Max</td>
                        <td>₱${r.rent}</td>
                        <td>
                            <button class="btn btn-warning btn-xs fw-bold text-dark" onclick="editRoomTrigger('${doc.id}', '${r.roomNum}', '${r.dormId}', ${r.capacity}, ${r.floor}, '${r.cr}', ${r.lamps}, ${r.windows}, '${r.size}', ${r.rent})">Edit</button>
                            <button class="btn btn-danger btn-xs fw-bold" onclick="deleteRoom('${doc.id}')">Delete</button>
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
                        <td>Unit: ${o.dormId} / Room: ${o.roomNum}</td>
                        <td>${o.age} yrs old / ${o.gender}</td>
                        <td>${o.contact}</td>
                        <td>
                            <button class="btn btn-warning btn-xs fw-bold text-dark" onclick="editOccTrigger('${doc.id}', '${o.lastname}', '${o.firstname}', '${o.middlename}', ${o.age}, '${o.birthday}', '${o.gender}', '${o.status}', '${o.dormId}', '${o.roomNum}', '${o.contact}', '${o.emergency}')">Edit</button>
                            <button class="btn btn-danger btn-xs fw-bold" onclick="deleteOcc('${doc.id}')">Delete</button>
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
                    <td>Dorm Unit Complex - Floor Level ${room.floor}</td>
                    <td><strong>Room ${room.roomNum}</strong></td>
                    <td><small class="text-secondary fw-semibold">${occupantNames} (${activeMatches.length}/${room.capacity} slots filled)</small></td>
                </tr>`;
        });
    }

    // ==========================================
    // 🧑‍🤝‍🧑 OCCUPANTS DIRECTORY WORKFLOW CONTROLLERS (CRUD)
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
            occSubmitBtn.textContent = "Save Occupant";
            occSubmitBtn.className = "btn btn-maroon btn-sm fw-bold";
            occFormTitle.innerHTML = `<i class="bi bi-person-plus-fill me-1"></i> Add New Occupant`;
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
        occSubmitBtn.textContent = "Update Occupant Parameters";
        occSubmitBtn.className = "btn btn-warning btn-sm fw-bold text-dark";
        occFormTitle.innerHTML = `<i class="bi bi-pencil-square me-1"></i> Modifying Occupant Info`;
        
        document.getElementById('occupants-tab').click();
    };

    window.deleteOcc = async (id) => {
        if (confirm("Are you sure you want to remove this occupant record permanently?")) {
            await deleteDoc(doc(db, "occupants", id));
        }
    };

    // ==========================================
    // 🚪 ROOMS DIRECTORY WORKFLOW CONTROLLERS (CRUD)
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
            roomSubmitBtn.textContent = "Save Room";
            roomSubmitBtn.className = "btn btn-maroon btn-sm fw-bold";
            roomFormTitle.innerHTML = `<i class="bi bi-door-open-fill me-1"></i> Add New Room`;
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
        roomSubmitBtn.textContent = "Update Room Parameters";
        roomSubmitBtn.className = "btn btn-warning btn-sm fw-bold text-dark";
        roomFormTitle.innerHTML = `<i class="bi bi-pencil-square me-1"></i> Modifying Room Info`;

        document.getElementById('rooms-tab').click();
    };

    window.deleteRoom = async (id) => {
        if (confirm("Are you sure you want to clear this room registry?")) {
            await deleteDoc(doc(db, "rooms", id));
        }
    };
});