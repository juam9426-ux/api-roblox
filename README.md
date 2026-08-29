Roblox User Search — Vercel

Estructura:

roblox-vercel/
├── index.html
├── api/
│   └── roblox.js
└── package.json

Deploy

Crea un proyecto nuevo en Vercel.

Sube esta carpeta completa o importa el repositorio.

No necesitas instalar dependencias.

Vercel desplegará api/roblox.js como una Vercel Function.

Abre la URL del proyecto y busca un username.

La página llama a /api/roblox?username=....
La función consulta:

users.roblox.com/v1/usernames/users

presence.roblox.com/v1/presence/users

thumbnails.roblox.com/v1/users/avatar-headshot

No se usa API Key de Roblox Open Cloud.
