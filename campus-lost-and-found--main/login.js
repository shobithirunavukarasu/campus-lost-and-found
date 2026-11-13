import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDJ6z1aA29SisqrOMqWLRpjrQGCJfvn0xU",
  authDomain: "campus-lost-and-found-2bec2.firebaseapp.com",
  projectId: "campus-lost-and-found-2bec2",
  storageBucket: "campus-lost-and-found-2bec2.firebasestorage.app",
  messagingSenderId: "661638609584",
  appId: "1:661638609584:web:e08902e181a82a1abf9975",
  measurementId: "G-JBMJ0DFCHT"
};

const auth = getAuth(initializeApp(firebaseConfig));
const form = document.getElementById("authForm");
const email = document.getElementById("authEmail");
const password = document.getElementById("authPassword");
const message = document.getElementById("authMessage");
const submit = document.getElementById("signInBtn");
const toggle = document.getElementById("toggleModeBtn");
let creatingAccount = false;

onAuthStateChanged(auth, user => {
  if (user) window.location.replace("index.html");
});

toggle.addEventListener("click", () => {
  creatingAccount = !creatingAccount;
  document.getElementById("loginTitle").textContent = creatingAccount ? "Create your account" : "Sign in to your account";
  document.getElementById("loginSubtitle").textContent = creatingAccount ? "Create an account with your email to get started." : "Use your email and password to continue.";
  document.getElementById("switchPrompt").textContent = creatingAccount ? "Already have an account?" : "New to CampusFind?";
  toggle.textContent = creatingAccount ? "Sign in" : "Create an account";
  submit.innerHTML = creatingAccount ? "Create account <span>→</span>" : "Sign in <span>→</span>";
  password.autocomplete = creatingAccount ? "new-password" : "current-password";
  message.textContent = "";
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  message.textContent = "";
  submit.disabled = true;
  try {
    if (creatingAccount) {
  const enteredEmail = email.value.trim().toLowerCase();

  if (!enteredEmail.endsWith("@stjosephs.ac.in")) {
    message.textContent = "Please use your official college email.";
    submit.disabled = false;
    return;
  }

  await createUserWithEmailAndPassword(auth, enteredEmail, password.value);
} else {
  await signInWithEmailAndPassword(
    auth,
    email.value.trim(),
    password.value
  );
}
    
    window.location.replace("index.html");
  } catch (error) {
    const messages = {
      "auth/invalid-credential": "Email or password is incorrect. If you are new, choose Create an account first.",
      "auth/email-already-in-use": "This email already has an account. Choose Sign in instead.",
      "auth/weak-password": "Choose a password with at least 6 characters.",
      "auth/invalid-email": "Enter a valid email address."
    };
    message.textContent = messages[error.code] || error.message;
  } finally {
    submit.disabled = false;
  }
});
