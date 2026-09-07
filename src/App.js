import React, { useState } from "react";
import CodeLogin from "./Login";
import CheckInOutForm from "./CheckInOutForm";
import EmployeeList from "./EmployeeList";

function App() {
  const [loggedEmployeeId, setLoggedEmployeeId] = useState(""); // Replace with actual login logic
  const [loggedEmployeeName, setLoggedEmployeeName] = useState(""); // Replace with actual login logic
  const [loggedEmployeeCode, setLoggedEmployeeCode] = useState(""); // Replace with actual login logic

  return (
    <div>
      {!loggedEmployeeId ? (
        <CodeLogin
          onLogin={setLoggedEmployeeId}
          onName={setLoggedEmployeeName}
          onCode={setLoggedEmployeeCode}
        />
      ) : (
        <>
          <div style={{ display: "none" }}>
            <h1 className="welcome_user">Welcome, {loggedEmployeeName}</h1>
          </div>
          <CheckInOutForm employeeCode={loggedEmployeeCode} />
          {/* <EmployeeList /> */}
          <EmployeeList employeeId={loggedEmployeeId} />
          {/* <EmployeeHistory employeeId={loggedEmployeeId} /> */}
          <div style={{ textAlign: "center" }}>
            <img src="/Revenge.svg" alt="Revenge" style={{ marginTop: 5 }} />
          </div>
        </>
      )}
    </div>
  );
}

export default App;
