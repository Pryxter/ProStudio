# Pro Studio

Employee Check-in Check-Out con React, Firebase Auth y Firestore.

## Configuracion

1. Crea un proyecto en Firebase.
2. Activa Authentication con el proveedor Email/Password.
3. Crea una base de datos Cloud Firestore.
4. Copia `.env.example` como `.env` y completa las variables de Firebase.
5. Publica las reglas de `firestore.rules` en Firestore Rules.

## Comandos

```bash
npm install
npm run dev
npm run build
```

## Datos en Firestore

Los registros se guardan en la coleccion `timeEntries` con este formato:

```js
{
  uid: "firebase-auth-user-id",
  employeeName: "Nombre del empleado",
  breakMinutes: 0 | 30,
  checkIn: Timestamp,
  checkOut: Timestamp | null,
  status: "open" | "completed"
}
```

Cada consulta filtra por `uid`, y las reglas evitan que un usuario lea o modifique horas de otro usuario. Al hacer Check-Out se guardan `30` minutos de break y el total mostrado descuenta ese tiempo.
