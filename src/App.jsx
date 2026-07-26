import { useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "./firebase";

const BREAK_MINUTES = 30;

const currencyFormatter = new Intl.NumberFormat("es-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function getEntryHours(entry) {
  if (!entry.checkIn?.toDate) return 0;
  const start = entry.checkIn.toDate().getTime();
  const hasCheckOut = Boolean(entry.checkOut?.toDate);
  const end = hasCheckOut ? entry.checkOut.toDate().getTime() : Date.now();
  const grossHours = (end - start) / 1000 / 60 / 60;
  const breakHours = hasCheckOut
    ? (entry.breakMinutes ?? BREAK_MINUTES) / 60
    : 0;

  return Math.max(0, grossHours - breakHours);
}

function getEntryTimestamp(entry) {
  return entry.checkIn?.toDate ? entry.checkIn.toDate().getTime() : 0;
}

function getFixedCheckoutDate(entry) {
  if (!entry.checkIn?.toDate) return null;
  const checkoutDate = entry.checkIn.toDate();
  checkoutDate.setHours(15, 30, 0, 0);
  return checkoutDate;
}

function formatDate(timestamp) {
  if (!timestamp?.toDate) return "--";
  return timestamp.toDate().toLocaleDateString("es-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(timestamp) {
  if (!timestamp?.toDate) return "--";
  return timestamp.toDate().toLocaleTimeString("es-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateTime(timestamp) {
  if (!timestamp?.toDate) return "--";
  return timestamp.toDate().toLocaleString("es-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      PS
    </div>
  );
}

function LoginScreen() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!auth) {
      setError("Firebase todavia no esta configurado.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      if (isRegistering) {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        await updateProfile(credential.user, {
          displayName: name.trim() || "Pro Studio Team",
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(getFriendlyAuthError(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="login-title">
        <BrandMark />
        <p className="eyebrow">Pro Studio</p>
        <h1 id="login-title">
          {isRegistering ? "Crea tu acceso" : "Bienvenido de vuelta"}
        </h1>
        <p className="auth-message">
          {/* Registra tus horas con calma. Tu historial es privado y solo tú puedes verlo. */}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegistering && (
            <label>
              Nombre
              <input
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Tu nombre"
                type="text"
              />
            </label>
          )}

          <label>
            Email
            <input
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nombre@empresa.com"
              type="email"
            />
          </label>

          <label>
            Password
            <input
              autoComplete={isRegistering ? "new-password" : "current-password"}
              minLength={6}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimo 6 caracteres"
              type="password"
            />
          </label>

          {error && <p className="error-message">{error}</p>}

          <button className="primary-button" disabled={loading} type="submit">
            {loading
              ? "Procesando..."
              : isRegistering
                ? "Crear cuenta"
                : "Entrar"}
          </button>
        </form>

        <button
          className="text-button"
          onClick={() => setIsRegistering((value) => !value)}
          type="button"
        >
          {isRegistering ? "Ya tengo cuenta" : "Crear una cuenta nueva"}
        </button>
      </section>
    </main>
  );
}

function FirebaseSetupScreen() {
  return (
    <main className="auth-shell">
      <section className="auth-panel setup-panel" aria-labelledby="setup-title">
        <BrandMark />
        <p className="eyebrow">Pro Studio</p>
        <h1 id="setup-title">Conecta Firebase</h1>
        <p className="auth-message">
          La pagina ya esta lista, pero falta crear el archivo{" "}
          <strong>.env</strong> con las credenciales de tu proyecto Firebase.
        </p>
        <div className="setup-steps">
          <p>
            1. Copia <strong>.env.example</strong> y nombralo{" "}
            <strong>.env</strong>.
          </p>
          <p>2. Pega los valores de Firebase Web App.</p>
          <p>3. Activa Authentication con Email/Password y Cloud Firestore.</p>
          <p>
            4. Reinicia el servidor con <strong>npm run dev</strong>.
          </p>
        </div>
      </section>
    </main>
  );
}

function Dashboard({ user }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const entriesQuery = query(
      collection(db, "timeEntries"),
      where("uid", "==", user.uid),
    );

    return onSnapshot(
      entriesQuery,
      (snapshot) => {
        setEntries(
          snapshot.docs
            .map((entryDoc) => ({
              id: entryDoc.id,
              ...entryDoc.data(),
            }))
            .sort(
              (entryA, entryB) =>
                getEntryTimestamp(entryB) - getEntryTimestamp(entryA),
            ),
        );
        setError("");
        setLoading(false);
      },
      (snapshotError) => {
        setError(
          `No pudimos cargar tus horas. Revisa las reglas de Firestore. Detalle: ${snapshotError.code || "error de lectura"}.`,
        );
        setLoading(false);
      },
    );
  }, [user.uid]);

  const openEntry = entries.find((entry) => !entry.checkOut);
  const totalHours = useMemo(
    () => entries.reduce((total, entry) => total + getEntryHours(entry), 0),
    [entries],
  );

  async function handleCheckToggle() {
    if (!db) {
      setError("Firebase todavia no esta configurado.");
      return;
    }
    setActionLoading(true);
    setError("");

    try {
      if (openEntry) {
        await updateDoc(doc(db, "timeEntries", openEntry.id), {
          checkOut: serverTimestamp(),
          breakMinutes: BREAK_MINUTES,
          status: "completed",
        });
      } else {
        await addDoc(collection(db, "timeEntries"), {
          uid: user.uid,
          employeeName: user.displayName || user.email,
          breakMinutes: 0,
          checkIn: serverTimestamp(),
          checkOut: null,
          status: "open",
        });
      }
    } catch {
      setError("No se pudo guardar el registro. Intentalo otra vez.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleWednesdayCheckout() {
    if (!db || !openEntry) {
      setError("Necesitas tener un turno abierto para usar Wednesday.");
      return;
    }

    const fixedCheckoutDate = getFixedCheckoutDate(openEntry);
    if (!fixedCheckoutDate) {
      setError("Espera unos segundos a que se confirme tu Check-In.");
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      await updateDoc(doc(db, "timeEntries", openEntry.id), {
        checkOut: Timestamp.fromDate(fixedCheckoutDate),
        breakMinutes: BREAK_MINUTES,
        checkOutType: "wednesday-fixed",
        status: "completed",
      });
    } catch {
      setError("No se pudo guardar el Wednesday Check-Out. Intentalo otra vez.");
    } finally {
      setActionLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="app-shell">
      <nav className="navbar">
        <a className="nav-brand" href="#top" aria-label="Pro Studio home">
          <BrandMark />
          <span>Pro Studio</span>
        </a>
        <button
          className="ghost-button"
          onClick={() => signOut(auth)}
          type="button"
        >
          Salir
        </button>
      </nav>

      <main className="dashboard" id="top">
        <section className="hero-band">
          <p className="eyebrow">Employee Check-in Check-Out</p>
          <h1>Hola, {user.displayName || user.email}</h1>
          <p>
            Marca tu entrada y salida desde cualquier dispositivo. Tus horas
            permanecen ligadas a tu usuario.
          </p>
        </section>

        <section className="summary-grid" aria-label="Resumen de horas">
          <article className="metric-card">
            <span>Total pagado</span>
            <strong>{currencyFormatter.format(totalHours)} h</strong>
          </article>
          <article className="metric-card">
            <span>Estado actual</span>
            <strong>{openEntry ? "Trabajando" : "Fuera"}</strong>
          </article>
          <article className="action-card">
            <span>
              {openEntry
                ? `Entrada: ${formatTime(openEntry.checkIn)}`
                : "Listo para iniciar"}
            </span>
            <div className="action-buttons">
              <button
                className="primary-button"
                disabled={actionLoading}
                onClick={handleCheckToggle}
                type="button"
              >
                {actionLoading
                  ? "Guardando..."
                  : openEntry
                    ? "Check-Out"
                    : "Check-In"}
              </button>
              <button
                className="secondary-button"
                disabled={actionLoading || !openEntry}
                onClick={handleWednesdayCheckout}
                type="button"
              >
                Wednesday
              </button>
            </div>
          </article>
        </section>

        {error && <p className="error-message dashboard-error">{error}</p>}

        <section className="history-section" aria-labelledby="history-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Mi historial</p>
              <h2 id="history-title">Horas registradas</h2>
            </div>
            <button
              className="secondary-button print-button"
              disabled={entries.length === 0}
              onClick={handlePrint}
              type="button"
            >
              Imprimir
            </button>
          </div>

          {loading ? (
            <p className="empty-state">Cargando tus registros...</p>
          ) : entries.length === 0 ? (
            <p className="empty-state">
              Aun no tienes horas registradas. Tu primer check-in aparecera
              aqui.
            </p>
          ) : (
            <div className="entries-list">
              {entries.map((entry) => (
                <article className="entry-card" key={entry.id}>
                  <div>
                    <span className="entry-date">
                      {formatDate(entry.checkIn)}
                    </span>
                    <strong>
                      {entry.status === "open"
                        ? "Turno abierto"
                        : "Turno completado"}
                    </strong>
                  </div>
                  <dl>
                    <div>
                      <dt>Entrada</dt>
                      <dd>{formatTime(entry.checkIn)}</dd>
                    </div>
                    <div>
                      <dt>Salida</dt>
                      <dd>{formatTime(entry.checkOut)}</dd>
                    </div>
                    <div>
                      <dt>Break</dt>
                      <dd>{entry.checkOut ? `${entry.breakMinutes ?? BREAK_MINUTES} min` : "--"}</dd>
                    </div>
                    <div>
                      <dt>Pagadas</dt>
                      <dd>{currencyFormatter.format(getEntryHours(entry))}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="print-report" aria-label="Reporte imprimible">
          <h1>Pro Studio</h1>
          <p>Employee Check-in Check-Out</p>
          <p>Empleado: {user.displayName || user.email}</p>
          <p>Total de horas pagadas: {currencyFormatter.format(totalHours)} h</p>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Break</th>
                <th>Horas</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={`print-${entry.id}`}>
                  <td>{formatDate(entry.checkIn)}</td>
                  <td>{formatDateTime(entry.checkIn)}</td>
                  <td>{formatDateTime(entry.checkOut)}</td>
                  <td>{entry.checkOut ? `${entry.breakMinutes ?? BREAK_MINUTES} min` : "--"}</td>
                  <td>{currencyFormatter.format(getEntryHours(entry))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>

      <footer className="footer">
        <span>Pro Studio</span>
        <span>Design by Marcelo Hernandez</span>
      </footer>
    </div>
  );
}

function getFriendlyAuthError(code) {
  const messages = {
    "auth/email-already-in-use": "Ese email ya tiene una cuenta.",
    "auth/invalid-credential": "Email o password incorrecto.",
    "auth/invalid-email": "Escribe un email valido.",
    "auth/weak-password": "Usa un password de al menos 6 caracteres.",
  };

  return (
    messages[code] || "No pudimos completar el acceso. Intentalo nuevamente."
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (!auth) {
      setCheckingSession(false);
      return undefined;
    }

    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setCheckingSession(false);
    });
  }, []);

  if (!isFirebaseConfigured) {
    return <FirebaseSetupScreen />;
  }

  if (checkingSession) {
    return (
      <main className="loading-screen">
        <BrandMark />
        <p>Preparando Pro Studio...</p>
      </main>
    );
  }

  return user ? <Dashboard user={user} /> : <LoginScreen />;
}
