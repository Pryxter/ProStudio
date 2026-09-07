import React, { useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import db from "./firebaseConfig";
import "./CodeLogin.css"; // Import CSS file
import ScreenLoader from "./ScreenLoader";

function CodeLogin({ onLogin, onName, onCode }) {
  const [code, setCode] = useState("");

  // Function to handle number clicks
  const handleNumberClick = (num) => {
    if (code.length < 4) {
      setCode(code + num);
    }
  };

  // Backspace button function
  const handleBackspace = () => {
    setCode(code.slice(0, -1));
  };

  // Clear input function
  const handleClear = () => {
    setCode("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const q = query(collection(db, "codes"), where("loginCode", "==", code));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        onLogin(userData.employeeId);
        onName(userData.employeeName);
        onCode(userData.loginCode);
      } else {
        alert("Invalid code. Please try again.");
      }
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  return (
    <div className="login-container">
      <ScreenLoader />
      <div className="code-login-container">
        <img src="/PRO.avif" alt="Logo" style={{ height: 100 }} />
        <h2>Enter Your Code</h2>

        {/* Code Display */}
        <div className="code-display">{code.padEnd(4, "•")}</div>

        {/* Number Pad */}
        <div className="number-pad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
            <button key={num} onClick={() => handleNumberClick(num)}>
              {num}
            </button>
          ))}
        </div>

        {/* Control Buttons */}
        <div className="control-buttons">
          <button
            className="clear-btn"
            style={{ width: 280 }}
            onClick={handleBackspace}
          >
            ⌫
          </button>
          <button onClick={handleClear}>Clear</button>
          <button onClick={handleLogin} disabled={code.length !== 4}>
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default CodeLogin;
