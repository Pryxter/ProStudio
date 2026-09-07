import React, { useEffect, useState } from "react";
import { doc, setDoc, arrayUnion, getDoc } from "firebase/firestore";
import db from "./firebaseConfig";
import { format, set } from "date-fns";
import "./CheckInOutForm.css";
import ScreenLoader from "./ScreenLoader";

function CheckInOutForm({ employeeCode }) {
  const [employeeId, setEmployeeId] = useState("");
  const [name, setName] = useState("");
  const [action, setAction] = useState("check-in");
  const [notification, setNotification] = useState("");

  useEffect(() => {
    const fetchEmployeeRecords = async () => {
      if (employeeCode) {
        try {
          const docRef = doc(db, "codes", employeeCode);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setName(data.employeeName || ""); // Display name if available
            setEmployeeId(data.employeeId);
          } else {
            setNotification("Invalid code. Please try again.");
            showNotification("error");
          }
        } catch (error) {
          console.error("Error fetching employee records:", error);
        }
      }
    };

    fetchEmployeeRecords();
  }, [employeeCode]);

  //Specific Time Check-In

  const now = new Date();

  const dateAtPM = set(now, {
    hours: 15,
    minutes: 30,
    seconds: 0,
    milliseconds: 0,
  });

  const handleSpecificSubmit = async (e) => {
    // e.preventDefault();
    const timeStamp = format(new Date(), "MM-dd-yy").toString();
    const time = format(dateAtPM, "h:mm:ss aa").toString();
    const record = { action, timeStamp, time };

    try {
      const employeeDocRef = doc(db, "employees", employeeId); // Document for individual employee
      await setDoc(
        employeeDocRef,
        {
          name,
          records: arrayUnion(record), // Add record to the employee's history
        },
        { merge: true } // Merge with existing data
      );
      setNotification("Record saved successfully!");
      showNotification("success");
    } catch (error) {
      setNotification("Failed to save record. Please try again.");
      showNotification("error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const timeStamp = format(new Date(), "MM-dd-yy").toString();
    const time = format(new Date(), "h:mm:ss aa").toString();
    const record = { action, timeStamp, time };

    try {
      const employeeDocRef = doc(db, "employees", employeeId); // Document for individual employee
      await setDoc(
        employeeDocRef,
        {
          name,
          records: arrayUnion(record), // Add record to the employee's history
        },
        { merge: true } // Merge with existing data
      );
      setNotification("Record saved successfully!");
      showNotification("success");
      // alert("Record saved successfully");
      // setEmployeeId('');
      // setName('');
      // refreshPage()
    } catch (error) {
      // console.error("Error saving record:", error);
      setNotification("Failed to save record. Please try again.");
      showNotification("error");
    }
  };

  const showNotification = (type) => {
    const element = document.getElementById("notification");
    element.className = `notification show ${type}`;
    setTimeout(() => {
      element.className = "notification";
    }, 3000); // Hide after 3 seconds
  };

  const handleRefresh = () => {
    window.parent.location = window.parent.location.href;
  };

  return (
    <>
      <ScreenLoader />
      <div>
        <form className="form-container" onSubmit={handleSubmit}>
          <div
            style={{
              display: "flex",
              textAlign: "center",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            <img src="/PRO.avif" alt="Logo" className="logo_container" />
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                textAlign: "center",
                justifyContent: "center",
              }}
            >
              <h1 className="welcome_user">Welcome, {name}</h1>
              <img
                src="/Verified.svg"
                alt="Verified"
                style={{ marginLeft: 5, marginTop: 5 }}
              />
            </div>
          </div>
          <h2>Employee Check-In/Out</h2>
          <div className="form-group">
            <label htmlFor="name">Employee ID:</label>
            <input
              type="text"
              // placeholder="Employee ID"
              placeholder={employeeId}
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
              disabled
            />
          </div>
          <div className="form-group">
            <label htmlFor="name">Employee Name:</label>
            <input
              type="text"
              // placeholder="Employee Name"
              placeholder={name}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled
            />
          </div>
          <div className="form-group">
            <label htmlFor="action">Action:</label>
            <select value={action} onChange={(e) => setAction(e.target.value)}>
              <option value="check-in">📈Check-In</option>
              <option value="check-out">📉Check-Out</option>
            </select>
          </div>
          <button type="submit" className="submit-button">
            Submit💵
          </button>
          {/* <div>
            <p
              className="threepm-button"
              onClick={(e) => handleSpecificSubmit()}
            >
              3:30:00 PM🤑
            </p>
          </div> */}
          <div>
            <p className="logout-button" onClick={() => handleRefresh()}>
              Logout🔒
            </p>
          </div>
        </form>
      </div>
      <div id="notification" className="notification">
        {notification}
      </div>
    </>
  );
}

export default CheckInOutForm;
