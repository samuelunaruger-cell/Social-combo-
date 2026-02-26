const socket = io();
let currentUser = "";

async function register() {
  await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: username.value,
      email: email.value,
      password: password.value
    })
  });
  alert("Registered!");
}

async function login() {
  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.value,
      password: password.value
    })
  });
  const data = await res.json();
  currentUser = data.username;
  loadPosts();
}

async function createPost() {
  const form = new FormData();
  form.append("text", postText.value);
  form.append("user", currentUser);
  form.append("media", media.files[0]);

  await fetch("/post", {
    method: "POST",
    body: form
  });
  loadPosts();
}

async function loadPosts() {
  const res = await fetch("/posts");
  const posts = await res.json();

  feed.innerHTML = posts.map(p => `
    <div class="post">
      <h4>${p.user}</h4>
      <p>${p.text}</p>
      ${p.image ? `<img src="${p.image}" width="100%">` : ""}
      ${p.video ? `<video src="${p.video}" controls width="100%"></video>` : ""}
      <button onclick="likePost('${p._id}')">Like (${p.likes.length})</button>
    </div>
  `).join("");
}

async function likePost(id) {
  await fetch("/like/" + id, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: currentUser })
  });
  loadPosts();
}

function sendMessage() {
  socket.emit("sendMessage", {
    user: currentUser,
    message: chatInput.value
  });
}

socket.on("receiveMessage", data => {
  chatBox.innerHTML += `<p><b>${data.user}:</b> ${data.message}</p>`;
});
