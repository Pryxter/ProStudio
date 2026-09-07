import React, { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { parse, differenceInMinutes } from "date-fns";
import db from "./firebaseConfig";
import "./EmployeeList.css";
import printJS from "print-js";

function EmployeeList({ employeeId }) {
  const [records, setRecords] = useState([]);
  const [totalHours, setTotalHours] = useState(0);
  const [notification, setNotification] = useState("");

  let pay = totalHours * 16.4;

  const handleResetRecords = async () => {
    if (window.confirm("Are you sure you want to reset all records?")) {
      try {
        const employeesRef = collection(db, "employees");
        const snapshot = await getDocs(employeesRef);

        const archiveRef = collection(db, "ArchivedRecords");

        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7); // Get last week's date
        const formattedDate = weekStart.toISOString().split("T")[0]; // YYYY-MM-DD

        const batchPromises = snapshot.docs.map(async (docSnap) => {
          const employeeData = docSnap.data();

          if (employeeData.records && employeeData.records.length > 0) {
            await addDoc(archiveRef, {
              employeeId: docSnap.id,
              name: employeeData.name,
              weekStart: formattedDate,
              records: employeeData.records,
              hours: totalHours,
              etpayment: pay,
              createdAt: serverTimestamp(), // Sort by time
            });

            // Clear employee records after saving
            const employeeDocRef = doc(db, "employees", docSnap.id);
            await updateDoc(employeeDocRef, { records: [] });
          }
        });

        await Promise.all(batchPromises);
        setNotification("Records reset successfully!");
        showNotification("success");
      } catch (error) {
        setNotification("Error resetting records:", error);
        showNotification("error");
      }
    }
  };
  const showNotification = (type) => {
    const element = document.getElementById("notification");
    element.className = `notification show ${type}`;
    setTimeout(() => {
      element.className = "notification";
    }, 3000); // Hide after 3 seconds
  };

  useEffect(() => {
    if (employeeId) {
      const unsubscribe = onSnapshot(
        doc(db, "employees", employeeId),
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setRecords(data.records || []);
            calculateTotalHours(data.records || []);
            // setName(data.name || 'Unknown');
          } else {
            alert("Employee record not found.");
          }
        }
      );

      // Cleanup on component unmount
      return () => unsubscribe();
    }
  }, [employeeId]);

  const calculateTotalHours = (records) => {
    let totalMinutesWorked = 0;
    let checkInTime = null;

    records.forEach((record) => {
      const timeFormat = "h:mm:ss aa"; // Custom time format
      if (record.action === "check-in") {
        checkInTime = parse(record.time, timeFormat, new Date());
      } else if (record.action === "check-out" && checkInTime) {
        const checkOutTime = parse(record.time, timeFormat, new Date());
        totalMinutesWorked += differenceInMinutes(checkOutTime, checkInTime);
        checkInTime = null; // Reset after calculating a session
      }
    });

    const hoursWorked = (totalMinutesWorked / 60).toFixed(2); // Convert minutes to hours
    setTotalHours(hoursWorked);
  };
  let estimatePay = totalHours * 16.4;
  let socialSecurity = (estimatePay * 6.2) / 100;
  let medicare = (estimatePay * 1.45) / 100;
  let ilStWH = (estimatePay * 4.95) / 100;
  let finalPay = estimatePay - socialSecurity - medicare - ilStWH;

  return (
    <div className="form-container" style={{ marginTop: 15 }}>
      <h2 className="table-title">Employee Records</h2>
      <p>
        <strong>Total Hours Worked:</strong>{" "}
        <span style={{ color: "blue", fontWeight: "bold" }}>{totalHours}</span>{" "}
        hours⏱️
      </p>
      {employeeId === "0427" ? (
        <button className="reset-button" onClick={handleResetRecords}>
          ✂️ Reset Records
        </button>
      ) : (
        <></>
      )}

      {records.length > 0 ? (
        <div id="print-section">
          <table className="employee-table">
            <thead>
              <tr>
                <th className="table-header">Action</th>
                <th className="table-header">Date</th>
                <th className="table-header">Time</th>
              </tr>
            </thead>
            <tbody>
              {records
                .slice()
                .reverse()
                .map((record, index) => (
                  <tr key={index}>
                    <td className="action_edit">{record.action}</td>
                    <td className="table-cell">{record.timeStamp}</td>
                    <td className="table-cell">{record.time}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No records found.</p>
      )}
      <div id="notification" className="notification">
        {notification}
      </div>
    </div>
  );
}

export default EmployeeList;
