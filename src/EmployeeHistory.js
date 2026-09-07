import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import db from "./firebaseConfig";
import "./EmployeeHistory.css";

function EmployeeHistory({ employeeId }) {
  const [archivedRecords, setArchivedRecords] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState("");

  useEffect(() => {
    if (!employeeId) return;

    const archiveRef = collection(db, "ArchivedRecords");
    const q = query(archiveRef, where("employeeId", "==", employeeId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      records.sort((a, b) => new Date(b.weekStart) - new Date(a.weekStart));
      setArchivedRecords(records);
    });

    return () => unsubscribe();
  }, [employeeId]);

  const uniqueWeeks =
    archivedRecords.length > 0
      ? [...new Set(archivedRecords.map((record) => record.weekStart))]
      : [];

  const filteredRecords = selectedWeek
    ? archivedRecords.filter((record) => record.weekStart === selectedWeek)
    : archivedRecords;

  return (
    <div className="employee-list">
      {/* <h2>My Weekly Work History 📅</h2>

      <select
        onChange={(e) => setSelectedWeek(e.target.value)}
        value={selectedWeek}
      >
        <option value="">📅 All Weeks</option>
        {uniqueWeeks.map((week, index) => (
          <option key={index} value={week}>
            📅 {week}
          </option>
        ))}
      </select>

      <table className="employee-table">
        <thead>
          <tr>
            <th className="table-header">Week Start</th>
            <th className="table-header">Action</th>
            <th className="table-header">Date</th>
            <th className="table-header">Time</th>
            <th className="table-header">Hours</th>
            <th className="table-header">ePayment</th>
          </tr>
        </thead>
        <tbody>
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record) =>
              (record.records || []).map((entry, index) => (
                <tr key={index}>
                  <td className="table-cell">{record.weekStart}</td>
                  <td className="action_edit">{entry.action}</td>
                  <td className="table-cell">{entry.timeStamp}</td>
                  <td className="table-cell">{entry.time}</td>
                  <td className="table-cell">{record.hours}⏱️</td>
                  <td className="table-cell">{record.etpayment}$✅</td>
                </tr>
              ))
            )
          ) : (
            <tr>
              <td colSpan="3">No records found</td>
            </tr>
          )}
        </tbody>
      </table> */}
    </div>
  );
}

export default EmployeeHistory;
