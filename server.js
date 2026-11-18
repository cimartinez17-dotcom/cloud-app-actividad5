const express = require('express');
const helmet = require('helmet');
const os = require('os');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Seguridad HTTP (Cumplimiento de buenas prácticas y lineamientos MinTIC)
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(express.static('public'));

// Identificador único de instancia para evidenciar balanceo de carga
const INSTANCE_ID = process.env.RENDER_INSTANCE_ID || `nodo-${crypto.randomBytes(3).toString('hex')}`;

// Almacenamiento estructurado inicial
let registros = [
  {
    id: 'PRJ-001',
    nombre: 'Sistema de Inventario Taller de Modelería',
    responsable: 'Equipo Ingeniería Cloud',
    estado: 'Activo',
    fecha: new Date().toISOString().split('T')[0]
  },
  {
    id: 'PRJ-002',
    nombre: 'Monitoreo Ambiental IoT en Nube Híbrida',
    responsable: 'Laboratorio Redes',
    estado: 'En Pruebas',
    fecha: new Date().toISOString().split('T')[0]
  }
];

// Endpoint de estado y telemetría (Balanceo y salud del nodo)
app.get('/api/status', (req, res) => {
  const memUsage = process.memoryUsage();
  res.json({
    estado: 'OPERATIVO',
    instancia: INSTANCE_ID,
    plataforma: os.platform(),
    arquitectura: os.arch(),
    cpu_nucleos: os.cpus().length,
    carga_promedio_1m: os.loadavg()[0].toFixed(2),
    memoria_usada_mb: (memUsage.rss / 1024 / 1024).toFixed(2),
    tiempo_activo_seg: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Obtener registros
app.get('/api/registros', (req, res) => {
  res.json({ instancia: INSTANCE_ID, total: registros.length, datos: registros });
});

// Crear nuevo registro
app.post('/api/registros', (req, res) => {
  const { nombre, responsable, estado } = req.body;
  if (!nombre || !responsable) {
    return res.status(400).json({ error: 'Nombre y responsable son obligatorios.' });
  }
  const nuevo = {
    id: `PRJ-${String(registros.length + 1).padStart(3, '0')}`,
    nombre: String(nombre).trim(),
    responsable: String(responsable).trim(),
    estado: estado || 'Activo',
    fecha: new Date().toISOString().split('T')[0]
  };
  registros.unshift(nuevo);
  res.status(201).json({ mensaje: 'Registro almacenado en la nube', instancia: INSTANCE_ID, dato: nuevo });
});

// Eliminar registro
app.delete('/api/registros/:id', (req, res) => {
  const index = registros.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Registro no encontrado' });
  registros.splice(index, 1);
  res.json({ mensaje: 'Registro eliminado', instancia: INSTANCE_ID });
});

// Endpoint controlado para pruebas de carga dinámica (CPU Stress)
app.get('/api/stress', (req, res) => {
  const duracionMs = Math.min(parseInt(req.query.ms) || 1500, 5000);
  const inicio = Date.now();
  let operaciones = 0;
  while (Date.now() - inicio < duracionMs) {
    crypto.pbkdf2Sync('carga_cloud_test', 'salt_seguro', 1000, 32, 'sha256');
    operaciones++;
  }
  res.json({
    mensaje: 'Prueba de procesamiento dinámico completada',
    instancia: INSTANCE_ID,
    duracion_ms: Date.now() - inicio,
    iteraciones_criptograficas: operaciones
  });
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT} | Instancia: ${INSTANCE_ID}`);
});