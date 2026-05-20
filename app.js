window.addEventListener('DOMContentLoaded', () => {
    // Firebase Tools
    const db = window.db;
    const auth = window.auth;
    const { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot } = window.dbTools;
    const { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } = window.authTools;

    const tenantCollection = collection(db, "tenants");

    // UI Screen Containers
    const authScreen = document.getElementById('auth-screen');
    const mainSystem = document.getElementById('main-system');

    // Auth Elements
    const authForm = document.getElementById('auth-form');
    const authEmail = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');
    const authTitle = document.getElementById('auth-title');
    const authBtn = document.getElementById('auth-btn');
    const toggleAuthBtn = document.getElementById('toggle-auth');
    const logoutBtn = document.getElementById('logout-btn');

    // System CRUD Elements
    const tenantForm = document.getElementById('tenant-form');
    const tenantIdInput = document.getElementById('tenant-id');
    const tenantNameInput = document.getElementById('tenant-name');
    const roomNumberInput = document.getElementById('room-number');
    const submitBtn = document.getElementById('submit-btn');
    const formTitle = document.getElementById('form-title');
    const tableBody = document.getElementById('tenants-table-body');

    let isLoginMode = true;
    let editMode = false;
    let unsubscribeSnapshot = null; // Para i-stop ang pakikinig sa DB kapag nag-logout

    // ==========================================
    // 🔐 AUTHENTICATION LOGIC (LOGIN / REGISTER)
    // ==========================================

    // Magpalit mula sa Login papuntang Register UI at vice-versa
    toggleAuthBtn.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        if (isLoginMode) {
            authTitle.textContent = "Dorm System Login";
            authBtn.textContent = "Login";
            toggleAuthBtn.textContent = "Don't have an account? Register";
        } else {
            authTitle.textContent = "Create Admin Account";
            authBtn.textContent = "Register";
            toggleAuthBtn.textContent = "Already have an account? Login";
        }
    });

    // Handle Auth Form Submit
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = authEmail.value;
        const password = authPassword.value;

        try {
            if (isLoginMode) {
                // LOGIN
                await signInWithEmailAndPassword(auth, email, password);
                alert("Welcome back!");
            } else {
                // REGISTER
                await createUserWithEmailAndPassword(auth, email, password);
                alert("Account created successfully!");
            }
            authForm.reset();
        } catch (error) {
            alert("Error: " + error.message);
        }
    });

    // Logout Function
    logoutBtn.addEventListener('click', async () => {
        if (confirm("Gusto mo ba mag-logout?")) {
            await signOut(auth);
        }
    });

    // Tagabantay kung may naka-login o wala (State Observer)
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // May naka-login: Ipakita ang system, itago ang login screen
            authScreen.style.display = 'none';
            mainSystem.style.display = 'block';
            startRealtimeListener(); // Paganahin ang Read ng data
        } else {
            // Walang naka-login: Ipakita ang login screen, itago ang system
            authScreen.style.display = 'block';
            mainSystem.style.display = 'none';
            tableBody.innerHTML = "";
            if (unsubscribeSnapshot) unsubscribeSnapshot(); // Patayin ang DB listener para sa security
        }
    });


    // ==========================================
    // 🏠 DORMITORY CRUD LOGIC (Gaya ng dati)
    // ==========================================

    function startRealtimeListener() {
        unsubscribeSnapshot = onSnapshot(tenantCollection, (snapshot) => {
            tableBody.innerHTML = "";
            snapshot.forEach((doc) => {
                const tenant = doc.data();
                const row = `
                    <tr>
                        <td>${tenant.name}</td>
                        <td>${tenant.room}</td>
                        <td>
                            <button class="btn btn-warning btn-sm me-2" onclick="editTenant('${doc.id}', '${tenant.name}', '${tenant.room}')">Edit</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteTenant('${doc.id}')">Delete</button>
                        </td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
        });
    }

    tenantForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = tenantNameInput.value;
        const room = roomNumberInput.value;

        if (!editMode) {
            await addDoc(tenantCollection, { name, room });
        } else {
            const id = tenantIdInput.value;
            const docRef = doc(db, "tenants", id);
            await updateDoc(docRef, { name, room });
            
            editMode = false;
            submitBtn.textContent = "Save Tenant";
            submitBtn.className = "btn btn-success";
            formTitle.textContent = "Add New Tenant";
        }
        tenantForm.reset();
        tenantIdInput.value = "";
    });

    window.editTenant = (id, name, room) => {
        tenantIdInput.value = id;
        tenantNameInput.value = name;
        roomNumberInput.value = room;
        editMode = true;
        submitBtn.textContent = "Update Tenant";
        submitBtn.className = "btn btn-primary";
        formTitle.textContent = "Editing Tenant Info";
    };

    window.deleteTenant = async (id) => {
        if (confirm("Sigurado ka bang gusto mo itong burahin?")) {
            const docRef = doc(db, "tenants", id);
            await deleteDoc(docRef);
        }
    };
});