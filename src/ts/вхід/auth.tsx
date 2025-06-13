import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../../scss/main.scss";
import App from "./App.tsx";
import { signInWithGoogle } from "./login.ts";

// перевірка localStorage
const user = localStorage.getItem("user");

if (user) {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} else {
  const button = document.createElement("button");
  button.innerText = "Увійти через Google";
  button.onclick = signInWithGoogle;
  document.body.appendChild(button);
}
