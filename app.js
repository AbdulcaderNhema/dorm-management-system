window.addEventListener('DOMContentLoaded', () => {
    // Kunin ang mga binato ng `firebase-config.js`
    const db = window.db;
    const auth = window.auth;
    const { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot } = window.dbTools;
    const { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } = window.authTools;

    // Database Collections Pointer
    const occupantsCollection = collection(db, "occupants");
    const roomsCollection = collection(db, "rooms");

    // UI Window Elements
    const authScreen = document.getElementById('auth-screen');
    const mainSystem = document.getElementById('main-system');
    const userDisplay = document.getElementById('user-display');

    // Authentication DOM Element Handles
    const authForm = document.getElementById('auth-form');
    const authEmail = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');
    const authTitle = document.getElementById('auth-title');
    const authBtn = document.getElementById('auth-btn');
    const toggleAuthBtn = document.getElementById('toggle-auth');
    const logoutBtn = document.getElementById('logout-btn');

    // Occupants Form Inputs
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

    // Rooms Form Inputs
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

    // Dashboard Counters
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
    // 🔐 AUTH LOGIC
    // ==========================================
    toggleAuthBtn.onclick = function() {
        isLoginMode = !isLoginMode;
        if (isLoginMode) {
            authTitle.textContent = "Dorm System Login";
            authBtn.textContent = "Login";
            toggleAuthBtn.textContent = "Walang account? Mag-register dito";
        } else {
            authTitle.textContent = "Create Admin Account";
            authBtn.textContent = "Register Admin";
            toggleAuthBtn.textContent = "May account na? Mag-login dito";
        }
    };

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = authEmail.value;
        const password = authPassword.value;

        if (password.length < 6) {
            alert("Ang password ay dapat hindi bababa sa 6 na characters.");
            return;
        }

        try {
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, email, password);
                alert("Maligayang pagbabalik!");
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
                alert("Matagumpay na nagawa ang Admin Account!");
            }
            authForm.reset();
        } catch (error) {
            alert("Auth Error: " + error.message);
        }
    });

    logoutBtn.addEventListener('click', async () => {
        if (confirm("Sigurado ka bang gusto mong mag-logout?")) {
            await signOut(auth);
        }
    });

    onAuthStateChanged(auth, (user) => {
        if (user) {
            authScreen.style.display = 'none';
            mainSystem.style.display = 'block';
            userDisplay.textContent = `Admin: ${user.email}`;
            startDataSync();
        } else {
            authScreen.style.display = 'block';
            mainSystem.style.display = 'none';
            stopDataSync();
        }
    });

    // ==========================================
    // 📊 REALTIME DATA CONNECTIONS
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
                        <td><strong>${r.roomNum}</strong></td>
                        <td>${r.dormId}</td>
                        <td>${r.capacity} Slots</td>
                        <td>₱${r.rent}</td>
                        <td>
                            <button class="btn btn-warning btn-xs" onclick="editRoomTrigger('${doc.id}', '${r.roomNum}', '${r.dormId}', ${r.capacity}, ${r.floor}, '${r.cr}', ${r.lamps}, ${r.windows}, '${r.size}', ${r.rent})">Edit</button>
                            <button class="btn btn-danger btn-xs" onclick="deleteRoom('${doc.id}')">Del</button>
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
                        <td>${o.lastname}, ${o.firstname}</td>
                        <td>D: ${o.dormId} / R: ${o.roomNum}</td>
                        <td>${o.age} / ${o.gender}</td>
                        <td>${o.contact}</td>
                        <td>
                            <button class="btn btn-warning btn-xs" onclick="editOccTrigger('${doc.id}', '${o.lastname}', '${o.firstname}', '${o.middlename}', ${o.age}, '${o.birthday}', '${o.gender}', '${o.status}', '${o.dormId}', '${o.roomNum}', '${o.contact}', '${o.emergency}')">Edit</button>
                            <button class="btn btn-danger btn-xs" onclick="deleteOcc('${doc.id}')">Del</button>
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
            const occupantNames = activeMatches.map(o => `${o.firstname} ${o.lastname}`).join(', ') || "Empty Room";
            
            overviewTableBody.innerHTML += `
                <tr>
                    <td><span class="badge bg-secondary">${room.dormId}</span></td>
                    <td>Dorm Unit - Floor ${room.floor}</td>
                    <td><strong>Room ${room.roomNum}</strong></td>
                    <td><small class="text-muted">${occupantNames} (${activeMatches.length}/${room.capacity} loaded)</small></td>
                </tr>`;
        });
    }

    // ==========================================
    // 🧑‍🤝‍🧑 OCCUPANTS CRUD
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
            occSubmitBtn.textContent = "I-save Occupant";
            occSubmitBtn.className = "btn btn-success btn-sm";
            occFormTitle.textContent = "Magdagdag ng Occupant";
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
        occSubmitBtn.textContent = "I-update Occupant";
        occSubmitBtn.className = "btn btn-primary btn-sm";
        occFormTitle.textContent = "I-edit Detalye ng Occupant";
        
        document.getElementById('occupants-tab').click();
    };

    window.deleteOcc = async (id) => {
        if (confirm("Sigurado ka bang buburahin ang occupant na ito?")) {
            await deleteDoc(doc(db, "occupants", id));
        }
    };

    // ==========================================
    // 🚪 ROOMS CRUD
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
            roomSubmitBtn.textContent = "I-save Kwarto";
            roomSubmitBtn.className = "btn btn-success btn-sm";
            roomFormTitle.textContent = "Magdagdag ng Kwarto";
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
        roomSubmitBtn.textContent = "I-update Kwarto";
        roomSubmitBtn.className = "btn btn-primary btn-sm";
        roomFormTitle.textContent = "I-edit Detalye ng Kwarto";

        document.getElementById('rooms-tab').click();
    };

    window.deleteRoom = async (id) => {
        if (confirm("Sigurado ka bang buburahin ang kwartong ito?")) {
            await deleteDoc(doc(db, "rooms", id));
        }
    };
});