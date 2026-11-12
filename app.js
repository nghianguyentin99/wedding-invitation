import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { 
  getFirestore, collection, addDoc, onSnapshot, 
  query, orderBy, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// 1. Cấu hình Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDFRCD42BZCQl2vWuuSMAfqGkiSQq585bY",
  authDomain: "fir-app-ec70a.firebaseapp.com",
  databaseURL: "https://fir-app-ec70a-default-rtdb.firebaseio.com",
  projectId: "fir-app-ec70a",
  storageBucket: "fir-app-ec70a.firebasestorage.app",
  messagingSenderId: "592999214250",
  appId: "1:592999214250:web:209d60fdedb8de8d5234d3",
  measurementId: "G-J1G21SPRWR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const wishesRef = collection(db, "wishes");

// 2. Xử lý gửi lời chúc lên Firestore + Thông báo thành công
const form = document.getElementById("wish-form");
const submitBtn = document.getElementById("submit-btn");
const successMsg = document.getElementById("wish-success-msg");
let successTimer = null;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("sender-name").value.trim();
  const message = document.getElementById("wish-message").value.trim();

  if (!name || !message) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "Đang gửi...";

  try {
    await addDoc(wishesRef, {
      name: name,
      message: message,
      createdAt: serverTimestamp() // Bắt buộc dùng serverTimestamp để khớp với Security Rules
    });
    form.reset();

    if (successMsg) {
      successMsg.classList.remove("hidden");
      clearTimeout(successTimer);
      successTimer = setTimeout(() => {
        successMsg.classList.add("hidden");
      }, 5000);
    }
  } catch (error) {
    console.error("Lỗi khi gửi:", error);
    alert("Không thể gửi lời chúc lúc này, bạn thử lại nhé!");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "✨ Gửi Lời Chúc Yêu Thương";
  }
});

// 3. Lắng nghe dữ liệu Real-time & chống XSS (Hiển thị trong Modal khi bấm nút)
const wishesList = document.getElementById("wishes-list");
const wishesCountBadge = document.getElementById("wishes-count-badge");
const wishesModalCount = document.getElementById("wishes-modal-count");
const wishesModal = document.getElementById("wishes-modal");
const openWishesBtn = document.getElementById("open-wishes-modal-btn");
const closeWishesBtn = document.getElementById("wishes-modal-close");

function openWishesModal() {
  if (!wishesModal) return;
  wishesModal.classList.remove("hidden");
  wishesModal.classList.add("flex");
}

function closeWishesModal() {
  if (!wishesModal) return;
  wishesModal.classList.add("hidden");
  wishesModal.classList.remove("flex");
}

if (openWishesBtn) openWishesBtn.addEventListener("click", openWishesModal);
if (closeWishesBtn) closeWishesBtn.addEventListener("click", closeWishesModal);
if (wishesModal) {
  wishesModal.addEventListener("click", (e) => {
    if (e.target === wishesModal) closeWishesModal();
  });
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeWishesModal();
});

const q = query(wishesRef, orderBy("createdAt", "desc"));

// Hàm escape HTML để tránh người dùng nhập mã độc <script> vào lời chúc
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag]));
}

onSnapshot(q, (snapshot) => {
  const total = snapshot.size;
  if (wishesCountBadge) wishesCountBadge.textContent = String(total);
  if (wishesModalCount) wishesModalCount.textContent = String(total);

  if (snapshot.empty) {
    wishesList.innerHTML = `<p class="text-center text-beige-600 text-sm italic py-6">Chưa có lời chúc nào. Hãy là người đầu tiên gửi lời chúc nhé!</p>`;
    return;
  }

  wishesList.innerHTML = "";
  snapshot.forEach((doc) => {
    const data = doc.data();
    const card = document.createElement("div");
    card.className = "p-5 rounded-2xl bg-white border border-beige-200 shadow-sm";
    card.innerHTML = `
      <div class="flex items-center gap-2.5">
        <span class="w-8 h-8 rounded-full bg-beige-200 text-beige-800 font-serif font-bold flex items-center justify-center text-sm flex-shrink-0">
          ${escapeHTML(data.name.charAt(0).toUpperCase())}
        </span>
        <div class="font-serif font-bold text-lg text-beige-900">${escapeHTML(data.name)}</div>
      </div>
      <p class="text-beige-700 mt-2.5 text-sm leading-relaxed whitespace-pre-line pl-10">${escapeHTML(data.message)}</p>
    `;
    wishesList.appendChild(card);
  });
});
