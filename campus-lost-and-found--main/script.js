import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";
import {
  getAuth,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
const firebaseConfig = {
    apiKey: "AIzaSyDJ6z1aA29SisqrOMqWLRpjrQGCJfvn0xU",
    authDomain: "campus-lost-and-found-2bec2.firebaseapp.com",
    projectId: "campus-lost-and-found-2bec2",
    storageBucket: "campus-lost-and-found-2bec2.firebasestorage.app",
    messagingSenderId: "661638609584",
    appId: "1:661638609584:web:e08902e181a82a1abf9975",
    measurementId: "G-JBMJ0DFCHT"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const signOutBtn = document.getElementById("signOutBtn");

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }
  signOutBtn.textContent = "Sign out";
});

signOutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.replace("login.html");
});

async function loadItemsFromFirestore() {
  try {
    const snapshot = await getDocs(collection(db, "items"));
    items = snapshot.docs.map((itemDoc) => ({
      id: itemDoc.id,
      ...itemDoc.data()
    }));
    renderItems();
  } catch (error) {
    console.error("Firebase load failed:", error);
  }
}


const STORAGE_KEY = 'campusItems';

let items = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let currentFilter = 'all';

const formContainer = document.getElementById('formContainer');
const itemForm = document.getElementById('itemForm');
const formTitle = document.getElementById('formTitle');
const itemTypeInput = document.getElementById('itemType');
const itemsGrid = document.getElementById('itemsGrid');
const searchInput = document.getElementById('searchInput');
const itemImageInput = document.getElementById('itemImage');
const imagePreview = document.getElementById('imagePreview');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const showLostFormBtn = document.getElementById('showLostFormBtn');
const showFoundFormBtn = document.getElementById('showFoundFormBtn');
const closeFormBtn = document.getElementById('closeFormBtn');
const filterBtns = document.querySelectorAll('.filter-btn');
const useLocationBtn = document.getElementById('useLocationBtn');
const locationMessage = document.getElementById('locationMessage');
const gpsLatitude = document.getElementById('gpsLatitude');
const gpsLongitude = document.getElementById('gpsLongitude');

useLocationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        locationMessage.textContent = 'Location is not supported by this browser. Enter a campus place instead.';
        return;
    }

    locationMessage.textContent = 'Requesting your location…';
    useLocationBtn.disabled = true;
    navigator.geolocation.getCurrentPosition(
        (position) => {
            gpsLatitude.value = position.coords.latitude;
            gpsLongitude.value = position.coords.longitude;
            document.getElementById('location').value = 'Current location (GPS)';
            locationMessage.textContent = 'Location added to this report.';
            useLocationBtn.disabled = false;
        },
        (error) => {
            const message = error.code === error.PERMISSION_DENIED
                ? 'Location permission was denied. You can enter a campus place manually.'
                : 'Could not get your location. Please enter a campus place manually.';
            locationMessage.textContent = message;
            useLocationBtn.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
});

document.getElementById('location').addEventListener('input', () => {
    gpsLatitude.value = '';
    gpsLongitude.value = '';
    locationMessage.textContent = '';
});

function saveAndRender() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    renderItems();

}

function escapeHtml(str = '') {
    return String(str).replace(/[&<>"']/g, (match) => {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return map[match];
    });
}

function getBase64(file) {
    return new Promise((resolve) => {
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
    });
}

function renderItems() {
    itemsGrid.innerHTML = '';
    const searchTerm = (searchInput.value || '').trim().toLowerCase();

    const filteredItems = items.filter((item) => {
        const matchesFilter = currentFilter === 'all' || item.type.toLowerCase() === currentFilter.toLowerCase();
        const searchableText = [item.name, item.category, item.location, item.description].join(' ').toLowerCase();
        return matchesFilter && searchableText.includes(searchTerm);
    });

    if (filteredItems.length === 0) {
        itemsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #94a3b8;">No items reported yet.</p>';
        return;
    }

    filteredItems.forEach((item) => {
        const card = document.createElement('article');
        card.className = `item-card type-${item.type.toLowerCase()}`;

        card.innerHTML = `
            <div>
                ${item.image ? `<img src="${item.image}" alt="${escapeHtml(item.name)}" style="width:100%; height:160px; object-fit:cover; border-radius:6px; margin-bottom:12px;">` : ''}
                <span class="badge badge-${item.type.toLowerCase()}">${item.type.toUpperCase()}</span>
                <h3>${escapeHtml(item.name)}</h3>
                <p><strong>Category:</strong> ${escapeHtml(item.category)}</p>
                <p><strong>Location:</strong> ${escapeHtml(item.location)}</p>
                <p><strong>Date:</strong> ${escapeHtml(item.date)}</p>
                <p><strong>Description:</strong> ${escapeHtml(item.description)}</p>
            </div>
            ${auth.currentUser && item.type === 'Found' && item.createdBy !== auth.currentUser.uid
  ? `<button type="button" class="claim-btn" data-id="${item.id}">Claim this item</button>`
  : ''}
            <button type="button" class="delete-btn" data-id="${item.id}">Remove Report</button>
        `;

        itemsGrid.appendChild(card);
    });

    itemsGrid.querySelectorAll(".delete-btn").forEach((button) => {
  button.addEventListener("click", async () => {
    const id = button.dataset.id;

    try {
      await deleteDoc(doc(db, "items", id));
      items = items.filter((item) => item.id !== id);
      saveAndRender();
    } catch (error) {
      console.error("Firebase delete failed:", error);
      alert("Could not remove the report.");
    }
  });
});
}

