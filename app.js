// Hintayin muna matapos mag-load ang window at Firebase
window.addEventListener('DOMContentLoaded', () => {
    const db = window.db;
    const { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot } = window.dbTools;

    const tenantCollection = collection(db, "tenants");

    // UI Elements
    const tenantForm = document.getElementById('tenant-form');
    const tenantIdInput = document.getElementById('tenant-id');
    const tenantNameInput = document.getElementById('tenant-name');
    const roomNumberInput = document.getElementById('room-number');
    const submitBtn = document.getElementById('submit-btn');
    const formTitle = document.getElementById('form-title');
    const tableBody = document.getElementById('tenants-table-body');

    let editMode = false;

    // 1. READ & REAL-TIME LISTEN (Awtomatikong mag-aupdate ang UI kapag may nagbago sa DB)
    onSnapshot(tenantCollection, (snapshot) => {
        tableBody.innerHTML = ""; // Linisin ang table
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

    // 2. CREATE & UPDATE function kapag nag-submit ng form
    tenantForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = tenantNameInput.value;
        const room = roomNumberInput.value;

        if (!editMode) {
            // CREATE MODE
            await addDoc(tenantCollection, { name, room });
        } else {
            // UPDATE MODE
            const id = tenantIdInput.value;
            const docRef = doc(db, "tenants", id);
            await updateDoc(docRef, { name, room });
            
            // Ibalik sa dating anyo ang form pagkatapos mag-update
            editMode = false;
            submitBtn.textContent = "Save Tenant";
            submitBtn.className = "btn btn-success";
            formTitle.textContent = "Add New Tenant";
        }

        tenantForm.reset();
        tenantIdInput.value = "";
    });

    // 3. EDIT TRIGGER (Ipapasa ang data sa form para mai-edit)
    window.editTenant = (id, name, room) => {
        tenantIdInput.value = id;
        tenantNameInput.value = name;
        roomNumberInput.value = room;

        editMode = true;
        submitBtn.textContent = "Update Tenant";
        submitBtn.className = "btn btn-primary";
        formTitle.textContent = "Editing Tenant Info";
    };

    // 4. DELETE FUNCTION
    window.deleteTenant = async (id) => {
        if (confirm("Sigurado ka bang gusto mo itong burahin?")) {
            const docRef = doc(db, "tenants", id);
            await deleteDoc(docRef);
        }
    };
});