function resetForm() {
    itemForm.reset();
    itemTypeInput.value = 'Lost';
    imagePreviewContainer.style.display = 'none';
    imagePreview.removeAttribute('src');
    gpsLatitude.value = '';
    gpsLongitude.value = '';
    locationMessage.textContent = '';
}

showLostFormBtn.addEventListener('click', () => {
    formTitle.textContent = 'Report Lost Item';
    itemTypeInput.value = 'Lost';
    formContainer.style.display = 'block';
    formContainer.scrollIntoView({ behavior: "smooth", block: "start" });
});

showFoundFormBtn.addEventListener('click', () => {
    formTitle.textContent = 'Report Found Item';
    itemTypeInput.value = 'Found';
    formContainer.style.display = 'block';
    formContainer.scrollIntoView({ behavior: "smooth", block: "start" });
});

closeFormBtn.addEventListener('click', () => {
    formContainer.style.display = 'none';
    resetForm();
});

itemImageInput.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) {
        imagePreviewContainer.style.display = 'none';
        imagePreview.removeAttribute('src');
        return;
    }

    if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        this.value = '';
        imagePreviewContainer.style.display = 'none';
        return;
    }

    if (file.size > 1024 * 1024) {
        alert('Please choose an image smaller than 1 MB.');
        this.value = '';
        imagePreviewContainer.style.display = 'none';
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        imagePreview.src = event.target.result;
        imagePreviewContainer.style.display = 'block';
    };
    reader.readAsDataURL(file);
});

itemForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const imageFile = itemImageInput.files[0];
    const imageDataUrl = imageFile ? await getBase64(imageFile) : '';
    const verificationDetail =
    document.getElementById('verificationDetail').value.trim();

    const newItem = {
        id: Date.now(),
        type: itemTypeInput.value,
        name: document.getElementById('itemName').value.trim(),
        category: document.getElementById('category').value,
        location: document.getElementById('location').value.trim(),
        latitude: gpsLatitude.value ? Number(gpsLatitude.value) : null,
        longitude: gpsLongitude.value ? Number(gpsLongitude.value) : null,
        date: document.getElementById('date').value,
        description: document.getElementById('description').value.trim(),
        image: imageDataUrl
    };


    
    try {
  const { id, ...itemData } = newItem;
  itemData.createdBy = auth.currentUser.uid;
  const savedDoc = await addDoc(collection(db, "items"), itemData);
  if (verificationDetail) {
  await setDoc(
    doc(db, "items", savedDoc.id, "private", "verification"),
    { verificationDetail }
  );
}
  newItem.id = savedDoc.id;

  items.unshift(newItem);
  saveAndRender();
  formContainer.style.display = "none";
  resetForm();
} catch (error) {
  console.error("Firebase save failed:", error);
  alert("Could not save the report. Please check the browser Console.");
}
});

filterBtns.forEach((btn) => {
    btn.addEventListener('click', (event) => {
        filterBtns.forEach((button) => button.classList.remove('active'));
        event.target.classList.add('active');
        currentFilter = event.target.dataset.filter;
        renderItems();
    });
});
const claimModal = document.getElementById('claimModal');
const claimForm = document.getElementById('claimForm');
const claimItemId = document.getElementById('claimItemId');
const claimAnswer = document.getElementById('claimAnswer');
const claimMessage = document.getElementById('claimMessage');

itemsGrid.addEventListener('click', (event) => {
  const button = event.target.closest('.claim-btn');
  if (!button) return;

  claimItemId.value = button.dataset.id;
  claimMessage.textContent = '';
  claimModal.hidden = false;
  claimAnswer.focus();
});

document.getElementById('closeClaimBtn').addEventListener('click', () => {
  claimModal.hidden = true;
  claimForm.reset();
});

claimForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const itemId = claimItemId.value;
  const answer = claimAnswer.value.trim();

  if (!auth.currentUser) {
    claimMessage.textContent = 'Please sign in before sending a claim.';
    return;
  }

  const submitButton = claimForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  claimMessage.textContent = 'Sending claim…';

  try {
    await addDoc(collection(db, 'items', itemId, 'claims'), {
      claimantId: auth.currentUser.uid,
      answer: answer,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    claimMessage.textContent = 'Claim sent. The item owner can review it.';
    claimAnswer.value = '';
  } catch (error) {
    console.error('Claim save failed:', error);
    claimMessage.textContent = 'Could not send the claim. Please try again.';
  } finally {
    submitButton.disabled = false;
  }
});
searchInput.addEventListener('input', renderItems);

renderItems();
loadItemsFromFirestore();
